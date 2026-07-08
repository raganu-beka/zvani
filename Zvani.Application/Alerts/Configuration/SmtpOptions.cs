using System.ComponentModel.DataAnnotations;

namespace Zvani.Application.Alerts.Configuration;

public sealed class SmtpOptions
{
    public const string SectionName = "Smtp";

    [Required]
    public string Host { get; init; } = string.Empty;

    [Range(1, 65535)]
    public int Port { get; init; } = 587;

    [Required]
    public string Username { get; init; } = string.Empty;

    [Required]
    public string Password { get; init; } = string.Empty;

    [Required]
    [EmailAddress]
    public string SenderEmail { get; init; } = string.Empty;

    [Required]
    public string SenderName { get; init; } = "Zvani Alert";

    public bool UseSsl { get; init; }
}
