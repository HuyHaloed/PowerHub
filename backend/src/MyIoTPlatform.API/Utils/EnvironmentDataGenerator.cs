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
            
            // Kiểm tra xem người dùng có tồn tại không
            var user = await _mongoDbService.GetUserByIdAsync(userId);
            if (user == null)
            {
                Console.WriteLine($"User with ID {userId} not found");
                return;
            }

            // Quyết định vị trí đo nhiệt độ và độ ẩm (mặc định là phòng khách)
            string location = "Phòng khách";

            Console.WriteLine($"Generating environment data for location: {location}");

            // Tạo dữ liệu môi trường cho khoảng thời gian 'days' ngày gần đây
            var endDate = DateTime.UtcNow;
            var startDate = endDate.AddDays(-days);

            // Tạo dữ liệu môi trường
            await GenerateLocationEnvironmentDataAsync(userId, location, startDate, endDate);

            Console.WriteLine($"Environment data generation completed for user {userId}");
        }

        private async Task GenerateLocationEnvironmentDataAsync(string userId, string location, DateTime startDate, DateTime endDate)
        {
            Console.WriteLine($"Generating environment data for location: {location}");
            
            // Tạo các giá trị cơ sở tùy thuộc vào vị trí
            var baseTemperature = GetBaseTemperatureForLocation(location);
            var baseHumidity = GetBaseHumidityForLocation(location);
            
            // Tạo dữ liệu theo từng ngày với nhiều bản ghi mỗi ngày
            var currentTime = startDate;
            while (currentTime <= endDate)
            {
                // Tạo 24 bản ghi mỗi ngày (cứ 1 giờ một bản ghi)
                int samplesPerDay = 24;
                
                for (int hour = 0; hour < samplesPerDay; hour++)
                {
                    // Tính toán thời điểm lấy mẫu
                    var sampleTime = currentTime.Date.AddHours(hour);
                    if (sampleTime > endDate) break;
                    
                    // Biến động nhiệt độ: Cao nhất vào buổi trưa, thấp nhất vào buổi đêm
                    var temperatureVariation = GetTemperatureVariationByHour(hour);
                    
                    // Biến động độ ẩm: Ngược lại với nhiệt độ
                    var humidityVariation = GetHumidityVariationByHour(hour);
                    
                    // Tạo thêm một chút ngẫu nhiên
                    var randomTempFactor = (_random.NextDouble() * 2 - 1) * 1.0; // -1.0 đến +1.0
                    var randomHumidFactor = (_random.NextDouble() * 2 - 1) * 2.0; // -2.0 đến +2.0
                    
                    // Tính giá trị cuối cùng
                    var temperature = Math.Round(baseTemperature + temperatureVariation + randomTempFactor, 1);
                    var humidity = Math.Round(baseHumidity + humidityVariation + randomHumidFactor, 1);
                    
                    // Đảm bảo các giá trị nằm trong khoảng hợp lý
                    temperature = Math.Max(16, Math.Min(38, temperature));
                    humidity = Math.Max(30, Math.Min(90, humidity));
                    
                    // Tạo bản ghi dữ liệu môi trường
                    var environmentData = new EnvironmentData
                    {
                        UserId = userId,
                        Temperature = temperature,
                        Humidity = humidity,
                        Timestamp = sampleTime,
                        Location = location
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
                var l when l.Contains("bếp") || l.Contains("kitchen") => 26.0,
                var l when l.Contains("tắm") || l.Contains("bathroom") => 25.0,
                var l when l.Contains("ngủ") || l.Contains("bedroom") => 24.0,
                var l when l.Contains("khách") || l.Contains("living") => 25.0,
                var l when l.Contains("làm việc") || l.Contains("office") => 24.0,
                _ => 25.0
            };
        }

        private double GetBaseHumidityForLocation(string location)
        {
            // Độ ẩm cơ sở tùy thuộc vào vị trí trong nhà
            return location.ToLower() switch
            {
                var l when l.Contains("bếp") || l.Contains("kitchen") => 60.0,
                var l when l.Contains("tắm") || l.Contains("bathroom") => 70.0,
                var l when l.Contains("ngủ") || l.Contains("bedroom") => 55.0,
                var l when l.Contains("khách") || l.Contains("living") => 50.0,
                var l when l.Contains("làm việc") || l.Contains("office") => 45.0,
                _ => 55.0
            };
        }

        private double GetTemperatureVariationByHour(int hour)
        {
            // Biến động nhiệt độ theo giờ trong ngày
            if (hour >= 6 && hour < 10) return 1.0;       // Sáng: Tăng nhẹ
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
    }
}