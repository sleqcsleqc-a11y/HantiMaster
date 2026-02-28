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
  property_count?: number;
  total_portfolio_value?: number;
  properties?: Property[];
  transactions?: Transaction[];
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

export interface FinanceStats {
  total_revenue: number;
  pending_payments: number;
  active_tenants: number;
}
