import nodemailer from "nodemailer";
import { env } from "../config/env";
import { logError, logInfo } from "../utils/logger";

type CompanyWelcomeEmailInput = {
  companyName: string;
  companyCode: string;
  companyEmail: string;
  adminEmail: string;
  adminPassword: string;
  executiveRegistrationPassword: string;
};

function getTransporter() {
  if (!env.SMTP_EMAIL || !env.SMTP_APP_PASSWORD) {
    throw new Error("SMTP credentials are not configured");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.SMTP_EMAIL,
      pass: env.SMTP_APP_PASSWORD,
    },
  });
}

function buildWelcomeEmailHtml(input: CompanyWelcomeEmailInput): string {
  const loginUrl = env.FRONTEND_URL.replace(/\/$/, "");
  const companyEmail = input.companyEmail.trim();
  const ccLine =
    companyEmail.toLowerCase() !== input.adminEmail.trim().toLowerCase()
      ? `<p style="margin:0 0 10px;color:#667085;"><strong>Company Email:</strong> ${companyEmail}</p>`
      : "";

  return `
  <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:680px;margin:0 auto;padding:32px 16px;">
      <div style="background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%);border-radius:20px 20px 0 0;padding:28px 32px;color:#fff;">
        <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.8;">Welcome to your CRM workspace</div>
        <h1 style="margin:10px 0 0;font-size:30px;line-height:1.2;">${input.companyName}</h1>
        <p style="margin:10px 0 0;font-size:14px;opacity:0.9;">Your company and admin account are ready.</p>
      </div>
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 20px 20px;padding:32px;">
        <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.7;">
          Your CRM account has been created successfully. Use the credentials below to sign in for the first time.
        </p>

        <div style="background:#f8fafc;border:1px solid #dbe4f0;border-radius:18px;padding:24px;margin:0 0 24px;">
          <div style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#475569;margin-bottom:18px;">
            Your Login Credentials
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:14px;color:#0f172a;">
            <tr><td style="padding:8px 0;color:#64748b;width:180px;">Company Name</td><td style="padding:8px 0;font-weight:600;">${input.companyName}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Company Code</td><td style="padding:8px 0;font-weight:600;">${input.companyCode}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Admin Email</td><td style="padding:8px 0;font-weight:600;">${input.adminEmail}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Admin Password</td><td style="padding:8px 0;font-weight:700;letter-spacing:0.04em;">${input.adminPassword}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Executive Registration Password</td><td style="padding:8px 0;font-weight:700;letter-spacing:0.04em;">${input.executiveRegistrationPassword}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Login URL</td><td style="padding:8px 0;font-weight:600;"><a href="${loginUrl}" style="color:#2563eb;text-decoration:none;">${loginUrl}</a></td></tr>
          </table>
        </div>

        <div style="margin:0 0 18px;padding:16px 18px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;color:#1e3a8a;font-size:14px;line-height:1.6;">
          Please change your password immediately after the first login.
        </div>

        <p style="margin:0 0 18px;color:#475569;font-size:14px;line-height:1.7;">
          For security, please do not share these credentials with anyone.
        </p>

        ${ccLine ? `<div style="margin:0 0 18px;color:#475569;font-size:14px;line-height:1.7;">${ccLine}</div>` : ""}

        <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.6;">
          <p style="margin:0 0 6px;font-weight:600;color:#334155;">Need help?</p>
          <p style="margin:0;">Contact CRM support at <a href="mailto:support@real-estate-crm.local" style="color:#2563eb;text-decoration:none;">support@real-estate-crm.local</a>.</p>
        </div>
      </div>
    </div>
  </div>`;
}

export const mailService = {
  async sendCompanyWelcomeEmail(input: CompanyWelcomeEmailInput): Promise<void> {
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `"CRM Support" <${env.SMTP_EMAIL}>`,
        to: input.adminEmail,
        cc:
          input.companyEmail.trim().toLowerCase() !==
          input.adminEmail.trim().toLowerCase()
            ? input.companyEmail
            : undefined,
        subject: `Welcome to ${input.companyName}`,
        html: buildWelcomeEmailHtml(input),
      });
      logInfo("Company welcome email sent", {
        companyName: input.companyName,
        adminEmail: input.adminEmail,
      });
    } catch (error) {
      logError("Failed to send company welcome email", {
        companyName: input.companyName,
        adminEmail: input.adminEmail,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
};
