import { body } from "express-validator";

export const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Name must be 2-150 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),

  body("mobileNumber")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required")
    .isLength({ min: 8, max: 20 })
    .withMessage("Mobile number must be 8-20 characters")
    .matches(/^\+?[0-9\s-]+$/)
    .withMessage(
      "Mobile number must contain only digits, spaces, hyphens, and optional leading +",
    ),

  body("registrationPassword")
    .notEmpty()
    .withMessage("Registration password is required")
    .isLength({ min: 6 })
    .withMessage("Registration password must be at least 6 characters"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

export const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];

export const changePasswordValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters"),
];
