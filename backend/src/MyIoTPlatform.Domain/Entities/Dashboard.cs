namespace MyIoTPlatform.Domain.Entities
{
    public class Dashboard
    {
        public required string Id { get; set; } // Added 'required' modifier to ensure initialization
        public required string Name { get; set; } // Added 'required' modifier to ensure initialization
        public required string Layout { get; set; } // Added 'required' modifier to ensure initialization
    }
}