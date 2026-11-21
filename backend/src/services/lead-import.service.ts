import * as XLSX from "xlsx";
import { getClient } from "../config/db";
import { resolveProjectId } from "../repositories/lead.repository";
import { generateLeadCode } from "../utils/leadCode";
import { AppError } from "../utils/appError";

const SOURCES = new Set([
  "WEBSITE",
  "FACEBOOK",
  "INSTAGRAM",
  "WHATSAPP",
  "GOOGLE",
  "REFERRAL",
  "WALK_IN",
  "OTHER",
]);
const REQUIRED_COLUMNS = ["customer name", "mobile", "project", "source"];

export interface ImportError {
  row: number;
  reason: string;
}
export interface ImportResult {
  totalRows: number;
  imported: number;
  duplicates: number;
  failed: number;
  errors: ImportError[];
}

function normalize(value: unknown): string {
  return String(value ?? "").trim();
}

function sourceValue(value: string): string {
  const normalized = value.toUpperCase().replace(/[ -]+/g, "_");
  return SOURCES.has(normalized) ? normalized : "OTHER";
}

export async function importLeads(
  buffer: Buffer,
  createdBy: string,
  companyId?: string,
): Promise<ImportResult> {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    throw new AppError("The workbook does not contain a worksheet", {
      statusCode: 422,
      code: "BAD_REQUEST",
    });
  }
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
  const headers =
    XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" })[0] ??
    [];
  const headerSet = new Set(
    headers.map((header) => normalize(header).toLowerCase()),
  );
  const missing = REQUIRED_COLUMNS.filter((column) => !headerSet.has(column));
  if (missing.length > 0)
    throw new AppError(`Missing mandatory columns: ${missing.join(", ")}`, {
      statusCode: 422,
      code: "VALIDATION_ERROR",
    });

  const result: ImportResult = {
    totalRows: rows.length,
    imported: 0,
    duplicates: 0,
    failed: 0,
    errors: [],
  };
  const valid: Array<Record<string, string>> = [];
  const mobiles = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const value = (name: string) =>
      normalize(
        row[name] ??
          row[Object.keys(row).find((key) => key.toLowerCase() === name) ?? ""],
      );
    const customerName = value("Customer Name");
    const mobile = value("Mobile");
    const project = value("Project");
    const source = value("Source");
    if (!customerName || !mobile || !project || !source) {
      result.failed++;
      result.errors.push({ row: rowNumber, reason: "Missing mandatory value" });
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      result.failed++;
      result.errors.push({ row: rowNumber, reason: "Invalid Mobile number" });
      return;
    }
    if (mobiles.has(mobile)) {
      result.duplicates++;
      result.errors.push({ row: rowNumber, reason: "Duplicate Mobile" });
      return;
    }
    mobiles.add(mobile);
    valid.push({
      customerName,
      mobile,
      project,
      source: sourceValue(source),
      alternateMobile: value("Alternate Mobile"),
      email: value("Email"),
      budget: value("Budget"),
      city: value("City"),
      occupation: value("Occupation"),
      remarks: value("Remarks"),
    });
  });

  if (valid.length === 0) return result;
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const existing = await client.query<{ mobile: string }>(
      companyId
        ? `SELECT mobile FROM leads WHERE mobile = ANY($1::varchar[]) AND company_id = $2`
        : `SELECT mobile FROM leads WHERE mobile = ANY($1::varchar[])`,
      companyId
        ? [valid.map((lead) => lead.mobile), companyId]
        : [valid.map((lead) => lead.mobile)],
    );
    const existingMobiles = new Set(existing.rows.map((row) => row.mobile));
    const insertable = valid.filter((lead, index) => {
      if (!existingMobiles.has(lead.mobile)) return true;
      result.duplicates++;
      result.failed++;
      result.errors.push({ row: index + 2, reason: "Duplicate Mobile" });
      return false;
    });

    const records: Array<Record<string, unknown>> = [];
    // Generate the daily sequence once. Calling generateLeadCode repeatedly
    // before the bulk INSERT would return the same value because the pending
    // rows are not visible to a second SELECT in the same transaction.
    const firstLeadCode = await generateLeadCode(client);
    const codeMatch = firstLeadCode.match(/^(.*-)(\d+)$/);
    const codePrefix = codeMatch?.[1] ?? "KARYAA-";
    const firstSequence = codeMatch ? Number(codeMatch[2]) : 1;
    for (const lead of insertable) {
      const projectId = /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(lead.project)
        ? lead.project
        : undefined;
      const sequence = firstSequence + records.length;
      records.push({
        ...lead,
        projectId: await resolveProjectId(client, projectId, createdBy),
        leadCode: `${codePrefix}${String(sequence).padStart(4, "0")}`,
      });
    }
    if (records.length > 0) {
      const values: unknown[] = [];
      const placeholders = records.map((lead, index) => {
        const offset = index * 16;
        values.push(
          companyId || null,
          lead.leadCode,
          lead.customerName,
          lead.mobile,
          lead.alternateMobile || null,
          lead.email || null,
          lead.city || null,
          lead.occupation || null,
          lead.budget && !Number.isNaN(Number(lead.budget))
            ? Number(lead.budget)
            : null,
          lead.source,
          lead.projectId,
          null,
          "NEW",
          lead.remarks || null,
          null,
          createdBy,
        );
        return `(${Array.from({ length: 16 }, (_, field) => `$${offset + field + 1}`).join(", ")})`;
      });
      await client.query(
        `INSERT INTO leads (company_id, lead_code, customer_name, mobile, alternate_mobile, email, city, occupation, budget, source, project_id, assigned_user_id, status, remarks, next_followup_date, created_by) VALUES ${placeholders.join(", ")}`,
        values,
      );

      const insertedLeadRows = await client.query<{
        id: string;
        lead_code: string;
      }>(`SELECT id, lead_code FROM leads WHERE lead_code = ANY($1::text[])`, [
        records.map((lead) => lead.leadCode),
      ]);
      const insertedLeadIds = new Map(
        insertedLeadRows.rows.map((row) => [row.lead_code, row.id]),
      );

      const historyValues: unknown[] = [];
      const historyPlaceholders = records.map((lead, index) => {
        const offset = index * 6;
        const leadCode =
          typeof lead.leadCode === "string"
            ? lead.leadCode
            : String(lead.leadCode);
        const leadId = insertedLeadIds.get(leadCode);
        if (!leadId) {
          throw new Error(`Unable to resolve inserted lead ID for ${leadCode}`);
        }
        historyValues.push(
          companyId || null,
          leadId,
          null,
          "NEW",
          lead.remarks || null,
          createdBy,
        );
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
      });
      await client.query(
        `INSERT INTO lead_history (company_id, lead_id, previous_status, new_status, remarks, updated_by) VALUES ${historyPlaceholders.join(", ")}`,
        historyValues,
      );
      result.imported = records.length;
    }
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
