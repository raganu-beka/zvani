namespace Zvani.Application.Alerts.Contracts;

public sealed record RemainingUsageResponse(
    int Limit,
    int Remaining,
    DateTimeOffset? NextResetAtUtc);
