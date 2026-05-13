import { Property, Unit, Tenant, MaintenanceRequest, FinanceStats, PropertyImage, Owner, Task, Message, PropertyDocument } from "../types";
import { supabase } from "../lib/supabase";

export const api = {
  async getOwners(): Promise<Owner[]> {
    const { data, error } = await supabase
      .from('owners')
      .select('*, profiles(id)');
    if (error) throw error;
    return data?.map((o: any) => ({
      ...o,
      user_id: o.profiles?.[0]?.id
    })) || [];
  },
  async getOwner(id: number): Promise<Owner> {
    const { data, error } = await supabase
      .from('owners')
      .select(`
        *,
        properties (*),
        owner_documents (*),
        transactions:properties(units(transactions(*))),
        profiles(id)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    
    // Flatten transactions from nested structure
    const transactions = data.transactions?.flatMap((p: any) => 
      p.units?.flatMap((u: any) => 
        u.transactions?.map((t: any) => ({
          ...t,
          property_name: p.name,
          unit_number: u.unit_number
        })) || []
      ) || []
    ) || [];

    return { ...data, transactions, user_id: data.profiles?.[0]?.id };
  },
  async getTenantByUserId(userId: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        units (
          id,
          unit_number,
          rent_amount,
          properties (id, name, address)
        ),
        profiles (id)
      `)
      .eq('profiles.id', userId)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      unit_id: data.units?.id,
      unit_number: data.units?.unit_number,
      rent_amount: data.units?.rent_amount,
      property_id: data.units?.properties?.id,
      property_name: data.units?.properties?.name,
      property_address: data.units?.properties?.address,
      user_id: data.profiles?.[0]?.id
    };
  },
  async getTenantPayments(tenantId: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async getTenantMaintenanceRequests(tenantId: number): Promise<MaintenanceRequest[]> {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select(`
        *,
        units (unit_number)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((r: any) => ({
      ...r,
      unit_number: r.units?.unit_number
    })) || [];
  },
  async updateOwner(id: number, data: Partial<Owner> & { admin_id?: string }): Promise<{ success: boolean }> {
    const { admin_id, ...updateData } = data;
    const { error } = await supabase.from('owners').update(updateData).eq('id', id);
    if (error) throw error;
    
    if (admin_id) {
      await supabase.from('audit_logs').insert({
        user_id: admin_id,
        action: 'Updated owner',
        entity_type: 'Owner',
        entity_id: id
      });
    }
    return { success: true };
  },
  async uploadOwnerDocument(id: number, data: { name: string, url: string, type: string }): Promise<{ id: number }> {
    const { data: doc, error } = await supabase
      .from('owner_documents')
      .insert({ ...data, owner_id: id })
      .select()
      .single();
    if (error) throw error;
    return { id: doc.id };
  },
  async createOwner(owner: Partial<Owner> & { admin_id?: string }): Promise<{ id: number }> {
    const { admin_id, ...ownerData } = owner;
    const { data, error } = await supabase.from('owners').insert(ownerData).select().single();
    if (error) throw error;

    if (admin_id) {
      await supabase.from('audit_logs').insert({
        user_id: admin_id,
        action: 'Created owner',
        entity_type: 'Owner',
        entity_id: data.id
      });
    }
    return { id: data.id };
  },
  async getProperties(userId?: string): Promise<Property[]> {
    let query = supabase.from('properties').select('*, owners(first_name, last_name), units(*), media_assets!image_asset_id(storage_path)');
    
    if (userId) {
      const { data: profile } = await supabase.from('profiles').select('property_scope, owner_id, roles(name)').eq('id', userId).single();
      
      const roleName = Array.isArray(profile?.roles) ? (profile?.roles[0] as any)?.name : (profile?.roles as any)?.name;

      if (roleName === 'Property Owner' && profile?.owner_id) {
         query = query.eq('owner_id', profile.owner_id);
      }
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data.map(p => {
      let imageUrl = p.image_url;
      if (p.media_assets) {
        const { data: { publicUrl } } = supabase.storage.from('hanti-assets').getPublicUrl(p.media_assets.storage_path);
        imageUrl = publicUrl;
      }
      
      const units = p.units || [];
      const occupiedUnits = units.filter((u: any) => u.status === 'Occupied').length;
      const occupancyRate = units.length > 0 ? (occupiedUnits / units.length) * 100 : 0;

      return {
        ...p,
        image_url: imageUrl,
        owner_name: p.owners ? `${p.owners.first_name} ${p.owners.last_name}` : undefined,
        unit_count: units.length,
        occupancy_rate: occupancyRate
      };
    });
  },
  async getProperty(id: number): Promise<Property> {
    const { data, error } = await supabase
      .from('properties')
      .select('*, owners(first_name, last_name, email, phone), units(*), media_assets!image_asset_id(storage_path)')
      .eq('id', id)
      .single();
    if (error) throw error;
    
    let imageUrl = data.image_url;
    if (data.media_assets) {
      const { data: { publicUrl } } = supabase.storage.from('hanti-assets').getPublicUrl(data.media_assets.storage_path);
      imageUrl = publicUrl;
    }

    const units = data.units || [];
    const occupiedUnits = units.filter((u: any) => u.status === 'Occupied').length;
    const occupancyRate = units.length > 0 ? (occupiedUnits / units.length) * 100 : 0;

    return {
      ...data,
      image_url: imageUrl,
      owner_name: data.owners ? `${data.owners.first_name} ${data.owners.last_name}` : undefined,
      owner_email: data.owners?.email,
      owner_phone: data.owners?.phone,
      unit_count: units.length,
      occupancy_rate: occupancyRate
    };
  },
  async updateProperty(id: number, data: Partial<Property>): Promise<{ success: boolean }> {
    const { error } = await supabase.from('properties').update(data).eq('id', id);
    if (error) throw error;
    return { success: true };
  },
  async createProperty(data: Partial<Property>): Promise<{ id: number }> {
    const { data: prop, error } = await supabase.from('properties').insert(data).select().single();
    if (error) throw error;
    return { id: prop.id };
  },
  async getPropertyUnits(id: number): Promise<Unit[]> {
    const { data, error } = await supabase
      .from('units')
      .select('*, tenants(id, first_name, last_name, lease_start, lease_end, notes)')
      .eq('property_id', id);
    if (error) throw error;
    
    return data.map((u: any) => {
      // Find the active tenant (lease not ended or end date in future)
      // For now, we'll take the first one returned as the active one if status is Occupied
      // In a real app, we'd filter by date or status more strictly
      const tenant = u.tenants?.[0]; 
      return {
        ...u,
        tenant_id: tenant?.id,
        tenant_name: tenant ? `${tenant.first_name} ${tenant.last_name}` : undefined,
        lease_start: tenant?.lease_start,
        lease_end: tenant?.lease_end,
        notes: tenant?.notes
      };
    }) || [];
  },
  async addPropertyUnit(id: number, data: Partial<Unit>): Promise<{ id: number }> {
    const { data: unit, error } = await supabase.from('units').insert({ ...data, property_id: id }).select().single();
    if (error) throw error;
    return { id: unit.id };
  },
  async getPropertyImages(id: number): Promise<PropertyImage[]> {
    const { data, error } = await supabase.from('property_images').select('*').eq('property_id', id);
    if (error) throw error;
    return data || [];
  },
  async addPropertyImage(id: number, data: { image_url: string }): Promise<{ id: number }> {
    const { data: img, error } = await supabase.from('property_images').insert({ ...data, property_id: id }).select().single();
    if (error) throw error;
    return { id: img.id };
  },
  async updatePropertyImage(imageId: number, image_url: string): Promise<{ success: boolean }> {
    const { error } = await supabase.from('property_images').update({ image_url }).eq('id', imageId);
    if (error) throw error;
    return { success: true };
  },

  async getPropertyDocuments(propertyId: number): Promise<PropertyDocument[]> {
    const { data, error } = await supabase.from('property_documents').select('*').eq('property_id', propertyId);
    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('property_documents table not found, returning empty array');
        return [];
      }
      throw error;
    }
    return data || [];
  },

  async uploadPropertyDocument(propertyId: number, data: { name: string, url: string, type: string, asset_id?: string }, userId?: string): Promise<{ success: boolean }> {
    const { error } = await supabase.from('property_documents').insert({
      property_id: propertyId,
      ...data,
      uploaded_by: userId
    });
    if (error) {
      if (error.code === 'PGRST205') {
        throw new Error('Property documents feature is currently unavailable. Please contact support.');
      }
      throw error;
    }
    return { success: true };
  },

  async getUnits(): Promise<Unit[]> {
    const { data, error } = await supabase.from('units').select('*, properties(name)');
    if (error) throw error;
    return data.map(u => ({ ...u, property_name: u.properties?.name }));
  },
  async updateUnit(id: number, data: Partial<Unit>): Promise<{ success: boolean }> {
    const { error } = await supabase.from('units').update(data).eq('id', id);
    if (error) throw error;
    return { success: true };
  },
  async getTenants(): Promise<Tenant[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        units (
          unit_number,
          properties (name)
        ),
        profiles (id)
      `);
    if (error) throw error;
    return data.map((t: any) => ({
      ...t,
      unit_number: t.units?.unit_number,
      property_name: t.units?.properties?.name,
      user_id: t.profiles?.[0]?.id
    }));
  },
  async getTenant(id: number): Promise<Tenant> {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        units (
          unit_number,
          rent_amount,
          properties (name, address)
        ),
        transactions (*),
        maintenance_requests (*),
        tenant_documents (*),
        profiles (id)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    
    return {
      ...data,
      unit_number: data.units?.unit_number,
      rent_amount: data.units?.rent_amount,
      property_name: data.units?.properties?.name,
      property_address: data.units?.properties?.address,
      maintenance: data.maintenance_requests,
      documents: data.tenant_documents,
      user_id: data.profiles?.[0]?.id
    };
  },
  async createTenant(data: Partial<Tenant> & { admin_id?: string }): Promise<{ id: number }> {
    const { admin_id, ...tenantData } = data;
    const { data: tenant, error } = await supabase.from('tenants').insert(tenantData).select().single();
    if (error) throw error;
    
    // Update unit status
    if (tenantData.unit_id) {
      await supabase.from('units').update({ status: 'Occupied' }).eq('id', tenantData.unit_id);
    }

    if (admin_id) {
      await supabase.from('audit_logs').insert({
        user_id: admin_id,
        action: 'Created tenant',
        entity_type: 'Tenant',
        entity_id: tenant.id
      });
    }
    return { id: tenant.id };
  },
  async updateTenant(id: number, data: Partial<Tenant> & { admin_id?: string }): Promise<{ success: boolean }> {
    const { admin_id, ...updateData } = data;
    const { error } = await supabase.from('tenants').update(updateData).eq('id', id);
    if (error) throw error;

    if (admin_id) {
      await supabase.from('audit_logs').insert({
        user_id: admin_id,
        action: 'Updated tenant',
        entity_type: 'Tenant',
        entity_id: id
      });
    }
    return { success: true };
  },
  async moveOutTenant(id: number, adminId?: string): Promise<{ success: boolean }> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get tenant to find unit
    const { data: tenant } = await supabase.from('tenants').select('unit_id, lease_end').eq('id', id).single();
    if (!tenant) throw new Error('Tenant not found');

    // Update lease end
    if (tenant.lease_end > today) {
      await supabase.from('tenants').update({ lease_end: today }).eq('id', id);
    }

    // Update unit status
    await supabase.from('units').update({ status: 'Vacant' }).eq('id', tenant.unit_id);

    if (adminId) {
      await supabase.from('audit_logs').insert({
        user_id: adminId,
        action: 'Processed move-out',
        entity_type: 'Tenant',
        entity_id: id
      });
    }

    return { success: true };
  },
  async uploadTenantDocument(id: number, file: File, data: { name: string, type: string }): Promise<{ id: number }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `tenant-documents/${id}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('hanti-assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('hanti-assets')
      .getPublicUrl(filePath);

    // Insert into media_assets table
    const { data: asset, error: assetError } = await supabase.from('media_assets').insert({
      storage_path: filePath,
      filename: file.name,
      mime_type: file.type,
      size: file.size
    }).select().single();

    if (assetError) throw assetError;

    // Insert into tenant_documents table
    const { data: doc, error } = await supabase.from('tenant_documents').insert({ 
      name: data.name, 
      url: publicUrlData.publicUrl, 
      type: data.type,
      tenant_id: id,
      asset_id: asset.id
    }).select().single();
    
    if (error) throw error;
    return { id: doc.id };
  },
  async getMaintenance(userId?: string): Promise<MaintenanceRequest[]> {
    const { data, error } = await supabase.from('maintenance_requests').select('*');
    if (error) throw error;
    return data || [];
  },
  async createMaintenance(data: Partial<MaintenanceRequest>): Promise<{ id: number }> {
    const { data: req, error } = await supabase.from('maintenance_requests').insert(data).select().single();
    if (error) throw error;
    return { id: req.id };
  },
  async getFinanceStats(userId?: string): Promise<FinanceStats> {
    let propertiesQuery = supabase.from('properties').select('id, owner_id, units(rent_amount, status)');

    if (userId) {
      const { data: profile } = await supabase.from('profiles').select('owner_id, roles(name)').eq('id', userId).single();
      const roleName = Array.isArray(profile?.roles) ? (profile?.roles[0] as any)?.name : (profile?.roles as any)?.name;
      
      if (roleName === 'Property Owner' && profile?.owner_id) {
        propertiesQuery = propertiesQuery.eq('owner_id', profile.owner_id);
      }
    }

    const { data: properties, error } = await propertiesQuery;
    if (error) throw error;

    let totalRevenue = 0;
    let activeTenants = 0;
    let pendingPayments = 0;

    properties?.forEach((p: any) => {
      p.units?.forEach((u: any) => {
        if (u.status === 'Occupied') {
          totalRevenue += u.rent_amount || 0;
          activeTenants++;
        }
      });
    });

    // Mock pending payments as 10% of revenue for demo
    pendingPayments = totalRevenue * 0.1;

    return {
      total_revenue: totalRevenue,
      pending_payments: pendingPayments,
      active_tenants: activeTenants
    };
  },
  async getTasks(): Promise<Task[]> {
    const { data, error } = await supabase.from('tasks').select('*');
    if (error) throw error;
    return data || [];
  },
  async createTask(data: Partial<Task>): Promise<{ id: number }> {
    const { data: task, error } = await supabase.from('tasks').insert(data).select().single();
    if (error) throw error;
    return { id: task.id };
  },
  async updateTask(id: number, data: Partial<Task>): Promise<{ success: boolean }> {
    const { error } = await supabase.from('tasks').update(data).eq('id', id);
    if (error) throw error;
    return { success: true };
  },
  async getMessages(): Promise<Message[]> {
    const { data, error } = await supabase.from('messages').select('*');
    if (error) throw error;
    return data || [];
  },
  async sendMessage(data: Partial<Message>): Promise<{ id: number }> {
    const { data: msg, error } = await supabase.from('messages').insert(data).select().single();
    if (error) throw error;
    return { id: msg.id };
  },
  async markMessageRead(id: number): Promise<{ success: boolean }> {
    const { error } = await supabase.from('messages').update({ read: true }).eq('id', id);
    if (error) throw error;
    return { success: true };
  },
  
  async submitPaymentProof(tenantId: number, amount: number, file: File): Promise<{ success: boolean }> {
    // 1. Upload the file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `payment-proofs/${tenantId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('hanti-assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('hanti-assets')
      .getPublicUrl(filePath);

    // 3. Create a transaction record (Pending verification)
    const { error: txError } = await supabase.from('transactions').insert({
      tenant_id: tenantId,
      amount: amount,
      type: 'Rent',
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      description: `Rent Payment Proof - ${file.name}`,
      payment_method: 'Bank Transfer',
      reference_number: publicUrl // Store the proof URL in reference for now
    });

    if (txError) throw txError;

    return { success: true };
  },
  
  // Auth & Users
  login: async (credentials: any) => {
    // Handled by Supabase Auth directly in AuthContext usually, but keeping for compatibility
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    if (error) throw error;
    
    // Fetch profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    return profile;
  },
  getCurrentUser: async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*, roles(name), media_assets!avatar_asset_id(storage_path)').eq('id', userId).single();
    if (error) throw error;
    
    let avatarUrl = data.avatar_url;
    if (data.media_assets) {
      const { data: { publicUrl } } = supabase.storage.from('hanti-assets').getPublicUrl(data.media_assets.storage_path);
      avatarUrl = publicUrl;
    }

    return { ...data, role_name: data.roles?.name, avatar_url: avatarUrl };
  },
  getUsers: async () => {
    const { data, error } = await supabase.from('profiles').select('*, roles(name), media_assets!avatar_asset_id(storage_path)');
    if (error) throw error;
    return data.map(u => {
      let avatarUrl = u.avatar_url;
      if (u.media_assets) {
        const { data: { publicUrl } } = supabase.storage.from('hanti-assets').getPublicUrl(u.media_assets.storage_path);
        avatarUrl = publicUrl;
      }
      return { ...u, role_name: u.roles?.name, avatar_url: avatarUrl };
    });
  },
  getRoles: async () => {
    const { data, error } = await supabase.from('roles').select('*');
    if (error) throw error;
    return data || [];
  },
  createRole: async (data: { name: string, description: string }) => {
    const { data: role, error } = await supabase.from('roles').insert(data).select().single();
    if (error) throw error;
    return role;
  },
  updateRole: async (id: number, data: { name?: string, description?: string }) => {
    const { data: role, error } = await supabase.from('roles').update(data).eq('id', id).select().single();
    if (error) throw error;
    return role;
  },
  deleteRole: async (id: number) => {
    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
  getAuditLogs: async () => {
    const { data, error } = await supabase.from('audit_logs').select('*, profiles(first_name, last_name)');
    if (error) throw error;
    return data.map(l => ({ ...l, user_name: l.profiles ? `${l.profiles.first_name} ${l.profiles.last_name}` : 'Unknown' }));
  },

  // Governance
  getGovernanceStats: async () => {
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: activeRoles } = await supabase.from('roles').select('*', { count: 'exact', head: true });
    const { count: pendingRequests } = await supabase.from('permission_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
    
    const { data: profiles } = await supabase.from('profiles').select('status, roles(name)');
    const suspendedCount = profiles?.filter(p => p.status === 'Suspended').length || 0;
    
    const distribution: Record<string, number> = {};
    profiles?.forEach(p => {
      const roleName = p.roles?.name || 'Unknown';
      distribution[roleName] = (distribution[roleName] || 0) + 1;
    });

    return {
      total_users: totalUsers,
      active_roles: activeRoles,
      pending_requests: pendingRequests,
      suspended_users: suspendedCount,
      role_distribution: Object.entries(distribution).map(([role, count]) => ({ role, count }))
    };
  },
  bulkUpdateUserStatus: async (userIds: string[], status: string, adminId?: string) => {
    const { error } = await supabase.from('profiles').update({ status }).in('id', userIds);
    if (error) throw error;
    
    if (adminId) {
      await supabase.from('audit_logs').insert(userIds.map(id => ({
        user_id: adminId,
        action: `Bulk update status to ${status}`,
        entity_type: 'User',
        entity_id: 0,
        details: `Updated user profile ${id}`
      })));
    }
    return { success: true };
  },
  getGovernanceUsers: async () => {
    const { data, error } = await supabase.from('profiles').select('*, roles(name)');
    if (error) throw error;
    return data.map(u => ({ ...u, role_name: u.roles?.name }));
  },
  createGovernanceUser: async (data: any, adminId?: string) => {
    const { email, password, first_name, last_name, role_id, property_scope } = data;
    
    // 1. Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // 2. Update the profile with the correct role and scope
    // The trigger handle_new_user already created a profile, but with default role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role_id,
        property_scope
      })
      .eq('id', authData.user.id);

    if (profileError) throw profileError;

    if (adminId) {
      await supabase.from('audit_logs').insert({
        user_id: adminId,
        action: 'Created user',
        entity_type: 'User',
        entity_id: 0 // No numeric ID for profiles
      });
    }

    return { id: authData.user.id };
  },
  updateGovernanceUser: async (id: string, data: any, adminId?: string) => {
    const { error } = await supabase.from('profiles').update(data).eq('id', id);
    if (error) throw error;
    
    if (adminId) {
      await supabase.from('audit_logs').insert({
        user_id: adminId,
        action: 'Updated user governance',
        entity_type: 'User',
        entity_id: 0,
        details: `Updated user profile ${id}`
      });
    }
    return { success: true };
  },
  getGovernanceUserDetails: async (id: string) => {
    const [{ data: user, error: userError }, { data: overrides }, { data: activity }] = await Promise.all([
      supabase.from('profiles').select('*, roles(name)').eq('id', id).single(),
      supabase.from('permission_overrides').select('*').eq('user_id', id),
      supabase.from('audit_logs').select('*').eq('user_id', id).order('timestamp', { ascending: false }).limit(5)
    ]);
    
    if (userError) throw userError;
    return { ...user, role_name: user.roles?.name, overrides: overrides || [], activity: activity || [] };
  },
  // Permission Overrides
  updatePermissionOverride: async (userId: string, module: string, action: string, type: 'Grant' | 'Deny' | 'Inherit') => {
    if (type === 'Inherit') {
      const { error } = await supabase.from('permission_overrides').delete().match({ user_id: userId, module, action });
      if (error) throw error;
    } else {
      const { error } = await supabase.from('permission_overrides').upsert({
        user_id: userId,
        module,
        action,
        override_type: type
      });
      if (error) throw error;
    }
    return { success: true };
  },
  getPermissionRequests: async () => {
    const { data, error } = await supabase.from('permission_requests').select('*, profiles!permission_requests_user_id_fkey(first_name, last_name)');
    if (error) throw error;
    return data.map(r => ({ ...r, user_name: r.profiles ? `${r.profiles.first_name} ${r.profiles.last_name}` : 'Unknown' }));
  },
  submitPermissionRequest: async (data: any) => {
    const { error } = await supabase.from('permission_requests').insert(data);
    if (error) throw error;
    return { success: true };
  },
  reviewPermissionRequest: async (id: number, data: any) => {
    const { error } = await supabase.from('permission_requests').update(data).eq('id', id);
    if (error) throw error;
    return { success: true };
  },
  getPermissionMatrix: async () => {
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*, role_permissions(permission_id)');
    if (rolesError) throw rolesError;

    const { data: permissions, error: permsError } = await supabase
      .from('permissions')
      .select('*');
    if (permsError) throw permsError;

    // Flatten role_permissions
    const rolePermissions = roles?.flatMap((r: any) => 
      r.role_permissions?.map((rp: any) => ({
        role_id: r.id,
        permission_id: rp.permission_id
      })) || []
    ) || [];

    return { roles: roles || [], permissions: permissions || [], rolePermissions };
  },
  getSecurityAlerts: async () => {
    // In a real system, these would come from a security scanner or log analyzer
    // For this demo, we'll return some mock alerts based on audit logs
    const { data: profiles } = await supabase.from('profiles').select('email, status').eq('status', 'Locked');
    const alerts = profiles?.map(p => ({
      id: Math.random(),
      type: 'Account Locked',
      risk: 'High',
      description: `Account for ${p.email} has been locked due to repeated failed login attempts.`,
      user: p.email,
      timestamp: new Date().toISOString()
    })) || [];
    
    // Add some static mock alerts for variety
    alerts.push({
      id: 99,
      type: 'Privilege Escalation',
      risk: 'Critical',
      description: 'Unauthorized attempt to modify role permissions detected.',
      user: 'Sarah M.',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    });

    return alerts;
  },
  getSystemRules: async () => {
    const { data: hierarchy } = await supabase.from('role_hierarchy_rules').select(`*, role_a:roles!role_a_id(name), role_b:roles!role_b_id(name)`);
    return {
      password_policy: { min_length: 12, complexity: 'High', rotation_days: 90 },
      mfa_settings: { enforced_roles: ['System Administrator', 'HR Manager', 'Accountant'], optional_roles: ['Property Manager', 'Leasing Agent'] },
      session_settings: { timeout_minutes: 30, auto_logout: true },
      hierarchy_rules: hierarchy?.map(h => ({
        id: h.id,
        type: h.type,
        role_a_id: h.role_a_id,
        role_a_name: (h.role_a as any)?.name,
        role_b_id: h.role_b_id,
        role_b_name: (h.role_b as any)?.name,
        description: h.description
      })) || []
    };
  },
  createHierarchyRule: async (data: any) => {
    const { error } = await supabase.from('role_hierarchy_rules').insert(data);
    if (error) throw error;
    return { success: true };
  },
  deleteHierarchyRule: async (id: number, adminId: string) => {
    const { error } = await supabase.from('role_hierarchy_rules').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
  updatePermissionMatrix: async (data: { role_id: number, permission_id: number, action: 'grant' | 'revoke', admin_id?: string }) => {
    if (data.action === 'grant') {
      await supabase.from('role_permissions').insert({ role_id: data.role_id, permission_id: data.permission_id });
    } else {
      await supabase.from('role_permissions').delete().match({ role_id: data.role_id, permission_id: data.permission_id });
    }
    return { success: true };
  },
  getUserOverrides: async (userId: string) => {
    const { data, error } = await supabase.from('permission_overrides').select('*, permissions(module, action)').eq('user_id', userId);
    if (error) throw error;
    return data.map(o => ({ ...o, module: o.permissions?.module, action: o.permissions?.action }));
  },

  // Asset Management
  async uploadAsset(file: File, userId: string): Promise<{ id: string, url: string }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // 1. Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from('hanti-assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Record in media_assets table
    const { data: asset, error: dbError } = await supabase
      .from('media_assets')
      .insert({
        storage_path: filePath,
        filename: file.name,
        mime_type: file.type,
        size: file.size,
        uploaded_by: userId
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 3. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('hanti-assets')
      .getPublicUrl(filePath);

    return { id: asset.id, url: publicUrl };
  },

  async getAssetUrl(assetId: string): Promise<string> {
    const { data, error } = await supabase
      .from('media_assets')
      .select('storage_path')
      .eq('id', assetId)
      .single();

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('hanti-assets')
      .getPublicUrl(data.storage_path);

    return publicUrl;
  }
};
