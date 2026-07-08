namespace Zvani.Application.Alerts.Interfaces;

public interface ISmsSender
{
    Task SendAsync(string receiverPhoneNumber, string body, CancellationToken cancellationToken);
}
