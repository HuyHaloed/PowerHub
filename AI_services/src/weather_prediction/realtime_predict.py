# File: src/weather_prediction/realtime_predict.py
import pandas as pd
import numpy as np
import pickle
import time
from datetime import datetime
import os

# Load model
with open('model/weather_model.pkl', 'rb') as f:
    model = pickle.load(f)

# Log file path
log_file = 'D:/AI_services/logs/prediction.csv'

# Create logs directory if not exist
os.makedirs('logs', exist_ok=True)

# Initialize log file
if not os.path.exists(log_file):
    pd.DataFrame(columns=['timestamp', 'humidity', 'pressure', 'wind_speed', 'predicted_temp']).to_csv(log_file, index=False)

while True:
    # Generate synthetic data
    humidity = np.random.uniform(0, 100)
    pressure = np.random.uniform(980, 1050)
    wind_speed = np.random.uniform(0, 30)

    # Predict temperature
    new_data = pd.DataFrame([[humidity, pressure, wind_speed]], columns=['Humidity', 'Pressure', 'Wind Speed'])
    predicted_temp = model.predict(new_data)[0]

    # Append to log
    timestamp = datetime.now().isoformat()
    log_entry = pd.DataFrame([[timestamp, humidity, pressure, wind_speed, predicted_temp]])
    log_entry.to_csv(log_file, mode='a', index=False, header=False)

    print(f"[{timestamp}] Predicted Temp: {predicted_temp:.2f}°C")
    time.sleep(2)