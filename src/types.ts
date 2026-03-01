export interface Transaction {
  id: number;
  unit_id: number;
  tenant_id: number;
  amount: number;
  type: string;
  status: string;
  date: string;
  tenant_name?: string;
  property_name?: string;
}

export interface Owner {
  id: number;
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
  type: string;
  uploaded_at: string;
}

export interface OwnerActivity {
  id: string;
  type: 'Message' | 'Property' | 'Payment' | 'Document';
  description: string;
  date: string;
}

export interface Property {
  id: number;
  name: string;
  address: string;
  type: string;
  image_url: string;
  unit_count?: number;
  occupancy_rate?: number;
  property_value?: number;
  owner_id?: number;
  owner_name?: string;
  tenant_name?: string;
  lease_end?: string;
  status?: string;
  amenities?: string;
}

export interface PropertyImage {
  id: number;
  property_id: number;
  image_url: string;
}

export interface Unit {
  id: number;
  property_id: number;
  unit_number: string;
  rent_amount: number;
  status: 'Occupied' | 'Vacant';
  property_name?: string;
}

export interface TenantDocument {
  id: number;
  tenant_id: number;
  name: string;
  url: string;
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
  unit_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  lease_start: string;
  lease_end: string;
  notes?: string;
  auto_rent_reminders?: boolean;
  nationality?: string;
  dob?: string;
  id_type?: string;
  id_number?: string;
  id_expiry?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  unit_number?: string;
  property_name?: string;
  property_address?: string;
  rent_amount?: number;
  transactions?: Transaction[];
  maintenance?: MaintenanceRequest[];
  documents?: TenantDocument[];
  activities?: TenantActivity[];
}

export interface MaintenanceRequest {
  id: number;
  unit_id: number;
  tenant_id: number;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  status: 'Open' | 'In Progress' | 'Completed' | 'Closed';
  cost?: number;
  time_spent?: number;
  created_at: string;
  unit_number?: string;
  first_name?: string;
  last_name?: string;
}

export interface Message {
  id: number;
  sender_id: number;
  sender_type: string;
  receiver_id: number;
  receiver_type: string;
  content: string;
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
}

export interface User {
  id: number;
  role_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role_name?: string;
  property_scope?: 'Global' | 'Assigned';
  tenant_id?: number;
  owner_id?: number;
  status: 'Active' | 'Suspended' | 'Locked' | 'Terminated';
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
  user_id: number;
  user_name?: string;
  module: string;
  action: string;
  justification: string;
  status: 'Pending' | 'Approved' | 'Denied';
  reviewed_by?: number;
  reviewer_name?: string;
  expiration_date?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface PermissionOverride {
  id: number;
  user_id: number;
  permission_id: number;
  override_type: 'Grant' | 'Deny';
  expiration_date?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
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
