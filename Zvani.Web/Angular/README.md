# Angular

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.18.

## Development server

Install the .NET 10 SDK, Node.js 24, and Bun 1.3.14. Configure the backend's
Clerk, Azure Email, Twilio, and alert settings in the ignored
`Zvani.Web/appsettings.Development.json` file or through environment variables.

From the repository root, start ASP.NET Core in one terminal:

```bash
dotnet run --project Zvani.Web/Zvani.Web.csproj --launch-profile https
```

In a second terminal, start Angular:

```bash
cd Zvani.Web/Angular
bun install --frozen-lockfile
bun start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

Angular forwards `/api/...` requests to `https://localhost:7011` through
`proxy.conf.json`. This matches the backend's `https` launch profile and keeps
API requests on the same browser origin. The proxy accepts the local development
certificate through `secure: false`. This setting applies only to the Angular
development server.

Keep both servers running. If you change the backend HTTPS port, update the proxy
target and restart `bun start`.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This compiles the frontend into `../wwwroot/`. By default, the production build
optimizes the application for performance and size.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
