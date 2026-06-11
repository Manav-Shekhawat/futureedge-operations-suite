export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'staff';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  custom_params?: Record<string, any>;
}

export interface Lead {
  id: string;
  assigned_to?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  status: 'new' | 'contacted' | 'interview_scheduled' | 'admitted' | 'rejected' | 'lost';
  source: string;
  academic_interest?: string;
  notes?: string;
  is_at_risk: boolean;
  risk_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  performed_by?: string;
  activity_type: 'note' | 'call' | 'email' | 'whatsapp_sync' | 'status_change' | 'ai_summary' | 'document_generated';
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface WhatsAppReport {
  id: string;
  uploaded_by: string;
  file_name: string;
  file_size: number;
  raw_content: string;
  summary?: string;
  analysis_results?: {
    summary?: string;
    at_risk_students?: Array<{ name: string; reason: string; urgency_level: string }>;
    action_items?: Array<{ task: string; assignee_role: string; due_date_estimation: string }>;
    sentiment_overall?: 'positive' | 'neutral' | 'concerned' | 'urgent';
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface DocumentLog {
  id: string;
  generated_by: string;
  lead_id?: string;
  document_type: 'acceptance_letter' | 'fee_receipt' | 'report_card' | 'compliance_notice';
  recipient_name: string;
  recipient_email?: string;
  data_payload: Record<string, any>;
  created_at: string;
}
