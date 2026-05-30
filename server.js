console.log("SERVER IS STARTING...");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

console.log("Modules loaded successfully");

// Add signal handlers to debug SIGTERM
process.on("SIGTERM", () => {
  console.error("SIGTERM signal received: shutting down");
  console.error("Stack trace:", new Error().stack);
  process.exit(1);
});

process.on("SIGINT", () => {
  console.error("SIGINT signal received: shutting down");
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  console.error("Stack trace:", err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = process.env.PORT || 3000;

console.log(`Configuration: dev=${dev}, hostname=${hostname}, port=${port}`);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

console.log("Next.js app created");

app.prepare()
  .then(() => {
    console.log("Next.js app prepared successfully");

    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error("Error occurred handling", req.url, err);
        res.statusCode = 500;
        res.end("internal server error");
      }
    });

    console.log("HTTP server created");

    server.on("error", (err) => {
      console.error("Server error:", err);
      process.exit(1);
    });

    server.listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log("Server is running and accepting connections");
      console.log("Process ID:", process.pid);
    });

    console.log("Server listen() called");

    // Keep the process alive
    setInterval(() => {
      // Heartbeat to keep process alive
    }, 60000);
  })
  .catch((err) => {
    console.error("Failed to prepare Next.js app:", err);
    console.error("Stack trace:", err.stack);
    process.exit(1);
  });

console.log("Server initialization code executed");
