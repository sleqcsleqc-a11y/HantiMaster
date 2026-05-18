export interface Transaction {
  id: number;
  unit_id?: number;
  tenant_id?: number;
  property_id?: number;
  amount: number;
  type: 'Charge' | 'Payment' | 'Refund' | 'Adjustment';
  category: 'Rent' | 'Security Deposit' | 'Utilities' | 'Late Fee' | 'Maintenance' | 'Other';
  status: 'Pending' | 'Completed' | 'Failed' | 'Void';
  transaction_date: string;
  description?: string;
  tenant_name?: string;
  property_name?: string;
  unit_number?: string;
  created_at: string;
}

export interface Owner {
  id: number;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address?: string;
  nationality?: string;
  dob?: string;
  id_type?: string;
  id_number?: string;
  id_expiry?: string;
  property_count?: number;
  total_portfolio_value?: number;
  properties?: Property[];
  transactions?: Transaction[];
  documents?: OwnerDocument[];
  activities?: OwnerActivity[];
}

export interface OwnerDocument {
  id: number;
  owner_id: number;
  name: string;
  url: string;
  asset_id?: string;
  type: string;
  uploaded_at: string;
}

export interface OwnerActivity {
  id: string;
  type: 'Message' | 'Property' | 'Payment' | 'Document';
  description: string;
  date: string;
}

export interface PropertyDocument {
  id: number;
  property_id: number;
  name: string;
  url: string;
  type: string;
  asset_id?: string;
  uploaded_at: string;
  uploaded_by?: string;
}

export interface Property {
  id: number;
  name: string;
  address: string;
  type: string;
  image_url: string;
  image_asset_id?: string;
  unit_count?: number;
  occupancy_rate?: number;
  property_value?: number;
  owner_id?: number;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  tenant_name?: string;
  lease_end?: string;
  status?: 'Vacant' | 'Occupied' | 'Reserved' | 'Under Maintenance' | 'Under Renovation' | 'Future Available' | 'Unavailable' | 'Archived';
  available_from?: string;
  amenities?: string;
  is_furnished?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  description?: string;
  documents?: PropertyDocument[];
  units?: Unit[];
}

export interface PropertyImage {
  id: number;
  property_id: number;
  image_url: string;
  asset_id?: string;
}

export interface Unit {
  id: number;
  property_id: number;
  unit_number: string;
  rent_amount: number;
  status: 'Occupied' | 'Vacant';
  living_rooms: number;
  bedrooms: number;
  bathrooms: number;
  property_name?: string;
  tenant_id?: number;
  tenant_name?: string;
  lease_start?: string;
  lease_end?: string;
  notes?: string;
}

export interface TenantDocument {
  id: number;
  tenant_id: number;
  name: string;
  url: string;
  asset_id?: string;
  type: string;
  uploaded_at: string;
}

export interface TenantActivity {
  id: string;
  type: 'Message' | 'Maintenance' | 'Payment' | 'Document' | 'Lease';
  description: string;
  date: string;
}

export interface Tenant {
  id: number;
  user_id?: string; 
  unit_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  tenant_id_number?: string;
  lease_start: string;
  lease_end: string;
  notes?: string;
  auto_rent_reminders?: boolean;
  nationality?: string;
  dob?: string;
  occupation?: string;
  employer?: string;
  monthly_income?: number;
  id_type?: string;
  id_number?: string;
  id_expiry_date?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  status: 'Prospective' | 'Active' | 'Evicted' | 'Terminated' | 'Archived';
  occupants_count?: number;
  occupant_details?: string;
  preferred_language?: 'English' | 'Somali' | 'Bilingual';
  vehicle_info?: string;
  rental_history?: string;
  guarantor_details?: string;
  unit_number?: string;
  property_id?: number;
  property_name?: string;
  property_address?: string;
  rent_amount?: number;
  transactions?: Transaction[];
  maintenance?: MaintenanceRequest[];
  documents?: TenantDocument[];
  activities?: TenantActivity[];
}

export interface LeaseTerms {
  id?: number;
  tenant_id: number;
  property_id: number;
  unit_id: number;
  start_date: string;
  end_date: string;
  duration_months: number;
  rent_amount: number;
  payment_frequency: 'Monthly' | 'Quarterly' | 'Yearly';
  payment_day: number;
  security_deposit: number;
  late_fee: number;
  grace_period: number;
  notice_period: number;
  payment_methods: string[];
  utilities_tenant: string[];
  utilities_landlord: string[];
  pet_policy: string;
  smoking_policy: string;
  furnished: boolean;
  inventory_list?: string;
  is_commercial: boolean;
  commercial_terms?: {
    permitted_use: string;
    operating_hours: string;
    signage_rules: string;
    parking_allocation: string;
    insurance_requirements: string;
  };
}

export interface MaintenanceRequest {
  id: number;
  unit_id: number;
  tenant_id: number;
  vendor_id?: number;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  status: 'Open' | 'In Progress' | 'Completed' | 'Closed';
  cost?: number;
  time_spent?: number;
  image_url?: string;
  image_asset_id?: string;
  created_at: string;
  unit_number?: string;
  first_name?: string;
  last_name?: string;
}

export interface Message {
  id: number;
  sender_id: string;
  sender_type: string;
  receiver_id: string;
  receiver_type: string;
  content: string;
  attachment_url?: string;
  attachment_name?: string;
  timestamp: string;
  read: boolean;
}

export interface Task {
  id: number;
  title: string;
  assignee: string;
  due_date: string;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  status: 'Pending' | 'In Progress' | 'Completed';
  cost: number;
  time_spent: number;
  property_id?: number;
  unit_id?: number;
  property_name?: string;
  unit_number?: string;
}

export interface User {
  id: string; // Changed from number to string (UUID)
  role_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  role_name?: string;
  property_scope?: 'Global' | 'Assigned';
  tenant_id?: number;
  owner_id?: number;
  status: 'Active' | 'Suspended' | 'Locked' | 'Terminated';
  avatar_url?: string;
  avatar_asset_id?: string;
  last_login?: string;
  mfa_enabled: boolean;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  is_locked: boolean;
}

export interface Permission {
  id: number;
  module: string;
  action: string;
}

export interface RolePermission {
  role_id: number;
  permission_id: number;
}

export interface PermissionRequest {
  id: number;
  user_id: string;
  user_name?: string;
  module: string;
  action: string;
  justification: string;
  status: 'Pending' | 'Approved' | 'Denied';
  reviewed_by?: string;
  reviewer_name?: string;
  expiration_date?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface PermissionOverride {
  id: number;
  user_id: string;
  permission_id: number;
  override_type: 'Grant' | 'Deny';
  expiration_date?: string;
  created_at: string;
  module?: string;
  action?: string;
}

export interface AuditLog {
  id: number;
  user_id: string;
  action: string;
  timestamp: string;
  entity_type: string;
  entity_id: number;
  user_name?: string;
  details?: string;
}

export interface FinanceStats {
  total_revenue: number;
  pending_payments: number;
  active_tenants: number;
}

export interface MediaAsset {
  id: string;
  storage_path: string;
  filename: string;
  mime_type: string;
  size: number;
  metadata?: any;
  created_at: string;
  uploaded_by: string;
}

export interface DocumentTemplate {
  id: number;
  category: 'Lease' | 'Notice' | 'Financial' | 'Property Management';
  name_en: string;
  name_so: string;
  content_en: string;
  content_so: string;
  placeholders: string[]; 
  is_active: boolean;
  created_at: string;
}

export interface LegalDocument {
  id: number;
  template_id?: number;
  property_id?: number;
  unit_id?: number;
  tenant_id?: number;
  owner_id?: number;
  title: string;
  content_en: string;
  content_so: string;
  placeholders_data: Record<string, string>;
  status: 'Draft' | 'Pending' | 'Signed' | 'Expired' | 'Archived';
  version: number;
  file_url?: string;
  asset_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  signatures?: DocumentSignature[];
}

export interface DocumentSignature {
  id: number;
  document_id: number;
  signer_id?: string;
  signer_name: string;
  signer_role: 'Landlord' | 'Tenant' | 'Witness';
  signature_data: string;
  signed_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface LeasingApplication {
  id: number;
  property_id: number;
  unit_id?: number;
  applicant_name: string;
  applicant_email: string;
  applicant_phone?: string;
  status: 'Pending' | 'Reviewing' | 'Approved' | 'Rejected' | 'Waitlisted';
  income_amount?: number;
  credit_score?: number;
  employment_status?: string;
  notes?: string;
  documents?: any[];
  created_at: string;
  properties?: { name: string; address: string };
  units?: { unit_number: string };
}

export interface Vendor {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  category: string;
  address?: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Blacklisted';
  tax_id?: string;
  insurance_url?: string;
  insurance_expiry?: string;
  certification_url?: string;
  rating?: number;
  created_at: string;
}

export interface VendorReview {
  id: number;
  vendor_id: number;
  user_id: string;
  rating: number;
  review_text: string;
  created_at: string;
  reviewer_name?: string; // Appended by front-end / join
}

export interface WorkOrder {
  id: number;
  request_id: number;
  vendor_id: number;
  status: 'Draft' | 'Sent' | 'In Progress' | 'Completed' | 'Cancelled';
  estimated_cost?: number;
  actual_cost?: number;
  scheduled_date?: string;
  completion_date?: string;
  vendor_notes?: string;
  created_at: string;
}
