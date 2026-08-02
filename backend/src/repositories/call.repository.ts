import { PoolClient } from "pg";
import { query } from "../config/db";

export interface LeadCallRow {
  id: string;
  company_id?: string | null;
  lead_id: string;
  followup_id: string | null;
  exotel_call_sid: string | null;
  initiated_by: string;
  initiated_by_name?: string | null;
  caller_id: string;
  from_number: string;
  to_number: string;
  status: string;
  status_callback_url: string | null;
  custom_field: string | null;
  raw_payload: Record<string, unknown>;
  answered_at: Date | null;
  ended_at: Date | null;
  duration: number | null;
  price: string | null;
  recording_url: string | null;
  answered_by: string | null;
  notes: string | null;
  outcome: string | null;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function createLeadCall(
  client: PoolClient,
  input: {
    companyId?: string | null;
    leadId: string;
    followupId?: string | null;
    exotelCallSid?: string | null;
    initiatedBy: string;
    initiatedByName?: string | null;
    callerId: string;
    fromNumber: string;
    toNumber: string;
    status?: string;
    statusCallbackUrl?: string | null;
    customField?: string | null;
    rawPayload?: Record<string, unknown>;
    notes?: string | null;
    outcome?: string | null;
    errorMessage?: string | null;
  },
): Promise<LeadCallRow> {
  if (input.exotelCallSid) {
    const existing = await client.query<LeadCallRow>(
      `SELECT lc.*, u.name AS initiated_by_name
       FROM lead_calls lc
       LEFT JOIN users u ON u.id = lc.initiated_by
       WHERE lc.exotel_call_sid = $1 AND lc.company_id = $2
       LIMIT 1`,
      [input.exotelCallSid, input.companyId ?? null],
    );
    if (existing.rows[0]) {
      return existing.rows[0];
    }
  }

  const result = await client.query<LeadCallRow>(
    `INSERT INTO lead_calls (
       company_id, lead_id, followup_id, exotel_call_sid, initiated_by, initiated_by_name,
       caller_id, from_number, to_number, status, status_callback_url,
       custom_field, raw_payload, notes, outcome, error_message
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING *`,
    [
      input.companyId ?? null,
      input.leadId,
      input.followupId ?? null,
      input.exotelCallSid ?? null,
      input.initiatedBy,
      input.initiatedByName ?? null,
      input.callerId,
      input.fromNumber,
      input.toNumber,
      input.status ?? "queued",
      input.statusCallbackUrl ?? null,
      input.customField ?? null,
      JSON.stringify(input.rawPayload ?? {}),
      input.notes ?? null,
      input.outcome ?? null,
      input.errorMessage ?? null,
    ],
  );
  return result.rows[0];
}

export async function updateLeadCall(
  callId: string,
  leadId: string,
  patch: Partial<{
    notes: string | null;
    outcome: string | null;
  }>,
  companyId?: string,
): Promise<LeadCallRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [field, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    const column = {
      notes: "notes",
      outcome: "outcome",
    }[field as keyof typeof patch];
    if (!column) continue;
    fields.push(`${column} = $${idx++}`);
    values.push(value);
  }

  if (fields.length === 0) {
    return findLeadCallById(callId, companyId);
  }

  fields.push(`updated_at = NOW()`);
  values.push(callId, leadId, companyId);

  const result = await query<LeadCallRow>(
    `UPDATE lead_calls SET ${fields.join(", ")} WHERE id = $${idx} AND lead_id = $${idx + 1} AND company_id = $${idx + 2} RETURNING *`,
    values,
  );
  return result.rows[0] ?? null;
}

export async function updateLeadCallBySid(
  callSid: string,
  patch: Partial<{
    status: string;
    answeredAt: Date | null;
    endedAt: Date | null;
    duration: number | null;
    price: string | null;
    recordingUrl: string | null;
    answeredBy: string | null;
    outcome: string | null;
    errorMessage: string | null;
  }>,
  rawPayload?: Record<string, unknown>,
  companyId?: string | null,
): Promise<LeadCallRow | null> {
  const scopedCompanyId = companyId?.trim() ? companyId : undefined;
  const existing = await findLeadCallBySid(callSid, scopedCompanyId);
  if (!existing) {
    return null;
  }

  const normalizedPatch: Array<{ column: string; value: unknown }> = [];

  for (const [field, value] of Object.entries(patch)) {
    if (value === undefined || value === null) continue;

    const column = {
      status: "status",
      answeredAt: "answered_at",
      endedAt: "ended_at",
      duration: "duration",
      price: "price",
      recordingUrl: "recording_url",
      answeredBy: "answered_by",
      outcome: "outcome",
      errorMessage: "error_message",
    }[field as keyof typeof patch];
    if (!column) continue;

    const currentValue = (existing as unknown as Record<string, unknown>)[
      column
    ];
    const normalizedValue = value instanceof Date ? value.toISOString() : value;
    const normalizedCurrentValue =
      currentValue instanceof Date ? currentValue.toISOString() : currentValue;

    if (
      normalizedCurrentValue !== undefined &&
      normalizedCurrentValue === normalizedValue
    ) {
      continue;
    }

    normalizedPatch.push({ column, value });
  }

  if (rawPayload) {
    const nextRawPayload = JSON.stringify(rawPayload);
    const currentRawPayload = JSON.stringify(existing.raw_payload ?? {});
    if (currentRawPayload !== nextRawPayload) {
      normalizedPatch.push({ column: "raw_payload", value: nextRawPayload });
    }
  }

  if (normalizedPatch.length === 0) {
    return existing;
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const entry of normalizedPatch) {
    fields.push(`${entry.column} = $${idx++}`);
    values.push(entry.value);
  }

  fields.push(`updated_at = NOW()`);
  values.push(callSid);

  const queryText = scopedCompanyId
    ? `UPDATE lead_calls SET ${fields.join(", ")} WHERE exotel_call_sid = $${idx} AND company_id = $${idx + 1} RETURNING *`
    : `UPDATE lead_calls SET ${fields.join(", ")} WHERE exotel_call_sid = $${idx} RETURNING *`;

  const queryValues = scopedCompanyId ? [...values, scopedCompanyId] : values;

  const result = await query<LeadCallRow>(queryText, queryValues);
  return result.rows[0] ?? existing;
}

export async function findLeadCallBySid(
  callSid: string,
  companyId?: string,
): Promise<LeadCallRow | null> {
  const scopedCompanyId = companyId?.trim() ? companyId : undefined;
  const queryText = scopedCompanyId
    ? `SELECT lc.*, u.name AS initiated_by_name
       FROM lead_calls lc
       LEFT JOIN users u ON u.id = lc.initiated_by
       WHERE lc.exotel_call_sid = $1 AND lc.company_id = $2
       LIMIT 1`
    : `SELECT lc.*, u.name AS initiated_by_name
       FROM lead_calls lc
       LEFT JOIN users u ON u.id = lc.initiated_by
       WHERE lc.exotel_call_sid = $1
       LIMIT 1`;

  const queryValues = scopedCompanyId ? [callSid, scopedCompanyId] : [callSid];

  const result = await query<LeadCallRow>(queryText, queryValues);
  return result.rows[0] ?? null;
}

export async function findLeadCallById(
  callId: string,
  companyId?: string,
): Promise<LeadCallRow | null> {
  const result = await query<LeadCallRow>(
    `SELECT lc.*, u.name AS initiated_by_name
     FROM lead_calls lc
     LEFT JOIN users u ON u.id = lc.initiated_by
     WHERE lc.id = $1 AND lc.company_id = $2
     LIMIT 1`,
    [callId, companyId ?? null],
  );
  return result.rows[0] ?? null;
}

export async function listLeadCalls(
  leadId: string,
  companyId?: string,
): Promise<LeadCallRow[]> {
  const result = await query<LeadCallRow>(
    `SELECT lc.*, u.name AS initiated_by_name
     FROM lead_calls lc
     LEFT JOIN users u ON u.id = lc.initiated_by
     WHERE lc.lead_id = $1 AND lc.company_id = $2
     ORDER BY lc.created_at DESC`,
    [leadId, companyId ?? null],
  );
  return result.rows;
}
