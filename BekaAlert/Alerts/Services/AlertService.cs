using BekaAlert.Alerts.Contracts;
using BekaAlert.Alerts.Interfaces;

namespace BekaAlert.Alerts.Services;

public sealed class AlertService(ILogger<AlertService> logger) : IAlertService
{
    public SendAlertResponse Send(SendAlertRequest request)
    {
        logger.LogInformation("Received alert request: {@Request}", request);
        return new SendAlertResponse("Alert request accepted.");
    }
}