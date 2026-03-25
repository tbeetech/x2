import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import fs from "node:fs";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { Server as SocketIOServer } from "socket.io";
import routes from "./routes/index.js";
import { env } from "./config/env.js";
import logger from "./lib/logger.js";

export function createServer() {
  const app = express();
  const httpServer = http.createServer(app);
  
  // Initialize Socket.IO with CORS settings
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow all origins for Socket.IO connections
        callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
  });

  // Socket.IO connection handler
  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Client connected via Socket.IO');

    // Join user-specific room
    socket.on('join', (userId) => {
      if (userId) {
        socket.join(userId);
        logger.info({ socketId: socket.id, userId }, 'User joined room');
      }
    });

    // Join admin room (for real-time admin notifications)
    socket.on('join-admin', (adminId) => {
      if (adminId) {
        socket.join(adminId);
        socket.join('admin-room'); // All admins join this room
        logger.info({ socketId: socket.id, adminId }, 'Admin joined admin-room');
      }
    });

    // Leave user room
    socket.on('leave', (userId) => {
      if (userId) {
        socket.leave(userId);
        logger.info({ socketId: socket.id, userId }, 'User left room');
      }
    });

    // Leave admin room
    socket.on('leave-admin', (adminId) => {
      if (adminId) {
        socket.leave('admin-room');
        logger.info({ socketId: socket.id, adminId }, 'Admin left admin-room');
      }
    });

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Client disconnected');
    });
  });

  // Make io accessible to routes via request object
  app.use((req, res, next) => {
    req.io = io;
    next();
  });

  // Store io instance globally for service access
  app.set('io', io);
  global.io = io;

  // Trust proxy - required for rate limiting behind nginx/reverse proxy
  // This allows express-rate-limit to correctly identify users via X-Forwarded-For header
  // Set to 1 to trust the first proxy (Nginx)
  app.set('trust proxy', 1);

  app.use(helmet());
  
  // Manual pre-flight handler to ensure all headers/origins are accepted
  app.use((req, res, next) => {
    const origin = req.get("Origin");
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Vary", "Origin");
    } else {
      res.header("Access-Control-Allow-Origin", "*");
    }
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    const requestHeaders = req.get("Access-Control-Request-Headers");
    res.header("Access-Control-Allow-Headers", requestHeaders || "*");

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });

  // CORS Configuration - fully open for global access (mirrors origin)
  app.use(
    cors({
      origin: true, // reflect request origin, allowing all
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      exposedHeaders: ["Content-Length", "Content-Type"],
      maxAge: 86400, // 24 hours
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(
    morgan(env.nodeEnv === "production" ? "combined" : "dev", {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    }),
  );

  const healthHandler = (req, res) => {
    res.json({ status: "ok", mode: env.useSampleData ? "sample" : "production" });
  };

  app.get("/health", healthHandler);
  app.get("/api/health", healthHandler);

  // Add API cache control middleware - prevent caching of dynamic data
  app.use("/api", (req, res, next) => {
    // Prevent caching of all API responses
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
  });

  app.use("/api", routes);

  if (env.serveStaticAssets) {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const rootDir = path.resolve(currentDir, "..", "..");
    const configuredDir = env.staticAssetsDir ? path.resolve(rootDir, env.staticAssetsDir) : null;
    const distPath = configuredDir ?? path.resolve(rootDir, "dist");

    if (!fs.existsSync(distPath)) {
      logger.warn({ distPath }, "Static assets directory does not exist; SPA routes will return 404.");
    } else {
      // Different cache strategies for different file types
      app.use(
        express.static(distPath, {
          index: false,
          setHeaders: (res, filePath) => {
            // Hash-based assets (JS/CSS with content hashes) - aggressive caching
            if (/\.(js|css)$/.test(filePath) && /[.-][a-f0-9]{8,}\.(js|css)$/.test(filePath)) {
              res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            }
            // Images and fonts - moderate caching
            else if (/\.(jpg|jpeg|png|gif|svg|webp|woff2?|ttf|eot|otf|ico)$/.test(filePath)) {
              res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day
            }
            // HTML and other files - no caching (for SPA updates)
            else {
              res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
              res.setHeader("Pragma", "no-cache");
              res.setHeader("Expires", "0");
            }
          },
        }),
      );

      app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api")) return next();
        // Always send fresh HTML with no-cache headers
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({ error: 'Internal server error' });
  });

  // Return both app and httpServer for Socket.IO compatibility
  return { app, httpServer, io };
}
