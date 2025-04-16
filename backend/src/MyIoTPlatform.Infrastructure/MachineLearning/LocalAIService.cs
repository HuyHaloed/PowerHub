// MyIoTPlatform.Infrastructure/Services/LocalAIService.cs
using System.Diagnostics;
using System.Text.Json;
using MyIoTPlatform.Domain.Interfaces.Services;
using MyIoTPlatform.Application.Features.MachineLearning.DTOs;
using MyIoTPlatform.Domain.Models;

namespace MyIoTPlatform.Infrastructure.MachineLearning
{
    public class LocalAIService : IMachineLearningService
    {
        // Tham chiếu đến các file model AI, thư viện ML, v.v. (nếu cần)
        private readonly string _pythonScriptPath = "path/to/your/ai/script.py";
        public LocalAIService()
        {
            // Khởi tạo các thành phần cần thiết cho ML (nếu có)
        }

        public async Task<ModelPerformanceDto> GetModelPerformanceAsync(string modelId, CancellationToken cancellationToken = default)
        {
            try
            {
                using (Process process = new Process())
                {
                    process.StartInfo.FileName = "python"; // Hoặc đường dẫn đầy đủ đến python.exe
                    process.StartInfo.Arguments = $"{_pythonScriptPath} {modelId}";
                    process.StartInfo.UseShellExecute = false;
                    process.StartInfo.RedirectStandardOutput = true;
                    process.StartInfo.CreateNoWindow = true;

                    process.Start();
                    string jsonOutput = await process.StandardOutput.ReadToEndAsync();
                    await process.WaitForExitAsync(cancellationToken);

                    if (process.ExitCode == 0 && !string.IsNullOrEmpty(jsonOutput))
                    {
                        try
                        {
                            var performanceData = JsonSerializer.Deserialize<Dictionary<string, object>>(jsonOutput);
                            if (performanceData != null &&
                                performanceData.TryGetValue("accuracy", out var accuracyObj) && double.TryParse(accuracyObj.ToString(), out var accuracy) &&
                                performanceData.TryGetValue("f1_score", out var f1ScoreObj) && double.TryParse(f1ScoreObj.ToString(), out var f1Score) &&
                                performanceData.TryGetValue("precision", out var precisionObj) && double.TryParse(precisionObj.ToString(), out var precision) &&
                                performanceData.TryGetValue("recall", out var recallObj) && double.TryParse(recallObj.ToString(), out var recall))
                            {
                                return new ModelPerformanceDto(modelId, accuracy, f1Score, precision, recall);
                            }
                        }
                        catch (JsonException ex)
                        {
                            // Xử lý lỗi JSON
                            Console.WriteLine($"Error parsing JSON: {ex.Message}");
                        }
                    }
                    else
                    {
                        // Xử lý lỗi script Python
                        Console.WriteLine($"Python script failed with exit code {process.ExitCode}: {jsonOutput}");
                        throw new Exception($"Failed to get model performance for model ID: {modelId}. Python script error.");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error running Python script: {ex.Message}");
                throw;
            }

            return null; // Hoặc trả về một giá trị mặc định/lỗi khác
        }

        // Implement các phương thức khác từ IMachineLearningService
    }
}