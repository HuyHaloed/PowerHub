import collections
import random
from datetime import datetime, timedelta

# Khởi tạo sensor_history
MAX_HISTORY_POINTS = 28800
sensor_history = collections.deque(maxlen=MAX_HISTORY_POINTS)

# Thời điểm bắt đầu giả lập
start_time = datetime.now() - timedelta(minutes=10)

# Tạo dữ liệu giả
for i in range(100000):
    timestamp = (start_time + timedelta(minutes=i)).strftime('%Y-%m-%d %H:%M:%S')
    temperature = round(random.uniform(25.0, 30.0), 2)  # Nhiệt độ từ 25.0 tới 30.0
    humidity = round(random.uniform(60.0, 80.0), 2)      # Độ ẩm từ 60% tới 80%
    sensor_history.append((timestamp, temperature, humidity))

# In thử dữ liệu
for record in sensor_history:
    print(record)

