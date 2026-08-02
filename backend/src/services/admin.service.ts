import {
  approveExecutive as approveExecutiveRepo,
  findExecutiveById,
  listExecutives as listExecutivesRepo,
  rejectExecutive as rejectExecutiveRepo,
  setExecutiveActive as setExecutiveActiveRepo,
} from "../repositories/executive.repository";
import type {
  ExecutiveListParams,
  ExecutiveListItem,
} from "../repositories/executive.repository";
import type { ApprovalStatus } from "../repositories/auth.repository";

export async function listExecutives(
  status?: ApprovalStatus,
  page = 1,
  limit = 50,
  sortBy: ExecutiveListParams["sortBy"] = "created_at",
  sortOrder: ExecutiveListParams["sortOrder"] = "desc",
  companyId?: string,
): Promise<{ rows: ExecutiveListItem[]; total: number }> {
  return listExecutivesRepo({ status, page, limit, sortBy, sortOrder, companyId });
}

export async function approveExecutive(
  executiveId: string,
  approvedBy: string,
  companyId?: string,
): Promise<ExecutiveListItem | null> {
  return approveExecutiveRepo(executiveId, approvedBy, companyId);
}

export async function rejectExecutive(
  executiveId: string,
  approvedBy: string,
  reason: string,
  companyId?: string,
): Promise<ExecutiveListItem | null> {
  return rejectExecutiveRepo(executiveId, approvedBy, reason, companyId);
}

export async function setExecutiveActive(
  executiveId: string,
  isActive: boolean,
  companyId?: string,
): Promise<ExecutiveListItem | null> {
  return setExecutiveActiveRepo(executiveId, isActive, companyId);
}

export async function getExecutiveById(executiveId: string, companyId?: string) {
  return findExecutiveById(executiveId, companyId);
}
