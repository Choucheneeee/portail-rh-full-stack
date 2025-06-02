# Front

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.1.4.
## Docker Setup

This project includes Docker configuration for easy development and deployment. Here's how to use it:

### Prerequisites
- Docker installed on your machine
- Docker Compose installed on your machine

### Running with Docker

1. Build and start the container:
```bash
docker-compose up --build
```

2. To run in detached mode (in the background):
```bash
docker-compose up -d
```

3. To stop the container:
```bash
docker-compose down
```

The application will be available at `http://localhost:4200/`

### Docker Commands

- View running containers:
```bash
docker ps
```

- View logs:
```bash
docker-compose logs -f
```

- Rebuild the container:
```bash
docker-compose build
```

### Development with Docker

The Docker setup includes:
- Hot-reloading enabled
- Volume mounting for live code updates
- Node modules preserved in container
- Development environment configuration


## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

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

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:"

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
