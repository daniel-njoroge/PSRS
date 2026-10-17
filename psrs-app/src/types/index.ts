export type UserRole = 'citizen' | 'staff' | 'admin';

export interface User {
  id: string;
  full_name: string;
  national_id: string;
  email: string;
  phone: string;
  role: UserRole;
  department?: string | null;
  county: string;
  sub_county: string;
  status: 'active' | 'suspended';
  created_at?: string;
}

export interface RequiredDocumentDef {
  id: string;
  name: string;
  required: boolean;
  description: string;
}

export interface FormFieldDef {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  category: string;
  department: string;
  description: string;
  eligibility: string;
  required_documents: RequiredDocumentDef[];
  fee_kes: number;
  processing_time_days: number;
  instructions: string;
  form_fields: FormFieldDef[];
  is_active: boolean;
  created_at: string;
}

export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Action Required'
  | 'Approved'
  | 'Rejected'
  | 'Completed';

export interface ApplicationDocument {
  id: string;
  document_name: string;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  uploaded_at: string;
}

export interface StatusHistoryEntry {
  id: string;
  previous_status: ApplicationStatus | null;
  new_status: ApplicationStatus;
  changed_by_user_id: string;
  changed_by_name?: string;
  changed_by_role?: string;
  remarks: string;
  timestamp: string;
}

export interface Payment {
  id: string;
  reference_number: string;
  application_id: string;
  application_reference?: string;
  service_name?: string;
  user_id: string;
  citizen_name?: string;
  citizen_id?: string;
  citizen_national_id?: string;
  amount_kes: number;
  payment_method: 'mpesa' | 'card' | 'bank_transfer';
  phone_number?: string;
  transaction_reference: string;
  status: 'Pending' | 'Completed' | 'Failed';
  is_simulated: number;
  paid_at?: string;
  created_at: string;
}

export interface Application {
  id: string;
  reference_number: string;
  user_id: string;
  service_id: string;
  service_name?: string;
  service_category?: string;
  service_department?: string;
  fee_kes?: number;
  processing_time_days?: number;
  status: ApplicationStatus;
  form_data: Record<string, any>;
  service_required_docs?: RequiredDocumentDef[];
  assigned_staff_id?: string | null;
  assigned_staff_name?: string | null;
  action_required_note?: string | null;
  rejection_reason?: string | null;
  approval_remarks?: string | null;
  applicant_name?: string;
  applicant_email?: string;
  applicant_phone?: string;
  applicant_national_id?: string;
  applicant_county?: string;
  applicant_sub_county?: string;
  documents?: ApplicationDocument[];
  statusHistory?: StatusHistoryEntry[];
  payment?: Payment | null;
  payment_status?: string;
  paid_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string;
  is_read: number;
  type: 'status_update' | 'payment' | 'action_required' | 'system';
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  summary: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  user_role?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details: Record<string, any>;
  ip_address: string;
  timestamp: string;
}

export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  display_order: number;
}
