using Zvani.Application.Alerts.Contracts;

namespace Zvani.Application.Alerts.Interfaces;

public interface IAlertUsageLimiter
{
    RemainingUsageResponse GetRemainingUsage(string userId);

    AlertUsageLease TryConsume(string userId);
}
