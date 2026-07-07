using Zvani.Application.Alerts.Contracts;

namespace Zvani.Application.Alerts.Interfaces;

public interface IAlertService
{
    SendAlertResponse Send(SendAlertRequest request);
}