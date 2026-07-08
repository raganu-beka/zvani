using System.Security.Claims;
using System.Text.Encodings.Web;
using Clerk.BackendAPI.Helpers.Jwks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Zvani.Application.Authentication.Configurations;

namespace Zvani.Application.Authentication;

public sealed class ClerkAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IOptions<ClerkAuthenticationOptions> clerkOptions)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var configuredOptions = clerkOptions.Value;
        var sessionToken = GetSessionToken(Request);
        if (string.IsNullOrWhiteSpace(sessionToken))
            return AuthenticateResult.NoResult();

        var secretKey = NullIfWhiteSpace(configuredOptions.SecretKey);
        var jwtKey = NullIfWhiteSpace(configuredOptions.JwtKey);

        if (secretKey is null && jwtKey is null)
            return AuthenticateResult.Fail("Clerk SecretKey or JwtKey must be configured.");

        var verificationOptions = new VerifyTokenOptions(
            secretKey: secretKey,
            machineSecretKey: null,
            jwtKey: jwtKey,
            audiences: NullIfEmpty(configuredOptions.Audiences),
            authorizedParties: NullIfEmpty(configuredOptions.AuthorizedParties),
            clockSkewInMs: configuredOptions.ClockSkewInMs,
            apiUrl: null,
            apiVersion: null,
            skipJwksCache: false);

        try
        {
            var claims = await VerifyToken.VerifyTokenAsync(sessionToken, verificationOptions);

            var identity = new ClaimsIdentity(
                claims.Claims,
                ClerkAuthenticationDefaults.AuthenticationScheme,
                ClaimTypes.Name,
                ClaimTypes.Role);
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, ClerkAuthenticationDefaults.AuthenticationScheme);

            return AuthenticateResult.Success(ticket);
        }
        catch (TokenVerificationException exception)
        {
            Logger.LogWarning(exception, "Clerk token verification failed: {Reason}", exception.Reason);
            return AuthenticateResult.Fail($"Clerk token verification failed: {exception.Reason}");
        }
        catch (Exception exception)
        {
            Logger.LogWarning(exception, "Clerk request authentication failed.");
            return AuthenticateResult.Fail("Clerk request authentication failed.");
        }
    }

    private static string? NullIfWhiteSpace(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static IEnumerable<string>? NullIfEmpty(IEnumerable<string>? values)
    {
        var normalizedValues = values?
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim())
            .ToArray();

        return normalizedValues is { Length: > 0 } ? normalizedValues : null;
    }

    private static string? GetSessionToken(HttpRequest request)
    {
        var authorization = request.Headers.Authorization.FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(authorization) &&
            authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return authorization["Bearer ".Length..].Trim();

        return request.Cookies.TryGetValue("__session", out var sessionCookie)
            ? sessionCookie
            : null;
    }
}
