import { Request, Response, NextFunction } from 'express';
import { getClient } from '../config/db';
import { findLeadById } from '../repositories/lead.repository';
import { createFollowup, listFollowups, listAllFollowups, completeFollowup } from '../repositories/followup.repository';
import { sendError, sendSuccess } from '../utils/apiResponse';
import { validateRequest } from '../middleware/error.middleware';
import { updateLead } from '../repositories/lead.repository';

export async function createFollowupHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!validateRequest(req, res)) return;
  try {
    const lead = await findLeadById(req.params.id as string, req.user!.companyId);
    if (!lead) {
      sendError(res, 'Lead not found', { statusCode: 404, code: 'LEAD_NOT_FOUND' });
      return;
    }
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const followup = await createFollowup(client, {
        companyId: req.user!.companyId,
        leadId: lead.id,
        followupDate: req.body.followup_date,
        notes: req.body.notes,
        status: req.body.status,
        createdBy: req.user!.id,
      });
      await updateLead(client, lead.id, { nextFollowupDate: req.body.followup_date });
      await client.query('COMMIT');
      sendSuccess(res, followup, { statusCode: 201, message: 'Follow-up created successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
}

export async function listFollowupsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lead = await findLeadById(req.params.id as string, req.user!.companyId);
    if (!lead) {
      sendError(res, 'Lead not found', { statusCode: 404, code: 'LEAD_NOT_FOUND' });
      return;
    }
    const followups = await listFollowups(lead.id, req.user!.companyId);
    sendSuccess(res, followups);
  } catch (error) {
    next(error);
  }
}

export async function completeFollowupHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const completed = req.body?.completed !== false;
    const followup = await completeFollowup(req.params.followupId as string, req.params.id as string, req.user!.companyId, completed);
    if (!followup) {
      sendError(res, 'Follow-up not found', { statusCode: 404, code: 'FOLLOWUP_NOT_FOUND' });
      return;
    }
    sendSuccess(res, followup, { message: completed ? 'Follow-up marked as completed' : 'Follow-up marked as pending' });
  } catch (error) {
    next(error);
  }
}

export async function listAllFollowupsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const followups = await listAllFollowups({
      filter: req.query.filter as string | undefined,
      userId: req.user?.id,
      userRole: req.user?.role,
      companyId: req.user!.companyId,
    });
    sendSuccess(res, followups);
  } catch (error) {
    next(error);
  }
}
