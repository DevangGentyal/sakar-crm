import { env } from "../config/env";
import { logDebug, logError } from "../utils/logger";
import { XMLParser } from "fast-xml-parser";

export interface ExotelConnectResponse {
  Call?: {
    Sid?: string;
    Status?: string;
    To?: string;
    From?: string;
    RecordingUrl?: string | null;
    [key: string]: unknown;
  };

  RestException?: {
    Status?: string;
    Message?: string;
    Code?: string;
  };

  [key: string]: unknown;
}

export interface ExotelConfigStatus {
  isConfigured: boolean;
  missing: string[];
}

export interface ExotelCallDetailsResponse {
  sid?: string;
  status?: string;
  duration?: number | null;
  recordingUrl?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  rawPayload?: Record<string, unknown>;
}

export function getExotelConfigStatus(): ExotelConfigStatus {
  const missing: string[] = [];
  if (!env.EXOTEL_API_KEY) missing.push("EXOTEL_API_KEY");
  if (!env.EXOTEL_API_TOKEN) missing.push("EXOTEL_API_TOKEN");
  if (!env.EXOTEL_ACCOUNT_SID) missing.push("EXOTEL_ACCOUNT_SID");
  if (!env.EXOTEL_CALLER_ID) missing.push("EXOTEL_CALLER_ID");

  return { isConfigured: missing.length === 0, missing };
}

function getExotelBaseUrl(): string {
  return env.EXOTEL_REGION.toLowerCase() === "singapore"
    ? "https://api.exotel.com"
    : "https://api.in.exotel.com";
}

export function exotelConfigured(): boolean {
  return getExotelConfigStatus().isConfigured;
}

function normalizeExotelCallerId(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("+")) {
    return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  }
  return trimmed.replace(/\D/g, "");
}

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: true,
  trimValues: true,
});

export async function initiateExotelCall(input: {
  to: string;
  from?: string | null;
  statusCallbackUrl?: string | null;
  customField?: string | null;
}): Promise<ExotelConnectResponse> {
  if (!exotelConfigured()) {
    throw new Error("Exotel is not configured");
  }

  const endpoint = `${getExotelBaseUrl()}/v1/Accounts/${env.EXOTEL_ACCOUNT_SID}/Calls/connect`;

  const auth = Buffer.from(
    `${env.EXOTEL_API_KEY}:${env.EXOTEL_API_TOKEN}`,
  ).toString("base64");

  const callerId = normalizeExotelCallerId(env.EXOTEL_CALLER_ID);
  const fromNumber = normalizeExotelCallerId(
    input.from || env.EXOTEL_CALLER_ID,
  );

  const body = new URLSearchParams();
  body.set("From", fromNumber);
  body.set("To", input.to);
  body.set("CallerId", callerId);
  body.set("CallType", "trans");
  body.set("Record", "true");

  const callbackUrl = input.statusCallbackUrl || env.EXOTEL_STATUS_CALLBACK_URL;
  console.log("Callback URL:", callbackUrl);
  if (callbackUrl) {
    body.set("StatusCallback", callbackUrl);

    body.append("StatusCallbackEvents[]", "terminal");
    body.append("StatusCallbackEvents[]", "answered");

    body.set("StatusCallbackContentType", "application/json");
  }

  if (input.customField) {
    body.set("CustomField", input.customField);
  }

  logDebug("Exotel call request prepared", {
    endpoint,
    region: env.EXOTEL_REGION,
    accountSid: env.EXOTEL_ACCOUNT_SID,
    callerId,
    fromNumber,
    to: input.to,
    hasStatusCallback: Boolean(callbackUrl),
    customFieldPresent: Boolean(input.customField),
  });

  console.log("Endpoint:", endpoint);
  console.log("Body:", body.toString());

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const rawResponse = await response.text();

  console.log("Status:", response.status);
  // console.log("Response:");
  // console.log(rawResponse);

  let parsed: any = {};

  try {
    parsed = rawResponse ? parser.parse(rawResponse) : {};
  } catch (err) {
    throw new Error(
      `Unable to parse Exotel response: ${
        err instanceof Error ? err.message : "Unknown parsing error"
      }`,
    );
  }

  const payload: ExotelConnectResponse = parsed?.TwilioResponse ?? parsed ?? {};

  if (!response.ok) {
    console.error("========== EXOTEL ERROR ==========");
    console.error("Status:", response.status);
    console.error("Status Text:", response.statusText);
    console.error("Raw Response:", rawResponse);
    console.error("Parsed:", JSON.stringify(payload, null, 2));
    console.error("Endpoint:", endpoint);
    console.error("==================================");

    const errorMessage =
      payload?.RestException?.Message ||
      payload?.Message ||
      rawResponse ||
      `HTTP ${response.status}`;

    logError("Exotel call failed", {
      endpoint,
      status: response.status,
      statusText: response.statusText,
      responseBody: payload,
      callerId,
      fromNumber,
      accountSid: env.EXOTEL_ACCOUNT_SID,
      region: env.EXOTEL_REGION,
    });

    throw new Error(`[Exotel ${response.status}] ${errorMessage}`);
  }

  logDebug("Exotel call response received", {
    endpoint,
    status: response.status,
    payload,
  });

  return payload;
}

export async function getExotelCallDetails(
  callSid: string,
): Promise<ExotelCallDetailsResponse> {
  if (!exotelConfigured()) {
    throw new Error("Exotel is not configured");
  }

  const endpoint = `${getExotelBaseUrl()}/v1/Accounts/${env.EXOTEL_ACCOUNT_SID}/Calls/${callSid}`;
  const auth = Buffer.from(
    `${env.EXOTEL_API_KEY}:${env.EXOTEL_API_TOKEN}`,
  ).toString("base64");

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
  });

  const rawResponse = await response.text();
  let parsed: unknown = {};

  try {
    parsed = rawResponse ? JSON.parse(rawResponse) : {};
  } catch {
    try {
      parsed = rawResponse ? parser.parse(rawResponse) : {};
    } catch {
      parsed = {};
    }
  }

  const parsedObject = (parsed as Record<string, unknown>) ?? {};
  const payload =
    (parsedObject.Call as Record<string, unknown> | undefined) ??
    (parsedObject.TwilioResponse as Record<string, unknown> | undefined) ??
    parsedObject;
  const restException = payload.RestException as
    | Record<string, unknown>
    | undefined;

  if (!response.ok) {
    const errorMessage =
      (restException?.Message as string | undefined) ||
      rawResponse ||
      `HTTP ${response.status}`;

    throw new Error(`[Exotel ${response.status}] ${errorMessage}`);
  }

  const status =
    typeof payload.Status === "string"
      ? payload.Status
      : typeof payload.status === "string"
        ? payload.status
        : undefined;

  const durationValue = payload.Duration;
  const duration =
    durationValue !== undefined && durationValue !== null
      ? Number(durationValue)
      : null;

  return {
    sid: typeof payload.Sid === "string" ? payload.Sid : undefined,
    status,
    duration: Number.isFinite(duration) ? duration : null,
    recordingUrl:
      typeof payload.RecordingUrl === "string" ? payload.RecordingUrl : null,
    startTime: typeof payload.StartTime === "string" ? payload.StartTime : null,
    endTime: typeof payload.EndTime === "string" ? payload.EndTime : null,
    rawPayload: payload as Record<string, unknown>,
  };
}
