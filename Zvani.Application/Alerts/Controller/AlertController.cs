using Microsoft.AspNetCore.Mvc;
using Zvani.Application.Alerts.Contracts;
using Zvani.Application.Alerts.Interfaces;

namespace Zvani.Application.Alerts.Controller;

[ApiController]
[Route("api/alert")]
public sealed class AlertController(IAlertService alertService) : ControllerBase
{
    [HttpPost("send")]
    public IActionResult Send(SendAlertRequest request)
    {
        var response = alertService.Send(request);
        return Accepted(response);
    }
}