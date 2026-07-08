namespace Zvani.Application.Authentication.Configurations;

public sealed class ClerkAuthenticationOptions
{
    public const string SectionName = "Clerk";

    public string PublishableKey { get; init; } = string.Empty;

    public string SecretKey { get; init; } = string.Empty;

    public string? JwtKey { get; init; }

    public string[] AuthorizedParties { get; init; } = [];

    public string[] Audiences { get; init; } = [];

    public long ClockSkewInMs { get; init; } = 5000;
}