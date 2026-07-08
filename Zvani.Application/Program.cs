using Azure.Communication.Email;
using Microsoft.Extensions.Options;
using Serilog;
using Zvani.Application.Alerts.Configuration;
using Zvani.Application.Alerts.Interfaces;
using Zvani.Application.Alerts.Services;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSerilog();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddOptions<AzureEmailOptions>()
    .Bind(builder.Configuration.GetRequiredSection(AzureEmailOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddOptions<AlertNotificationOptions>()
    .Bind(builder.Configuration.GetRequiredSection(AlertNotificationOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddSingleton(sp =>
{
    var options = sp.GetRequiredService<IOptions<AzureEmailOptions>>().Value;
    return new EmailClient(options.ConnectionString);
});
builder.Services.AddScoped<IEmailSender, AzureEmailSender>();
builder.Services.AddScoped<IAlertService, AlertService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseSerilogRequestLogging();
app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();

app.MapFallbackToFile("index.html");

app.Run();
