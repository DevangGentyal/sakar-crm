import { randomUUID } from "crypto";
import { hashPassword } from "../utils/hash";
import { logError } from "../utils/logger";
import {
  createCompanyWithAdmin,
  listCompanies,
  listPublicCompanies,
  resetAdminPassword,
  setCompanyRegistrationPassword,
  setCompanyStatus,
} from "../repositories/company.repository";
import { mailService } from "./mail.service";

export async function getCompanies() {
  return listCompanies();
}

export async function getPublicCompanies() {
  return listPublicCompanies();
}

export async function createCompanyWithAdminAccount(input: {
  companyName: string;
  companyCode: string;
  companyType: string;
  email: string;
  mobile?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  theme?: Record<string, unknown> | null;
  adminName: string;
  adminEmail: string;
  adminMobile?: string | null;
  adminPassword: string;
  executiveRegistrationPassword?: string | null;
}) {
  const adminPasswordHash = await hashPassword(input.adminPassword);
  const company = await createCompanyWithAdmin({
    ...input,
    adminPasswordHash,
    executiveRegistrationPasswordHash: input.executiveRegistrationPassword
      ? await hashPassword(input.executiveRegistrationPassword)
      : null,
  });

  void mailService
    .sendCompanyWelcomeEmail({
      companyName: company.company_name,
      companyCode: company.company_code,
      companyEmail: company.email ?? input.adminEmail,
      adminEmail: input.adminEmail,
      adminPassword: input.adminPassword,
      executiveRegistrationPassword: input.executiveRegistrationPassword ?? "Not set",
    })
    .catch((error) => {
      logError("Company welcome email failed after creation", {
        companyId: company.id,
        companyName: company.company_name,
        adminEmail: input.adminEmail,
        message: error instanceof Error ? error.message : String(error),
      });
    });

  return company;
}

export async function activateCompany(companyId: string) {
  return setCompanyStatus(companyId, "ACTIVE");
}

export async function deactivateCompany(companyId: string) {
  return setCompanyStatus(companyId, "INACTIVE");
}

export async function updateCompanyRegistrationPassword(
  companyId: string,
  registrationPassword: string,
) {
  const hash = await hashPassword(registrationPassword);
  return setCompanyRegistrationPassword(companyId, hash);
}

export async function resetCompanyAdminPassword(companyId: string) {
  const tempPassword = randomUUID().slice(0, 12);
  const hash = await hashPassword(tempPassword);
  await resetAdminPassword(companyId, hash);
  return { tempPassword };
}
