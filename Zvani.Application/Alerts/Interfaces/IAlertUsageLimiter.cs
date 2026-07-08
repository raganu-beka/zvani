namespace Zvani.Application.Alerts.Interfaces;

public interface IAlertUsageLimiter
{
    AlertUsageLease TryConsume(string userId);
}
