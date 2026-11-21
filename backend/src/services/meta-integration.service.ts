import { env } from "../config/env";
import {
  deleteIntegration,
  findIntegrationByCompany,
  findIntegrationByKey,
  findMetaEvent,
  findMetaEventByLeadgen,
  insertOrIgnoreMetaEvent,
  listMetaEvents,
  markIntegrationError,
  updateMetaEventStatus,
  upsertIntegration,
} from "../repositories/meta.repository";
import {
  decryptSecret,
  encryptSecret,
  randomSecret,
  verifyMetaSignature,
} from "../utils/secret";
import { createLeadService, DuplicateMobileError } from "./lead.service";
import { AppError } from "../utils/appError";

const masterKey = () => env.META_ENCRYPTION_KEY || env.JWT_SECRET;

export interface MetaSettingsInput {
  enabled?: boolean;
  appId?: string;
  appSecret?: string;
  pageId?: string;
  pageAccessToken?: string;
  defaultProjectId?: string;
  defaultAssignedUserId?: string;
  fieldMapping?: Record<string, string>;
}

export async function getMetaSettings(companyId: string) {
  const integration = await findIntegrationByCompany(companyId);
  if (!integration) return null;
  const masked = (value: string | null) =>
    value ? `••••••••${value.slice(-4)}` : null;
  let appSecretMask: string | null = null;
  let tokenMask: string | null = null;
  try {
    if (integration.app_secret_encrypted) {
      appSecretMask = masked(
        decryptSecret(integration.app_secret_encrypted, masterKey()),
      );
    }
    if (integration.page_access_token_encrypted) {
      tokenMask = masked(
        decryptSecret(integration.page_access_token_encrypted, masterKey()),
      );
    }
  } catch {
    appSecretMask = null;
    tokenMask = null;
  }
  const connected = Boolean(
    integration.last_sync_at && !integration.last_error,
  );
  return {
    id: integration.id,
    enabled: integration.enabled,
    integrationKey: integration.integration_key,
    connected,
    callbackUrl: connected
      ? `${env.PUBLIC_BASE_URL.replace(/\/$/, "")}/api/v1/webhooks/meta/${integration.integration_key}`
      : null,
    verifyToken: integration.verify_token,
    appId: integration.app_id,
    appSecretMasked: appSecretMask,
    pageId: integration.page_id,
    pageAccessTokenMasked: tokenMask,
    defaultProjectId: integration.default_project_id,
    defaultAssignedUserId: integration.default_assigned_user_id,
    fieldMapping: integration.field_mapping,
    lastSyncAt: integration.last_sync_at,
    lastError: integration.last_error,
  };
}

async function testPageAccessToken(
  pageId: string,
  pageAccessToken: string,
  appId?: string,
  appSecret?: string,
) {
  const normalizedPageId = pageId.trim();
  if (!/^\d+$/.test(normalizedPageId)) {
    throw new AppError("Facebook Page ID must contain only digits", {
      statusCode: 422,
      code: "VALIDATION_ERROR",
      details: { field: "pageId" },
    });
  }

  const url = `https://graph.facebook.com/${env.META_GRAPH_API_VERSION}/${encodeURIComponent(normalizedPageId)}?fields=id,name&access_token=${encodeURIComponent(pageAccessToken.trim())}`;
  const response = await fetch(url);
  const data = (await response.json()) as {
    id?: string;
    name?: string;
    error?: {
      message?: string;
      type?: string;
      code?: number;
      error_subcode?: number;
    };
  };

  if (!response.ok || data.error) {
    const metaMessage =
      data.error?.message || `Meta returned HTTP ${response.status}`;
    throw new AppError(metaMessage, {
      statusCode: 422,
      code: "BAD_REQUEST",
      details: {
        field: "pageId/pageAccessToken",
        pageId: normalizedPageId,
        metaCode: data.error?.code,
        metaType: data.error?.type,
      },
    });
  }

  if (String(data.id) !== normalizedPageId) {
    throw new AppError(
      "The Page Access Token does not belong to the configured Facebook Page",
      {
        statusCode: 422,
        code: "BAD_REQUEST",
        details: { field: "pageId/pageAccessToken", pageId: normalizedPageId },
      },
    );
  }

  if (appId && appSecret) {
    const debugTokenUrl = `https://graph.facebook.com/${env.META_GRAPH_API_VERSION}/debug_token?input_token=${encodeURIComponent(pageAccessToken.trim())}&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}&fields=is_valid,type,expires_at,scopes`;
    const debugResponse = await fetch(debugTokenUrl);
    const debugData = (await debugResponse.json()) as {
      data?: {
        is_valid?: boolean;
        type?: string;
        expires_at?: number;
        scopes?: string[];
      };
      error?: { message?: string; code?: number };
    };
    if (!debugResponse.ok || debugData.error) {
      throw new AppError(
        debugData.error?.message ||
          "Meta could not validate the App ID and App Secret",
        {
          statusCode: 422,
          code: "BAD_REQUEST",
          details: {
            field: "appId/appSecret",
            metaCode: debugData.error?.code,
          },
        },
      );
    }
    if (!debugData.data?.is_valid) {
      throw new AppError(
        "Meta reports that the Page Access Token is invalid or revoked",
        {
          statusCode: 422,
          code: "BAD_REQUEST",
          details: {
            field: "pageAccessToken",
            tokenType: debugData.data?.type,
          },
        },
      );
    }

    const subscribedUrl = `https://graph.facebook.com/${env.META_GRAPH_API_VERSION}/${encodeURIComponent(normalizedPageId)}/subscribed_apps?access_token=${encodeURIComponent(pageAccessToken.trim())}`;
    const subscribedResponse = await fetch(subscribedUrl);
    const subscribedData = (await subscribedResponse.json()) as {
      data?: Array<{
        id?: string;
        name?: string;
        subscribed_fields?: Array<{ name?: string }>;
      }>;
      error?: { message?: string };
    };
    if (!subscribedResponse.ok || subscribedData.error) {
      throw new AppError(
        subscribedData.error?.message ||
          "Unable to read Page webhook subscriptions",
        {
          statusCode: 422,
          code: "BAD_REQUEST",
          details: { field: "pageAccessToken", pageId: normalizedPageId },
        },
      );
    }

    const subscribedApp = subscribedData.data?.find(
      (item) => String(item.id) === appId,
    );
    if (!subscribedApp) {
      throw new AppError(
        "The Meta app is not subscribed to this Facebook Page",
        {
          statusCode: 422,
          code: "BAD_REQUEST",
          details: { field: "pageId", pageId: normalizedPageId, appId },
        },
      );
    }
  }

  return {
    id: data.id,
    name: data.name ?? "Facebook Page",
    subscribed: Boolean(appId && appSecret),
  };
}

export async function saveMetaSettings(
  companyId: string,
  userId: string,
  input: MetaSettingsInput,
) {
  const existing = await findIntegrationByCompany(companyId);
  const candidateAppId = input.appId?.trim() || existing?.app_id;
  const candidatePageId = input.pageId?.trim() || existing?.page_id;
  const candidateAppSecret = input.appSecret?.trim()
    ? input.appSecret.trim()
    : existing?.app_secret_encrypted
      ? decryptSecret(existing.app_secret_encrypted, masterKey())
      : "";
  const candidatePageToken = input.pageAccessToken?.trim()
    ? input.pageAccessToken.trim()
    : existing?.page_access_token_encrypted
      ? decryptSecret(existing.page_access_token_encrypted, masterKey())
      : "";

  if (!candidateAppId) {
    throw new AppError("Meta App ID is required", {
      statusCode: 422,
      code: "VALIDATION_ERROR",
      details: { field: "appId" },
    });
  }
  if (!candidateAppSecret) {
    throw new AppError("Meta App Secret is required", {
      statusCode: 422,
      code: "VALIDATION_ERROR",
      details: { field: "appSecret" },
    });
  }
  if (!candidatePageId) {
    throw new AppError("Facebook Page ID is required", {
      statusCode: 422,
      code: "VALIDATION_ERROR",
      details: { field: "pageId" },
    });
  }
  if (!candidatePageToken) {
    throw new AppError("Page Access Token is required", {
      statusCode: 422,
      code: "VALIDATION_ERROR",
      details: { field: "pageAccessToken" },
    });
  }

  try {
    await testPageAccessToken(
      candidatePageId,
      candidatePageToken,
      candidateAppId,
      candidateAppSecret,
    );
  } catch (error) {
    if (existing) {
      const message =
        error instanceof Error ? error.message : "Meta connection test failed";
      await markIntegrationError(companyId, message);
    }
    throw error;
  }
  const integrationKey = existing?.integration_key ?? randomSecret(24);
  const verifyToken = existing?.verify_token ?? randomSecret(24);
  const appSecret = input.appSecret?.trim()
    ? encryptSecret(input.appSecret.trim(), masterKey())
    : (existing?.app_secret_encrypted ?? null);
  const pageToken = input.pageAccessToken?.trim()
    ? encryptSecret(input.pageAccessToken.trim(), masterKey())
    : (existing?.page_access_token_encrypted ?? null);
  const result = await upsertIntegration({
    companyId,
    enabled: input.enabled ?? existing?.enabled ?? true,
    integrationKey,
    verifyToken,
    appId: input.appId?.trim() || existing?.app_id || null,
    appSecretEncrypted: appSecret,
    pageId: input.pageId?.trim() || existing?.page_id || null,
    pageAccessTokenEncrypted: pageToken,
    defaultProjectId: input.defaultProjectId?.trim() || null,
    defaultAssignedUserId: input.defaultAssignedUserId?.trim() || null,
    fieldMapping: input.fieldMapping ?? existing?.field_mapping ?? {},
    updatedBy: userId,
  });
  await markIntegrationError(companyId, null);
  return getMetaSettings(companyId) || result;
}

export async function removeMetaIntegration(companyId: string) {
  await deleteIntegration(companyId);
}

function normalizeMobile(value: string): string {
  let mobile = value.replace(/[^0-9+]/g, "");
  if (mobile.startsWith("+91") && mobile.length === 13)
    mobile = mobile.slice(3);
  if (mobile.startsWith("91") && mobile.length === 12) mobile = mobile.slice(2);
  return mobile.replace(/^\+/, "");
}

interface MetaFieldData {
  name?: string;
  values?: unknown[];
}

function findField(fieldData: MetaFieldData[], names: string[]): unknown {
  for (const name of names) {
    const field = fieldData.find(
      (item) => item.name?.toLowerCase() === name.toLowerCase(),
    );
    if (field?.values?.length) return field.values[0];
  }
  return undefined;
}

export async function processMetaLead(
  integrationKey: string,
  leadgenId: string,
) {
  const integration = await findIntegrationByKey(integrationKey);
  if (!integration || !integration.enabled)
    throw new Error("Meta integration is disabled");
  if (!integration.page_access_token_encrypted)
    throw new Error("Meta Page access token is missing");
  let event = await findMetaEventByLeadgen(integration.id, leadgenId);
  if (!event) {
    event = await insertOrIgnoreMetaEvent({
      integrationId: integration.id,
      companyId: integration.company_id,
      leadgenId,
      payload: {},
    });
  }
  if (!event) return null;
  await updateMetaEventStatus(event.id, { status: "PROCESSING" });
  try {
    const pageToken = decryptSecret(
      integration.page_access_token_encrypted,
      masterKey(),
    );
    const url = `https://graph.facebook.com/${env.META_GRAPH_API_VERSION}/${encodeURIComponent(leadgenId)}?fields=created_time,ad_id,form_id,field_data&page_access_token=${encodeURIComponent(pageToken)}`;
    const response = await fetch(url);
    const data = (await response.json()) as {
      error?: { message?: string };
      ad_id?: string;
      form_id?: string;
      field_data?: MetaFieldData[];
    };
    if (!response.ok || data.error)
      throw new Error(
        data.error?.message || `Meta returned HTTP ${response.status}`,
      );

    const fieldData = data.field_data ?? [];
    const customerName = String(
      findField(fieldData, ["full_name", "name", "first_name"]) ?? "",
    ).trim();
    const rawMobile = String(
      findField(fieldData, ["phone_number", "phone", "mobile"]) ?? "",
    ).trim();
    const mobile = normalizeMobile(rawMobile);
    const email =
      String(findField(fieldData, ["email", "email_address"]) ?? "").trim() ||
      undefined;
    const city =
      String(
        findField(fieldData, ["city", "location", "postcode", "zip_code"]) ??
          "",
      ).trim() || undefined;
    if (!customerName || !mobile)
      throw new Error("Meta lead has no usable name or mobile number");

    let source = "FACEBOOK";
    if (integration.field_mapping?.source === "INSTAGRAM") source = "INSTAGRAM";

    const lead = await createLeadService({
      companyId: integration.company_id,
      customerName,
      mobile,
      email,
      city,
      source,
      projectId: integration.default_project_id || undefined,
      assignedUserId: integration.default_assigned_user_id || undefined,
      remarks: `Meta Lead Ad${data.form_id ? ` - Form ${data.form_id}` : ""}${data.ad_id ? ` - Ad ${data.ad_id}` : ""}`,
      createdBy: integration.updated_by,
    });
    await updateMetaEventStatus(event.id, {
      status: "COMPLETED",
      crmLeadId: lead.id,
    });
    await markIntegrationError(integration.company_id, null);
    return lead;
  } catch (error) {
    const message =
      error instanceof DuplicateMobileError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unknown Meta lead error";
    await updateMetaEventStatus(event.id, {
      status: "FAILED",
      errorMessage: message,
      incrementRetry: true,
    });
    await markIntegrationError(integration.company_id, message);
    throw error;
  }
}

export async function webhookVerify(
  integrationKey: string,
  mode: string | undefined,
  verifyToken: string | undefined,
  challenge: string | undefined,
) {
  const integration = await findIntegrationByKey(integrationKey);
  if (
    !integration ||
    mode !== "subscribe" ||
    verifyToken !== integration.verify_token
  )
    return null;
  return challenge ?? null;
}

export async function handleWebhook(
  integrationKey: string,
  rawBody: Buffer,
  signature: string | undefined,
  payload: Record<string, any>,
) {
  const integration = await findIntegrationByKey(integrationKey);
  if (!integration || !integration.enabled)
    return { accepted: false, reason: "integration_disabled" };
  if (!integration.app_secret_encrypted)
    return { accepted: false, reason: "app_secret_missing" };
  const appSecret = decryptSecret(
    integration.app_secret_encrypted,
    masterKey(),
  );
  if (!verifyMetaSignature(rawBody, signature, appSecret))
    return { accepted: false, reason: "invalid_signature" };

  const pending: string[] = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "leadgen" && change.field !== "lead_gen") continue;
      const leadgenId = String(change.value?.leadgen_id ?? "");
      if (!leadgenId) continue;
      const event = await insertOrIgnoreMetaEvent({
        integrationId: integration.id,
        companyId: integration.company_id,
        leadgenId,
        pageId: String(change.value?.page_id ?? entry.id ?? "") || undefined,
        formId: String(change.value?.form_id ?? "") || undefined,
        adId: String(change.value?.ad_id ?? "") || undefined,
        payload,
      });
      if (event) pending.push(leadgenId);
    }
  }
  setImmediate(() => {
    for (const leadgenId of pending) {
      processMetaLead(integrationKey, leadgenId).catch(() => undefined);
    }
  });
  return { accepted: true, queued: pending.length };
}

export async function listEvents(companyId: string) {
  return listMetaEvents(companyId);
}

export async function retryEvent(companyId: string, eventId: string) {
  const event = await findMetaEvent(eventId, companyId);
  if (!event) throw new Error("Meta event not found");
  const integration = await findIntegrationByCompany(companyId);
  if (!integration) throw new Error("Meta integration not found");
  await updateMetaEventStatus(eventId, {
    status: "PROCESSING",
    incrementRetry: true,
  });
  await processMetaLead(integration.integration_key, event.leadgen_id);
}

export async function testMetaConnection(companyId: string) {
  const integration = await findIntegrationByCompany(companyId);
  if (!integration?.page_access_token_encrypted)
    throw new Error("Page access token is not configured");
  const token = decryptSecret(
    integration.page_access_token_encrypted,
    masterKey(),
  );
  try {
    const appSecret = integration.app_secret_encrypted
      ? decryptSecret(integration.app_secret_encrypted, masterKey())
      : undefined;
    const data = await testPageAccessToken(
      integration.page_id || "",
      token,
      integration.app_id || undefined,
      appSecret,
    );
    await markIntegrationError(companyId, null);
    return data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Meta connection test failed";
    await markIntegrationError(companyId, message);
    throw error;
  }
}
