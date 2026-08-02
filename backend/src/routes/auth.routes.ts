import { Router } from "express";
import {
  registerHandler,
  loginHandler,
  getMeHandler,
  listUsersHandler,
  logoutHandler,
  changePasswordHandler,
} from "../controllers/auth.controller";
import {
  registerValidator,
  loginValidator,
  changePasswordValidator,
} from "../validators/auth.validator";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();

// Public routes
router.post("/register", registerValidator, registerHandler);
router.post("/login", loginValidator, loginHandler);

// Protected routes
router.post("/logout", authenticate, logoutHandler);
router.post(
  "/change-password",
  authenticate,
  changePasswordValidator,
  changePasswordHandler,
);
router.get("/me", authenticate, getMeHandler);
router.get("/users", authenticate, requireRole("ADMIN"), listUsersHandler);

export default router;
