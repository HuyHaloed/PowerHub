// using MongoDB.Bson;
// using MongoDB.Bson.Serialization.Attributes;
// using System;
// using System.Collections.Generic;

// namespace MyIoTPlatform.API.Models
// {

//     // Dữ liệu năng lượng
//     public class EnergyData
//     {
//         public string Name { get; set; }
//         public double Value { get; set; }
//         public DateTime Date { get; set; }
//     }

//     // Model tổng quan Dashboard
//     public class DashboardData
//     {
//         public User User { get; set; }
//         public List<Stat> QuickStats { get; set; }
//         public List<Device> Devices { get; set; }
//         public List<EnergyData> DailyEnergyData { get; set; }
//         public List<EnergyData> WeeklyEnergyData { get; set; }
//         public List<EnergyData> MonthlyEnergyData { get; set; }
//         public List<EnergyData> YearlyEnergyData { get; set; }
//         public List<Alert> Alerts { get; set; }
//         public List<EnergyDistribution> EnergyDistribution { get; set; }
//     }

//     // Phân phối năng lượng
//     public class EnergyDistribution
//     {
//         public string Name { get; set; }
//         public double Value { get; set; }
//         public string Color { get; set; }
//     }
// }