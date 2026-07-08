namespace Zvani.Application.Alerts.Contracts;

public sealed record SendAlertResponse(bool EmailSucceeded, bool SmsSucceeded);
