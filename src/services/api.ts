import { Property, Unit, Tenant, MaintenanceRequest, FinanceStats, PropertyImage, Owner, Task, Message } from "../types";

const API_BASE = "/api";

export const api = {
  async getOwners(): Promise<Owner[]> {
    const res = await fetch(`${API_BASE}/owners`);
    return res.json();
  },
  async getOwner(id: number): Promise<Owner> {
    const res = await fetch(`${API_BASE}/owners/${id}`);
    return res.json();
  },
  async updateOwner(id: number, data: Partial<Owner>): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/owners/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async uploadOwnerDocument(id: number, data: { name: string, url: string, type: string }): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE}/owners/${id}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async createOwner(owner: Partial<Owner>): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE}/owners`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(owner),
    });
    return res.json();
  },
  async getProperties(userId?: number): Promise<Property[]> {
    const url = userId ? `${API_BASE}/properties?userId=${userId}` : `${API_BASE}/properties`;
    const res = await fetch(url);
    return res.json();
  },
  async getProperty(id: number): Promise<Property> {
    const res = await fetch(`${API_BASE}/properties/${id}`);
    return res.json();
  },
  async updateProperty(id: number, data: Partial<Property>): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/properties/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async createProperty(data: Partial<Property>): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE}/properties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async getPropertyUnits(id: number): Promise<Unit[]> {
    const res = await fetch(`${API_BASE}/properties/${id}/units`);
    return res.json();
  },
  async addPropertyUnit(id: number, data: Partial<Unit>): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE}/properties/${id}/units`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async getPropertyImages(id: number): Promise<PropertyImage[]> {
    const res = await fetch(`${API_BASE}/properties/${id}/images`);
    return res.json();
  },
  async addPropertyImage(id: number, data: { image_url: string }): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE}/properties/${id}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updatePropertyImage(imageId: number, image_url: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/property_images/${imageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url }),
    });
    return res.json();
  },
  async getUnits(): Promise<Unit[]> {
    const res = await fetch(`${API_BASE}/units`);
    return res.json();
  },
  async updateUnit(id: number, data: Partial<Unit>): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/units/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async getTenants(): Promise<Tenant[]> {
    const res = await fetch(`${API_BASE}/tenants`);
    return res.json();
  },
  async getTenant(id: number): Promise<Tenant> {
    const res = await fetch(`${API_BASE}/tenants/${id}`);
    return res.json();
  },
  async createTenant(data: Partial<Tenant>): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE}/tenants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateTenant(id: number, data: Partial<Tenant>): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/tenants/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async uploadTenantDocument(id: number, data: { name: string, url: string, type: string }): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE}/tenants/${id}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async getMaintenance(userId?: number): Promise<MaintenanceRequest[]> {
    const url = userId ? `${API_BASE}/maintenance?userId=${userId}` : `${API_BASE}/maintenance`;
    const res = await fetch(url);
    return res.json();
  },
  async createMaintenance(data: Partial<MaintenanceRequest>): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE}/maintenance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async getFinanceStats(): Promise<FinanceStats> {
    const res = await fetch(`${API_BASE}/finance/stats`);
    return res.json();
  },
  async getTasks(): Promise<Task[]> {
    const res = await fetch(`${API_BASE}/tasks`);
    return res.json();
  },
  async createTask(data: Partial<Task>): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async updateTask(id: number, data: Partial<Task>): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async getMessages(): Promise<Message[]> {
    const res = await fetch(`${API_BASE}/messages`);
    return res.json();
  },
  async sendMessage(data: Partial<Message>): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async markMessageRead(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/messages/read/${id}`, {
      method: "PUT",
    });
    return res.json();
  },
  // Auth & Users
  login: async (credentials: any) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },
  getCurrentUser: async (userId: number) => {
    const res = await fetch(`${API_BASE}/users/me?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to get user');
    return res.json();
  },
  getUsers: async () => {
    const res = await fetch(`${API_BASE}/users`);
    return res.json();
  },
  getRoles: async () => {
    const res = await fetch(`${API_BASE}/roles`);
    return res.json();
  },
  getAuditLogs: async () => {
    const res = await fetch(`${API_BASE}/audit-logs`);
    return res.json();
  },

  // Governance & Permission Control
  getGovernanceStats: async () => {
    const res = await fetch(`${API_BASE}/governance/stats`);
    return res.json();
  },
  getGovernanceUsers: async () => {
    const res = await fetch(`${API_BASE}/governance/users`);
    return res.json();
  },
  createGovernanceUser: async (data: any, adminId?: number) => {
    const res = await fetch(`${API_BASE}/governance/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, admin_id: adminId })
    });
    return res.json();
  },
  getGovernanceUserDetails: async (id: number) => {
    const res = await fetch(`${API_BASE}/governance/users/${id}`);
    return res.json();
  },
  updateGovernanceUser: async (id: number, data: any, adminId?: number) => {
    const res = await fetch(`${API_BASE}/governance/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, admin_id: adminId })
    });
    return res.json();
  },
  getPermissionRequests: async () => {
    const res = await fetch(`${API_BASE}/governance/permission-requests`);
    return res.json();
  },
  submitPermissionRequest: async (data: any) => {
    const res = await fetch(`${API_BASE}/governance/permission-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  reviewPermissionRequest: async (id: number, data: any) => {
    const res = await fetch(`${API_BASE}/governance/permission-requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getPermissionMatrix: async () => {
    const res = await fetch(`${API_BASE}/governance/matrix`);
    return res.json();
  },
  getSecurityAlerts: async () => {
    const res = await fetch(`${API_BASE}/governance/security-alerts`);
    return res.json();
  },
  getSystemRules: async () => {
    const res = await fetch(`${API_BASE}/governance/system-rules`);
    return res.json();
  },
  createHierarchyRule: async (data: any) => {
    const res = await fetch(`${API_BASE}/governance/hierarchy-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteHierarchyRule: async (id: number, adminId: number) => {
    const res = await fetch(`${API_BASE}/governance/hierarchy-rules/${id}?admin_id=${adminId}`, {
      method: 'DELETE'
    });
    return res.json();
  },
  updatePermissionMatrix: async (data: { role_id: number, permission_id: number, action: 'grant' | 'revoke', admin_id?: number }) => {
    const res = await fetch(`${API_BASE}/governance/matrix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getUserOverrides: async (userId: number) => {
    const res = await fetch(`${API_BASE}/governance/overrides/${userId}`);
    return res.json();
  }
};
