using System.ComponentModel.DataAnnotations;

namespace Zvani.Application.Alerts.Configuration;

public sealed class AzureEmailOptions
{
    public const string SectionName = "AzureEmail";

    [Required]
    public string ConnectionString { get; init; } = string.Empty;

    [Required]
    [EmailAddress]
    public string SenderAddress { get; init; } = string.Empty;
}
