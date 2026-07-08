using Azure.Communication.Email;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Serilog;
using Twilio.Clients;
using Zvani.Application.Alerts.Configuration;
using Zvani.Application.Alerts.Interfaces;
using Zvani.Application.Alerts.Services;
using Zvani.Application.Authentication;
using Zvani.Application.Authentication.Configurations;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSerilog();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddOptions<ClerkAuthenticationOptions>()
    .Bind(builder.Configuration.GetRequiredSection(ClerkAuthenticationOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services
    .AddAuthentication(ClerkAuthenticationDefaults.AuthenticationScheme)
    .AddScheme<AuthenticationSchemeOptions, ClerkAuthenticationHandler>(
        ClerkAuthenticationDefaults.AuthenticationScheme,
        options => { });

builder.Services.AddAuthorization();

builder.Services.AddOptions<AzureEmailOptions>()
    .Bind(builder.Configuration.GetRequiredSection(AzureEmailOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddOptions<AlertNotificationOptions>()
    .Bind(builder.Configuration.GetRequiredSection(AlertNotificationOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddOptions<TwilioOptions>()
    .Bind(builder.Configuration.GetRequiredSection(TwilioOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddSingleton(sp =>
{
    var options = sp.GetRequiredService<IOptions<AzureEmailOptions>>().Value;
    return new EmailClient(options.ConnectionString);
});
builder.Services.AddSingleton<ITwilioRestClient>(sp =>
{
    var options = sp.GetRequiredService<IOptions<TwilioOptions>>().Value;
    return new TwilioRestClient(options.AccountSid, options.AuthToken);
});

builder.Services.AddScoped<IEmailSender, AzureEmailSender>();
builder.Services.AddScoped<ISmsSender, TwilioSmsSender>();
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

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("index.html");

app.Run();