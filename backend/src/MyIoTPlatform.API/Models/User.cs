
// using MongoDB.Bson;
// using MongoDB.Bson.Serialization.Attributes;

// namespace MyIoTPlatform.API.Models
// {
//     public class User
//     {
//         [BsonId]
//         [BsonRepresentation(BsonType.ObjectId)]
//         public string Id { get; set; }

//         public string Name { get; set; }

//         public string Email { get; set; }

//         public string PasswordHash { get; set; }

//         public string Phone { get; set; }

//         public string Avatar { get; set; } = string.Empty;

//         public UserSubscription Subscription { get; set; } = new UserSubscription();

//         public UserPreferences Preferences { get; set; } = new UserPreferences();

//         public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

//         public DateTime LastLogin { get; set; } = DateTime.UtcNow;

//         public bool IsActive { get; set; } = true;
//     }

//     public class UserSubscription
//     {
//         public string Plan { get; set; } = "basic";
//         public DateTime ValidUntil { get; set; } = DateTime.UtcNow.AddYears(1);
//     }

//     public class UserPreferences
//     {
//         public string Theme { get; set; } = "light";
//         public bool Notifications { get; set; } = true;
//         public int EnergyGoal { get; set; } = 1000;
//     }
// }

// namespace MyIoTPlatform.API.Models
// {
//     public class LoginRequest
//     {
//         public string Email { get; set; }
//         public string Password { get; set; }
//     }

//     public class RegisterRequest
//     {
//         public string Name { get; set; }
//         public string Email { get; set; }
//         public string Password { get; set; }
//         public string Phone { get; set; }
//     }

//     public class AuthResponse
//     {
//         public string Token { get; set; }
//         public UserDto User { get; set; }
//     }

//     public class UserDto
//     {
//         public string Id { get; set; }
//         public string Name { get; set; }
//         public string Email { get; set; }
//         public string Avatar { get; set; }
//         public UserSubscription Subscription { get; set; }
//         public UserPreferences Preferences { get; set; }
//     }
// }