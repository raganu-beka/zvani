using Microsoft.Extensions.Options;
using Zvani.Application.Alerts.Configuration;
using Zvani.Application.Alerts.Contracts;
using Zvani.Application.Alerts.Interfaces;

namespace Zvani.Application.Alerts.Services;

public sealed class AlertService(
    IEmailSender emailSender,
    IOptions<AlertNotificationOptions> notificationOptions,
    ILogger<AlertService> logger) : IAlertService
{
    public async Task<SendAlertResponse> SendAsync(SendAlertRequest request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Received alert request: {@Request}", request);

        var receiverEmail = notificationOptions.Value.ReceiverEmail;
        var message = string.IsNullOrWhiteSpace(request.Message)
            ? "Alert notification received."
            : request.Message;

        await emailSender.SendAsync(receiverEmail, "Zvani Alert", message, cancellationToken);

        return new SendAlertResponse("Alert request accepted.");
    }
}
