using Zvani.Application.Alerts.Contracts;

namespace Zvani.Application.Alerts;

public sealed record AlertUsageLease(bool IsAllowed, RemainingUsageResponse RemainingUsage);
