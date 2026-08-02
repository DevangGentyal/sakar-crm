import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import {
  activateCompanyHandler,
  createCompanyHandler,
  deactivateCompanyHandler,
  listCompaniesHandler,
  resetCompanyAdminPasswordHandler,
  updateCompanyRegistrationPasswordHandler,
} from "../controllers/company.controller";

const router = Router();

router.get("/", listCompaniesHandler);
router.post(
  "/",
  authenticate,
  requireRole("SUPER_ADMIN"),
  createCompanyHandler,
);
router.put(
  "/:id/activate",
  authenticate,
  requireRole("SUPER_ADMIN"),
  activateCompanyHandler,
);
router.put(
  "/:id/deactivate",
  authenticate,
  requireRole("SUPER_ADMIN"),
  deactivateCompanyHandler,
);
router.put(
  "/:id/reset-admin-password",
  authenticate,
  requireRole("SUPER_ADMIN"),
  resetCompanyAdminPasswordHandler,
);
router.put(
  "/registration-password",
  authenticate,
  requireRole("ADMIN"),
  updateCompanyRegistrationPasswordHandler,
);

export default router;
