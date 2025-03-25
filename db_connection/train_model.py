import pyodbc
import pandas as pd
from sklearn.linear_model import LinearRegression
import joblib

# Kết nối Azure SQL
conn = pyodbc.connect(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=iot-assignment-242.database.windows.net;"
    "DATABASE=your-database;"
    "UID=your-username;"
    "PWD=your-password"
)

# Load dữ liệu từ Azure SQL
query = "SELECT temperature, humidity FROM SensorData"
df = pd.read_sql(query, conn)

# Huấn luyện mô hình dự đoán độ ẩm từ nhiệt độ
X = df[['temperature']]
y = df['humidity']

model = LinearRegression()
model.fit(X, y)

# Lưu mô hình
joblib.dump(model, "humidity_predictor.pkl")
print("Đã huấn luyện xong mô hình!")
