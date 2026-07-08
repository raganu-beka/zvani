using System.Collections.Concurrent;
using Microsoft.Extensions.Options;
using Zvani.Application.Alerts.Configuration;
using Zvani.Application.Alerts.Contracts;
using Zvani.Application.Alerts.Interfaces;

namespace Zvani.Application.Alerts.Services;

public sealed class InMemoryAlertUsageLimiter(IOptions<AlertNotificationOptions> notificationOptions)
    : IAlertUsageLimiter
{
    private readonly ConcurrentDictionary<string, List<DateTimeOffset>> _requestsByUser = new();

    public AlertUsageLease TryConsume(string userId)
    {
        var options = notificationOptions.Value;
        var limit = options.MaxRequestsPerUser;
        var window = TimeSpan.FromHours(options.RequestWindowHours);
        var now = DateTimeOffset.UtcNow;
        var windowStart = now.Subtract(window);
        var requests = _requestsByUser.GetOrAdd(userId, _ => []);

        lock (requests)
        {
            requests.RemoveAll(requestedAt => requestedAt <= windowStart);

            if (requests.Count >= limit)
                return new AlertUsageLease(false, CreateUsage(limit, requests, window));

            requests.Add(now);

            return new AlertUsageLease(true, CreateUsage(limit, requests, window));
        }
    }

    private static RemainingUsageResponse CreateUsage(
        int limit,
        IReadOnlyCollection<DateTimeOffset> requests,
        TimeSpan window)
    {
        var remaining = Math.Max(0, limit - requests.Count);
        var nextResetAtUtc = requests.Count == 0
            ? (DateTimeOffset?)null
            : requests.Min().Add(window);

        return new RemainingUsageResponse(limit, remaining, nextResetAtUtc);
    }
}