using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Zvani.Application.Alerts.Contracts;
using Zvani.Application.Alerts.Interfaces;

namespace Zvani.Application.Alerts.Controller;

[Authorize]
[ApiController]
[Route("api/alert")]
public sealed class AlertController(IAlertService alertService) : ControllerBase
{
    [HttpPost("send")]
    public async Task<IActionResult> Send(SendAlertRequest request, CancellationToken cancellationToken)
    {
        var response = await alertService.SendAsync(request, cancellationToken);
        return Accepted(response);
    }
}
