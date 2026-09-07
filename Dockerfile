FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY Zvani.Web/bin/Release/net10.0/publish/ .
USER $APP_UID

ENTRYPOINT ["dotnet", "Zvani.Web.dll"]
