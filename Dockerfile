FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY BekaAlert/BekaAlert.csproj BekaAlert/
RUN dotnet restore BekaAlert/BekaAlert.csproj

COPY . .
RUN dotnet publish BekaAlert/BekaAlert.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .
USER $APP_UID

ENTRYPOINT ["dotnet", "BekaAlert.dll"]
