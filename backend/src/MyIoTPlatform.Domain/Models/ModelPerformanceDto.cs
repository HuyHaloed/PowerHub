namespace MyIoTPlatform.Domain.Models
{
    public class ModelPerformanceDto
    {
        public string ModelId { get; set; } // Để xác định mô hình nào
        public double Accuracy { get; set; }
        public double F1Score { get; set; }
        public double Precision { get; set; }
        public double Recall { get; set; }
        // Thêm các chỉ số hiệu suất khác mà script Python của bạn trả về
        public string EvaluationDate { get; set; } // Ví dụ: Ngày đánh giá
        public string Notes { get; set; } // Ví dụ: Ghi chú về quá trình đánh giá

        // Bạn có thể thêm constructor nếu cần thiết
        public ModelPerformanceDto()
        {
            // Khởi tạo giá trị mặc định (nếu cần)
        }

        public ModelPerformanceDto(string modelId, double accuracy, double f1Score, double precision, double recall, string evaluationDate = null, string notes = null)
        {
            ModelId = modelId;
            Accuracy = accuracy;
            F1Score = f1Score;
            Precision = precision;
            Recall = recall;
            EvaluationDate = evaluationDate;
            Notes = notes;
        }
    }
}