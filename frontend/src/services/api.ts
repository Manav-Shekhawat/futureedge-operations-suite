const BASE_URL = import.meta.env.VITE_API_URL || "";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Authentication
  async login(email: string, password: string): Promise<{ access_token: string }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(error.detail || "Login failed");
    }
    return res.json();
  },

  async getMe(): Promise<any> {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch user profiles");
    return res.json();
  },

  // Leads CRM
  async getLeads(params: {
    skip?: number;
    limit?: number;
    status?: string;
    assigned_to?: string;
    is_at_risk?: boolean;
    search?: string;
  } = {}): Promise<{ items: any[]; total: number }> {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.set("skip", params.skip.toString());
    if (params.limit !== undefined) query.set("limit", params.limit.toString());
    if (params.status) query.set("status", params.status);
    if (params.assigned_to) query.set("assigned_to", params.assigned_to);
    if (params.is_at_risk !== undefined) query.set("is_at_risk", params.is_at_risk.toString());
    if (params.search) query.set("search", params.search);

    const res = await fetch(`${BASE_URL}/leads?${query.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load leads");
    return res.json();
  },

  async createLead(data: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/leads`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create lead");
    return res.json();
  },

  async updateLead(id: string, data: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/leads/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update lead details");
    return res.json();
  },

  async deleteLead(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/leads/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete lead");
  },

  async getLeadActivities(id: string): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/leads/${id}/activities`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load lead activities");
    return res.json();
  },

  async addLeadActivity(leadId: string, type: string, description: string, metadata?: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/leads/${leadId}/activities`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ activity_type: type, description, metadata_json: metadata }),
    });
    if (!res.ok) throw new Error("Failed to add activity log");
    return res.json();
  },

  getExportLeadsUrl(params: {
    status?: string;
    assigned_to?: string;
    is_at_risk?: boolean;
    search?: string;
  } = {}): string {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.assigned_to) query.set("assigned_to", params.assigned_to);
    if (params.is_at_risk !== undefined) query.set("is_at_risk", params.is_at_risk.toString());
    if (params.search) query.set("search", params.search);
    return `${BASE_URL}/leads/export?${query.toString()}`;
  },

  // WhatsApp Reports
  async uploadReport(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/reports/upload`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload report file");
    return res.json();
  },

  async getReports(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/reports`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load upload history");
    return res.json();
  },

  async getReport(id: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/reports/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load report analysis");
    return res.json();
  },

  // AI Assistant Audit
  async generateFollowUp(leadId: string, channel: 'email' | 'whatsapp', tone: string): Promise<{ suggested_message: string }> {
    const res = await fetch(`${BASE_URL}/audit/generate-followup`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ lead_id: leadId, channel, tone }),
    });
    if (!res.ok) throw new Error("Failed to generate AI follow-up message");
    return res.json();
  },

  async getAiStatus(): Promise<{ status: string }> {
    const res = await fetch(`${BASE_URL}/audit/status`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch AI connection diagnostics");
    return res.json();
  },

  // Document Automation
  async getDocuments(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/documents`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load documents log");
    return res.json();
  },

  async generateDocumentPdf(docType: string, leadId: string | null, variables: any): Promise<Blob> {
    const res = await fetch(`${BASE_URL}/documents/generate`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        document_type: docType,
        lead_id: leadId,
        variables,
      }),
    });
    if (!res.ok) throw new Error("Failed to generate PDF document");
    return res.blob();
  },

  async getDocumentPdf(documentId: string): Promise<Blob> {
    const res = await fetch(`${BASE_URL}/documents/${documentId}/download`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to download document PDF");
    return res.blob();
  },

  // Settings & Team
  async getSettings(): Promise<any> {
    const res = await fetch(`${BASE_URL}/settings`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load settings");
    return res.json();
  },

  async updateSettings(data: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update settings");
    return res.json();
  },

  async getUsers(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/users`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load team members list");
    return res.json();
  },

  async createUser(data: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/users`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add team member");
    return res.json();
  },

  async updateUser(id: string, data: any): Promise<any> {
    const res = await fetch(`${BASE_URL}/users/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update team member details");
    return res.json();
  }
};
