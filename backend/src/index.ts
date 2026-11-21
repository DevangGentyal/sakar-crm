import "./config/env"; // Validates env vars at startup — fails fast if any are missing
import app from "./app";
import { env } from "./config/env";
import { ping } from "./config/db";

async function bootstrap(): Promise<void> {
  // Verify DB connectivity before accepting traffic
  try {
    await ping();
    console.log("[DB] Connected to PostgreSQL");
  } catch (err) {
    console.error("[DB] Failed to connect to PostgreSQL:", err);
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    console.log(
      `[Server] KARYAA CRM API running on port ${env.PORT} [${env.NODE_ENV}]`,
    );
  });

  // ─── Graceful Shutdown ────────────────────────────────────────────────────
  const shutdown = (signal: string) => {
    console.log(`[Server] ${signal} received — shutting down gracefully...`);
    server.close(() => {
      console.log("[Server] HTTP server closed");
      process.exit(0);
    });

    // Force exit after 10s if graceful shutdown stalls
    setTimeout(() => {
      console.error("[Server] Forced shutdown after timeout");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("uncaughtException", (err) => {
    console.error("[Server] Uncaught Exception:", err);
    shutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    console.error("[Server] Unhandled Rejection:", reason);
    shutdown("unhandledRejection");
  });
}

bootstrap();
