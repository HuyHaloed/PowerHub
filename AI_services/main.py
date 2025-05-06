import time
import os
import logging
import pickle
import pandas as pd

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import date, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_model(model_path):
    try:
        if not os.path.exists(model_path):
             logger.error(f"Model file not found at: {model_path}")
             return None
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        logger.info(f"Model loaded successfully from {model_path}")
        return model
    except Exception as e:
        logger.error(f"Error loading model from {model_path}: {e}")
        return None

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')
WEATHER_MODEL_PATH = os.path.join(MODEL_DIR, 'weather_model.pkl')
COMFORT_MODEL_PATH = os.path.join(MODEL_DIR, 'comfort_model.pkl')

WEATHER_MODEL = load_model(WEATHER_MODEL_PATH)
COMFORT_MODEL = load_model(COMFORT_MODEL_PATH)

try:
    from comfort_prediction.prediction import calculate_comfort as calculate_comfort_formula
    logger.info("Imported calculate_comfort formula.")
except ImportError:
    logger.warning("Could not import calculate_comfort formula. Check path or define it.")
    calculate_comfort_formula = None

def get_weather_forecast_data(days: int):
    logger.info(f"Generating weather forecast for {days} days using model...")
    forecast_list = []
    today = date.today()

    if WEATHER_MODEL is None:
        logger.error("Weather model not loaded. Cannot generate forecast.")
        for i in range(days):
             future_date = today + timedelta(days=i)
             temp = 25 + i*0.5 + (time.time() % 5 - 2.5)
             humidity = 50 + i*1 + (time.time() % 10 - 5)
             pressure = 1010 + i*0.1 + (time.time() % 2 - 1)
             wind_speed = 10 + i*0.2 + (time.time() % 3 - 1.5)
             forecast_list.append({
                "date": future_date.strftime("%Y-%m-%d"),
                "temperature": round(temp, 1),
                "humidity": round(humidity, 1),
                "pressure": round(pressure, 1),
                "windSpeed": round(wind_speed, 1),
             })
        return forecast_list

    base_humidity = 60
    base_pressure = 1010
    base_wind = 15
    variation_seed = time.time()

    for i in range(days):
        future_date = today + timedelta(days=i)
        future_humidity = base_humidity + i * 0.5 + 10 * (i % 7 - 3) / 3
        future_pressure = base_pressure + i * 0.1 + 5 * (i % 5 - 2) / 2
        future_wind = base_wind + i * 0.2 + 7 * (i % 6 - 2.5) / 2.5

        future_humidity = max(0, min(100, future_humidity))
        future_pressure = max(980, min(1050, future_pressure))
        future_wind = max(0, min(30, future_wind))

        input_data = pd.DataFrame({
            'Humidity': [future_humidity],
            'Pressure': [future_pressure],
            'Wind Speed': [future_wind]
        })

        predicted_temp = None
        try:
            predicted_temp = WEATHER_MODEL.predict(input_data)[0]
            predicted_temp = round(float(predicted_temp), 1)
        except Exception as e:
             logger.error(f"Error predicting weather forecast for day {i} with model: {e}")

        forecast_list.append({
            "date": future_date.strftime("%Y-%m-%d"),
            "temperature": predicted_temp,
            "humidity": round(float(future_humidity), 1),
            "pressure": round(float(future_pressure), 1),
            "windSpeed": round(float(future_wind), 1),
        })

    return [item for item in forecast_list if item['temperature'] is not None]

def get_comfort_forecast_data(days: int):
    logger.info(f"Generating comfort forecast for {days} days using model/formula...")
    forecast_list = []
    today = date.today()

    if COMFORT_MODEL is None and calculate_comfort_formula is None:
         logger.error("Comfort model not loaded and formula not available. Cannot generate forecast.")
         return []

    base_temp = 24
    base_humidity = 55
    base_light = 60
    variation_seed = time.time()

    for i in range(days):
        future_date = today + timedelta(days=i)
        future_temp = base_temp + i * 0.2 + 3 * (i % 7 - 3) / 3
        future_humidity = base_humidity + i * 0.3 + 8 * (i % 5 - 2) / 2
        future_light = base_light + i * 1 + 15 * (i % 6 - 2.5) / 2.5

        future_temp = max(15, min(35, future_temp))
        future_humidity = max(0, min(100, future_humidity))
        future_light = max(0, min(100, future_light))

        predicted_comfort_score = None

        if COMFORT_MODEL is not None:
             try:
                 input_data = pd.DataFrame({
                     'Temperature': [future_temp],
                     'Humidity': [future_humidity],
                     'Light': [future_light]
                 })
                 predicted_comfort_score = COMFORT_MODEL.predict(input_data)[0]
                 predicted_comfort_score = max(0, min(100, predicted_comfort_score))
                 predicted_comfort_score = round(float(predicted_comfort_score), 1)
             except Exception as e:
                  logger.error(f"Error predicting comfort forecast for day {i} with model: {e}")
        elif calculate_comfort_formula is not None:
             try:
                  predicted_comfort_score = calculate_comfort_formula(future_temp, future_humidity, future_light)
             except Exception as e:
                  logger.error(f"Error calculating comfort formula for day {i}: {e}")

        forecast_list.append({
            "date": future_date.strftime("%Y-%m-%d"),
            "temperature": round(float(future_temp), 1),
            "humidity": round(float(future_humidity), 1),
            "light": round(float(future_light), 1),
            "comfortScore": predicted_comfort_score,
        })

    return [item for item in forecast_list if item['comfortScore'] is not None]

def get_current_conditions_data():
    logger.info("Getting current conditions using model/formula...")

    current_temp = 28 + (time.time() % 5 - 2.5)
    current_humidity = 60 + (time.time() % 10 - 5)
    current_pressure = 1012 + (time.time() % 3 - 1.5)
    current_wind = 15 + (time.time() % 5 - 2.5)
    current_light = 70 + (time.time() % 20 - 10)

    current_weather_data = {
        "date": date.today().strftime("%Y-%m-%d"),
        "temperature": round(float(current_temp), 1),
        "humidity": round(float(current_humidity), 1),
        "pressure": round(float(current_pressure), 1),
        "windSpeed": round(float(current_wind), 1),
        "light": round(float(current_light), 1),
    }

    current_comfort_score = None

    if COMFORT_MODEL is not None:
         try:
              input_data = pd.DataFrame({
                  'Temperature': [current_temp],
                  'Humidity': [current_humidity],
                  'Light': [current_light]
              })
              predicted_comfort_score = COMFORT_MODEL.predict(input_data)[0]
              predicted_comfort_score = max(0, min(100, predicted_comfort_score))
              predicted_comfort_score = round(float(predicted_comfort_score), 1)
         except Exception as e:
              logger.error(f"Error predicting current comfort with model: {e}")
    elif calculate_comfort_formula is not None:
         try:
             predicted_comfort_score = calculate_comfort_formula(current_temp, current_humidity, current_light)
         except Exception as e:
             logger.error(f"Error calculating current comfort with formula: {e}")

    current_weather_data["comfortScore"] = predicted_comfort_score

    return current_weather_data

app = FastAPI(
    title="PowerHub AI Services API",
    description="API for Weather and Comfort Predictions",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/weather/forecast", summary="Get Weather Forecast")
async def weather_forecast_api(days: int = Query(7, ge=1, le=14, description="Number of forecast days (1-14)")):
    logger.info(f"API: Received request for weather forecast for {days} days.")
    try:
        forecast_data = get_weather_forecast_data(days)
        if not forecast_data:
             raise HTTPException(status_code=404, detail="Weather forecast data not available")
        return forecast_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API Error getting weather forecast: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error retrieving weather forecast: {e}")

@app.get("/api/comfort/forecast", summary="Get Comfort Forecast")
async def comfort_forecast_api(days: int = Query(7, ge=1, le=14, description="Number of forecast days (1-14)")):
    logger.info(f"API: Received request for comfort forecast for {days} days.")
    try:
        forecast_data = get_comfort_forecast_data(days)
        if not forecast_data:
             raise HTTPException(status_code=404, detail="Comfort forecast data not available")
        return forecast_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API Error getting comfort forecast: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error retrieving comfort forecast: {e}")

@app.get("/api/weather/current", summary="Get Current Conditions")
async def current_conditions_api():
    logger.info("API: Received request for current conditions.")
    try:
        current_data = get_current_conditions_data()
        if not current_data or current_data.get("temperature") is None:
             raise HTTPException(status_code=404, detail="Current conditions data not available")

        return current_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API Error getting current conditions: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error retrieving current conditions: {e}")

if __name__ == "__main__":
    logger.info("Bắt đầu ứng dụng FastAPI...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
    logger.info("Ứng dụng FastAPI đã dừng.")