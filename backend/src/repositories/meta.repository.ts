import { query } from "../config/db";

export interface MetaIntegrationRow {
  id: string;
  company_id: string;
  enabled: boolean;
  integration_key: string;
  verify_token: string;
  app_id: string | null;
  app_secret_encrypted: string | null;
  page_id: string | null;
  page_access_token_encrypted: string | null;
  default_project_id: string | null;
  default_assigned_user_id: string | null;
  field_mapping: Record<string, string>;
  last_sync_at: Date | null;
  last_error: string | null;
  updated_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface MetaEventRow {
  id: string;
  integration_id: string;
  company_id: string;
  leadgen_id: string;
  page_id: string | null;
  form_id: string | null;
  ad_id: string | null;
  payload: Record<string, unknown>;
  status: string;
  retry_count: number;
  crm_lead_id: string | null;
  error_message: string | null;
  received_at: Date;
  processed_at: Date | null;
}

export async function findIntegrationByCompany(companyId: string) {
  const result = await query<MetaIntegrationRow>(
    `SELECT * FROM meta_integrations WHERE company_id = $1 LIMIT 1`,
    [companyId],
  );
  return result.rows[0] ?? null;
}

export async function findIntegrationByKey(integrationKey: string) {
  const result = await query<MetaIntegrationRow>(
    `SELECT * FROM meta_integrations WHERE integration_key = $1 LIMIT 1`,
    [integrationKey],
  );
  return result.rows[0] ?? null;
}

export async function upsertIntegration(input: {
  companyId: string;
  enabled: boolean;
  integrationKey: string;
  verifyToken: string;
  appId: string | null;
  appSecretEncrypted: string | null;
  pageId: string | null;
  pageAccessTokenEncrypted: string | null;
  defaultProjectId: string | null;
  defaultAssignedUserId: string | null;
  fieldMapping: Record<string, string>;
  updatedBy: string;
}) {
  const result = await query<MetaIntegrationRow>(
    `INSERT INTO meta_integrations (
      company_id, enabled, integration_key, verify_token, app_id,
      app_secret_encrypted, page_id, page_access_token_encrypted,
      default_project_id, default_assigned_user_id, field_mapping, updated_by
    ) VALUES ($1::uuid,$2::boolean,$3::text,$4::text,$5::text,$6::text,$7::text,$8::text,$9::uuid,$10::uuid,$11::jsonb,$12::uuid)
    ON CONFLICT (company_id) DO UPDATE SET
      enabled = EXCLUDED.enabled,
      app_id = EXCLUDED.app_id,
      app_secret_encrypted = EXCLUDED.app_secret_encrypted,
      page_id = EXCLUDED.page_id,
      page_access_token_encrypted = EXCLUDED.page_access_token_encrypted,
      default_project_id = EXCLUDED.default_project_id,
      default_assigned_user_id = EXCLUDED.default_assigned_user_id,
      field_mapping = EXCLUDED.field_mapping,
      verify_token = EXCLUDED.verify_token,
      updated_by = EXCLUDED.updated_by,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *`,
    [
      input.companyId,
      input.enabled,
      input.integrationKey,
      input.verifyToken,
      input.appId,
      input.appSecretEncrypted,
      input.pageId,
      input.pageAccessTokenEncrypted,
      input.defaultProjectId,
      input.defaultAssignedUserId,
      JSON.stringify(input.fieldMapping),
      input.updatedBy,
    ],
  );
  return result.rows[0];
}

export async function deleteIntegration(companyId: string) {
  await query(`DELETE FROM meta_integrations WHERE company_id = $1`, [
    companyId,
  ]);
}

export async function insertOrIgnoreMetaEvent(input: {
  integrationId: string;
  companyId: string;
  leadgenId: string;
  pageId?: string;
  formId?: string;
  adId?: string;
  payload: Record<string, unknown>;
}) {
  const result = await query<MetaEventRow>(
    `INSERT INTO meta_lead_events (
      integration_id, company_id, leadgen_id, page_id, form_id, ad_id, payload
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (integration_id, leadgen_id) DO NOTHING
    RETURNING *`,
    [
      input.integrationId,
      input.companyId,
      input.leadgenId,
      input.pageId ?? null,
      input.formId ?? null,
      input.adId ?? null,
      JSON.stringify(input.payload),
    ],
  );
  return result.rows[0] ?? null;
}

export async function findMetaEvent(eventId: string, companyId: string) {
  const result = await query<MetaEventRow>(
    `SELECT * FROM meta_lead_events WHERE id = $1 AND company_id = $2 LIMIT 1`,
    [eventId, companyId],
  );
  return result.rows[0] ?? null;
}

export async function listMetaEvents(companyId: string, limit = 50) {
  const result = await query<MetaEventRow>(
    `SELECT * FROM meta_lead_events WHERE company_id = $1
     ORDER BY received_at DESC LIMIT $2`,
    [companyId, limit],
  );
  return result.rows;
}

export async function updateMetaEventStatus(
  eventId: string,
  patch: {
    status: string;
    crmLeadId?: string | null;
    errorMessage?: string | null;
    incrementRetry?: boolean;
  },
) {
  await query(
    `UPDATE meta_lead_events SET
      status = $2,
      crm_lead_id = COALESCE($3, crm_lead_id),
      error_message = $4,
      retry_count = retry_count + CASE WHEN $5 THEN 1 ELSE 0 END,
      processed_at = CASE WHEN $2 IN ('COMPLETED','FAILED') THEN CURRENT_TIMESTAMP ELSE processed_at END
     WHERE id = $1`,
    [
      eventId,
      patch.status,
      patch.crmLeadId ?? null,
      patch.errorMessage ?? null,
      patch.incrementRetry ?? false,
    ],
  );
}

export async function findMetaEventByLeadgen(
  integrationId: string,
  leadgenId: string,
) {
  const result = await query<MetaEventRow>(
    `SELECT * FROM meta_lead_events WHERE integration_id = $1 AND leadgen_id = $2 LIMIT 1`,
    [integrationId, leadgenId],
  );
  return result.rows[0] ?? null;
}

export async function markIntegrationError(
  companyId: string,
  error: string | null,
) {
  await query(
    `UPDATE meta_integrations SET last_error = $2::text,
      last_sync_at = CASE WHEN $2::text IS NULL THEN CURRENT_TIMESTAMP ELSE last_sync_at END,
      updated_at = CURRENT_TIMESTAMP WHERE company_id = $1::uuid`,
    [companyId, error],
  );
}
