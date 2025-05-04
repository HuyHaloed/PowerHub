# File: src/comfort_prediction/realtime_predict.py

import pandas as pd
import numpy as np
import pickle
import time
from datetime import datetime
import os

# Load model
with open('model/comfort_model.pkl', 'rb') as f:
    model = pickle.load(f)
    
# Log file path
log_file = 'D:/AI_services/logs/comfort_prediction.csv'

# Create logs directory if not exist
os.makedirs('logs', exist_ok=True)

# Initialize log file
if not os.path.exists(log_file):
    pd.DataFrame(columns=['timestamp', 'temperature', 'humidity', 'light_scaled', 'comfort_score']).to_csv(log_file, index=False)
    
while True:
    # Generate synthetic data
    temperature = np.random.uniform(15, 35)
    humidity = np.random.uniform(0, 100)
    light_scaled = np.random.uniform(0, 100)

    # Predict comfort score
    new_data = pd.DataFrame([[temperature, humidity, light_scaled]], columns=['Temperature', 'Humidity', 'Light'])
    comfort_score = model.predict(new_data)[0]

    # Append to log
    timestamp = datetime.now().isoformat()
    log_entry = pd.DataFrame([[timestamp, temperature, humidity, light_scaled, comfort_score]])
    log_entry.to_csv(log_file, mode='a', index=False, header=False)

    print(f"[{timestamp}] Comfort Score: {comfort_score:.2f}")
    time.sleep(20)