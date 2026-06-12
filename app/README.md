
# NandSim - web application

This application is implemented using Node.js, Vite, React, the React Compiler, and TypeScript.

To develop or deploy, install Node.js on your local machine.

To build the application, you need first to install the dependencies:

```
npm i
```

To view the application in development, run:

```
npm run dev
```

To build the application for deployment in production, run:

```
npm run build
```

The `dist/` folder contains the files needed for deployment. Copy the `dist/` folder to the target machine and serve it as the root with an HTTP web-server.

For Caddy, the following can be added to the `Caddyfile`:

```
nandsim.my.site {
    root * <path to dist/>/
    file_server {
        browse
    }
}
```
Afterwarsd, run:
```
caddy reload --config Caddyfile
```
