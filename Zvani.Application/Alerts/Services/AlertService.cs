using Zvani.Application.Alerts.Contracts;
using Zvani.Application.Alerts.Interfaces;

namespace Zvani.Application.Alerts.Services;

public sealed class AlertService(ILogger<AlertService> logger) : IAlertService
{
    public SendAlertResponse Send(SendAlertRequest request)
    {
        logger.LogInformation("Received alert request: {@Request}", request);
        return new SendAlertResponse("Alert request accepted.");
    }
}