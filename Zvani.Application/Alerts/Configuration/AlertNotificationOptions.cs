using System.ComponentModel.DataAnnotations;

namespace Zvani.Application.Alerts.Configuration;

public sealed class AlertNotificationOptions
{
    public const string SectionName = "AlertNotifications";

    [Required] [EmailAddress] public string ReceiverEmail { get; init; } = string.Empty;

    [Required] public string ReceiverPhoneNumber { get; init; } = string.Empty;

    [Required] public string DefaultSubject { get; init; } = string.Empty;
}
