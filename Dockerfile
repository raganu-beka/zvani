FROM oven/bun:1 AS frontend-build
WORKDIR /src/Zvani.Application/Angular

COPY Zvani.Application/Angular/package.json Zvani.Application/Angular/bun.lock ./
RUN bun install --frozen-lockfile

COPY Zvani.Application/Angular ./
RUN bun run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Zvani.Application/Zvani.Application.csproj Zvani.Application/
RUN dotnet restore Zvani.Application/Zvani.Application.csproj

COPY . .
COPY --from=frontend-build /src/Zvani.Application/wwwroot Zvani.Application/wwwroot

RUN dotnet publish Zvani.Application/Zvani.Application.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .
USER $APP_UID

ENTRYPOINT ["dotnet", "Zvani.Application.dll"]
