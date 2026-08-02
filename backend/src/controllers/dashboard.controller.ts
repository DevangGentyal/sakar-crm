import { Request, Response, NextFunction } from 'express';
import { getDashboardStats } from '../services/dashboard.service';
import { sendSuccess } from '../utils/apiResponse';

export async function getDashboardHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await getDashboardStats(req.user?.id, req.user?.role, req.user?.companyId);
    sendSuccess(res, stats);
  } catch (err) {
    next(err);
  }
}
