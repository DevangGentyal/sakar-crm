import { z } from "zod";

// ============= Auth Schemas =============
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string({ required_error: "Name is required" })
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters"),
    mobileNumber: z
      .string({ required_error: "Mobile number is required" })
      .regex(/^\+?[0-9\s-]{8,20}$/, "Enter a valid mobile number"),
    companyCode: z
      .string({ required_error: "Company code is required" })
      .min(2, "Company code must be at least 2 characters"),
    registrationPassword: z
      .string({ required_error: "Registration password is required" })
      .min(6, "Registration password must be at least 6 characters"),
    email: z
      .string({ required_error: "Email is required" })
      .email("Please enter a valid email address"),
    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string({
      required_error: "Please confirm your password",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: "Current password is required" })
      .min(8, "Current password must be at least 8 characters"),
    newPassword: z
      .string({ required_error: "New password is required" })
      .min(8, "New password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string({
      required_error: "Please confirm your password",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ============= Lead Schemas =============
export const leadSourceSchema = z.enum([
  "WEBSITE",
  "FACEBOOK",
  "INSTAGRAM",
  "WHATSAPP",
  "GOOGLE",
  "REFERRAL",
  "WALK_IN",
  "OTHER",
]);
export const propertyTypeSchema = z.enum([
  "residential",
  "commercial",
  "industrial",
  "land",
]);
export const leadStatusSchema = z.enum([
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "INTERESTED",
  "SITE_VISIT",
  "NEGOTIATION",
  "BOOKED",
  "LOST",
]);

export const createLeadSchema = z.object({
  customerName: z
    .string({ required_error: "Lead name is required" })
    .min(3, "Name must be at least 3 characters")
    .max(150, "Name must be less than 150 characters"),
  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email address")
    .or(z.literal("")),
  mobile: z
    .string({ required_error: "Mobile number is required" })
    .regex(/^\d{10}$/, "Mobile must be exactly 10 digits"),
  alternateMobile: z
    .string()
    .regex(/^\d{10}$/, "Alternate mobile must be exactly 10 digits")
    .optional()
    .or(z.literal("")),
  source: leadSourceSchema,
  budget: z.preprocess(
    (value) => (value === "" || Number.isNaN(value) ? undefined : value),
    z.number().optional(),
  ),
  location: z
    .string()
    .max(200, "Location must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  occupation: z
    .string()
    .max(100, "Occupation must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  assignedTo: z
    .string()
    .uuid("Assigned executive must be a valid user")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(1000, "Notes must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
});

export type CreateLeadFormData = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = z.object({
  customerName: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(150, "Name must be less than 150 characters")
    .optional(),
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  mobile: z
    .string()
    .regex(/^\d{10}$/, "Mobile must be exactly 10 digits")
    .optional(),
  alternateMobile: z
    .string()
    .regex(/^\d{10}$/, "Alternate mobile must be exactly 10 digits")
    .optional()
    .or(z.literal("")),
  status: leadStatusSchema.optional(),
  source: leadSourceSchema.optional(),
  budget: z.preprocess(
    (value) => (value === "" || Number.isNaN(value) ? undefined : value),
    z.number().optional(),
  ),
  location: z
    .string()
    .max(200, "Location must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  occupation: z
    .string()
    .max(100, "Occupation must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  assignedTo: z
    .string()
    .uuid("Assigned executive must be a valid user")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(1000, "Notes must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
});

export type UpdateLeadFormData = z.infer<typeof updateLeadSchema>;

export const noteSchema = z.object({
  content: z
    .string({ required_error: "Note content is required" })
    .min(1, "Note cannot be empty")
    .max(1000, "Note must be less than 1000 characters"),
});

export type NoteFormData = z.infer<typeof noteSchema>;

export const followUpSchema = z.object({
  title: z
    .string({ required_error: "Follow-up title is required" })
    .min(1, "Title cannot be empty")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
  dueDate: z
    .string({ required_error: "Due date is required" })
    .refine(
      (date) => new Date(date) > new Date(),
      "Due date must be in the future",
    ),
});

export type FollowUpFormData = z.infer<typeof followUpSchema>;
