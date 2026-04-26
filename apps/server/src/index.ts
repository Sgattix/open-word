import { createContext } from "@OpenWord/api/context";
import { appRouter } from "@OpenWord/api/routers/index";
import { auth } from "@OpenWord/auth";
import { env } from "@OpenWord/env/server";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import prisma from "@OpenWord/db";

import logger from "./lib/logger";
import { initializeSocket } from "./socket/socketHandler";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = express();
const httpServer = createServer(app);

app.use(
  pinoHttp({
    logger,
    genReqId: (req) => {
      const incomingId = req.headers["x-request-id"];

      if (Array.isArray(incomingId)) {
        return incomingId[0] ?? crypto.randomUUID();
      }

      return incomingId ?? crypto.randomUUID();
    },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "silent";
    },
  }),
);

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);


app.all("/api/auth{/*path}", toNodeHandler(auth));

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ path, error, req, ctx }) => {
      const requestLogger = req.log ?? logger;

      requestLogger.error(
        {
          trpcPath: path,
          trpcCode: error.code,
          cause: error.cause,
          userId: ctx?.session?.user.id,
        },
        error.message,
      );
    },
  }),
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const requestLogger = req.log ?? logger;
    requestLogger.error(
      {
        err,
        route: req.originalUrl,
        method: req.method,
      },
      "Unhandled express error",
    );

    const message =
      err instanceof Error ? err.message : "Unexpected server error";

    res.status(500).json({ error: message });
  },
);

app.listen(PORT, "0.0.0.0", () => {
  logger.info({ port: PORT }, `Server is running on http://localhost:${PORT}`);
});

// Initialize Socket.io after creating the HTTP server
initializeSocket(httpServer, prisma);

httpServer.listen(PORT, () => {
  logger.info({ port: PORT }, `Socket.io server running on http://localhost:${PORT}`);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error(
    {
      promise,
      reason,
    },
    "Unhandled promise rejection",
  );
});

process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "Uncaught exception");
  process.exit(1);
});
