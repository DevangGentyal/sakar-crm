import apiClient, { setAuthToken } from "./client";
import {
  AuthResponse,
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  Lead,
  LeadHistoryEvent,
  LeadHistoryRecord,
  CreateLeadInput,
  UpdateLeadInput,
  LeadListParams,
  PaginatedResponse,
  DashboardStats,
  LeadFollowUp,
  LeadCall,
  LeadNote,
  UserSummary,
  Company,
} from "../types";

// ============= Auth Services =============
// NOTE: Backend wraps all responses as { success: true, data: { token, user } }
// Axios gives us `response.data` = the JSON body, so the actual payload is at response.data.data

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<{
      success: boolean;
      data: AuthResponse;
    }>("/auth/login", credentials);
    const authData = response.data.data;
    setAuthToken(authData.token);
    return authData;
  },

  listUsers: async (): Promise<UserSummary[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: UserSummary[];
    }>("/auth/users");
    return response.data.data;
  },
  register: async (
    credentials: RegisterCredentials,
  ): Promise<{ user: AuthUser; message: string }> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { user: AuthUser; message: string };
    }>("/auth/register", credentials);
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    setAuthToken(null);
  },

  getCurrentUser: async (): Promise<AuthResponse> => {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        id: string;
        name: string;
        email: string;
        role: string;
        is_active: boolean;
        mobile_number?: string | null;
      };
    }>("/auth/me");
    const user = response.data.data;
    // Normalize into AuthResponse shape (token already in localStorage, just need user)
    return {
      token:
        typeof window !== "undefined"
          ? (localStorage.getItem("authToken") ?? "")
          : "",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as AuthUser["role"],
        mobileNumber: undefined,
        createdAt: new Date().toISOString(),
      },
    };
  },
  changePassword: async (input: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    await apiClient.post("/auth/change-password", input);
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const response = await apiClient.post<{
      success: boolean;
      data: AuthResponse;
    }>("/auth/refresh");
    const authData = response.data.data;
    setAuthToken(authData.token);
    return authData;
  },
};

export const companyService = {
  list: async (): Promise<Company[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: Company[];
    }>("/companies");
    return response.data.data;
  },
  create: async (input: {
    companyName: string;
    companyCode: string;
    companyType: string;
    email: string;
    mobile?: string;
    address?: string;
    logoUrl?: string;
    theme?: Record<string, unknown>;
    adminName: string;
    adminEmail: string;
    adminMobile?: string;
    adminPassword: string;
    executiveRegistrationPassword?: string;
  }): Promise<{ company: Company }> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { company: Company };
    }>("/companies", input);
    return response.data.data;
  },
  activate: async (id: string): Promise<Company> => {
    const response = await apiClient.put<{
      success: boolean;
      data: Company;
    }>(`/companies/${id}/activate`);
    return response.data.data;
  },
  deactivate: async (id: string): Promise<Company> => {
    const response = await apiClient.put<{
      success: boolean;
      data: Company;
    }>(`/companies/${id}/deactivate`);
    return response.data.data;
  },
};

// ============= Lead Services =============
export const leadService = {
  uploadLeadPhoto: async (file: File): Promise<{ path: string; url: string | null }> => {
    const formData = new FormData();
    formData.append("photo", file);
    const response = await apiClient.post<{
      success: boolean;
      data: { path: string; url: string | null };
    }>("/leads/photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },
  importLeads: async (
    file: File,
  ): Promise<{
    totalRows: number;
    imported: number;
    duplicates: number;
    failed: number;
    errors: Array<{ row: number; reason: string }>;
  }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<{
      success: boolean;
      data: {
        totalRows: number;
        imported: number;
        duplicates: number;
        failed: number;
        errors: Array<{ row: number; reason: string }>;
      };
    }>("/v1/leads/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },
  getLeads: async (
    params: LeadListParams,
  ): Promise<PaginatedResponse<Lead>> => {
    const response = await apiClient.get<{
      success: boolean;
      data: PaginatedResponse<Lead>;
    }>("/leads", { params });
    return response.data.data;
  },
  getLead: async (id: string): Promise<Lead> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { lead: Lead; history: LeadHistoryRecord[] };
    }>(`/leads/${id}`);
    return response.data.data.lead;
  },

  getLeadDetails: async (
    id: string,
  ): Promise<{ lead: Lead; history: LeadHistoryRecord[] }> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { lead: Lead; history: LeadHistoryRecord[] };
    }>(`/leads/${id}`);
    return response.data.data;
  },

  createLead: async (input: CreateLeadInput): Promise<Lead> => {
    const payload = {
      customer_name: input.customerName,
      email: input.email,
      mobile: input.mobile,
      alternate_mobile: input.alternateMobile || undefined,
      photo_url: input.photoUrl || undefined,
      source: input.source,
      budget: Number.isFinite(input.budget) ? input.budget : undefined,
      city: input.location,
      occupation: input.occupation,
      remarks: input.notes,
      next_followup_date: input.nextFollowupDate || undefined,
      assigned_user_id: input.assignedTo || undefined,
    };
    const response = await apiClient.post<{ success: boolean; data: Lead }>(
      "/leads",
      payload,
    );
    return response.data.data;
  },

  updateLead: async (id: string, input: UpdateLeadInput): Promise<Lead> => {
    const payload = {
      customer_name: input.customerName,
      email: input.email,
      mobile: input.mobile,
      alternate_mobile: input.alternateMobile || null,
      photo_url: input.photoUrl || null,
      source: input.source,
      budget: Number.isFinite(input.budget) ? input.budget : undefined,
      city: input.location,
      occupation: input.occupation,
      remarks: input.notes,
      status: input.status,
      ...(input.assignedTo !== undefined && {
        assigned_user_id: input.assignedTo || null,
      }),
      next_followup_date: input.nextFollowupDate || null,
    };
    // Remove undefined fields
    Object.keys(payload).forEach(
      (key) =>
        payload[key as keyof typeof payload] === undefined &&
        delete payload[key as keyof typeof payload],
    );

    const response = await apiClient.patch<{ success: boolean; data: Lead }>(
      `/leads/${id}`,
      payload,
    );
    return response.data.data;
  },
};

// ============= Lead History Services =============
export const leadHistoryService = {
  getHistory: async (leadId: string): Promise<LeadHistoryEvent[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: LeadHistoryEvent[];
    }>(`/leads/${leadId}/history`);
    return response.data.data;
  },

  getNotes: async (leadId: string): Promise<LeadNote[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: LeadNote[];
    }>(`/leads/${leadId}/notes`);
    return response.data.data;
  },

  addNote: async (leadId: string, content: string): Promise<LeadNote> => {
    const response = await apiClient.post<{ success: boolean; data: LeadNote }>(
      `/leads/${leadId}/notes`,
      { content },
    );
    return response.data.data;
  },

  deleteNote: async (leadId: string, noteId: string): Promise<void> => {
    await apiClient.delete(`/leads/${leadId}/notes/${noteId}`);
  },

  getFollowUps: async (leadId: string): Promise<LeadFollowUp[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: LeadFollowUp[];
    }>(`/leads/${leadId}/follow-ups`);
    return response.data.data;
  },

  createFollowUp: async (
    leadId: string,
    followUp: Omit<LeadFollowUp, "id" | "leadId" | "createdAt" | "updatedAt">,
  ): Promise<LeadFollowUp> => {
    const response = await apiClient.post<{
      success: boolean;
      data: LeadFollowUp;
    }>(`/leads/${leadId}/follow-ups`, followUp);
    return response.data.data;
  },

  updateFollowUp: async (
    leadId: string,
    followUpId: string,
    completed: boolean,
  ): Promise<LeadFollowUp> => {
    const response = await apiClient.patch<{
      success: boolean;
      data: LeadFollowUp;
    }>(`/leads/${leadId}/follow-ups/${followUpId}`, { completed });
    return response.data.data;
  },

  deleteFollowUp: async (leadId: string, followUpId: string): Promise<void> => {
    await apiClient.delete(`/leads/${leadId}/follow-ups/${followUpId}`);
  },
};

export const followupService = {
  complete: async (
    leadId: string,
    followupId: string,
    completed = true,
  ): Promise<void> => {
    await apiClient.patch(`/leads/${leadId}/followups/${followupId}/complete`, {
      completed,
    });
  },
  getAllFollowups: async (filter?: string): Promise<LeadFollowUp[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: Array<Record<string, unknown>>;
    }>("/leads/followups", { params: { filter } });
    return response.data.data.map((item) => ({
      id: String(item.id),
      leadId: String(item.lead_id),
      followupDate: String(item.followup_date),
      notes: item.notes ? String(item.notes) : undefined,
      createdBy: String(item.created_by),
      createdAt: String(item.created_at),
      status: item.status as LeadFollowUp["status"],
      customerName: item.customer_name ? String(item.customer_name) : undefined,
      mobile: item.mobile ? String(item.mobile) : undefined,
      leadStatus: item.lead_status as LeadFollowUp["leadStatus"],
    }));
  },
  getAll: async (leadId: string): Promise<LeadFollowUp[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: Array<Record<string, unknown>>;
    }>(`/leads/${leadId}/followups`);
    return response.data.data.map((item) => ({
      id: String(item.id),
      leadId: String(item.lead_id),
      followupDate: String(item.followup_date),
      notes: item.notes ? String(item.notes) : undefined,
      createdBy: String(item.created_by),
      createdByName: item.created_by_name
        ? String(item.created_by_name)
        : undefined,
      createdAt: String(item.created_at),
      status: item.status as LeadFollowUp["status"],
    }));
  },
  create: async (
    leadId: string,
    input: { followupDate: string; notes?: string },
  ): Promise<LeadFollowUp> => {
    const response = await apiClient.post<{
      success: boolean;
      data: Record<string, unknown>;
    }>(`/leads/${leadId}/followups`, {
      followup_date: input.followupDate,
      notes: input.notes,
    });
    const item = response.data.data;
    return {
      id: String(item.id),
      leadId: String(item.lead_id),
      followupDate: String(item.followup_date),
      notes: item.notes ? String(item.notes) : undefined,
      createdBy: String(item.created_by),
      createdAt: String(item.created_at),
      status: item.status as LeadFollowUp["status"],
    };
  },
};

export const callService = {
  getAll: async (leadId: string): Promise<LeadCall[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: Array<Record<string, unknown>>;
    }>(`/leads/${leadId}/calls`);
    return response.data.data.map((item) => ({
      id: String(item.id),
      leadId: String(item.lead_id),
      followupId: item.followup_id ? String(item.followup_id) : null,
      exotelCallSid: item.exotel_call_sid ? String(item.exotel_call_sid) : null,
      initiatedBy: String(item.initiated_by),
      initiatedByName: item.initiated_by_name
        ? String(item.initiated_by_name)
        : null,
      callerId: String(item.caller_id),
      fromNumber: String(item.from_number),
      toNumber: String(item.to_number),
      status: String(item.status),
      statusCallbackUrl: item.status_callback_url
        ? String(item.status_callback_url)
        : null,
      customField: item.custom_field ? String(item.custom_field) : null,
      answeredAt: item.answered_at ? String(item.answered_at) : null,
      endedAt: item.ended_at ? String(item.ended_at) : null,
      duration:
        item.duration !== null && item.duration !== undefined
          ? Number(item.duration)
          : null,
      price: item.price ? String(item.price) : null,
      recordingUrl: item.recording_url ? String(item.recording_url) : null,
      errorMessage: item.error_message ? String(item.error_message) : null,
      notes: item.notes ? String(item.notes) : null,
      outcome: item.outcome ? String(item.outcome) : null,
      createdAt: String(item.created_at),
      updatedAt: String(item.updated_at),
    }));
  },
  update: async (
    leadId: string,
    callId: string,
    input: { notes?: string | null; outcome?: string | null },
  ): Promise<LeadCall> => {
    const response = await apiClient.patch<{
      success: boolean;
      data: Record<string, unknown>;
    }>(`/leads/${leadId}/calls/${callId}`, input);
    const item = response.data.data;
    return {
      id: String(item.id),
      leadId: String(item.lead_id),
      followupId: item.followup_id ? String(item.followup_id) : null,
      exotelCallSid: item.exotel_call_sid ? String(item.exotel_call_sid) : null,
      initiatedBy: String(item.initiated_by),
      initiatedByName: item.initiated_by_name
        ? String(item.initiated_by_name)
        : null,
      callerId: String(item.caller_id),
      fromNumber: String(item.from_number),
      toNumber: String(item.to_number),
      status: String(item.status),
      statusCallbackUrl: item.status_callback_url
        ? String(item.status_callback_url)
        : null,
      customField: item.custom_field ? String(item.custom_field) : null,
      answeredAt: item.answered_at ? String(item.answered_at) : null,
      endedAt: item.ended_at ? String(item.ended_at) : null,
      duration:
        item.duration !== null && item.duration !== undefined
          ? Number(item.duration)
          : null,
      price: item.price ? String(item.price) : null,
      recordingUrl: item.recording_url ? String(item.recording_url) : null,
      errorMessage: item.error_message ? String(item.error_message) : null,
      notes: item.notes ? String(item.notes) : null,
      outcome: item.outcome ? String(item.outcome) : null,
      createdAt: String(item.created_at),
      updatedAt: String(item.updated_at),
    };
  },
  initiate: async (
    leadId: string,
    input: { followupId?: string | null; statusCallbackUrl?: string },
  ): Promise<LeadCall> => {
    const response = await apiClient.post<{
      success: boolean;
      data: Record<string, unknown>;
    }>(`/leads/${leadId}/calls`, input);
    const item = response.data.data;
    return {
      id: String(item.id),
      leadId: String(item.lead_id),
      followupId: item.followup_id ? String(item.followup_id) : null,
      exotelCallSid: item.exotel_call_sid ? String(item.exotel_call_sid) : null,
      initiatedBy: String(item.initiated_by),
      initiatedByName: item.initiated_by_name
        ? String(item.initiated_by_name)
        : null,
      callerId: String(item.caller_id),
      fromNumber: String(item.from_number),
      toNumber: String(item.to_number),
      status: String(item.status),
      statusCallbackUrl: item.status_callback_url
        ? String(item.status_callback_url)
        : null,
      customField: item.custom_field ? String(item.custom_field) : null,
      answeredAt: item.answered_at ? String(item.answered_at) : null,
      endedAt: item.ended_at ? String(item.ended_at) : null,
      duration:
        item.duration !== null && item.duration !== undefined
          ? Number(item.duration)
          : null,
      price: item.price ? String(item.price) : null,
      recordingUrl: item.recording_url ? String(item.recording_url) : null,
      errorMessage: item.error_message ? String(item.error_message) : null,
      notes: item.notes ? String(item.notes) : null,
      outcome: item.outcome ? String(item.outcome) : null,
      createdAt: String(item.created_at),
      updatedAt: String(item.updated_at),
      exotelResponse: item.exotelResponse as
        | Record<string, unknown>
        | undefined,
    };
  },
};

// ============= Dashboard Services =============
export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<{
      success: boolean;
      data: DashboardStats;
    }>("/dashboard");
    return response.data.data;
  },
};
