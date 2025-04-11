using System;
using System.Collections.Generic; // Cho Dictionary

namespace MyIoTPlatform.Application.Features.Devices.DTOs;
public record DeviceDetailsDto(
    Guid Id,
    string Name,
    string Type,
    string? Location,
    string Status,
    double? Consumption, // Logic tương tự Summary
    DateTime? LastUpdated,
    List<TelemetryHistoryDto>? History, // DTO cho lịch sử telemetry
    Dictionary<string, string>? Properties // Parse từ PropertiesJson
);
// Tạo thêm TelemetryHistoryDto nếu cần
public record TelemetryHistoryDto(DateTime Date, double Value /*, ...*/);