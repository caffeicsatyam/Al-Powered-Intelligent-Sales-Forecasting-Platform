export type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Proposal"
  | "Won"
  | "Lost";

export const LEAD_STATUSES: readonly LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Won",
  "Lost",
] as const;

export interface Lead {
  id: number;
  company_name: string;
  industry: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  employee_count: string | null;
  location: string | null;
  description: string | null;
  technology_stack: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LeadCreatePayload {
  company_name: string;
  industry: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  employee_count?: string | null;
  location?: string | null;
  description?: string | null;
  technology_stack?: string | null;
  status: string;
}

export type LeadUpdatePayload = Partial<LeadCreatePayload>;

export interface CompanyAnalysis {
  id: number;
  lead_id: number;
  company_overview: string;
  business_needs: string;
  opportunities: string;
  industry_analysis: string;
  qualification_score: number;
  recommended_action: string;
  generated_at: string;
}

export interface ScoreRequest {
  company_growth: number;
  industry_match: number;
  technology_alignment: number;
  business_need: number;
  engagement_level: number;
}

export interface LeadScoreRecord {
  id: number;
  lead_id: number;
  company_growth: number;
  industry_match: number;
  technology_alignment: number;
  business_need: number;
  engagement_level: number;
  total_score: number;
  priority: "High" | "Medium" | "Low" | string;
  conversation_probability: number | null;
  probability_source: string | null;
  created_at: string;
}

export interface EmailGenerationRequest {
  tone: string;
  service_offered: string;
  additional_context?: string | null;
}

export interface OutreachEmailRecord {
  id: number;
  lead_id: number;
  recipient: string;
  subject: string;
  body: string;
  tone: string;
  created_at: string;
}

export interface OutreachRecommendationRecord {
  id: number;
  lead_id: number;
  channel: string;
  follow_up_timing: string;
  strategy: string;
  next_action: string;
  created_at: string;
}

export interface LeadIntelligenceBundle {
  analysis: CompanyAnalysis | null;
  score: LeadScoreRecord | null;
  emails: OutreachEmailRecord[];
  recommendation: OutreachRecommendationRecord | null;
}

export type WorkspaceView = "forecast" | "directory" | "workbench" | "model";
export type WorkbenchTab = "intelligence" | "scoring" | "outreach" | "profile";
