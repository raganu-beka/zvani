using BekaAlert.Alerts.Contracts;
using BekaAlert.Alerts.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BekaAlert.Alerts.Controller;

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
