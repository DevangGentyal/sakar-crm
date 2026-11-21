import express from "express";

import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env";
import { UPLOADS_ROOT } from "./config/paths";
import { httpLogger } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import routes from "./routes/index";

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  }),
);

const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin (Postman, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(origin) ||
        /^https:\/\/.*\.ngrok-free\.(app|dev)$/.test(origin)
      ) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// ─── Request Parsing ─────────────────────────────────────────────────────────
app.use(
  express.json({
    limit: "1mb",
    verify: (req: express.Request & { rawBody?: Buffer }, _res, buf) => {
      req.rawBody = Buffer.from(buf);
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use("/uploads", express.static(UPLOADS_ROOT));

// ─── HTTP Logging ─────────────────────────────────────────────────────────────
app.use(httpLogger);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", routes);
app.use("/api/v1", routes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
