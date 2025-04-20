using MyIoTPlatform.API.Models;
using MyIoTPlatform.API.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace MyIoTPlatform.API.Utilities
{
    public class EnvironmentDataGenerator
    {
        private readonly MongoDbService _mongoDbService;
        private readonly Random _random = new Random();

        public EnvironmentDataGenerator(MongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
        }

        public async Task GenerateEnvironmentDataForUserAsync(string userId, int days = 14)
        {
            Console.WriteLine($"Generating environment data for user {userId} for the past {days} days...");
            
            // Lấy danh sách thiết bị của người dùng
            var devices = await _mongoDbService.GetDevicesByUserIdAsync(userId);
            if (devices.Count == 0)
            {
                Console.WriteLine($"No devices found for user {userId}");
                return;
            }

            // Chọn một vài thiết bị để làm cảm biến môi trường (không phải tất cả thiết bị đều có cảm biến)
            var sensorDevices = devices.Where(d => 
                d.Type.Contains("Air Conditioner") || 
                d.Type.Contains("Refrigerator") || 
                d.Location.Contains("Living Room") || 
                d.Location.Contains("Bedroom")).Take(3).ToList();

            if (sensorDevices.Count == 0)
            {
                Console.WriteLine($"No suitable devices found for environment sensors for user {userId}");
                // Nếu không tìm thấy thiết bị phù hợp, hãy chọn ngẫu nhiên 2 thiết bị
                sensorDevices = devices.OrderBy(x => Guid.NewGuid()).Take(2).ToList();
            }

            Console.WriteLine($"Selected {sensorDevices.Count} devices to generate environment data");

            // Tạo dữ liệu môi trường cho khoảng thời gian 'days' ngày gần đây
            var endDate = DateTime.UtcNow;
            var startDate = endDate.AddDays(-days);

            // Tạo dữ liệu cho từng thiết bị
            foreach (var device in sensorDevices)
            {
                await GenerateDeviceEnvironmentDataAsync(userId, device, startDate, endDate);
            }

            Console.WriteLine($"Environment data generation completed for user {userId}");
        }

        private async Task GenerateDeviceEnvironmentDataAsync(string userId, Device device, DateTime startDate, DateTime endDate)
        {
            Console.WriteLine($"Generating environment data for device: {device.Name} ({device.Id}) in {device.Location}");
            
            // Tạo các giá trị cơ sở tùy thuộc vào vị trí
            var baseTemperature = GetBaseTemperatureForLocation(device.Location);
            var baseHumidity = GetBaseHumidityForLocation(device.Location);
            
            // Tạo dữ liệu theo từng ngày với nhiều bản ghi mỗi ngày
            var currentTime = startDate;
            while (currentTime <= endDate)
            {
                // Tạo từ 4-12 bản ghi mỗi ngày, tùy thuộc vào loại thiết bị và ngẫu nhiên
                int samplesPerDay = device.Type.Contains("Air Conditioner") ? 
                    _random.Next(8, 13) : _random.Next(4, 9);
                
                // Khoảng thời gian giữa các mẫu
                var timeInterval = 24.0 / samplesPerDay;
                
                for (int i = 0; i < samplesPerDay; i++)
                {
                    // Tính toán thời điểm lấy mẫu
                    var sampleTime = currentTime.Date.AddHours(i * timeInterval + _random.NextDouble() * 0.5);
                    if (sampleTime > endDate) break;
                    
                    // Tạo biến động nhiệt độ và độ ẩm dựa trên thời gian trong ngày
                    var hourOfDay = sampleTime.Hour;
                    
                    // Biến động nhiệt độ: Cao nhất vào buổi trưa, thấp nhất vào buổi đêm
                    var temperatureVariation = GetTemperatureVariationByHour(hourOfDay);
                    
                    // Biến động độ ẩm: Ngược lại với nhiệt độ - thấp nhất vào buổi trưa, cao nhất vào buổi đêm/sáng sớm
                    var humidityVariation = GetHumidityVariationByHour(hourOfDay);
                    
                    // Tạo thêm một chút ngẫu nhiên
                    var randomTempFactor = (_random.NextDouble() * 2 - 1) * 1.5; // -1.5 đến +1.5
                    var randomHumidFactor = (_random.NextDouble() * 2 - 1) * 3;  // -3 đến +3
                    
                    // Thêm ảnh hưởng của thiết bị lên dữ liệu môi trường
                    var deviceEffect = GetDeviceEnvironmentEffect(device.Type, device.Status);
                    
                    // Tính giá trị cuối cùng
                    var temperature = Math.Round(baseTemperature + temperatureVariation + randomTempFactor + deviceEffect.TemperatureEffect, 1);
                    var humidity = Math.Round(baseHumidity + humidityVariation + randomHumidFactor + deviceEffect.HumidityEffect, 1);
                    
                    // Đảm bảo các giá trị nằm trong khoảng hợp lý
                    temperature = Math.Max(16, Math.Min(38, temperature));
                    humidity = Math.Max(30, Math.Min(90, humidity));
                    
                    // Tạo bản ghi dữ liệu môi trường
                    var environmentData = new EnvironmentData
                    {
                        UserId = userId,
                        DeviceId = device.Id,
                        DeviceName = device.Name,
                        Temperature = temperature,
                        Humidity = humidity,
                        Timestamp = sampleTime,
                        Location = device.Location
                    };
                    
                    await _mongoDbService.AddEnvironmentDataAsync(environmentData);
                }
                
                // Chuyển sang ngày tiếp theo
                currentTime = currentTime.AddDays(1);
            }
        }

        private double GetBaseTemperatureForLocation(string location)
        {
            // Nhiệt độ cơ sở tùy thuộc vào vị trí trong nhà
            return location.ToLower() switch
            {
                var l when l.Contains("kitchen") => 26.0,
                var l when l.Contains("bathroom") => 25.0,
                var l when l.Contains("bedroom") => 24.0,
                var l when l.Contains("living") => 25.0,
                var l when l.Contains("office") => 24.0,
                _ => 25.0
            };
        }

        private double GetBaseHumidityForLocation(string location)
        {
            // Độ ẩm cơ sở tùy thuộc vào vị trí trong nhà
            return location.ToLower() switch
            {
                var l when l.Contains("kitchen") => 60.0,
                var l when l.Contains("bathroom") => 70.0,
                var l when l.Contains("bedroom") => 55.0,
                var l when l.Contains("living") => 50.0,
                var l when l.Contains("office") => 45.0,
                _ => 55.0
            };
        }

        private double GetTemperatureVariationByHour(int hour)
        {
            // Biến động nhiệt độ theo giờ trong ngày
            if (hour >= 6 && hour < 10) return 1.0;      // Sáng: Tăng nhẹ
            else if (hour >= 10 && hour < 14) return 3.0; // Trưa: Đỉnh điểm
            else if (hour >= 14 && hour < 18) return 2.5; // Chiều: Giảm nhẹ
            else if (hour >= 18 && hour < 22) return 0.5; // Tối: Trung bình
            else return -1.5;                             // Đêm: Thấp nhất
        }

        private double GetHumidityVariationByHour(int hour)
        {
            // Biến động độ ẩm theo giờ - ngược lại với nhiệt độ
            if (hour >= 6 && hour < 10) return 2.0;       // Sáng: Cao
            else if (hour >= 10 && hour < 14) return -5.0; // Trưa: Thấp nhất
            else if (hour >= 14 && hour < 18) return -3.0; // Chiều: Tăng dần
            else if (hour >= 18 && hour < 22) return 0.0;  // Tối: Trung bình
            else return 4.0;                               // Đêm: Cao nhất
        }

        private (double TemperatureEffect, double HumidityEffect) GetDeviceEnvironmentEffect(string deviceType, string deviceStatus)
        {
            // Thiết bị không hoạt động sẽ không ảnh hưởng đến môi trường
            if (deviceStatus.ToLower() != "on")
                return (0, 0);
            
            // Ảnh hưởng của thiết bị lên nhiệt độ và độ ẩm
            return deviceType.ToLower() switch
            {
                var d when d.Contains("air conditioner") => (-3.0, -8.0),   // Máy lạnh: giảm nhiệt độ và độ ẩm
                var d when d.Contains("refrigerator") => (-0.5, -1.0),      // Tủ lạnh: giảm nhẹ
                var d when d.Contains("television") => (0.5, 0),             // TV: tăng nhiệt độ nhẹ
                var d when d.Contains("washing machine") => (0.5, 5.0),      // Máy giặt: tăng độ ẩm đáng kể
                var d when d.Contains("light") => (0.3, 0),                  // Đèn: tăng nhiệt độ rất nhẹ
                _ => (0, 0)
            };
        }
    }
}