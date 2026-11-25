import type {
  CompanyAnalysis,
  EmailGenerationRequest,
  Lead,
  LeadCreatePayload,
  LeadScoreRecord,
  LeadUpdatePayload,
  OutreachEmailRecord,
  OutreachRecommendationRecord,
  ScoreRequest,
} from "../types/sales";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function parseErrorDetail(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.detail === "string") {
      return data.detail;
    }
    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((item: { loc?: unknown[]; msg?: string }) => {
          const field = Array.isArray(item.loc)
            ? String(item.loc[item.loc.length - 1] ?? "field")
            : "field";
          return `${field}: ${item.msg ?? "invalid value"}`;
        })
        .join("; ");
    }
    return `Request failed with status ${response.status}`;
  } catch {
    return response.statusText || `Request failed with status ${response.status}`;
  }
}

async function requestJson<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const detail = await parseErrorDetail(response);
    throw new ApiError(response.status, detail);
  }

  return (await response.json()) as T;
}

async function requestOptionalJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const detail = await parseErrorDetail(response);
    throw new ApiError(response.status, detail);
  }
  return (await response.json()) as T;
}

export const api = {
  async checkHealth(): Promise<{ status: string }> {
    return requestJson<{ status: string }>("/health");
  },

  async listLeads(params?: {
    search?: string;
    status?: string;
    limit?: number;
  }): Promise<Lead[]> {
    const query = new URLSearchParams();
    if (params?.search?.trim()) query.set("search", params.search.trim());
    if (params?.status?.trim()) query.set("status", params.status.trim());
    query.set("limit", String(params?.limit ?? 200));
    return requestJson<Lead[]>(`/api/leads/?${query.toString()}`);
  },

  async createLead(payload: LeadCreatePayload): Promise<Lead> {
    return requestJson<Lead>("/api/leads/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateLead(leadId: number, payload: LeadUpdatePayload): Promise<Lead> {
    return requestJson<Lead>(`/api/leads/${leadId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteLead(leadId: number): Promise<{ message: string }> {
    return requestJson<{ message: string }>(`/api/leads/${leadId}`, {
      method: "DELETE",
    });
  },

  async getLatestAnalysis(leadId: number): Promise<CompanyAnalysis | null> {
    return requestOptionalJson<CompanyAnalysis>(
      `/api/analysis/${leadId}/latest`
    );
  },

  async runAnalysis(leadId: number): Promise<CompanyAnalysis> {
    return requestJson<CompanyAnalysis>(`/api/analysis/${leadId}`, {
      method: "POST",
    });
  },

  async getLatestScore(leadId: number): Promise<LeadScoreRecord | null> {
    return requestOptionalJson<LeadScoreRecord>(`/api/scoring/${leadId}`);
  },

  async predictScore(
    leadId: number,
    payload: ScoreRequest
  ): Promise<LeadScoreRecord> {
    return requestJson<LeadScoreRecord>(`/api/scoring/predict/${leadId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async listEmails(leadId: number): Promise<OutreachEmailRecord[]> {
    return requestJson<OutreachEmailRecord[]>(`/api/outreach/${leadId}`);
  },

  async generateEmail(
    leadId: number,
    payload: EmailGenerationRequest
  ): Promise<OutreachEmailRecord> {
    return requestJson<OutreachEmailRecord>(
      `/api/outreach/generate/${leadId}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  async generateRecommendation(
    leadId: number
  ): Promise<OutreachRecommendationRecord> {
    return requestJson<OutreachRecommendationRecord>(
      `/api/outreach/recommend/${leadId}`,
      {
        method: "POST",
      }
    );
  },
};
