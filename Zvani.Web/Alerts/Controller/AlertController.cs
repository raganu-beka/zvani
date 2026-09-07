using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Zvani.Application.Alerts.Contracts;
using Zvani.Application.Alerts.Interfaces;

namespace Zvani.Application.Alerts.Controller;

[Authorize]
[ApiController]
[Route("api/alert")]
public sealed class AlertController(
    IAlertService alertService,
    IAlertUsageLimiter alertUsageLimiter) : ControllerBase
{
    [HttpGet("usage")]
    public IActionResult Usage()
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        return Ok(alertUsageLimiter.GetRemainingUsage(userId));
    }

    [HttpPost("send")]
    public async Task<IActionResult> Send(SendAlertRequest request, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var response = await alertService.SendAsync(userId, request, cancellationToken);
        if (!response.Accepted)
            return StatusCode(StatusCodes.Status429TooManyRequests, response);

        return Accepted(response);
    }

    private string? GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? User.Identity?.Name;
    }
}
