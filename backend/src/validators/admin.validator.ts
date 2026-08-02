import { body, param, query } from "express-validator";
import { ApprovalStatus } from "../repositories/auth.repository";

const validStatusValues: ApprovalStatus[] = ["PENDING", "APPROVED", "REJECTED"];

export const executiveIdParamValidator = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("Executive id is required")
    .isUUID()
    .withMessage("Executive id must be a valid UUID"),
];

export const listExecutivesValidator = [
  query("status")
    .optional()
    .isIn(validStatusValues)
    .withMessage("Status must be PENDING, APPROVED, or REJECTED"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("sortBy")
    .optional()
    .isIn(["name", "email", "created_at"])
    .withMessage("sortBy must be name, email, or created_at"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be asc or desc"),
];

export const rejectExecutiveValidator = [
  body("reason")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Rejection reason cannot exceed 500 characters"),
];
