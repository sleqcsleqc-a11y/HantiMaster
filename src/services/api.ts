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
  async createOwner(owner: Partial<Owner>): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE}/owners`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(owner),
    });
    return res.json();
  },
  async getProperties(): Promise<Property[]> {
    const res = await fetch(`${API_BASE}/properties`);
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
  async getMaintenance(): Promise<MaintenanceRequest[]> {
    const res = await fetch(`${API_BASE}/maintenance`);
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
  }
};
