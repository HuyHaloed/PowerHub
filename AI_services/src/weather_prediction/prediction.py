# File: src/weather_prediction/prediction.py
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

humidity = np.random.uniform(0, 100, np_samples)
pressure = np.random.uniform(980, 1050, np_samples)
wind_speed = np.random.uniform(0, 30, np_samples)
temparature = 29 + 0.1 * humidity - 0.01 * pressure + 0.05 * wind_speed + np.random.normal(0, 2, np_samples)

#Create a DataFrame
weather_data = pd.DataFrame({
    'Humidity': humidity,
    'Pressure': pressure,
    'Wind Speed': wind_speed,
    'Temperature': temparature
})

#visualize the data
plt.figure(figsize=(12, 6))
plt.subplot(2, 2, 1)
plt.scatter(weather_data['Humidity'], weather_data['Temperature'], alpha=0.5)
plt.xlabel('Humidity')
plt.ylabel('Temperature')
plt.title('Humidity vs Temperature')

plt.subplot(2, 2, 2)
plt.scatter(weather_data['Pressure'], weather_data['Temperature'], alpha=0.5)
plt.xlabel('Pressure')
plt.ylabel('Temperature')
plt.title('Pressure vs Temperature')

plt.subplot(2, 2, 3)
plt.scatter(weather_data['Wind Speed'], weather_data['Temperature'], alpha=0.5)
plt.xlabel('Wind Speed')
plt.ylabel('Temperature')
plt.title('Wind Speed vs Temperature')

#split the data into features and target variable
x= weather_data[['Humidity', 'Pressure', 'Wind Speed']]
y= weather_data['Temperature']

#split the data into training and testing sets
x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42)


#create a linear regression model
model = LinearRegression()
model.fit(x_train, y_train)

#make predictions on the test set
y_pred = model.predict(x_test)

#evaluate the model
mse = mean_squared_error(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f'Mean Squared Error: {mse}')
print(f'Mean Absolute Error: {mae}')
print(f'R^2 Score: {r2}')

#visualize the predictions and actual values
plt.subplot(2, 2, 4)
plt.scatter(y_test, y_pred, alpha=0.5)
plt.xlabel('Actual Temperature')
plt.ylabel('Predicted Temperature')
plt.title('Actual vs Predicted Temperature')

#show the plots
plt.tight_layout()
plt.show()

#make predictions for new data
new_data = pd.DataFrame({
    'Humidity': [50, 60, 70],
    'Pressure': [1000, 1010, 1020],
    'Wind Speed': [10, 15, 20]
})
predictions = model.predict(new_data)
print(f'Predictions for new data: {predictions[0]}')

model_path = os.path.join(os.path.dirname(__file__), '../../model/weather_model.pkl')
with open(model_path, 'wb') as f:
    pickle.dump(model, f)