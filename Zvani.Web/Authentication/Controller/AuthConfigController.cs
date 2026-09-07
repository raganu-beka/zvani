using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Zvani.Application.Authentication.Configurations;
using Zvani.Application.Authentication.Contracts;

namespace Zvani.Application.Authentication.Controller;

[AllowAnonymous]
[ApiController]
[Route("api/auth/config")]
public sealed class AuthConfigController(IOptions<ClerkAuthenticationOptions> clerkOptions) : ControllerBase
{
    [HttpGet("public")]
    public PublicAuthConfigResponse GetPublic()
    {
        return new PublicAuthConfigResponse(clerkOptions.Value.PublishableKey);
    }
}