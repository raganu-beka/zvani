using BekaAlert.Alerts.Contracts;
using BekaAlert.Alerts.Interfaces;

namespace BekaAlert.Alerts.Services;

public sealed class AlertService : IAlertService
{
    public SendAlertResponse Send(SendAlertRequest request)
    {
        return new SendAlertResponse("Alert request accepted.");
    }
}
