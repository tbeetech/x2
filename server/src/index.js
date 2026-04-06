import net from "node:net";
import { createServer } from "./server.js";
import { env, assertProductionConfig } from "./config/env.js";
import { connectDatabase } from "./lib/database.js";
import logger from "./lib/logger.js";
import { startMarketDataUpdater } from "./services/marketDataService.js";
import { startPortfolioGrowthScheduler } from "./services/portfolioGrowthService.js";
import { seedAdmin } from "./services/adminSeedService.js";

// Quick runtime PID log to help debugging unexpected exits
try {
  console.log(`Starting Invisphere server process pid=${process.pid}`);
} catch {
  // ignore
}

const HOST = "0.0.0.0";

async function ensureAvailablePort(preferredPort) {
  const parsedPreferred = Number(preferredPort);

  // When Render assigns a PORT, we must bind to it exactly.
  if (process.env.PORT) {
    return Number(process.env.PORT);
  }

  if (!Number.isInteger(parsedPreferred) || parsedPreferred <= 0) {
    return 0;
  }

  return await new Promise((resolve) => {
    const tester = net.createServer();

    tester.once("error", (error) => {
      tester.close(() => {
        if (error?.code === "EADDRINUSE") {
          logger.warn({ port: parsedPreferred }, "Preferred port in use. Selecting a random available port.");
          resolve(0);
        } else {
          resolve(parsedPreferred);
        }
      });
    });

    tester.once("listening", () => {
      tester.close(() => resolve(parsedPreferred));
    });

    tester.listen(parsedPreferred, HOST);
  });
}

async function startHttpServer(app, port) {
  const attemptListen = (desiredPort) =>
    new Promise((resolve, reject) => {
      let server;

      try {
        server = app.listen(desiredPort, HOST);
      } catch (error) {
        reject(error);
        return;
      }

      const handleError = (error) => {
        server.off("listening", handleListening);
        reject(error);
      };

      const handleListening = () => {
        server.off("error", handleError);
        resolve(server);
      };

      server.once("error", handleError);
      server.once("listening", handleListening);
    });

  try {
    return await attemptListen(port);
  } catch (error) {
    const allowDynamicPort = env.nodeEnv !== "production" || !process.env.PORT;
    logger.warn(
      {
        port,
        portEnv: process.env.PORT,
        nodeEnv: env.nodeEnv,
        err: error,
      },
      "Error while binding HTTP server.",
    );
    if (error?.code === "EADDRINUSE" && allowDynamicPort && port !== 0) {
      logger.warn({ port }, "Preferred port occupied during startup. Falling back to a random free port.");
      return await attemptListen(0);
    }
    throw error;
  }
}

async function bootstrap() {
  // Validate production configuration only at runtime (not during module import)
  try {
    assertProductionConfig();
  } catch (err) {
    logger.error({ err }, "Invalid production configuration");
    // Exit explicitly; validation failures in production are fatal.
    process.exit(1);
  }

  let usingSampleData = env.useSampleData;
  let stopMarketDataUpdater = () => {};
  let stopPortfolioGrowthScheduler = () => {};

  if (!usingSampleData) {
    try {
      await connectDatabase();
      logger.info({ mongo: env.mongoUri }, "Connected to MongoDB");
      stopMarketDataUpdater = startMarketDataUpdater();
      stopPortfolioGrowthScheduler = startPortfolioGrowthScheduler();
    } catch (error) {
      logger.warn({ err: error }, "Failed to connect to MongoDB. Falling back to in-memory sample data.");
      env.useSampleData = true;
      usingSampleData = true;
    }
  }

  // Ensure a seeded admin exists (DB or sample mode)
  await seedAdmin({ usingSampleData });

  if (usingSampleData) {
    logger.info("Running in sample data mode (no persistent database connection).");
  }

  const app = createServer();
  const requestedPort = env.port;
  const portToBind = await ensureAvailablePort(requestedPort);
  
  // Check if createServer returns an object with httpServer (Socket.IO enabled)
  let server;
  if (app.httpServer) {
    // Socket.IO enabled - use the httpServer
    server = await startHttpServer(app.httpServer, portToBind);
  } else {
    // Fallback for non-Socket.IO app
    server = await startHttpServer(app, portToBind);
  }
  
  // Attach handlers to catch immediate server-level closures
  try {
    server.on && server.on('close', () => {
      logger.info('HTTP server emitted close event');
    });
    server.on && server.on('error', (err) => {
      logger.error({ err }, 'HTTP server emitted error event');
    });
  } catch (err) {
    logger.warn({ err }, 'Failed to attach server event handlers for debugging');
  }
  const addressInfo = server.address();
  const actualPort = typeof addressInfo === "object" && addressInfo ? addressInfo.port : env.port;
  env.port = actualPort;

  if (actualPort !== requestedPort) {
    logger.info({ requestedPort, port: actualPort }, "Using fallback port because the preferred port was busy.");
  }

  logger.info({ port: actualPort, sampleData: usingSampleData }, `Invisphere API listening on port ${actualPort}`);

  const shutdown = () => {
    logger.info("Shutting down Invisphere API...");
    stopMarketDataUpdater?.();
    stopPortfolioGrowthScheduler?.();
    server?.close(() => {
      logger.info("Invisphere API shutdown complete.");
    });
  };

  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}

bootstrap().catch((error) => {
  logger.error({ err: error }, "Fatal startup error");
  process.exit(1);
});

// Global process-level handlers to aid debugging when the process exits unexpectedly.
process.on("uncaughtException", (err) => {
  try {
    logger.error({ err }, "uncaughtException - the process will exit");
  } catch {
    // If logger fails, still write to stderr so we don't swallow the error
    console.error("uncaughtException", err);
  }
  // Allow the runtime to perform its default actions (flush logs) then exit
  process.exit(1);
});

process.on("unhandledRejection", (reason, _promise) => {
  try {
    logger.error({ reason }, "unhandledRejection detected");
  } catch {
    console.error("unhandledRejection", reason);
  }
});

process.on("exit", (code) => {
  try {
    logger.info({ code }, "process exit event");
  } catch {
    console.error("process exit", code);
  }
});
