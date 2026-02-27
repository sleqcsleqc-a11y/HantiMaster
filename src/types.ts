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

export interface Tenant {
  id: number;
  unit_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  lease_start: string;
  lease_end: string;
  unit_number?: string;
  property_name?: string;
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

export interface FinanceStats {
  total_revenue: number;
  pending_payments: number;
  active_tenants: number;
}
