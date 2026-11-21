import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { requireCompany } from "../middleware/company.middleware";
import {
  deleteMetaSettingsHandler,
  getMetaSettingsHandler,
  listMetaEventsHandler,
  retryMetaEventHandler,
  saveMetaSettingsHandler,
  testMetaConnectionHandler,
} from "../controllers/meta.controller";

const router = Router();
router.use(authenticate, requireRole("ADMIN"), requireCompany);
router.get("/", getMetaSettingsHandler);
router.put("/", saveMetaSettingsHandler);
router.delete("/", deleteMetaSettingsHandler);
router.post("/test", testMetaConnectionHandler);
router.get("/events", listMetaEventsHandler);
router.post("/events/:eventId/retry", retryMetaEventHandler);

export default router;
