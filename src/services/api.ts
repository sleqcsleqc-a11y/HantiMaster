import { Property, Unit, Tenant, MaintenanceRequest, FinanceStats, PropertyImage } from "../types";

const API_BASE = "/api";

export const api = {
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
  async getUnits(): Promise<Unit[]> {
    const res = await fetch(`${API_BASE}/units`);
    return res.json();
  },
  async getTenants(): Promise<Tenant[]> {
    const res = await fetch(`${API_BASE}/tenants`);
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
};
