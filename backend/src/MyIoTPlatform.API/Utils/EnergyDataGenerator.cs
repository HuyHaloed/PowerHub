// EnergyDataGenerator.cs được viết lại
using MyIoTPlatform.API.Models;
using MyIoTPlatform.API.Services;

namespace MyIoTPlatform.API.Utilities
{
    public class EnergyDataGenerator
    {
        private readonly MongoDbService _mongoDbService;
        private readonly Random _random = new Random();

        public EnergyDataGenerator(MongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
        }

        public async Task GenerateEnergyDataForUserAsync(string userId, int days = 7)
        {
            // Lấy danh sách thiết bị của người dùng
            var devices = await _mongoDbService.GetDevicesByUserIdAsync(userId);
            if (devices.Count == 0)
            {
                Console.WriteLine($"No devices found for user {userId}");
                return;
            }

            // Tạo dữ liệu cho khoảng thời gian 'days' ngày gần đây
            var startDate = DateTime.UtcNow.Date.AddDays(-days);
            var endDate = DateTime.UtcNow;

            // Tạo dữ liệu phân bố năng lượng cho từng thiết bị theo từng giờ
            foreach (var device in devices)
            {
                await GenerateHourlyDistributionDataAsync(userId, device, startDate, endDate);
            }

            // Tính tổng tiêu thụ cho từng thiết bị theo ngày, tuần, tháng
            await CalculateDeviceConsumptionAsync(userId, devices, startDate, endDate);

            // Tính tổng tiêu thụ cho tất cả thiết bị theo ngày, tuần, tháng
            await CalculateTotalConsumptionAsync(userId, startDate, endDate);

            Console.WriteLine($"Energy data generated successfully for user {userId}");
        }

        private async Task GenerateHourlyDistributionDataAsync(string userId, Device device, DateTime startDate, DateTime endDate)
        {
            Console.WriteLine($"Generating hourly distribution data for device: {device.Name} ({device.Id})");
            
            var colors = new[] { "#4CAF50", "#2196F3", "#FFC107", "#9C27B0", "#F44336", "#607D8B" };
            int colorIndex = _random.Next(colors.Length);

            // Tạo dữ liệu theo từng ngày
            for (var date = startDate; date <= endDate; date = date.AddDays(1))
            {
                // Tạo giá trị tiêu thụ cho 24 giờ trong ngày
                for (int hour = 0; hour < 24; hour++)
                {
                    // Bỏ qua một số giờ ngẫu nhiên để mô phỏng thiết bị không hoạt động liên tục
                    if (_random.Next(10) < 3) continue;
                    
                    var timePoint = date.AddHours(hour);
                    
                    // Tạo giá trị tiêu thụ dựa trên loại thiết bị
                    var consumption = GetDeviceHourlyConsumption(device.Type);
                    
                    // Thêm một chút biến động ngẫu nhiên
                    consumption += _random.NextDouble() * (consumption * 0.2);
                    
                    // Nếu thiết bị đang tắt, đặt tiêu thụ bằng 0
                    var isOn = _random.Next(10) < 7; // 70% khả năng thiết bị đang bật
                    if (!isOn) consumption = 0;
                    
                    // Tạo bản ghi phân bố năng lượng
                    var distribution = new EnergyDistribution
                    {
                        UserId = userId,
                        DeviceId = device.Id,
                        Name = device.Name,
                        Value = consumption, // Ghi nhận giá trị tiêu thụ thực tế, không phải phần trăm
                        Color = colors[colorIndex],
                        Date = timePoint // Thời điểm ghi nhận (giờ cụ thể)
                    };
                    
                    await _mongoDbService.AddEnergyDistributionAsync(distribution);
                }
            }
        }

        private double GetDeviceHourlyConsumption(string deviceType)
        {
            // Ước tính tiêu thụ điện theo loại thiết bị (kWh mỗi giờ)
            return deviceType.ToLower() switch
            {
                "air conditioner" => _random.Next(10, 25) / 10.0, // 1.0 - 2.5 kWh
                "refrigerator" => _random.Next(5, 12) / 10.0,     // 0.5 - 1.2 kWh
                "television" => _random.Next(1, 4) / 10.0,        // 0.1 - 0.4 kWh
                "washing machine" => _random.Next(8, 20) / 10.0,  // 0.8 - 2.0 kWh
                "light" => _random.Next(1, 5) / 100.0,            // 0.01 - 0.05 kWh
                _ => _random.Next(3, 10) / 10.0                   // 0.3 - 1.0 kWh
            };
        }

        private async Task CalculateDeviceConsumptionAsync(string userId, List<Device> devices, DateTime startDate, DateTime endDate)
        {
            Console.WriteLine("Calculating device consumption totals...");
            
            // Tính tổng tiêu thụ cho từng thiết bị theo ngày
            foreach (var device in devices)
            {
                // Tính theo ngày
                for (var date = startDate; date <= endDate; date = date.AddDays(1))
                {
                    // Lấy tất cả bản ghi phân bố năng lượng của thiết bị trong ngày
                    var startOfDay = date.Date;
                    var endOfDay = date.Date.AddDays(1).AddTicks(-1);
                    
                    // Lấy tất cả các bản ghi phân bố của thiết bị trong ngày
                    var distributions = await _mongoDbService.GetEnergyDistributionByDeviceAsync(
                        userId, device.Id, startOfDay, endOfDay);
                    
                    // Tính tổng tiêu thụ trong ngày
                    double dailyConsumption = distributions.Sum(d => d.Value);
                    
                    // Tạo bản ghi tiêu thụ năng lượng cho thiết bị trong ngày
                    var energyConsumption = new EnergyConsumption
                    {
                        UserId = userId,
                        DeviceId = device.Id,
                        DeviceName = device.Name,
                        Value = dailyConsumption,
                        Date = date.Date,
                        TimeRange = "day"
                    };
                    
                    await _mongoDbService.AddEnergyConsumptionAsync(energyConsumption);
                }
                
                // Tính theo tuần (mỗi 7 ngày)
                DateTime currentWeekStart = startDate;
                while (currentWeekStart <= endDate)
                {
                    DateTime weekEnd = currentWeekStart.AddDays(6);
                    if (weekEnd > endDate) weekEnd = endDate;
                    
                    // Lấy tất cả tiêu thụ năng lượng hàng ngày của thiết bị trong tuần
                    var dailyConsumptions = await _mongoDbService.GetEnergyConsumptionByDeviceAsync(
                        userId, device.Id, "day", currentWeekStart, weekEnd);
                    
                    // Tính tổng tiêu thụ trong tuần
                    double weeklyConsumption = dailyConsumptions.Sum(c => c.Value);
                    
                    // Tạo bản ghi tiêu thụ năng lượng cho thiết bị trong tuần
                    var weeklyConsumptionRecord = new EnergyConsumption
                    {
                        UserId = userId,
                        DeviceId = device.Id,
                        DeviceName = device.Name,
                        Value = weeklyConsumption,
                        Date = currentWeekStart.Date,
                        TimeRange = "week"
                    };
                    
                    await _mongoDbService.AddEnergyConsumptionAsync(weeklyConsumptionRecord);
                    
                    currentWeekStart = currentWeekStart.AddDays(7);
                }
                
                // Tính theo tháng
                DateTime currentMonthStart = new DateTime(startDate.Year, startDate.Month, 1);
                while (currentMonthStart <= endDate)
                {
                    DateTime monthEnd = currentMonthStart.AddMonths(1).AddDays(-1);
                    if (monthEnd > endDate) monthEnd = endDate;
                    
                    // Lấy tất cả tiêu thụ năng lượng hàng ngày của thiết bị trong tháng
                    var dailyConsumptions = await _mongoDbService.GetEnergyConsumptionByDeviceAsync(
                        userId, device.Id, "day", currentMonthStart, monthEnd);
                    
                    // Tính tổng tiêu thụ trong tháng
                    double monthlyConsumption = dailyConsumptions.Sum(c => c.Value);
                    
                    // Tạo bản ghi tiêu thụ năng lượng cho thiết bị trong tháng
                    var monthlyConsumptionRecord = new EnergyConsumption
                    {
                        UserId = userId,
                        DeviceId = device.Id,
                        DeviceName = device.Name,
                        Value = monthlyConsumption,
                        Date = currentMonthStart.Date,
                        TimeRange = "month"
                    };
                    
                    await _mongoDbService.AddEnergyConsumptionAsync(monthlyConsumptionRecord);
                    
                    currentMonthStart = currentMonthStart.AddMonths(1);
                }
            }
        }

        private async Task CalculateTotalConsumptionAsync(string userId, DateTime startDate, DateTime endDate)
        {
            Console.WriteLine("Calculating total consumption for all devices...");
            
            // Tính tổng tiêu thụ theo ngày cho tất cả thiết bị
            for (var date = startDate; date <= endDate; date = date.AddDays(1))
            {
                // Lấy tất cả bản ghi tiêu thụ năng lượng của các thiết bị trong ngày
                var deviceConsumptions = await _mongoDbService.GetEnergyConsumptionByTimeRangeAsync(
                    userId, "day", date.Date, date.Date.AddDays(1).AddTicks(-1));
                
                // Tính tổng tiêu thụ trong ngày
                double totalDailyConsumption = deviceConsumptions.Sum(c => c.Value);
                
                // Tạo bản ghi tổng tiêu thụ năng lượng trong ngày
                var totalDailyConsumptionRecord = new EnergyConsumption
                {
                    UserId = userId,
                    DeviceId = null, // Null để đánh dấu đây là tổng tiêu thụ
                    DeviceName = "Total Consumption",
                    Value = totalDailyConsumption,
                    Date = date.Date,
                    TimeRange = "day"
                };
                
                await _mongoDbService.AddEnergyConsumptionAsync(totalDailyConsumptionRecord);
            }
            
            // Tính tổng tiêu thụ theo tuần
            DateTime currentWeekStart = startDate;
            while (currentWeekStart <= endDate)
            {
                DateTime weekEnd = currentWeekStart.AddDays(6);
                if (weekEnd > endDate) weekEnd = endDate;
                
                // Lấy tất cả bản ghi tiêu thụ năng lượng của các thiết bị trong tuần
                var deviceConsumptions = await _mongoDbService.GetEnergyConsumptionByTimeRangeAsync(
                    userId, "day", currentWeekStart, weekEnd);
                
                // Tính tổng tiêu thụ trong tuần
                double totalWeeklyConsumption = deviceConsumptions.Sum(c => c.Value);
                
                // Tạo bản ghi tổng tiêu thụ năng lượng trong tuần
                var totalWeeklyConsumptionRecord = new EnergyConsumption
                {
                    UserId = userId,
                    DeviceId = null,
                    DeviceName = "Total Consumption",
                    Value = totalWeeklyConsumption,
                    Date = currentWeekStart.Date,
                    TimeRange = "week"
                };
                
                await _mongoDbService.AddEnergyConsumptionAsync(totalWeeklyConsumptionRecord);
                
                currentWeekStart = currentWeekStart.AddDays(7);
            }
            
            // Tính tổng tiêu thụ theo tháng
            DateTime currentMonthStart = new DateTime(startDate.Year, startDate.Month, 1);
            while (currentMonthStart <= endDate)
            {
                DateTime monthEnd = currentMonthStart.AddMonths(1).AddDays(-1);
                if (monthEnd > endDate) monthEnd = endDate;
                
                // Lấy tất cả bản ghi tiêu thụ năng lượng của các thiết bị trong tháng
                var deviceConsumptions = await _mongoDbService.GetEnergyConsumptionByTimeRangeAsync(
                    userId, "day", currentMonthStart, monthEnd);
                
                // Tính tổng tiêu thụ trong tháng
                double totalMonthlyConsumption = deviceConsumptions.Sum(c => c.Value);
                
                // Tạo bản ghi tổng tiêu thụ năng lượng trong tháng
                var totalMonthlyConsumptionRecord = new EnergyConsumption
                {
                    UserId = userId,
                    DeviceId = null,
                    DeviceName = "Total Consumption",
                    Value = totalMonthlyConsumption,
                    Date = currentMonthStart.Date,
                    TimeRange = "month"
                };
                
                await _mongoDbService.AddEnergyConsumptionAsync(totalMonthlyConsumptionRecord);
                
                currentMonthStart = currentMonthStart.AddMonths(1);
            }
        }
    }
}