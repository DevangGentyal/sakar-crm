import { Router } from "express";
import {
  createLeadHandler,
  listLeadsHandler,
  getLeadHandler,
  updateLeadHandler,
} from "../controllers/lead.controller";
import {
  createLeadValidator,
  updateLeadValidator,
  listLeadsValidator,
} from "../validators/lead.validator";
import { authenticate } from "../middleware/auth.middleware";
import {
  createFollowupHandler,
  listFollowupsHandler,
  listAllFollowupsHandler,
  completeFollowupHandler,
} from "../controllers/followup.controller";
import { followupValidator } from "../validators/followup.validator";
import multer from "multer";
import { requireRole } from "../middleware/role.middleware";
import { importLeadsHandler } from "../controllers/lead-import.controller";
import { uploadLeadPhotoHandler } from "../controllers/upload.controller";
import {
  createLeadCallHandler,
  listLeadCallsHandler,
  updateLeadCallHandler,
} from "../controllers/call.controller";
import { param } from "express-validator";
import { validateRequest } from "../middleware/error.middleware";
import { sendError } from "../utils/apiResponse";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    callback(
      null,
      allowed.includes(file.mimetype) ||
        /\.(xlsx|xls)$/i.test(file.originalname),
    );
  },
});
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    callback(null, allowed.includes(file.mimetype));
  },
});

// All lead routes require authentication
router.use(authenticate);
router.use((req, res, next) => {
  if (req.user?.role === "SUPER_ADMIN") {
    sendError(res, "Lead access is not allowed for super admin", {
      statusCode: 403,
      code: "FORBIDDEN",
    });
    return;
  }
  next();
});

router.get("/", listLeadsValidator, listLeadsHandler);
router.get("/followups", listAllFollowupsHandler);
router.post(
  "/",
  requireRole("ADMIN"),
  photoUpload.single("photo"),
  createLeadValidator,
  createLeadHandler,
);
router.post(
  "/photo",
  requireRole("ADMIN"),
  photoUpload.single("photo"),
  uploadLeadPhotoHandler,
);
router.post(
  "/import",
  requireRole("ADMIN"),
  upload.single("file"),
  importLeadsHandler,
);
const validateRoute = (req: any, res: any, next: any): void => {
  if (!validateRequest(req, res)) return;
  next();
};

router.get("/:id", param("id").isUUID(), validateRoute, getLeadHandler);
router.get("/:id/calls", param("id").isUUID(), validateRoute, listLeadCallsHandler);
router.post("/:id/calls", param("id").isUUID(), validateRoute, createLeadCallHandler);
router.patch(
  "/:id/calls/:callId",
  param("id").isUUID(),
  param("callId").isUUID(),
  validateRoute,
  updateLeadCallHandler,
);
router.post("/:id/followups", param("id").isUUID(), validateRoute, followupValidator, createFollowupHandler);
router.get("/:id/followups", param("id").isUUID(), validateRoute, listFollowupsHandler);
router.patch(
  "/:id/followups/:followupId/complete",
  param("id").isUUID(),
  param("followupId").isUUID(),
  validateRoute,
  completeFollowupHandler,
);
router.patch(
  "/:id",
  param("id").isUUID(),
  validateRoute,
  requireRole("ADMIN"),
  photoUpload.single("photo"),
  updateLeadValidator,
  updateLeadHandler,
);

export default router;
