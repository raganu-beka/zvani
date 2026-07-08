namespace Zvani.Application.Alerts.Interfaces;

public interface IEmailSender
{
    Task SendAsync(string receiverEmail, string subject, string body, CancellationToken cancellationToken);
}
