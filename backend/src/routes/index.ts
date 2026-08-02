import { Router, Request, Response } from "express";
import { ping } from "../config/db";
import { sendSuccess, sendError } from "../utils/apiResponse";
import authRoutes from "./auth.routes";
import adminRoutes from "./admin.routes";
import companyRoutes from "./company.routes";
import leadRoutes from "./lead.routes";
import dashboardRoutes from "./dashboard.routes";
import { exotelStatusCallbackHandler } from "../controllers/call.controller";

const router = Router();

// ─── Health Check ─────────────────────────────────────────────────────────────
router.get("/health", async (_req: Request, res: Response) => {
  try {
    await ping();
    sendSuccess(res, {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      db: "connected",
    });
  } catch {
    sendError(res, "Database connection failed", {
      statusCode: 503,
      code: "DB_UNAVAILABLE",
    });
  }
});

// ─── API Routes ───────────────────────────────────────────────────────────────
router.use("/auth", authRoutes);
router.use("/companies", companyRoutes);
router.use("/admin", adminRoutes);
router.use("/leads", leadRoutes);
router.use("/dashboard", dashboardRoutes);
router.post("/calls/exotel/status-callback", exotelStatusCallbackHandler);

export default router;
