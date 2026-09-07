using Microsoft.Extensions.Options;
using Twilio.Clients;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;
using Zvani.Application.Alerts.Configuration;
using Zvani.Application.Alerts.Interfaces;

namespace Zvani.Application.Alerts.Services;

public sealed class TwilioSmsSender(
    ITwilioRestClient twilioClient,
    IOptions<TwilioOptions> options,
    ILogger<TwilioSmsSender> logger) : ISmsSender
{
    private readonly TwilioOptions _twilioOptions = options.Value;

    public async Task SendAsync(string receiverPhoneNumber, string body, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var message = await MessageResource.CreateAsync(
            to: new PhoneNumber(receiverPhoneNumber),
            from: new PhoneNumber(_twilioOptions.SmsFrom),
            body: body,
            client: twilioClient);

        logger.LogInformation("SMS sent to {ReceiverPhoneNumber} with SID {MessageSid}", receiverPhoneNumber,
            message.Sid);
    }
}
