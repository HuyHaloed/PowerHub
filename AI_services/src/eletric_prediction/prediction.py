#File: src/eletric_prediction/prediction.py
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class EnergyPredictor:
    def __init__(self):
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.is_trained = False

    def prepare_features(self, data: List[Dict[str, Any]]) -> pd.DataFrame:
        """Chuẩn bị dữ liệu đầu vào cho model"""
        df = pd.DataFrame(data)
        
        # Chuyển đổi timestamp thành các tính năng thời gian
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['hour'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        df['month'] = df['timestamp'].dt.month
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)

        # Bổ sung các trường thiếu với giá trị mặc định
        if 'pressure' not in df.columns:
            df['pressure'] = 1013  # Áp suất trung bình (hPa)
        if 'wind_speed' not in df.columns:
            df['wind_speed'] = 0   # Gió mặc định
        # Nếu có brightness thì dùng làm light, nếu không thì 500
        if 'light' not in df.columns:
            if 'brightness' in df.columns:
                df['light'] = df['brightness']
            else:
                df['light'] = 500

        # Tính năng thời tiết
        weather_features = ['temperature', 'humidity', 'pressure', 'wind_speed', 'light']
        for feature in weather_features:
            if feature in df.columns:
                df[f'{feature}_rolling_mean'] = df[feature].rolling(window=24, min_periods=1).mean()
        
        # Tính năng thiết bị
        device_features = ['device_status', 'device_type']
        for feature in device_features:
            if feature in df.columns:
                df[f'{feature}_count'] = df.groupby('timestamp')[feature].transform('count')
        
        # Chọn các cột cần thiết cho model
        feature_columns = [
            'hour', 'day_of_week', 'month', 'is_weekend',
            'temperature', 'humidity', 'pressure', 'wind_speed', 'light',
            'temperature_rolling_mean', 'humidity_rolling_mean',
            'device_status_count', 'device_type_count'
        ]
        
        # Lọc các cột có sẵn trong dữ liệu
        available_features = [col for col in feature_columns if col in df.columns]
        
        return df[available_features]

    def train(self, historical_data: List[Dict[str, Any]]):
        """Huấn luyện model với dữ liệu lịch sử"""
        try:
            # Chuẩn bị dữ liệu
            X = self.prepare_features(historical_data)
            y = pd.DataFrame(historical_data)['energy_consumption']
            
            # Chia dữ liệu train/test
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Chuẩn hóa dữ liệu
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Huấn luyện model
            self.model.fit(X_train_scaled, y_train)
            
            # Đánh giá model
            train_score = self.model.score(X_train_scaled, y_train)
            test_score = self.model.score(X_test_scaled, y_test)
            
            logger.info(f"Model trained successfully. Train score: {train_score:.3f}, Test score: {test_score:.3f}")
            self.is_trained = True
            
            return {
                'train_score': train_score,
                'test_score': test_score
            }
            
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            raise

    def predict(self, input_data: List[Dict[str, Any]]) -> List[float]:
        """Dự đoán tiêu thụ năng lượng"""
        if not self.is_trained:
            raise ValueError("Model chưa được huấn luyện")
        
        try:
            # Chuẩn bị dữ liệu đầu vào
            X = self.prepare_features(input_data)
            
            # Chuẩn hóa dữ liệu
            X_scaled = self.scaler.transform(X)
            
            # Dự đoán
            predictions = self.model.predict(X_scaled)
            
            return predictions.tolist()
            
        except Exception as e:
            logger.error(f"Error making predictions: {str(e)}")
            raise

    def save_model(self, model_path: str):
        """Lưu model và scaler"""
        if not self.is_trained:
            raise ValueError("Model chưa được huấn luyện")
        
        try:
            model_data = {
                'model': self.model,
                'scaler': self.scaler,
                'is_trained': self.is_trained
            }
            joblib.dump(model_data, model_path)
            logger.info(f"Model saved successfully to {model_path}")
            
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            raise

    @classmethod
    def load_model(cls, model_path: str) -> 'EnergyPredictor':
        """Tải model đã lưu"""
        try:
            model_data = joblib.load(model_path)
            predictor = cls()
            predictor.model = model_data['model']
            predictor.scaler = model_data['scaler']
            predictor.is_trained = model_data['is_trained']
            logger.info(f"Model loaded successfully from {model_path}")
            return predictor
            
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise

    def generate_sample_data(self, days: int = 7) -> List[Dict[str, Any]]:
        """Tạo dữ liệu mẫu để test model với biến động mạnh hơn"""
        sample_data = []
        base_time = datetime.now()
        for i in range(days * 24):
            timestamp = base_time + timedelta(hours=i)
            # Tạo dữ liệu thời tiết lắc léo hơn
            temperature = 25 + 5 * np.sin(i / 5) + np.random.normal(0, 2)
            humidity = 60 + 15 * np.cos(i / 7) + np.random.normal(0, 5)
            light = 400 + 200 * np.sin(i / 3) + np.random.normal(0, 100)
            pressure = np.random.normal(1013, 5)
            wind_speed = np.random.normal(10, 5)
            device_status = np.random.choice(['on', 'off'], p=[0.7, 0.3])
            device_type = np.random.choice(['light', 'fan', 'ac', 'tv'], p=[0.3, 0.3, 0.2, 0.2])
            # Tính toán tiêu thụ năng lượng dựa trên các yếu tố
            base_consumption = 0
            if device_status == 'on':
                if device_type == 'light':
                    base_consumption = 0.1 * (light / 500)
                elif device_type == 'fan':
                    base_consumption = 0.2 * (1 + (temperature - 25) / 10)
                elif device_type == 'ac':
                    base_consumption = 1.0 * (1 + abs(temperature - 25) / 5)
                elif device_type == 'tv':
                    base_consumption = 0.3
            # Thêm nhiễu ngẫu nhiên mạnh hơn
            energy_consumption = base_consumption * (1 + np.random.normal(0, 0.2))
            sample_data.append({
                'timestamp': timestamp,
                'temperature': temperature,
                'humidity': humidity,
                'pressure': pressure,
                'wind_speed': wind_speed,
                'light': light,
                'device_status': device_status,
                'device_type': device_type,
                'energy_consumption': max(0, energy_consumption)
            })
        return sample_data


from pymongo import MongoClient
import os

def get_real_data_from_mongo():
    MONGO_URI = "mongodb+srv://xuanhuy6a1:usA02u8ynSixe3Ve@powerhub.f6br6mk.mongodb.net/"
    DB_NAME = "PowerHubDb"
    COLLECTION = "PredictionData"
    client = MongoClient(MONGO_URI, tls=True, tlsAllowInvalidCertificates=True)
    db = client[DB_NAME]
    collection = db[COLLECTION]
    docs = list(collection.find({}, {"_id": 0}))
    client.close()
    return docs

def main():
    predictor = EnergyPredictor()
    data = get_real_data_from_mongo()
    # Đảm bảo có trường energy_consumption (nếu không có thì dùng energy)
    for d in data:
        if "energy_consumption" not in d:
            d["energy_consumption"] = d.get("energy", 0)
    if not data:
        print("Không có dữ liệu thực tế trong MongoDB!")
        return
    result = predictor.train(data)
    print("Train done! Kết quả:")
    print(result)
    model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../model"))
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "energy_model.pkl")
    predictor.save_model(model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    main()
