import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import {
  approveExecutiveHandler,
  disableExecutiveHandler,
  enableExecutiveHandler,
  listExecutivesHandler,
  rejectExecutiveHandler,
} from "../controllers/admin.controller";
import {
  executiveIdParamValidator,
  listExecutivesValidator,
  rejectExecutiveValidator,
} from "../validators/admin.validator";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/executives", listExecutivesValidator, listExecutivesHandler);
router.put(
  "/executives/:id/approve",
  executiveIdParamValidator,
  approveExecutiveHandler,
);
router.put(
  "/executives/:id/reject",
  executiveIdParamValidator,
  rejectExecutiveValidator,
  rejectExecutiveHandler,
);
router.put(
  "/executives/:id/enable",
  executiveIdParamValidator,
  enableExecutiveHandler,
);
router.put(
  "/executives/:id/disable",
  executiveIdParamValidator,
  disableExecutiveHandler,
);

export default router;
