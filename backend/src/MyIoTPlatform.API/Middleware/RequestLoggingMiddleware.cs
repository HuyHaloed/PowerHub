using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Threading.Tasks;

namespace MyIoTPlatform.API.Middleware
{
    /// <summary>
    /// Middleware for logging details of incoming HTTP requests.
    /// </summary>
    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestLoggingMiddleware> _logger;

        public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var stopwatch = Stopwatch.StartNew();

            _logger.LogInformation("Handling request: {Method} {Path}", context.Request.Method, context.Request.Path);

            await _next(context);

            stopwatch.Stop();
            _logger.LogInformation("Finished handling request in {ElapsedMilliseconds}ms", stopwatch.ElapsedMilliseconds);
        }
    }
}