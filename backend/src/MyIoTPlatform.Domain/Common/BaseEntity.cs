using System;

namespace MyIoTPlatform.Domain.Common
{
    public abstract class BaseEntity<TKey>
    {
        public TKey Id { get; set; }
        public string? CreatedBy { get; set; }
        public DateTimeOffset CreatedOn { get; set; } = DateTimeOffset.UtcNow;
        public string? LastModifiedBy { get; set; }
        public DateTimeOffset? LastModifiedOn { get; set; }
        public bool IsDeleted { get; set; } = false;
    }

    public abstract class BaseEntity : BaseEntity<Guid>
    {
        public BaseEntity()
        {
            CreatedOn = DateTimeOffset.UtcNow; // Đảm bảo CreatedOn được khởi tạo khi dùng BaseEntity không generic
        }
    }
}