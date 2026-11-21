import { NextFunction, Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/apiResponse";
import {
  getMetaSettings,
  handleWebhook,
  listEvents,
  removeMetaIntegration,
  retryEvent,
  saveMetaSettings,
  testMetaConnection,
  webhookVerify,
} from "../services/meta-integration.service";

export async function getMetaSettingsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    sendSuccess(res, await getMetaSettings(req.user!.companyId));
  } catch (error) {
    next(error);
  }
}

export async function saveMetaSettingsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await saveMetaSettings(
      req.user!.companyId,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, result, { message: "Meta integration settings saved" });
  } catch (error) {
    next(error);
  }
}

export async function deleteMetaSettingsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await removeMetaIntegration(req.user!.companyId);
    sendSuccess(
      res,
      { deleted: true },
      { message: "Meta integration disconnected" },
    );
  } catch (error) {
    next(error);
  }
}

export async function listMetaEventsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    sendSuccess(res, await listEvents(req.user!.companyId));
  } catch (error) {
    next(error);
  }
}

export async function retryMetaEventHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await retryEvent(req.user!.companyId, String(req.params.eventId));
    sendSuccess(
      res,
      { retried: true },
      { message: "Meta event retried successfully" },
    );
  } catch (error) {
    next(error);
  }
}

export async function testMetaConnectionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    sendSuccess(res, await testMetaConnection(req.user!.companyId));
  } catch (error) {
    next(error);
  }
}

export async function metaWebhookVerifyHandler(req: Request, res: Response) {
  const integrationKey = String(req.params.integrationKey);
  const challenge = await webhookVerify(
    integrationKey,
    req.query["hub.mode"] as string,
    req.query["hub.verify_token"] as string,
    req.query["hub.challenge"] as string,
  );
  if (challenge === null) {
    sendError(res, "Webhook verification failed", {
      statusCode: 403,
      code: "WEBHOOK_VERIFICATION_FAILED",
    });
    return;
  }
  res.status(200).send(challenge);
}

export async function metaWebhookHandler(req: Request, res: Response) {
  const integrationKey = String(req.params.integrationKey);
  const rawBody =
    (req as Request & { rawBody?: Buffer }).rawBody ??
    Buffer.from(JSON.stringify(req.body));
  const result = await handleWebhook(
    integrationKey,
    rawBody,
    req.headers["x-hub-signature-256"] as string | undefined,
    req.body,
  );
  if (!result.accepted) {
    res
      .status(result.reason === "invalid_signature" ? 403 : 404)
      .json({ received: false, reason: result.reason });
    return;
  }
  res.status(200).json({ received: true, queued: result.queued });
}
