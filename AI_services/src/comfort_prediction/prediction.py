#File: src/comfort_prediction/prediction.py
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
import pickle
import os

#Generate synthetic data
np.random.seed(0)
np_samples = 1000

temperature = np.random.uniform(15, 35, np_samples)
humidity = np.random.uniform(0, 100, np_samples)
light_scaled = np.random.uniform(0, 100, np_samples)

#define the comfort level based on temperature, humidity, and light
IDEAL_TEMP_LOW = 22.0
IDEAL_TEMP_HIGH = 25.0
IDEAL_HUMIDITY_LOW = 40.0
IDEAL_HUMIDITY_HIGH = 60.0
IDEAL_LIGHT_LOW = 40.0
IDEAL_LIGHT_HIGH = 70.0 

#penalty factors
PENALTY_TEMP = 3.0
PENALTY_HUMIDITY = 1.5
PENALTY_LIGHT = 1.0

def calculate_comfort(temperature, humidity, light_scaled_0_100):
    comfort_score = 100.0

    if temperature < IDEAL_TEMP_LOW:
        comfort_score -= PENALTY_TEMP * (IDEAL_TEMP_LOW - temperature)
    elif temperature > IDEAL_TEMP_HIGH:
        comfort_score -= PENALTY_TEMP * (temperature - IDEAL_TEMP_HIGH)

    if humidity < IDEAL_HUMIDITY_LOW:
        comfort_score -= PENALTY_HUMIDITY * (IDEAL_HUMIDITY_LOW - humidity)
    elif humidity > IDEAL_HUMIDITY_HIGH:
        comfort_score -= PENALTY_HUMIDITY * (humidity - IDEAL_HUMIDITY_HIGH)

    if light_scaled_0_100 < IDEAL_LIGHT_LOW:
        comfort_score -= PENALTY_LIGHT * (IDEAL_LIGHT_LOW - light_scaled_0_100)
    elif light_scaled_0_100 > IDEAL_LIGHT_HIGH:
        comfort_score -= PENALTY_LIGHT * (light_scaled_0_100 - IDEAL_LIGHT_HIGH)

    comfort_score = max(0.0, min(100.0, comfort_score))

    return round(comfort_score, 2)

comfort_score = np.array([calculate_comfort(t, h, l) for t, h, l in zip(temperature, humidity, light_scaled)])

comfort_data = pd.DataFrame({
    'Temperature': temperature,
    'Humidity': humidity,
    'Light': light_scaled,
    'Comfort_Score': comfort_score
})

#visualize the data
plt.figure(figsize=(12, 9))

plt.subplot(2, 2, 1)
plt.scatter(comfort_data['Temperature'], comfort_data['Comfort_Score'], alpha=0.5)
plt.xlabel('Temperature (°C)')
plt.ylabel('Comfort Score (0-100)')
plt.title('Temperature vs Comfort Score')
plt.ylim(0, 100)

plt.subplot(2, 2, 2)
plt.scatter(comfort_data['Humidity'], comfort_data['Comfort_Score'], alpha=0.5)
plt.xlabel('Humidity (%)')
plt.ylabel('Comfort Score (0-100)')
plt.title('Humidity vs Comfort Score')
plt.ylim(0, 100)

plt.subplot(2, 2, 3)
plt.scatter(comfort_data['Light'], comfort_data['Comfort_Score'], alpha=0.5)
plt.xlabel('Light (Scaled 0-100)')
plt.ylabel('Comfort Score (0-100)')
plt.title('Light vs Comfort Score')
plt.ylim(0, 100)

x = comfort_data[['Temperature', 'Humidity', 'Light']]
y = comfort_data['Comfort_Score']

x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42)

model = LinearRegression()
model.fit(x_train, y_train)

y_pred = model.predict(x_test)

mse = mean_squared_error(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f'Mean Squared Error: {mse}')
print(f'Mean Absolute Error: {mae}')
print(f'R^2 Score: {r2}')

#visualize the predictions and actual values
plt.subplot(2, 2, 4)
plt.scatter(y_test, y_pred, alpha=0.5)
plt.xlabel('Actual Comfort Score')
plt.ylabel('Predicted Comfort Score')
plt.title('Actual vs Predicted Comfort Score')
plt.xlim(0, 100)
plt.ylim(0, 100)

#show the plots
plt.tight_layout()
plt.show()

#make predictions for new data
new_data = pd.DataFrame({
    'Temperature': [23, 18, 30],
    'Humidity': [50, 70, 30],
    'Light': [60, 20, 80]
})

predictions = model.predict(new_data)
predictions = np.clip(predictions, 0, 100)
print(f'\nPredictions for new data (Comfort Score):') 
for i, pred in enumerate(predictions):
    print(f'Sample {i+1}: {pred:.2f}')

model_path = os.path.join(os.path.dirname(__file__), '../../model/comfort_model.pkl')
with open(model_path, 'wb') as f:
    pickle.dump(model, f)

print(f"\nComfort prediction model saved to {model_path}")