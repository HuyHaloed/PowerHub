
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MyIoTPlatform.API.Models;
using System.Security.Cryptography;
using System.Text;

namespace MyIoTPlatform.API.Services
{
    public class UserService
    {
        private readonly IMongoCollection<User> _usersCollection;

        public UserService(IOptions<MongoDbSettings> mongoDBSettings)
        {
            var mongoClient = new MongoClient(mongoDBSettings.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(mongoDBSettings.Value.DatabaseName);
            _usersCollection = mongoDatabase.GetCollection<User>("Users");
        }

        public async Task<User> GetUserByIdAsync(string id)
        {
            return await _usersCollection.Find(u => u.Id == id).FirstOrDefaultAsync();
        }

        public async Task<User> GetUserByEmailAsync(string email)
        {
            return await _usersCollection.Find(u => u.Email == email).FirstOrDefaultAsync();
        }

        public async Task<User> CreateUserAsync(RegisterRequest request)
        {
            var existingUser = await GetUserByEmailAsync(request.Email);
            if (existingUser != null)
                throw new Exception("Email already exists");


            string passwordHash = HashPassword(request.Password);

            var user = new User
            {
                Name = request.Name,
                Email = request.Email,
                PasswordHash = passwordHash,
                Phone = request.Phone,
                CreatedAt = DateTime.UtcNow,
                LastLogin = DateTime.UtcNow
            };

            await _usersCollection.InsertOneAsync(user);
            return user;
        }

        public async Task<User> AuthenticateAsync(string email, string password)
        {
            var user = await GetUserByEmailAsync(email);
            if (user == null)
                return null;
            if (!VerifyPassword(password, user.PasswordHash))
                return null;
            var update = Builders<User>.Update.Set(u => u.LastLogin, DateTime.UtcNow);
            await _usersCollection.UpdateOneAsync(u => u.Id == user.Id, update);

            return user;
        }

        public async Task UpdateUserAsync(string id, User updatedUser)
        {
            await _usersCollection.ReplaceOneAsync(u => u.Id == id, updatedUser);
        }
        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                byte[] hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        private bool VerifyPassword(string password, string storedHash)
        {
            string hashedPassword = HashPassword(password);
            return storedHash == hashedPassword;
        }
    }
}