namespace Zvani.Application.Alerts.Contracts;

public sealed record SendAlertResponse(
    bool Accepted,
    bool EmailSucceeded,
    bool SmsSucceeded,
    RemainingUsageResponse RemainingUsage);
