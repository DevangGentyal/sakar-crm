import {
  findUserByEmail,
  findUserByMobile,
  createUser,
  findUserById,
  findUserByIdAndCompany,
  updateUserPassword,
  UserRow,
} from "../repositories/auth.repository";
import { findCompanyByCode } from "../repositories/company.repository";
import { hashPassword, comparePassword } from "../utils/hash";
import { signToken } from "../utils/jwt";

export interface RegisterInput {
  name: string;
  email: string;
  mobileNumber: string;
  password: string;
  registrationPassword: string;
  companyCode: string;
  role: string;
}

export interface RegisterResult {
  user: {
    id: string;
    name: string;
    email: string;
    mobileNumber: string | null;
    role: string;
  };
  message: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    mobileNumber: string | null;
    role: string;
  };
}

export class DuplicateEmailError extends Error {
  constructor() {
    super("An account with this email already exists");
    this.name = "DuplicateEmailError";
  }
}

export class DuplicateMobileError extends Error {
  constructor() {
    super("An account with this mobile number already exists");
    this.name = "DuplicateMobileError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password");
    this.name = "InvalidCredentialsError";
  }
}

export class AccountDisabledError extends Error {
  constructor() {
    super("Your account has been disabled. Contact an administrator.");
    this.name = "AccountDisabledError";
  }
}

export class InvalidRegistrationPasswordError extends Error {
  constructor() {
    super("Invalid registration password");
    this.name = "InvalidRegistrationPasswordError";
  }
}

export class InvalidCompanyCodeError extends Error {
  constructor() {
    super("The selected company code is invalid");
    this.name = "InvalidCompanyCodeError";
  }
}

export class CompanyInactiveError extends Error {
  constructor() {
    super("The selected company is currently inactive");
    this.name = "CompanyInactiveError";
  }
}

export class PasswordChangeRequiredError extends Error {
  constructor() {
    super("Please change your password before continuing.");
    this.name = "PasswordChangeRequiredError";
  }
}

export async function register(input: RegisterInput): Promise<RegisterResult> {
  const companyCode = input.companyCode?.trim();
  if (!companyCode) {
    throw new InvalidCompanyCodeError();
  }

  const company = await findCompanyByCode(companyCode);
  if (!company) {
    throw new InvalidCompanyCodeError();
  }

  if (company.status !== "ACTIVE") {
    throw new CompanyInactiveError();
  }

  if (!company.registration_password_hash) {
    throw new InvalidRegistrationPasswordError();
  }

  const isValidRegistrationPassword = await comparePassword(
    input.registrationPassword,
    company.registration_password_hash,
  );
  if (!isValidRegistrationPassword) {
    throw new InvalidRegistrationPasswordError();
  }

  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new DuplicateEmailError();
  }

  const existingMobile = await findUserByMobile(input.mobileNumber);
  if (existingMobile) {
    throw new DuplicateMobileError();
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    companyId: company.id,
    name: input.name,
    email: input.email,
    mobileNumber: input.mobileNumber,
    passwordHash,
    role: input.role,
    approvalStatus: "PENDING",
    mustChangePassword: false,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      mobileNumber: user.mobile_number,
      role: user.role,
    },
    message:
      "Registration submitted successfully. Your account is awaiting administrator approval.",
  };
}

export class AccountPendingApprovalError extends Error {
  constructor() {
    super("Your account is awaiting administrator approval.");
    this.name = "AccountPendingApprovalError";
  }
}

export class AccountRejectedError extends Error {
  constructor() {
    super("Your registration request has been rejected.");
    this.name = "AccountRejectedError";
  }
}

export async function login(
  input: LoginInput,
): Promise<AuthResult & { mustChangePassword: boolean }> {
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new InvalidCredentialsError();
  }

  if (!user.is_active) {
    throw new AccountDisabledError();
  }

  if (user.role === "EXECUTIVE") {
    if (user.approval_status === "PENDING") {
      throw new AccountPendingApprovalError();
    }
    if (user.approval_status === "REJECTED") {
      throw new AccountRejectedError();
    }
  }

  const valid = await comparePassword(input.password, user.password_hash);
  if (!valid) {
    throw new InvalidCredentialsError();
  }

  const token = signToken({
    userId: user.id,
    companyId: user.company_id ?? "",
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      mobileNumber: user.mobile_number,
      role: user.role,
    },
    mustChangePassword: user.must_change_password,
  };
}

export async function changePassword(
  userId: string,
  companyId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = companyId
    ? await findUserByIdAndCompany(userId, companyId)
    : await findUserById(userId);

  if (!user) {
    throw new InvalidCredentialsError();
  }

  const valid = await comparePassword(currentPassword, user.password_hash);
  if (!valid) {
    throw new InvalidCredentialsError();
  }

  const passwordHash = await hashPassword(newPassword);
  await updateUserPassword(user.id, passwordHash, false);
}

export function sanitizeUser(user: UserRow) {
  const { password_hash: _, ...safe } = user;
  return safe;
}
