using Zvani.Application.Alerts.Contracts;

namespace Zvani.Application.Alerts.Interfaces;

public interface IAlertService
{
    Task<SendAlertResponse> SendAsync(string userId, SendAlertRequest request, CancellationToken cancellationToken);
}
