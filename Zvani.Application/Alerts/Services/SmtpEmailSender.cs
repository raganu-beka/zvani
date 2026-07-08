using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using Zvani.Application.Alerts.Configuration;
using Zvani.Application.Alerts.Interfaces;

namespace Zvani.Application.Alerts.Services;

public sealed class SmtpEmailSender(IOptions<SmtpOptions> options, ILogger<SmtpEmailSender> logger) : IEmailSender
{
    private readonly SmtpOptions _smtpOptions = options.Value;

    public async Task SendAsync(
        string receiverEmail,
        string subject,
        string body,
        CancellationToken cancellationToken)
    {
        var message = new MimeMessage();

        message.From.Add(new MailboxAddress(_smtpOptions.SenderName, _smtpOptions.SenderEmail));
        message.To.Add(MailboxAddress.Parse(receiverEmail));
        message.Subject = subject;

        message.Body = new TextPart("plain")
        {
            Text = body
        };

        using var client = new SmtpClient();
        var socketOptions = _smtpOptions.UseSsl
            ? SecureSocketOptions.SslOnConnect
            : SecureSocketOptions.StartTlsWhenAvailable;

        await client.ConnectAsync(_smtpOptions.Host, _smtpOptions.Port, socketOptions, cancellationToken);

        if (!string.IsNullOrWhiteSpace(_smtpOptions.Username))
            await client.AuthenticateAsync(_smtpOptions.Username, _smtpOptions.Password, cancellationToken);

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);

        logger.LogInformation("Alert email sent to {ReceiverEmail}", receiverEmail);
    }
}