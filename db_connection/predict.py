import joblib

# Load mô hình
model = joblib.load("humidity_predictor.pkl")

# Dự đoán
temp = 30.0  # Nhiệt độ đầu vào
predicted_humidity = model.predict([[temp]])
print(f"Dự đoán độ ẩm khi nhiệt độ {temp}°C: {predicted_humidity[0]:.2f}%")
