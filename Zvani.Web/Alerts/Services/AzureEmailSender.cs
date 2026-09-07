using Azure;
using Azure.Communication.Email;
using Microsoft.Extensions.Options;
using Zvani.Application.Alerts.Configuration;
using Zvani.Application.Alerts.Interfaces;

namespace Zvani.Application.Alerts.Services;

public sealed class AzureEmailSender(
    EmailClient emailClient,
    IOptions<AzureEmailOptions> options,
    ILogger<AzureEmailSender> logger) : IEmailSender
{
    private readonly AzureEmailOptions _emailOptions = options.Value;

    public async Task SendAsync(
        string receiverEmail,
        string subject,
        string body,
        CancellationToken cancellationToken)
    {
        var message = new EmailMessage(
            senderAddress: _emailOptions.SenderAddress,
            content: new EmailContent(subject)
            {
                PlainText = body
            },
            recipients: new EmailRecipients([new EmailAddress(receiverEmail)]));

        await emailClient.SendAsync(WaitUntil.Completed, message, cancellationToken);

        logger.LogInformation("Alert email sent to {ReceiverEmail}", receiverEmail);
    }
}
