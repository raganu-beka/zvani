using Microsoft.Extensions.Options;
using Zvani.Application.Alerts.Configuration;
using Zvani.Application.Alerts.Contracts;
using Zvani.Application.Alerts.Interfaces;

namespace Zvani.Application.Alerts.Services;

public sealed class AlertService(
    IEmailSender emailSender,
    ISmsSender smsSender,
    IAlertUsageLimiter alertUsageLimiter,
    IOptions<AlertNotificationOptions> notificationOptions,
    ILogger<AlertService> logger) : IAlertService
{
    public async Task<SendAlertResponse> SendAsync(
        string userId,
        SendAlertRequest request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Received alert request for {UserId}: {@Request}", userId, request);

        var usageLease = alertUsageLimiter.TryConsume(userId);
        if (!usageLease.IsAllowed)
        {
            logger.LogInformation("Alert request rejected for {UserId}; usage limit reached.", userId);
            return new SendAlertResponse(false, false, false, usageLease.RemainingUsage);
        }

        var options = notificationOptions.Value;
        var message = string.IsNullOrWhiteSpace(request.Message)
            ? "Alert notification received."
            : request.Message;

        var emailTask = SendEmailAsync(options.ReceiverEmail, options.DefaultSubject, message, cancellationToken);
        var smsTask = SendSmsAsync(options.ReceiverPhoneNumber, message, cancellationToken);

        await Task.WhenAll(emailTask, smsTask);

        return new SendAlertResponse(true, emailTask.Result, smsTask.Result, usageLease.RemainingUsage);
    }

    private async Task<bool> SendEmailAsync(
        string receiverEmail,
        string subject,
        string body,
        CancellationToken cancellationToken)
    {
        try
        {
            await emailSender.SendAsync(receiverEmail, subject, body, cancellationToken);
            logger.LogInformation("Alert email delivery succeeded for {ReceiverEmail}", receiverEmail);
            return true;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning("Alert email delivery canceled for {ReceiverEmail}", receiverEmail);
            return false;
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Alert email delivery failed for {ReceiverEmail}", receiverEmail);
            return false;
        }
    }

    private async Task<bool> SendSmsAsync(string receiverPhoneNumber, string body, CancellationToken cancellationToken)
    {
        try
        {
            await smsSender.SendAsync(receiverPhoneNumber, body, cancellationToken);
            logger.LogInformation("Alert SMS delivery succeeded for {ReceiverPhoneNumber}", receiverPhoneNumber);
            return true;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning("Alert SMS delivery canceled for {ReceiverPhoneNumber}", receiverPhoneNumber);
            return false;
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Alert SMS delivery failed for {ReceiverPhoneNumber}", receiverPhoneNumber);
            return false;
        }
    }
}
