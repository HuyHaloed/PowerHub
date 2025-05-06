import time
import os
import logging
from datetime import date, timedelta
from fastapi import FastAPI, Query, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Callable
import random
import pickle
import pandas as pd

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# Cấu hình limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# Cấu hình logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Xử lý lỗi khi vượt quá giới hạn truy cập
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Rate limit exceeded. Try again later.",
            "retry-after": 10  # Seconds to wait before retry
        },
        headers={"Retry-After": "10"}
    )

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class WeatherData(BaseModel):
    date: str
    temperature: Optional[float]
    humidity: Optional[float]
    pressure: Optional[float]
    windSpeed: Optional[float]
    light: Optional[float]
    comfortScore: Optional[float]

class ForecastWeatherData(BaseModel):
    date: str
    humidity: Optional[float]
    pressure: Optional[float]
    windSpeed: Optional[float]
    temperature: Optional[float]

class ComfortDataFromAPI(BaseModel):
    date: str
    temperature: Optional[float]
    humidity: Optional[float]
    light: Optional[float]
    comfortScore: Optional[float]

# Request bundling model
class BundledRequest(BaseModel):
    weather_forecast: Optional[bool] = False
    comfort_forecast: Optional[bool] = False
    current_weather: Optional[bool] = False
    days: Optional[int] = 7

class BundledResponse(BaseModel):
    weather_forecast: Optional[List[ForecastWeatherData]] = None
    comfort_forecast: Optional[List[ComfortDataFromAPI]] = None
    current_weather: Optional[WeatherData] = None

# Cache implementation
class APICache:
    def __init__(self, ttl: int = 300):  # Default TTL: 5 minutes
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = ttl
    
    def get(self, key: str) -> Any:
        if key in self.cache:
            item = self.cache[key]
            if time.time() < item["expiry"]:
                return item["data"]
            else:
                del self.cache[key]
        return None
    
    def set(self, key: str, data: Any, ttl: Optional[int] = None) -> None:
        expiry = time.time() + (ttl if ttl is not None else self.ttl)
        self.cache[key] = {"data": data, "expiry": expiry}

# Initialize cache
cache = APICache(ttl=300)  # 5 minutes cache for most data
current_weather_cache = APICache(ttl=60)  # 1 minute cache for current weather

# Load model
WEATHER_MODEL_PATH = './model/weather_model.pkl'
COMFORT_MODEL_PATH = './model/comfort_model.pkl'
weather_model = None
comfort_model = None

def load_models():
    global weather_model, comfort_model
    try:
        if os.path.exists(WEATHER_MODEL_PATH):
            with open(WEATHER_MODEL_PATH, 'rb') as f:
                weather_model = pickle.load(f)
            logger.info(f"Loaded weather model from {WEATHER_MODEL_PATH}")
        else:
            logger.warning(f"Weather model not found at {WEATHER_MODEL_PATH}")

        if os.path.exists(COMFORT_MODEL_PATH):
            with open(COMFORT_MODEL_PATH, 'rb') as f:
                comfort_model = pickle.load(f)
            logger.info(f"Loaded comfort model from {COMFORT_MODEL_PATH}")
        else:
            logger.warning(f"Comfort model not found at {COMFORT_MODEL_PATH}")

    except Exception as e:
        logger.error(f"Error loading models: {e}")

# Predict comfort score
def predict_comfort_score_from_model(temperature: float, humidity: float, light: float) -> Optional[float]:
    if comfort_model:
        try:
            df = pd.DataFrame([[temperature, humidity, light]], columns=['Temperature', 'Humidity', 'Light'])
            prediction = comfort_model.predict(df)[0]
            return round(max(0.0, min(100.0, prediction)), 2)
        except Exception as e:
            logger.error(f"Comfort model prediction error: {e}")
            return None
    return calculate_comfort_fallback(temperature, humidity, light)

# Fallback
def calculate_comfort_fallback(temperature: float, humidity: float, light: float) -> float:
    score = 100.0
    if temperature < 22: score -= 3.0 * (22 - temperature)
    elif temperature > 25: score -= 3.0 * (temperature - 25)
    if humidity < 40: score -= 1.5 * (40 - humidity)
    elif humidity > 60: score -= 1.5 * (humidity - 60)
    if light < 40: score -= 1.0 * (40 - light)
    elif light > 70: score -= 1.0 * (light - 70)
    return round(max(0.0, min(100.0, score)), 2)

# Generate cache key
def get_cache_key(prefix: str, **kwargs) -> str:
    sorted_items = sorted(kwargs.items(), key=lambda x: x[0])
    params = "_".join([f"{k}={v}" for k, v in sorted_items])
    return f"{prefix}_{params}" if params else prefix

# Helper to generate current weather data
def generate_current_weather() -> WeatherData:
    current_data = WeatherData(
        date=date.today().strftime("%Y-%m-%d"),
        temperature=random.uniform(25, 32),
        humidity=random.uniform(50, 70),
        pressure=random.uniform(1005, 1015),
        windSpeed=random.uniform(5, 20),
        light=random.uniform(30, 80)
    )

    current_data.comfortScore = predict_comfort_score_from_model(
        current_data.temperature or 0,
        current_data.humidity or 0,
        current_data.light or 0
    )
    
    return current_data

# Helper to generate weather forecast
def generate_weather_forecast(days: int) -> List[ForecastWeatherData]:
    today = date.today()
    forecast_list = [
        ForecastWeatherData(
            date=(today + timedelta(days=i)).strftime("%Y-%m-%d"),
            temperature=random.uniform(26, 33),
            humidity=random.uniform(55, 75),
            pressure=random.uniform(1000, 1018),
            windSpeed=random.uniform(8, 25)
        )
        for i in range(days)
    ]
    return forecast_list

# Helper to generate comfort forecast
def generate_comfort_forecast(days: int) -> List[ComfortDataFromAPI]:
    today = date.today()
    forecast_list = []

    for i in range(days):
        forecast_date = today + timedelta(days=i)
        temp = random.uniform(20, 30)
        hum = random.uniform(40, 80)
        light = random.uniform(50, 90)

        score = predict_comfort_score_from_model(temp, hum, light)
        forecast_list.append(ComfortDataFromAPI(
            date=forecast_date.strftime("%Y-%m-%d"),
            temperature=temp,
            humidity=hum,
            light=light,
            comfortScore=score
        ))
    
    return forecast_list

# API: Current weather
@app.get("/api/weather/current", response_model=WeatherData)
@limiter.limit("10/minute")  # Increased limit for individual endpoints
async def get_current_weather(request: Request):
    logger.info("API: Current weather requested.")
    
    # Check cache first
    cache_key = "current_weather"
    cached_data = current_weather_cache.get(cache_key)
    
    if cached_data:
        logger.info("API: Returning cached current weather.")
        return cached_data
    
    # Generate new data
    current_data = generate_current_weather()
    
    # Cache the result
    current_weather_cache.set(cache_key, current_data)
    
    logger.info(f"API: Returning fresh current weather")
    return current_data

# API: Forecast weather
@app.get("/api/weather/forecast", response_model=List[ForecastWeatherData])
@limiter.limit("10/minute")  # Increased limit for individual endpoints
async def get_weather_forecast(request: Request, days: int = Query(7, ge=1, le=14)):
    logger.info(f"API: Forecast weather for {days} days requested.")
    
    # Check cache first
    cache_key = get_cache_key("weather_forecast", days=days)
    cached_data = cache.get(cache_key)
    
    if cached_data:
        logger.info("API: Returning cached weather forecast.")
        return cached_data
    
    # Generate new forecast
    forecast_list = generate_weather_forecast(days)
    
    # Cache the result
    cache.set(cache_key, forecast_list)
    
    logger.info(f"API: Returning fresh forecast for {days} days.")
    return forecast_list

# API: Forecast comfort score
@app.get("/api/comfort/forecast", response_model=List[ComfortDataFromAPI])
@limiter.limit("10/minute")  # Increased limit for individual endpoints
async def get_comfort_forecast(request: Request, days: int = Query(7, ge=1, le=14)):
    logger.info(f"API: Comfort forecast for {days} days requested.")
    
    # Check cache first
    cache_key = get_cache_key("comfort_forecast", days=days)
    cached_data = cache.get(cache_key)
    
    if cached_data:
        logger.info("API: Returning cached comfort forecast.")
        return cached_data
    
    # Generate new forecast
    forecast_list = generate_comfort_forecast(days)
    
    # Cache the result
    cache.set(cache_key, forecast_list)
    
    logger.info(f"API: Returning fresh comfort forecast.")
    return forecast_list

# NEW ENDPOINT: Bundled API request
# This allows the frontend to request multiple data types in a single API call
@app.post("/api/bundled", response_model=BundledResponse)
@limiter.limit("15/minute")  # Higher limit for the bundled endpoint
async def get_bundled_data(request: Request, bundle_request: BundledRequest):
    logger.info(f"API: Bundled request received: {bundle_request}")
    response = BundledResponse()
    
    # Process each requested data type
    if bundle_request.current_weather:
        cache_key = "current_weather"
        cached_data = current_weather_cache.get(cache_key)
        
        if cached_data:
            response.current_weather = cached_data
        else:
            current_data = generate_current_weather()
            current_weather_cache.set(cache_key, current_data)
            response.current_weather = current_data
    
    if bundle_request.weather_forecast:
        days = bundle_request.days
        cache_key = get_cache_key("weather_forecast", days=days)
        cached_data = cache.get(cache_key)
        
        if cached_data:
            response.weather_forecast = cached_data
        else:
            forecast_data = generate_weather_forecast(days)
            cache.set(cache_key, forecast_data)
            response.weather_forecast = forecast_data
    
    if bundle_request.comfort_forecast:
        days = bundle_request.days
        cache_key = get_cache_key("comfort_forecast", days=days)
        cached_data = cache.get(cache_key)
        
        if cached_data:
            response.comfort_forecast = cached_data
        else:
            comfort_data = generate_comfort_forecast(days)
            cache.set(cache_key, comfort_data)
            response.comfort_forecast = comfort_data
    
    logger.info("API: Returning bundled response")
    return response

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": time.time()}

# Start app
if __name__ == "__main__":
    import uvicorn
    logger.info("Starting FastAPI app...")
    load_models()
    uvicorn.run(app, host="0.0.0.0", port=8001)