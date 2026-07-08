using System.ComponentModel.DataAnnotations;

namespace Zvani.Application.Alerts.Configuration;

public sealed class TwilioOptions
{
    public const string SectionName = "Twilio";

    [Required]
    public string AccountSid { get; init; } = string.Empty;

    [Required]
    public string AuthToken { get; init; } = string.Empty;

    [Required]
    public string SmsFrom { get; init; } = string.Empty;
}
