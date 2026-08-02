// Auth Types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  role?: "SUPER_ADMIN" | "ADMIN" | "EXECUTIVE";
  mobileNumber?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  mobileNumber: string;
  companyCode: string;
  registrationPassword: string;
}

export interface ExecutiveListItem {
  id: string;
  name: string;
  email: string;
  mobile_number: string | null;
  role: string;
  is_active: boolean;
  approval_status: "PENDING" | "APPROVED" | "REJECTED";
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  exotel_enabled: boolean;
  // exotel_user_id: string | null;
  created_at: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  mustChangePassword?: boolean;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface Company {
  id: string;
  company_name: string;
  company_code: string;
  company_type: string | null;
  email: string | null;
  mobile: string | null;
  address: string | null;
  logo_url: string | null;
  theme: Record<string, unknown> | null;
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
  updated_at: string;
}

// Lead Types
export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "FOLLOW_UP"
  | "INTERESTED"
  | "SITE_VISIT"
  | "NEGOTIATION"
  | "BOOKED"
  | "LOST";
export type LeadSource =
  | "WEBSITE"
  | "FACEBOOK"
  | "INSTAGRAM"
  | "WHATSAPP"
  | "GOOGLE"
  | "REFERRAL"
  | "WALK_IN"
  | "OTHER";
// PropertyType removed, keeping it for now if components need it but making it optional/legacy
export type PropertyType = "residential" | "commercial" | "industrial" | "land";

export interface Lead {
  id: string;
  leadCode?: string;
  photoUrl?: string;
  customerName: string;
  email: string;
  mobile: string;
  alternateMobile?: string;
  status: LeadStatus;
  source: LeadSource;
  budget?: number;
  location?: string; // maps to city
  projectId?: string;
  occupation?: string;
  notes?: string; // maps to remarks
  assignedTo?: string; // assigned_user_id
  assignedUserName?: string;
  createdByName?: string;
  nextFollowupDate?: string;
  createdAt: string;
  updatedAt: string;
  latestFollowupDate?: string;
  latestFollowupNotes?: string;
  latestStatusChangeAt?: string;
  companyId?: string;
  companyName?: string;
}

export interface LeadHistoryRecord {
  id: string;
  leadId: string;
  previousStatus: LeadStatus | null;
  newStatus: LeadStatus;
  remarks?: string;
  updatedBy: string;
  updatedByName?: string;
  updatedAt: string;
  changedFields?: Record<string, unknown>;
}

export interface LeadDetail extends Lead {
  history: LeadHistoryRecord[];
}

export interface LeadFollowUp {
  id: string;
  leadId: string;
  followupDate: string;
  notes?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  status?: LeadStatus;
  customerName?: string;
  mobile?: string;
  leadStatus?: LeadStatus;
  title?: string;
  description?: string;
  dueDate?: string;
  completed?: boolean;
  updatedAt?: string;
}

export interface LeadCall {
  id: string;
  leadId: string;
  followupId?: string | null;
  exotelCallSid?: string | null;
  initiatedBy: string;
  initiatedByName?: string | null;
  callerId: string;
  fromNumber: string;
  toNumber: string;
  status: string;
  statusCallbackUrl?: string | null;
  customField?: string | null;
  answeredAt?: string | null;
  endedAt?: string | null;
  duration?: number | null;
  price?: string | null;
  recordingUrl?: string | null;
  notes?: string | null;
  outcome?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  exotelResponse?: Record<string, unknown>;
}

export interface CreateLeadInput {
  customerName: string;
  email: string;
  mobile: string;
  alternateMobile?: string;
  photoUrl?: string;
  source: LeadSource;
  budget?: number;
  location?: string;
  occupation?: string;
  nextFollowupDate?: string;
  assignedTo?: string;
  notes?: string;
}

export interface UpdateLeadInput extends Partial<CreateLeadInput> {
  status?: LeadStatus;
  assignedTo?: string;
}

// Lead History
export interface LeadHistoryEvent {
  id: string;
  leadId: string;
  type:
    | "status_change"
    | "note_added"
    | "follow_up_scheduled"
    | "assigned"
    | "comment";
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
}

export interface LeadNote {
  id: string;
  leadId: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Pagination & Filtering
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface LeadFilters {
  status?: LeadStatus;
  source?: LeadSource;
  propertyType?: PropertyType;
  search?: string;
  assignedTo?: string;
}

export interface LeadListParams extends PaginationParams, LeadFilters {
  sortBy?: "createdAt" | "name" | "status";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Dashboard Stats
export interface DashboardRecentLead {
  id: string;
  lead_code: string;
  customer_name: string;
  mobile: string;
  status: string;
  source: string;
  created_at: string;
}

export interface DashboardStats {
  totalLeads: number;
  statusBreakdown: { status: string; count: number }[];
  sourceBreakdown: { source: string; count: number }[];
  monthlyTrend: { month: string; count: number }[];
  recentLeads: DashboardRecentLead[];
  followupsDue: {
    id: string;
    lead_code: string;
    customer_name: string;
    mobile: string;
    status: string;
    next_followup_date: string;
    assigned_user_name: string | null;
  }[];
  followupMetrics?: {
    today: number;
    tomorrow: number;
    pending: number;
    overdue: number;
    completed: number;
    upcoming: number;
  };
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: Record<string, unknown>;
}
