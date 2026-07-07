using BekaAlert.Alerts.Contracts;

namespace BekaAlert.Alerts.Interfaces;

public interface IAlertService
{
    SendAlertResponse Send(SendAlertRequest request);
}
