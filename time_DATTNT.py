from datetime import datetime

# Tạo đối tượng datetime cho giờ bắt đầu và kết thúc
start_dt = datetime.strptime("2025-04-25 00:01:00", "%Y-%m-%d %H:%M:%S")
end_dt = datetime.strptime("2025-04-25 00:02:00", "%Y-%m-%d %H:%M:%S")

# Đổi sang timestamp dạng milliseconds
start_ts = int(start_dt.timestamp() * 1000)
end_ts = int(end_dt.timestamp() * 1000)

print("startTs:", start_ts)
print("endTs:", end_ts)
