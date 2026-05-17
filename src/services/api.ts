import { Property, Unit, Tenant, MaintenanceRequest, FinanceStats, PropertyImage, Owner, Task, Message, PropertyDocument, DocumentTemplate, LegalDocument, DocumentSignature, LeaseTerms, Vendor, WorkOrder, Transaction } from "../types";
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

  async getUnitMaintenanceRequests(unitId: number): Promise<MaintenanceRequest[]> {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('*')
      .eq('unit_id', unitId)
      .order('created_at', { ascending: false });
    if (error && error.code !== 'PGRST116') throw error;
    return data || [];
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
    let query = supabase.from('properties').select('*, owner:owners(first_name, last_name), units(*)');
    
    if (userId) {
      const { data: profile } = await supabase.from('profiles').select('property_scope, owner_id, role:roles(name)').eq('id', userId).single();
      
      const roleName = Array.isArray(profile?.role) ? (profile?.role[0] as any)?.name : (profile?.role as any)?.name;

      if (roleName === 'Property Owner' && profile?.owner_id) {
         query = query.eq('owner_id', profile.owner_id);
      }
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(p => {
      const imageUrl = p.image_url;
      const unitsArray = p.units || [];
      const occupiedUnits = unitsArray.filter((u: any) => u.status === 'Occupied').length;
      const occupancyRate = unitsArray.length > 0 ? (occupiedUnits / unitsArray.length) * 100 : 0;

      return {
        ...p,
        image_url: imageUrl,
        owner_name: p.owner ? `${(p.owner as any).first_name} ${(p.owner as any).last_name}` : undefined,
        unit_count: unitsArray.length,
        occupancy_rate: occupancyRate
      };
    });
  },
  async getProperty(id: number): Promise<Property> {
    const { data, error } = await supabase
      .from('properties')
      .select('*, owner:owners(first_name, last_name, email, phone), units(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    
    const imageUrl = data.image_url;
    const unitsArray = data.units || [];
    const occupiedUnits = unitsArray.filter((u: any) => u.status === 'Occupied').length;
    const occupancyRate = unitsArray.length > 0 ? (occupiedUnits / unitsArray.length) * 100 : 0;

    return {
      ...data,
      image_url: imageUrl,
      owner_name: data.owner ? `${(data.owner as any).first_name} ${(data.owner as any).last_name}` : undefined,
      owner_email: (data.owner as any)?.email,
      owner_phone: (data.owner as any)?.phone,
      unit_count: unitsArray.length,
      occupancy_rate: occupancyRate
    };
  },
  async updateProperty(id: number, data: Partial<Property>, adminId?: string): Promise<{ success: boolean }> {
    const sanitizedData: any = {};
    const validFields = ['name', 'address', 'type', 'image_url', 'image_asset_id', 'property_value', 'owner_id', 'status', 'amenities', 'is_furnished', 'description'];
    
    validFields.forEach(field => {
      if ((data as any)[field] !== undefined) {
        sanitizedData[field] = (data as any)[field];
      }
    });

    const { error } = await supabase.from('properties').update(sanitizedData).eq('id', id);
    if (error) throw error;
    
    if (adminId) {
      await supabase.from('audit_logs').insert({
        user_id: adminId,
        action: `Updated property: ${data.name || 'details'}`,
        entity_type: 'Property',
        entity_id: id
      });
    }
    return { success: true };
  },
  async createProperty(data: Partial<Property>, adminId?: string): Promise<{ id: number }> {
    const sanitizedData: any = {};
    const validFields = ['name', 'address', 'type', 'image_url', 'image_asset_id', 'property_value', 'owner_id', 'status', 'amenities', 'is_furnished', 'description', 'bedrooms', 'bathrooms', 'available_from'];
    
    validFields.forEach(field => {
      if ((data as any)[field] !== undefined) {
        sanitizedData[field] = (data as any)[field];
      }
    });

    const { data: prop, error } = await supabase.from('properties').insert(sanitizedData).select().single();
    if (error) throw error;

    // Create a default unit for the property so it appears in unit-based workflows
    await supabase.from('units').insert({
      property_id: prop.id,
      unit_number: '1', // Default unit number
      rent_amount: (data.property_value || 150000) / 100, // Example default rent mapping if not specified
      status: 'Vacant'
    });

    if (adminId) {
      await supabase.from('audit_logs').insert({
        user_id: adminId,
        action: `Created property: ${prop.name}`,
        entity_type: 'Property',
        entity_id: prop.id
      });
    }
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
  async addPropertyImage(id: number, data: { image_url: string, asset_id?: string }): Promise<{ id: number }> {
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
      if (error.code === 'PGRST205' || error.code === 'PGRST204' || error.code === '42P01') {
        console.warn('property_documents table not found, returning empty array');
        return [];
      }
      throw error;
    }
    return data || [];
  },

  async uploadPropertyDocument(propertyId: number, file: File, data: { name: string, type: string }, userId?: string): Promise<{ success: boolean }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `property-documents/${propertyId}/${fileName}`;

    // 1. Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from('hanti-assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('hanti-assets')
      .getPublicUrl(filePath);

    // 3. Record in media_assets
    const { data: asset, error: assetError } = await supabase.from('media_assets').insert({
      storage_path: filePath,
      filename: file.name,
      mime_type: file.type,
      size: file.size,
      uploaded_by: userId
    }).select().single();

    if (assetError) throw assetError;

    // 4. Record in property_documents
    const { error } = await supabase.from('property_documents').insert({
      property_id: propertyId,
      name: data.name,
      type: data.type,
      url: publicUrl,
      asset_id: asset.id,
      uploaded_by: userId
    });

    if (error) {
      if (error.code === 'PGRST205') {
        throw new Error('Property documents table not found. Please run the migration in the Legal Documents tab.');
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
  async createUnit(data: Partial<Unit>): Promise<{ id: number }> {
    const { data: unit, error } = await supabase.from('units').insert(data).select().single();
    if (error) throw error;
    return { id: unit.id };
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
          id,
          unit_number,
          properties (id, name, address, status)
        ),
        profiles (id)
      `);
    if (error) throw error;
    return data.map((t: any) => ({
      ...t,
      unit_id: t.units?.id,
      unit_number: t.units?.unit_number,
      property_id: t.units?.properties?.id,
      property_name: t.units?.properties?.name,
      property_address: t.units?.properties?.address,
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
    
    const sanitized: any = {};
    const extraData: any = {};
    
    // Core fields we are confident exist in the database (absolute minimum)
    const coreFields = [
      'first_name', 'last_name', 'email', 'phone', 'notes'
    ];

    // Other fields that might be missing in some DB versions
    const potentialFields = [
      'status', 'nationality', 'dob', 'id_type', 'id_number', 'id_expiry_date', 
      'unit_id', 'tenant_id_number', 'occupation', 'employer', 'monthly_income',
      'occupants_count', 'occupant_details', 'preferred_language', 'vehicle_info', 
      'rental_history', 'guarantor_details', 'auto_rent_reminders', 'lease_start', 'lease_end'
    ];

    // Fields that the error confirmed are missing or are high risk
    const highRiskFields = [
      'occupation', 'employer', 'monthly_income', 'occupants_count', 
      'occupant_details', 'preferred_language', 'vehicle_info', 
      'rental_history', 'guarantor_details'
    ];

    const allValidFields = [...coreFields, ...potentialFields];

    allValidFields.forEach(field => {
      if ((tenantData as any)[field] !== undefined) {
        sanitized[field] = (tenantData as any)[field];
      }
    });

    // Ensure ID is NEVER sent during create to avoid pkey constraints if sequence is out of sync
    delete sanitized.id;

    // Bundle high risk fields into notes if they have values
    highRiskFields.forEach(field => {
      if ((tenantData as any)[field] !== undefined) {
        extraData[field] = (tenantData as any)[field];
      }
    });

    if (Object.keys(extraData).length > 0) {
      const extraString = `\n\n--- Onboarding Info ---\n${JSON.stringify(extraData, null, 2)}`;
      sanitized.notes = (sanitized.notes || '') + extraString;
    }

    const { data: tenant, error } = await supabase
      .from('tenants')
      .insert({
        ...sanitized,
        status: sanitized.status || 'Prospective'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Core insert failed, attempting fallback...', error);
      // Fallback: further reduce fields if even potentialFields are missing
      if (error.code === 'PGRST204') {
        const minimalSanitized: any = {};
        coreFields.forEach(field => {
          if ((tenantData as any)[field] !== undefined) {
            minimalSanitized[field] = (tenantData as any)[field];
          }
        });
        delete minimalSanitized.id;
        const { data: fallbackTenant, error: fallbackError } = await supabase
          .from('tenants')
          .insert({
            ...minimalSanitized,
            status: minimalSanitized.status || 'Prospective'
          })
          .select()
          .single();
        if (fallbackError) throw fallbackError;
        return { id: fallbackTenant.id };
      }
      throw error;
    }
    
    // Update unit status
    if (sanitized.unit_id && typeof sanitized.unit_id === 'number') {
      await supabase.from('units').update({ status: 'Occupied' }).eq('id', sanitized.unit_id);
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
    
    const sanitized: any = {};
    
    // Core fields we are confident exist in the database
    const coreFields = [
      'first_name', 'last_name', 'email', 'phone', 'notes'
    ];

    // Other fields that might be missing
    const potentialFields = [
      'status', 'unit_id', 'tenant_id_number', 'occupation', 'employer', 
      'monthly_income', 'occupants_count', 'occupant_details', 'preferred_language', 
      'vehicle_info', 'rental_history', 'guarantor_details', 'auto_rent_reminders',
      'lease_start', 'lease_end', 'nationality', 'dob', 'id_type', 'id_number', 
      'id_expiry_date', 'emergency_contact_name', 'emergency_contact_phone', 
      'emergency_contact_relation'
    ];

    const allValidFields = [...coreFields, ...potentialFields];
    const extraData: any = {};
    const highRiskFields = [
      'occupation', 'employer', 'monthly_income', 'occupants_count', 
      'occupant_details', 'preferred_language', 'vehicle_info', 
      'rental_history', 'guarantor_details'
    ];

    allValidFields.forEach(field => {
      if ((updateData as any)[field] !== undefined) {
        sanitized[field] = (updateData as any)[field];
      }
    });

    // Bundle high risk fields into notes if they have values
    highRiskFields.forEach(field => {
      if ((updateData as any)[field] !== undefined) {
        extraData[field] = (updateData as any)[field];
      }
    });

    if (Object.keys(extraData).length > 0) {
      const extraString = `\n\n--- Updated Info ---\n${JSON.stringify(extraData, null, 2)}`;
      sanitized.notes = (sanitized.notes || '') + extraString;
    }

    // Explicitly handle fields that might be JSON or blobs
    if (sanitized.occupant_details && typeof sanitized.occupant_details !== 'string') {
      sanitized.occupant_details = JSON.stringify(sanitized.occupant_details);
    }

    const { error } = await supabase.from('tenants').update(sanitized).eq('id', id);
    
    if (error) {
      if (error.code === 'PGRST204') {
        // Fallback: further reduce fields
        const minimalSanitized: any = {};
        coreFields.forEach(field => {
          if ((updateData as any)[field] !== undefined) {
            minimalSanitized[field] = (updateData as any)[field];
          }
        });
        const { error: fallbackError } = await supabase.from('tenants').update(minimalSanitized).eq('id', id);
        if (fallbackError) throw fallbackError;
      } else {
        throw error;
      }
    }

    if (admin_id) {
      await supabase.from('audit_logs').insert({
        user_id: admin_id,
        action: 'Updated tenant profile',
        entity_type: 'Tenant',
        entity_id: id
      });
    }
    return { success: true };
  },

  // HantiMaster Workflow Engine Methods
  async getOperationalProperties(): Promise<Property[]> {
    // Broaden search to include various statuses that might still be leasable or newly created
    const { data, error } = await supabase
      .from('properties')
      .select('*, owner:owners(first_name, last_name), units(*)')
      .or('status.is.null,status.in.("Vacant","Future Available","Operational","For Sale","Active")');
    
    if (error) throw error;
    return (data || []).map(p => {
      const unitsArray = p.units || [];
      return {
        ...p,
        owner_name: p.owner ? `${(p.owner as any).first_name} ${(p.owner as any).last_name}` : undefined,
        unit_count: unitsArray.length,
      };
    });
  },

  async validateLeaseEligibility(propertyId: number, tenantId: number, startDate: string, unitId?: number): Promise<{ eligible: boolean, message?: string }> {
    try {
      // 1. Technical Guard
      if (!propertyId || isNaN(propertyId)) {
        console.error('validateLeaseEligibility: Invalid propertyId', propertyId);
        return { eligible: false, message: 'Technical Error: Invalid Property Identifier provided.' };
      }

      // 2. Verify Tenant Status & Existence
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, first_name, last_name, status')
        .eq('id', tenantId)
        .maybeSingle();
      
      if (tenantError) throw tenantError;
      if (!tenant) return { eligible: false, message: 'Tenant profile not found. Please verify the tenant selection.' };
      
      const restrictedTenantStatuses = ['Evicted', 'Terminated', 'Archived'];
      if (restrictedTenantStatuses.includes(tenant.status || '')) {
        return { eligible: false, message: `Tenant status is "${tenant.status}". Leases cannot be created for ${tenant.status?.toLowerCase()} profiles.` };
      }

      // 3. Verify Property Existence & Baseline status
      let propertyData: any = null;
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('id, status, available_from, name')
        .eq('id', propertyId)
        .maybeSingle();
      
      if (propertyError) {
        // Fallback if available_from is missing (migration error)
        if (propertyError.code === '42703') {
           const { data: retryData, error: retryError } = await supabase
            .from('properties')
            .select('id, status, name')
            .eq('id', propertyId)
            .maybeSingle();
           if (retryError) throw retryError;
           propertyData = retryData;
        } else {
          throw propertyError;
        }
      } else {
        propertyData = property;
      }
      
      if (!propertyData) {
        console.error(`Property lookup failed for ID: ${propertyId}`);
        return { eligible: false, message: 'Property not found in the portfolio database. Please refresh select lists.' };
      }

      // 4. Block by Property Global Status (Infrastructure level)
      const infrastructureBlockedStatuses = ['Under Renovation', 'Unavailable', 'Archived'];
      if (propertyData.status && infrastructureBlockedStatuses.includes(propertyData.status) && !unitId) {
        return { eligible: false, message: `The entire property "${propertyData.name}" is currently ${propertyData.status.toLowerCase()} and cannot be leased.` };
      }

      // 4.1 Future Availability Logic (Property level)
      if (propertyData.status === 'Future Available' && propertyData.available_from) {
        if (new Date(startDate) < new Date(propertyData.available_from)) {
          return { 
            eligible: false, 
            message: `Property "${propertyData.name}" is only available from ${new Date(propertyData.available_from).toLocaleDateString()}. Please adjust lease start date.` 
          };
        }
      }

      // 5. Unit-Specific Commercial Validity
      if (unitId) {
        const { data: unit, error: unitError } = await supabase
          .from('units')
          .select('id, status, unit_number, rent_amount')
          .eq('id', unitId)
          .maybeSingle();
        
        if (unitError) throw unitError;
        if (!unit) return { eligible: false, message: 'The specified unit could not be located.' };

        // Industry Standard: If unit is occupied, check if it has a pending move-out
        if (unit.status === 'Occupied') {
          // Check if there is an active tenant that is supposed to end before our start date
          const { data: currentLease } = await supabase
            .from('tenants')
            .select('lease_end')
            .eq('unit_id', unitId)
            .gte('lease_end', new Date().toISOString())
            .maybeSingle();
          
          if (currentLease && new Date(currentLease.lease_end) > new Date(startDate)) {
             return { 
                eligible: false, 
                message: `Unit ${unit.unit_number} is currently occupied until ${new Date(currentLease.lease_end).toLocaleDateString()}. Date conflict detected.` 
             };
          }
        }
      }

      // 6. Maintenance Health Check (Operational Blocking)
      const { data: maintenance } = await supabase
        .from('maintenance_requests')
        .select('id, title, priority')
        .eq('property_id', propertyId)
        .in('status', ['Open', 'In Progress'])
        .eq('priority', 'Emergency') // Only block for emergency issues at eligibility stage
        .maybeSingle();
      
      if (maintenance) {
        return { eligible: false, message: `Operational Block: Ongoing emergency maintenance (${maintenance.title}) must be resolved prior to leasing.` };
      }

      // 7. Duplicate Lease prevention (Relational Integrity) 
      // Ensure the tenant doesn't already have an active lease (Optional depending on business rules, but usually one lease per tenant)
      const { data: duplicateLease } = await supabase
        .from('tenants')
        .select('id, unit_id')
        .eq('id', tenantId)
        .eq('status', 'Active')
        .maybeSingle();
      
      if (duplicateLease && duplicateLease.unit_id) {
        // If they already have an active unit, we might want to warn or block
        // return { eligible: false, message: 'This tenant already has an active tenancy in this system.' };
      }

      return { eligible: true };
    } catch (err) {
      console.error('Eligibility Engine Failure:', err);
      return { eligible: false, message: 'The eligibility engine encountered a processing error. Please contact system administrator.' };
    }
  },

  async createTenancyWorkflow(terms: LeaseTerms, creatorId: string): Promise<{ lease_id: number }> {
    // 1. Generate the Legal Document (Tenancy Agreement)
    const { id: docId } = await this.createLegalDocument({
      template_id: terms.is_commercial ? 2 : 1, // Assume 1 is Residential, 2 is Commercial
      property_id: terms.property_id,
      unit_id: terms.unit_id,
      tenant_id: terms.tenant_id,
      title: `${terms.is_commercial ? 'Commercial' : 'Residential'} Lease - ${new Date().toLocaleDateString()}`,
      placeholders_data: {
        date: new Date().toLocaleDateString(),
        reference_no: `LEASE-${Math.random().toString(36).substring(7).toUpperCase()}`,
        lease_start: terms.start_date,
        lease_end: terms.end_date,
        rent_amount: terms.rent_amount.toString(),
        security_deposit: terms.security_deposit.toString(),
        late_fee: terms.late_fee.toString(),
        grace_period: terms.grace_period.toString(),
        notice_period: terms.notice_period.toString(),
        pet_policy: terms.pet_policy,
        smoking_policy: terms.smoking_policy,
        landlord_utilities: terms.utilities_landlord.join(', '),
        tenant_utilities: terms.utilities_tenant.join(', '),
        payment_method: terms.payment_methods.join(', '),
        payment_day: terms.payment_day.toString(),
        inventory_status: terms.furnished ? 'Furnished' : 'Unfurnished',
        // Add more mapping as needed...
      },
      status: 'Draft',
      created_by: creatorId,
      version: 1
    });

    // 2. Update Property Status to "Reserved" or "Occupied" depending on start date
    const now = new Date();
    const start = new Date(terms.start_date);
    const newStatus = start <= now ? 'Occupied' : 'Reserved';
    
    await this.updateProperty(terms.property_id, { status: newStatus }, creatorId);

    // 2.1 Update Tenant Status to "Active" and link unit
    await supabase.from('tenants').update({ 
      status: 'Active', 
      unit_id: terms.unit_id 
    }).eq('id', terms.tenant_id);

    // 2.2 Financial Ledger Initialization (Auditability Foundation)
    // Create initial Rent Charge
    await this.createTransaction({
      tenant_id: terms.tenant_id,
      property_id: terms.property_id,
      amount: terms.rent_amount,
      type: 'Charge',
      category: 'Rent',
      status: 'Completed',
      description: `Initial Rent Charge - Lease ${terms.start_date} to ${terms.end_date}`,
      transaction_date: now.toISOString().split('T')[0]
    });

    // Create Security Deposit Charge
    if (terms.security_deposit > 0) {
      await this.createTransaction({
        tenant_id: terms.tenant_id,
        property_id: terms.property_id,
        amount: terms.security_deposit,
        type: 'Charge',
        category: 'Security Deposit',
        status: 'Completed',
        description: 'Security Deposit Requirement',
        transaction_date: now.toISOString().split('T')[0]
      });
    }

    // 3. Create Related Workflow Actions (Tasks)
    const workflowTasks = [
      { title: 'Inventory Checklist Verification', assignee: 'Leasing Agent', due_date: terms.start_date, priority: 'High', status: 'Pending' },
      { title: 'Key Handover & Documentation', assignee: 'Property Manager', due_date: terms.start_date, priority: 'High', status: 'Pending' },
      { title: 'Utility Meter Reading (Move-in)', assignee: 'Maintenance Supervisor', due_date: terms.start_date, priority: 'Medium', status: 'Pending' },
      { title: 'Security Deposit Confirmation', assignee: 'Accountant', due_date: now.toISOString().split('T')[0], priority: 'High', status: 'Pending' }
    ];

    for (const task of workflowTasks) {
      await this.createTask(task as any);
    }

    // 4. Generate Related Document Shells
    const relatedDocs = [
      { title: 'Move-in Checklist', template_id: 4 }, // Assume 4 is Checklist
      { title: 'Inventory List', template_id: 4 },
      { title: 'Welcome Package', template_id: 4 }
    ];

    for (const rd of relatedDocs) {
      await this.createLegalDocument({
        ...rd,
        property_id: terms.property_id,
        tenant_id: terms.tenant_id,
        status: 'Draft',
        created_by: creatorId
      });
    }

    return { lease_id: docId };
  },
  async moveOutTenant(id: number, adminId?: string): Promise<{ success: boolean }> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get tenant to find unit and property
    const { data: tenant } = await supabase
      .from('tenants')
      .select('unit_id, lease_end, units(property_id)')
      .eq('id', id)
      .single();
    
    if (!tenant) throw new Error('Tenant not found');

    // Update lease end
    if (tenant.lease_end > today) {
      await supabase.from('tenants').update({ lease_end: today }).eq('id', id);
    }

    // Update unit status to 'Under Maintenance' for Turnover State (Temporal Integrity)
    await supabase.from('units').update({ status: 'Under Maintenance' }).eq('id', tenant.unit_id);

    // Create a Turnover Automation Task
    await this.createTask({
      title: 'Unit Turnover: Cleaning & Repairs',
      description: `Automated turnover task generated after tenant move-out. Please inspect and restore unit to 'Vacant' status when ready.`,
      unit_id: tenant.unit_id,
      property_id: (tenant.units as any)?.property_id,
      assignee: 'Maintenance Supervisor',
      due_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // 3 days for turnover
      priority: 'Medium',
      status: 'Pending'
    });

    if (adminId) {
      await supabase.from('audit_logs').insert({
        user_id: adminId,
        action: 'Processed move-out & initiated turnover',
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
  async updateMaintenance(id: number, data: Partial<MaintenanceRequest>): Promise<{ success: boolean }> {
    const { error } = await supabase.from('maintenance_requests').update(data).eq('id', id);
    if (error) throw error;
    return { success: true };
  },
  async assignVendorToRequest(requestId: number, vendorId: number): Promise<{ success: boolean }> {
    const { error: reqError } = await supabase
      .from('maintenance_requests')
      .update({ vendor_id: vendorId, status: 'In Progress' })
      .eq('id', requestId);
    
    if (reqError) throw reqError;

    // Create a work order automatically
    await supabase.from('work_orders').insert({
      request_id: requestId,
      vendor_id: vendorId,
      status: 'Sent'
    });

    return { success: true };
  },
  async generateMonthlyRent(): Promise<{ success: boolean, message: string }> {
    try {
      const response = await fetch('/api/admin/generate-rent', {
        method: 'POST'
      });
      const result = await response.json();
      return { 
        success: response.ok, 
        message: result.message || (response.ok ? 'Rent generation triggered successfully' : 'Failed to trigger rent generation') 
      };
    } catch (error) {
      console.error('Error generating rent:', error);
      return { success: false, message: 'Failed to connect to the automated rent engine.' };
    }
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
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, properties(name), units(unit_number)');
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        property_name: t.properties?.name,
        unit_number: t.units?.unit_number
      })) || [];
    } catch (error: any) {
      // Fallback if relationships are missing (migration hasn't run)
      if (error.code === 'PGRST200' || error.message?.includes('relationship')) {
        console.warn('Tasks relationships missing, falling back to simple fetch. Please run the schema migration.');
        const { data, error: simpleError } = await supabase.from('tasks').select('*');
        if (simpleError) throw simpleError;
        return data || [];
      }
      throw error;
    }
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
  
  async getTenantLedger(tenantId: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('transaction_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getCashFlowReport(): Promise<any> {
    try {
      const response = await fetch('/api/reports/cash-flow');
      const result = await response.json();
      if (result.success) return result.data;
      throw new Error(result.error);
    } catch (err) {
      console.error('Failed to fetch cash flow report:', err);
      // Fallback or re-throw
      throw err;
    }
  },

  async getTransactions(limit = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, tenants(first_name, last_name)') // Removed properties join to avoid PGRST200 if relationship is missing
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      // Manually enrichment if property_id exists but relationship isn't established in Supabase schema cache
      if (data && data.length > 0) {
        const propertyIds = [...new Set(data.map(tx => tx.property_id).filter(Boolean))];
        if (propertyIds.length > 0) {
          const { data: properties } = await supabase
            .from('properties')
            .select('id, name')
            .in('id', propertyIds);
          
          if (properties) {
            return data.map(tx => ({
              ...tx,
              properties: properties.find(p => p.id === tx.property_id)
            }));
          }
        }
      }
      
      return data || [];
    } catch (err) {
      console.error('Error fetching transactions:', err);
      // Return empty instead of crashing if the table itself is missing
      return [];
    }
  },

  async createTransaction(data: any): Promise<{ id: number }> {
    const { data: tx, error } = await supabase.from('transactions').insert(data).select().single();
    if (error) throw error;
    return { id: tx.id };
  },

  async getVendors(): Promise<any[]> {
    const { data, error } = await supabase.from('vendors').select('*').order('company_name');
    if (error) throw error;
    return data || [];
  },

  async createVendor(data: any): Promise<{ id: number }> {
    const { data: vendor, error } = await supabase.from('vendors').insert(data).select().single();
    if (error) throw error;
    return { id: vendor.id };
  },

  async getWorkOrders(filters?: { vendor_id?: number, status?: string }): Promise<any[]> {
    let query = supabase.from('work_orders').select('*, vendors(company_name), maintenance_requests(title, priority)');
    if (filters?.vendor_id) query = query.eq('vendor_id', filters.vendor_id);
    if (filters?.status) query = query.eq('status', filters.status);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createWorkOrder(data: any): Promise<{ id: number }> {
    const { data: wo, error } = await supabase.from('work_orders').insert(data).select().single();
    if (error) throw error;
    return { id: wo.id };
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
    const { data, error } = await supabase.from('profiles').select('*, role:roles(name)').eq('id', userId).single();
    if (error) throw error;
    
    const roleName = Array.isArray(data.role) ? (data.role[0] as any)?.name : (data.role as any)?.name;
    const avatarUrl = data.avatar_url;

    return { ...data, role_name: roleName, avatar_url: avatarUrl };
  },
  getUsers: async () => {
    const { data, error } = await supabase.from('profiles').select('*, role:roles(name)');
    if (error) throw error;
    return (data || []).map(u => {
      const roleName = Array.isArray(u.role) ? (u.role[0] as any)?.name : (u.role as any)?.name;
      const avatarUrl = u.avatar_url;
      return { ...u, role_name: roleName, avatar_url: avatarUrl };
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
  },

  // Legal Documents & Templates
  async getDocumentTemplates(): Promise<DocumentTemplate[]> {
    const { data, error } = await supabase.from('document_templates').select('*').eq('is_active', true);
    if (error) throw error;
    return (data || []).map(t => ({
      ...t,
      placeholders: typeof t.placeholders === 'string' ? JSON.parse(t.placeholders) : (Array.isArray(t.placeholders) ? t.placeholders : [])
    }));
  },

  async getLegalDocuments(filters?: { property_id?: number, tenant_id?: number, owner_id?: number }): Promise<LegalDocument[]> {
    let query = supabase.from('legal_documents').select('*, document_signatures(*)').order('created_at', { ascending: false });
    
    if (filters?.property_id) query = query.eq('property_id', filters.property_id);
    if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
    if (filters?.owner_id) query = query.eq('owner_id', filters.owner_id);

    const { data, error } = await query;
    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return [];
      }
      throw error;
    }
    return (data || []).map((d: any) => ({
      ...d,
      signatures: d.document_signatures,
      placeholders_data: typeof d.placeholders_data === 'string' ? JSON.parse(d.placeholders_data) : (d.placeholders_data || {})
    }));
  },

  async getLegalDocument(id: number): Promise<LegalDocument> {
    const { data, error } = await supabase
      .from('legal_documents')
      .select('*, document_signatures(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return {
      ...data,
      signatures: data.document_signatures,
      placeholders_data: typeof data.placeholders_data === 'string' ? JSON.parse(data.placeholders_data) : (data.placeholders_data || {})
    };
  },

  async createLegalDocument(data: Partial<LegalDocument>): Promise<{ id: number }> {
    const sanitizedData: any = {};
    const validFields = ['template_id', 'property_id', 'unit_id', 'tenant_id', 'owner_id', 'title', 'content_en', 'content_so', 'placeholders_data', 'status', 'version', 'file_url', 'asset_id', 'created_by'];
    
    validFields.forEach(field => {
      if ((data as any)[field] !== undefined) {
        sanitizedData[field] = (data as any)[field];
      }
    });

    // If template_id is provided but content is missing, fetch and process template
    if (sanitizedData.template_id && (!sanitizedData.content_en || !sanitizedData.content_so)) {
      try {
        const { data: template, error: tError } = await supabase
          .from('document_templates')
          .select('*')
          .eq('id', sanitizedData.template_id)
          .maybeSingle(); // Use maybeSingle to avoid throw if not found
        
        if (!tError && template) {
          let enContent = template.content_en;
          let soContent = template.content_so;
          const pData = sanitizedData.placeholders_data || {};
          
          // Simple regex replace for placeholders {{key}}
          Object.keys(pData).forEach(key => {
            const val = pData[key] !== undefined && pData[key] !== null ? String(pData[key]) : '';
            const regex = new RegExp(`{{${key}}}`, 'g');
            enContent = enContent.replace(regex, val);
            soContent = soContent.replace(regex, val);
          });
          
          sanitizedData.content_en = enContent;
          sanitizedData.content_so = soContent;
        }
      } catch (err) {
        console.error('Error processing template during document creation:', err);
      }
    }

    // Default empty content if still missing to satisfy NOT NULL constraint
    if (!sanitizedData.content_en) sanitizedData.content_en = sanitizedData.title || 'Generated Document';
    if (!sanitizedData.content_so) sanitizedData.content_so = sanitizedData.title || 'Dukuminti la soo saaray';

    const { data: doc, error } = await supabase.from('legal_documents').insert(sanitizedData).select().single();
    if (error) {
       console.error('Error in createLegalDocument insert:', error);
       throw error;
    }
    return { id: doc.id };
  },

  async updateLegalDocument(id: number, data: Partial<LegalDocument>): Promise<{ success: boolean }> {
    // Document Versioning Security: Prevent modification of executed documents
    const { data: currentDoc } = await supabase.from('legal_documents').select('status').eq('id', id).maybeSingle();
    
    if (currentDoc && ['Finalized', 'Signed', 'Archived'].includes(currentDoc.status)) {
      if (data.status !== 'Archived') { // Allow archiving even if finalized
        throw new Error(`The document is currently ${currentDoc.status} and cannot be modified to ensure legal integrity.`);
      }
    }

    const sanitizedData: any = {};
    const validFields = ['template_id', 'property_id', 'unit_id', 'tenant_id', 'owner_id', 'title', 'content_en', 'content_so', 'placeholders_data', 'status', 'version', 'file_url', 'asset_id', 'updated_at'];
    
    validFields.forEach(field => {
      if ((data as any)[field] !== undefined) {
        sanitizedData[field] = (data as any)[field];
      }
    });

    const { error } = await supabase.from('legal_documents').update(sanitizedData).eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  async addSignature(data: Partial<DocumentSignature>): Promise<{ success: boolean }> {
    const { error } = await supabase.from('document_signatures').insert(data);
    if (error) throw error;
    return { success: true };
  },

  async getVendorByUserId(userId: string): Promise<Vendor | null> {
    const { data: profile, error: pError } = await supabase
      .from('profiles')
      .select('vendor_id')
      .eq('id', userId)
      .single();
    
    if (pError || !profile?.vendor_id) return null;

    const { data: vendor, error: vError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', profile.vendor_id)
      .single();
    
    if (vError) return null;
    return vendor;
  },

  async getVendorWorkOrders(vendorId: number): Promise<(WorkOrder & { request_title?: string, property_name?: string, unit_number?: string })[]> {
    const { data, error } = await supabase
      .from('work_orders')
      .select('*, maintenance_requests!inner(title, units(unit_number, properties(name)))')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map((wo: any) => ({
      ...wo,
      request_title: wo.maintenance_requests?.title,
      property_name: wo.maintenance_requests?.units?.properties?.name,
      unit_number: wo.maintenance_requests?.units?.unit_number
    }));
  },

  async updateWorkOrder(id: number, data: Partial<WorkOrder>): Promise<{ success: boolean }> {
    const { error } = await supabase.from('work_orders').update(data).eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  async getVendorPayments(vendorId: number): Promise<Transaction[]> {
    // Assuming transactions with category 'Maintenance' and vendor_id (which we might need to add to transactions)
    // For now, let's just get maintenance-related transactions where we can link to vendor via work orders
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('category', 'Maintenance')
      // This is a simplification; in a real app, transactions would have a direct link or be filtered by related work orders
      .order('transaction_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async postMonthlyRent(): Promise<{ processed: number, already_posted: number }> {
    // 1. Get all active tenants
    const { data: tenants, error: tError } = await supabase
      .from('tenants')
      .select('id, unit_id, property_id, rent_amount, first_name, last_name')
      .eq('status', 'Active');
    
    if (tError) throw tError;
    if (!tenants || tenants.length === 0) return { processed: 0, already_posted: 0 };

    const today = new Date();
    const monthYear = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    const firstDayOfMonth = `${monthYear}-01`;

    let processed = 0;
    let already_posted = 0;

    for (const tenant of tenants) {
      if (!tenant.rent_amount) continue;

      // Check if rent already posted this month
      const { data: existing, error: eError } = await supabase
        .from('transactions')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('category', 'Rent')
        .eq('type', 'Charge')
        .gte('transaction_date', firstDayOfMonth)
        .lt('transaction_date', new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0])
        .maybeSingle();

      if (existing) {
        already_posted++;
        continue;
      }

      // Create rent charge
      const { error: iError } = await supabase.from('transactions').insert({
        tenant_id: tenant.id,
        unit_id: tenant.unit_id,
        property_id: tenant.property_id,
        amount: tenant.rent_amount,
        type: 'Charge',
        category: 'Rent',
        status: 'Completed',
        transaction_date: firstDayOfMonth, // Always post on 1st
        description: `Monthly Rent - ${today.toLocaleString('default', { month: 'long', year: 'numeric' })}`
      });

      if (iError) {
        console.error(`Failed to post rent for tenant ${tenant.id}:`, iError);
      } else {
        processed++;
      }
    }

    return { processed, already_posted };
  },

  async createMaintenanceInvoice(requestId: number, vendorId: number, data: { amount: number, description: string, date: string, file_url?: string }): Promise<{ success: boolean }> {
    // 1. Get request details to link to unit/property
    const { data: request, error: rError } = await supabase
      .from('maintenance_requests')
      .select('unit_id, property_id')
      .eq('id', requestId)
      .single();
    
    if (rError) throw rError;

    // 2. Create an expense transaction
    const { error: tError } = await supabase.from('transactions').insert({
      unit_id: request.unit_id,
      property_id: request.property_id,
      amount: data.amount,
      type: 'Charge',
      category: 'Maintenance',
      status: 'Completed',
      transaction_date: data.date,
      description: `Maintenance Invoice: ${data.description}`,
      // Link to vendor (we might need a vendor_id column in transactions, assuming it exists or adding later)
    });

    if (tError) throw tError;

    // 3. Mark the request as completed if not already
    await supabase.from('maintenance_requests').update({ status: 'Completed' }).eq('id', requestId);

    return { success: true };
  },

  async getVaultDocuments(): Promise<any[]> {
    const { data, error } = await supabase
      .from('vault_documents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
       if (error.code === '42P01') return [];
       throw error;
    }
    return data || [];
  },

  async deleteVaultDocument(id: number): Promise<void> {
    const { error } = await supabase.from('vault_documents').delete().eq('id', id);
    if (error) throw error;
  },

  async uploadVaultDocument(file: File, userId: string): Promise<any> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
    const filePath = `vault/${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('assets')
      .getPublicUrl(filePath);

    // AI Analysis simulation - normally we'd call an edge function or Gemini here
    // For this simulation, we'll just insert with "pending" state
    const { data, error } = await supabase
      .from('vault_documents')
      .insert({
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        status: 'Pending',
        ai_suggestions: [
          { type: 'Property', name: 'Villa Sunshine', match: 0.94 },
          { type: 'Tenant', name: 'Ahmed Ali', match: 0.88 }
        ]
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async matchVaultDocument(docId: number, target: { type: string, id: number }): Promise<{ success: boolean }> {
    // 1. Get the vault document
    const { data: vaultDoc, error: vError } = await supabase
      .from('vault_documents')
      .select('*')
      .eq('id', docId)
      .single();
    
    if (vError) throw vError;

    // 2. Create the appropriate record (PropertyDocument, etc.)
    if (target.type === 'Property') {
      await supabase.from('property_documents').insert({
        property_id: target.id,
        name: vaultDoc.file_name,
        file_url: vaultDoc.file_url,
        doc_type: 'Legal'
      });
    }

    // 3. Delete from vault
    await supabase.from('vault_documents').delete().eq('id', docId);

    return { success: true };
  },

  async createExpenseTransaction(data: {
    amount: number,
    category: string,
    vendor_id?: number,
    transaction_date: string,
    description: string,
    property_id?: number
  }): Promise<{ success: boolean }> {
    const { error: tError } = await supabase.from('transactions').insert({
      amount: data.amount,
      type: 'Charge',
      category: data.category,
      status: 'Completed',
      transaction_date: data.transaction_date,
      description: data.description,
      property_id: data.property_id,
      metadata: data.vendor_id ? { vendor_id: data.vendor_id } : {}
    });

    if (tError) throw tError;
    return { success: true };
  },

  async getRentRoll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        units (
          unit_number,
          properties (name)
        )
      `)
      .order('last_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async seedTemplates(): Promise<void> {
    const templates = [
      {
        category: 'Lease',
        name_en: 'Residential Tenancy Agreement',
        name_so: 'Heshiiska Kirada Guriga',
        content_en: `# RESIDENTIAL TENANCY AGREEMENT

**DATE:** {{date}}
**TENANCY REFERENCE:** {{reference_no}}

### 1. THE PARTIES
This Residential Tenancy Agreement is entered into by:
**THE LANDLORD:** {{landlord_name}}
**THE TENANT:** {{tenant_name}}
**AUTHORIZED OCCUPANTS:** {{occupants_list}}

### 2. THE PROPERTY
The Landlord let to the Tenant the property located at:
**ADDRESS:** {{property_address}}
**UNIT/SUITE:** {{unit_number}}
**INVENTORY STATUS:** {{inventory_status}} (Furnished/Unfurnished)

### 3. TERM & DURATION
The tenancy shall be for a fixed term of **{{lease_duration}} months**, commencing on **{{lease_start}}** and terminating on **{{lease_end}}**.
Upon expiry, the parties may negotiate a renewal or the tenancy may convert to a month-to-month basis as per local laws.

### 4. RENT & PAYMENTS
* **Monthly Base Rent:** \${{rent_amount}}
* **Payment Due Date:** On or before the {{payment_day}} day of each calendar month.
* **Late Fee:** A late fee of \${{late_fee}} shall apply if rent is not received within {{grace_period}} days of the due date.
* **Preferred Payment Method:** {{payment_method}}

### 5. SECURITY DEPOSIT
The Tenant shall pay a Security Deposit of **\${{security_deposit}}** upon signing. This deposit will be held by the Landlord as security for the performance of the Tenant's obligations and will be refunded within {{return_days}} days of termination, less any deductions for unpaid rent or damages beyond normal wear and tear.

### 6. UTILITIES & SERVICES
* **Landlord Responsibility:** {{landlord_utilities}} (e.g., Water, Waste Management)
* **Tenant Responsibility:** {{tenant_utilities}} (e.g., Electricity, Internet, Gas)

### 7. MAINTENANCE & REPAIRS
* **Tenant Duties:** Keep premises clean, sanitary, and in good condition. Report any defects immediately.
* **Landlord Duties:** Maintain structural integrity, exterior, and essential services (plumbing, wiring, HVAC).
* **Emergency Access:** The Landlord may enter without notice in case of emergency. For routine inspections, {{notice_for_entry}} hours notice will be given.

### 8. RULES & CONDUCT
* **Subletting:** Prohibited without written Landlord consent.
* **Pets:** {{pet_policy}}
* **Smoking:** {{smoking_policy}}
* **Noises:** Tenant shall not disturb the peace of neighbors.

### 9. TERMINATION & NOTICES
Either party may terminate this agreement by providing **{{notice_period}} days** written notice before the end of the term.

### 10. GOVERNING LAW
This agreement shall be governed by and construed in accordance with the Laws of the Federal Republic of Somalia.

**SIGNATURES:**

**Landlord/Agent:** ________________________  Date: __________

**Tenant:** ________________________  Date: __________`,
        content_so: `# HESHIISKA KIRADA GURIGA (DEEGAANKA)

**TAARIIKHDA:** {{date}}
**TIXRAACA:** {{reference_no}}

### 1. DHINACYADA HESHIISKA
Heshiiskan waxaa kal saxiixday:
**MULKIILAHA:** {{landlord_name}}
**KIREYSTAHA:** {{tenant_name}}
**DADKA DEGEN:** {{occupants_list}}

### 2. HANTIDA / GURIGA
Mulkiiluhu wuxuu u kireeyay Kireystaha guriga ku yaal:
**CINWAANKA:** {{property_address}}
**LAMBARKA GURIGA:** {{unit_number}}
**XAALADDA GURIGA:** {{inventory_status}} (Qalabaysan/Aan qalabaysnayn)

### 3. MUDDADA HESHIISKA
Heshiiska kiradu waa mid go'an oo socon doona muddo **{{lease_duration}} bilood ah**, oo ka bilaabanaysa **{{lease_start}}** kuna dhammaanaysa **{{lease_end}}**.

### 4. KIRADA & LACAG BIXINTA
* **Kirada Bishii:** \${{rent_amount}}
* **Xilliga Lacag-bixinta:** Maalinta {{payment_day}} ee bil kasta.
* **Ganaaxa Dib-u-dhaca:** Ganaax dhan \${{late_fee}} ayaa lagu soo rogi doonaa haddii kirada la waayo {{grace_period}} maalmood gudahood.
* **Habka Lacag-bixinta:** {{payment_method}}

### 5. DHIBOOMADKA (DEPOSIT)
Kireystuhu waa inuu bixiyo dhiboomad dhan **\${{security_deposit}}**. Lacagtan waxaa loo hayn doonaa dammaanad ahaan, waxaana lagu soo celin doonaa {{return_days}} maalmood gudahood marka guriga laga guuro, marka laga reebo wixii khasaare ah ama kire aan la bixin.

### 6. ADEEGYADA (BIYAHA & KONTOROOLKA)
* **Mas'uuliyadda Mulkiilaha:** {{landlord_utilities}}
* **Mas'uuliyadda Kireystaha:** {{tenant_utilities}}

### 7. DAYACTIRKA
* **Kireystaha:** Waa inuu guriga u hayo si nadiif ah oo nidaamsan.
* **Mulkiilaha:** Waxaa mas'uul ka yahay dhismaha iyo nidaamyada waaweyn (tuubooyinka, korontada).
* **Gelitaanka Guriga:** Mulkiiluhu wuxuu geli karaa guriga ogeysiis {{notice_for_entry}} saacadood ah ka dib.

### 8. XEERARKA GURIGA
* **Kireynta kale:** Reebban iyada oo aan oggolaansho qoraal ah laga helin.
* **Xayawaanka:** {{pet_policy}}
* **Sigaar-cabidda:** {{smoking_policy}}

### 9. JOOJINTA HESHIISKA
Labadaba dhinac waxay joojin karaan heshiiska iyagoo bixinaya ogeysiis qoraal ah oo {{notice_period}} maalmood ah.

### 10. SHARCIGA LAGU DHAQMAYO
Heshiiskan waxaa lagu maamuli doonaa sharciyada Jamhuuriyadda Federaalka Soomaaliya.

**SAXIIXADA:**

**Mulkiilaha:** ________________________  Taariikh: __________

**Kireystaha:** ________________________  Taariikh: __________`,
        placeholders: ['date', 'reference_no', 'landlord_name', 'tenant_name', 'occupants_list', 'property_address', 'unit_number', 'inventory_status', 'lease_duration', 'lease_start', 'lease_end', 'rent_amount', 'payment_day', 'late_fee', 'grace_period', 'payment_method', 'security_deposit', 'return_days', 'landlord_utilities', 'tenant_utilities', 'notice_for_entry', 'notice_period', 'pet_policy', 'smoking_policy']
      },
      {
        category: 'Lease',
        name_en: 'Commercial Lease Agreement',
        name_so: 'Heshiiska Kirada Ganacsiga',
        content_en: `# COMMERCIAL LEASE AGREEMENT

**DATE:** {{date}}
**LEASE REFERENCE:** {{reference_no}}

### 1. PARTIES
**THE LANDLORD:** {{landlord_name}}
**THE TENANT:** {{business_name}} (Represented by {{tenant_name}})
**REGISTRATION/TIN:** {{registration_number}}

### 2. THE PREMISES
The Landlord hereby leases to the Tenant the commercial space located at:
**ADDRESS:** {{property_address}}
**SQ FOOTAGE/METERS:** {{total_area}}
**PARCEL/PLOT:** {{parcel_number}}

### 3. TERM & RENEWAL
* **Initial Term:** {{lease_duration}} years, commencing on {{lease_start}} and expiring on {{lease_end}}.
* **Option to Renew:** The Tenant has the option to renew for an additional {{renewal_term}} years by providing written notice at least {{notice_days}} days before expiry.

### 4. RENT & ESCALATION
* **Initial Monthly Rent:** \${{rent_amount}}
* **Annual Escalation:** The rent shall increase by {{rent_escalation_pc}}% on each anniversary of the commencement date.
* **Triple Net (NNN) Obligations:** Tenant is responsible for {{tenant_extra_costs}} (Property Taxes, Insurance, Maintenance).

### 5. USE & PERMITTED ACTIVITY
The Premises shall be used exclusively for: **{{business_activity}}**. The Tenant shall obtain all necessary business licenses and permits required by local authorities in Somalia.

### 6. FIXTURES & ALTERATIONS
The Tenant may install trade fixtures provided they do not damage the structure. Any significant structural alterations require written Landlord approval and must comply with Somalia construction standards.

### 7. MAINTENANCE & UTILITIES
* **Landlord:** Responsible for structural integrity, roof, and exterior walls.
* **Tenant:** Responsible for interior systems, HVAC, plumbing fixtures, and all utilities including {{utilities_list}}.

### 8. INSURANCE & INDEMNIFICATION
Tenant shall maintain Commercial General Liability insurance of at least \${{insurance_amount}}. Tenant agrees to indemnify and hold Landlord harmless from any claims arising from Tenant's use of the premises.

### 9. DEFAULT & TERMINATION
* **Grace Period:** {{default_days}} days for rent payments.
* **Default:** If default occurs, Landlord may re-enter the premises, change locks, and pursue legal remedies as per the Laws of the Federal Republic of Somalia.

### 10. GOVERNING LAW
Any disputes arising from this agreement shall be settled through arbitration in Mogadishu, Somalia.

**SIGNATURES:**

**Landlord:** ________________________  Date: __________

**Tenant:** ________________________  Date: __________ (Official Seal)`,
        content_so: `# HESHIISKA KIRADA GANACSIGA

**TAARIIKHDA:** {{date}}
**TIXRAACA:** {{reference_no}}

### 1. DHINACYADA HESHIISKA
**MULKIILAHA:** {{landlord_name}}
**KIREYSTAHA:** {{business_name}} (Waxaana matalaya {{tenant_name}})
**LAMBARKA DIIWAANGELINTA/TIN:** {{registration_number}}

### 2. DHISMAHA / GOOBTA
Mulkiiluhu wuxuu u kireeyay Kireystaha goobta ganacsiga ee ku taal:
**CINWAANKA:** {{property_address}}
**MUDDADA DHISMAHA:** {{total_area}}
**LAMBARKA BOOSKA:** {{parcel_number}}

### 3. MUDDADA & CUSBOONAYSIINTA
* **Muddada Hore:** {{lease_duration}} sano, oo ka bilaabanaysa {{lease_start}} kuna dhammaanaysa {{lease_end}}.
* **Ikhtiyaarka Cusboonaysiinta:** Kireystuhu wuxuu xaq u leeyahay inuu cusboonaysiiyo muddo {{renewal_term}} sano ah haddii uu bixiyo ogeysiis {{notice_days}} maalmood ka hor dhammaadka.

### 4. KIRADA & KORDHINTA
* **Kirada Bishii:** \${{rent_amount}}
* **Kordhinta Sannadlaha ah:** Kirada waxaa lagu kordhin doonaa {{rent_escalation_pc}}% sannad kasta.
* **Mas'uuliyadaha Dheeraadka ah:** Kireystaha ayaa mas'uul ka ah {{tenant_extra_costs}} (Canshuurta, Caymiska, iyo Dayactirka).

### 5. ISTICMAALKA GOOBTA
Goobta waxaa loo isticmaali doonaa oo kaliya: **{{business_activity}}**. Kireystuhu waa inuu haystaa dhammaan liisammada ganacsi ee looga baahan yahay dalka.

### 6. WAX KA BEDDELKA DHISMAHA
Kireystaha ma samayn karo wax beddel dhismeed ah isaga oo aan ogolaansho qoraal ah ka helin mulkiilaha. Qalabka ganacsiga ee lagu rakibo waa inaanu waxyeello u geysan dhismaha rasmiga ah.

### 7. DAYACTIRKA & ADEEGYADA
* **Mulkiilaha:** Mas'uul ka ah dhismaha guud, saqafka, iyo darbiyada dibadda.
* **Kireystaha:** Mas'uul ka ah gudaha, tuubooyinka, iyo adeegyada sida {{utilities_list}}.

### 8. CAYMISKA (INSURANCE)
Kireystaha waa inuu haystaa caymiska ganacsiga oo ugu yaraan dhan \${{insurance_amount}}.

### 9. JABINTA HESHIISKA
* **Muddada Sugitaanka:** {{default_days}} maalmood oo loogu talagalay bixinta kirada.
* **Ganaaxa:** Haddii heshiiska la jabiyo, Mulkiiluhu wuxuu xaq u leeyahay inuu dib u la wareego dhismaha.

### 10. SHARCIGA LAGU DHAQMAYO
Wixii khilaaf ah ee ka dhasha heshiiskan waxaa lagu xallin doonaa garoobnimo (arbitration) magaalada Muqdisho.

**SAXIIXADA:**

**Mulkiilaha:** ________________________  Taariikh: __________

**Kireystaha:** ________________________  Taariikh: __________ (Shaabadda shirkadda)`,
        placeholders: ['date', 'reference_no', 'landlord_name', 'business_name', 'tenant_name', 'registration_number', 'property_address', 'total_area', 'parcel_number', 'lease_duration', 'lease_start', 'lease_end', 'renewal_term', 'notice_days', 'rent_amount', 'rent_escalation_pc', 'tenant_extra_costs', 'business_activity', 'utilities_list', 'insurance_amount', 'default_days']
      },
      {
        category: 'Legal',
        name_en: 'Investment Property Management Agreement',
        name_so: 'Heshiiska Maamulka Hantida Maalgashiga',
        content_en: `# INVESTMENT PROPERTY MANAGEMENT AGREEMENT

**DATE:** {{date}}
**AGREEMENT NO:** {{agreement_no}}

### 1. PARTIES
This Agreement is between:
**THE OWNER:** {{owner_name}} (Address: {{owner_address}})
**THE MANAGER:** {{manager_name}} (Hanti Property Management)

### 2. APPOINTMENT OF AGENT
The Owner hereby appoints the Manager as the exclusive agent to manage, lease, and operate the Property located at:
**PROPERTY:** {{property_name}} ({{property_address}})

### 3. RESPONSIBILITIES OF MANAGER
The Manager shall:
* **Leasing:** Advertise vacancies, screen tenants, and execute lease agreements.
* **Financials:** Collect rents, pay expenses, and provide monthly financial reports.
* **Maintenance:** Oversee routine repairs up to a budget of \${{maintenance_threshold}} without prior approval.
* **Legal:** Initiate eviction proceedings if necessary on behalf of the Owner.

### 4. FEES & COMPENSATION
* **Management Fee:** {{management_fee_pc}}% of gross monthly rental income.
* **Leasing Fee:** {{leasing_fee_pc}}% of one month's rent for each new tenant.
* **Administrative Setup:** A one-time fee of \${{setup_fee}}.

### 5. FINANCIAL DISBURSEMENTS
The Manager shall remit the net proceeds to the Owner on or before the {{remittance_day}} of each month via {{payment_method}}.

### 6. TERM & TERMINATION
This agreement shall commence on {{start_date}} and continue for {{term_months}} months. Either party may terminate with {{notice_period}} days written notice.

### 7. INDEMNIFICATION
The Owner agrees to indemnify the Manager from liability for damage or injuries resulting from the condition of the Property, provided the Manager acted in good faith.

### 8. GOVERNING LAW
This agreement is governed by the laws of the Federal Republic of Somalia.

**SIGNATURES:**

**Owner:** ________________________  Date: __________

**Manager:** ________________________  Date: __________`,
        content_so: `# HESHIISKA MAAMULKA HANTIDA MAALGASHIGA

**TAARIIKHDA:** {{date}}
**LAMBARKA HESHIISKA:** {{agreement_no}}

### 1. DHINACYADA HESHIISKA
Heshiiskani wuxuu u dhexeeyaa:
**MULKIILAHA:** {{owner_name}}
**MAAMULAHA:** {{manager_name}} (Hanti Property Management)

### 2. MAGACAABISTA WAKIILKA
Mulkiiluhu wuxuu halkan ku magacaabayaa Maamulaha inuu noqdo wakiilka gaarka ah ee maamulaya, kireynaya, kana shaqaysiinaya hantida ku taal:
**HANTIDA:** {{property_name}} ({{property_address}})

### 3. MAS'UULIYADDA MAAMULAHA
Maamulaha waxaa laga rabaa:
* **Kireynta:** Inuu xayaysiiyo boosaska bannaan, baaro kireystayaasha, oo saxiixo heshiisyada.
* **Maaliyadda:** Inuu soo ururiyo kirada, bixiyo kharashyada, oo soo gudbiyo warbixinnada bishii.
* **Dayactirka:** Inuu kormeero dayactirka ilaa miisaaniyad dhan \${{maintenance_threshold}}.

### 4. KHIDMADDA & MAGDOWGA
* **Khidmadda Maamulka:** {{management_fee_pc}}% ee wadarta kirada bishii.
* **Khidmadda Kireynta:** {{leasing_fee_pc}}% oo kirada bisha koowaad ah kireyste kasta oo cusub.
* **Diyaarinta:** Lacag hal mar ah oo dhan \${{setup_fee}}.

### 5. GUDBINTA LACAGTA
Maamulaha waa inuu lacagta saafiga ah ugu gudbiyaa Mulkiilaha maalinta {{remittance_day}} ee bishii.

### 6. MUDDADA & JOOJINTA
Heshiiskani wuxuu bilaabmayaa {{start_date}} wuxuuna soconayaa {{term_months}} bilood. Labada dhinac waxay ku joojin karaan heshiiska ogeysiis {{notice_period}} maalmood ah.

### 7. SHARCIGA LAGU DHAQMAYO
Heshiiskani wuxuu hoos imaanayaa sharciyada Jamhuuriyadda Federaalka Soomaaliya.

**SAXIIXADA:**

**Mulkiilaha:** ________________________  Taariikh: __________

**Maamulaha:** ________________________  Taariikh: __________`,
        placeholders: ['date', 'agreement_no', 'owner_name', 'owner_address', 'manager_name', 'property_name', 'property_address', 'maintenance_threshold', 'management_fee_pc', 'leasing_fee_pc', 'setup_fee', 'remittance_day', 'payment_method', 'start_date', 'term_months', 'notice_period']
      },
      {
        category: 'Notice',
        name_en: 'Notice of Rent Due',
        name_so: 'Ogeysiiska Lacagta Kirada ah',
        content_en: `# NOTICE OF RENT DUE

**DATE:** {{date}}
**TO:** {{tenant_name}}
**PROPERTY:** {{property_address}}

Dear Tenant,

This is a formal reminder that your rent for the period **{{period}}** is now due.

* **Rent Amount:** \${{amount}}
* **Late Fee (if applicable):** \${{late_fee}}
* **Total Due:** \${{total_amount}}
* **Due Date:** {{due_date}}

Please ensure that payment is made using the authorized payment method ({{payment_method}}). If you have already made this payment, please disregard this notice and provide us with the transaction receipt.

Failure to pay by the due date may result in late fees as per your tenancy agreement.

Sincerely,
Management`,
        content_so: `# OGEYSIISKA LACAGTA KIRADA AH

**TAARIIKHDA:** {{date}}
**KU:** {{tenant_name}}
**GURIGA:** {{property_address}}

Mudane/Marwo,

Kani waa xusuusin rasmi ah oo ku saabsan in kiradii aad ku lahayd muddada **{{period}}** ay hadda tahay mid la bixin karo.

* **Cadadka Kirada:** \${{amount}}
* **Ganaaxa dib-u-dhaca (haddii ay jirto):** \${{late_fee}}
* **Warta guud ee la bixinayo:** \${{total_amount}}
* **Xilliga ugu dambeeya:** {{due_date}}

Fadlan hubi in lacagta lagu bixiyo habka loo oggolaaday ee ah ({{payment_method}}). Haddii aad mar hore bixisay lacagtan, fadlan iska indha tir ogeysiiskan oo noo soo dir rasiidka lacag bixinta.

Bixin la'aanta lacagta waqtigeeda waxay keeni kartaa ganaaxyo sida ku cad heshiiskaaga kirada.

Mahadsanid,
Maamulka`,
        placeholders: ['date', 'tenant_name', 'property_address', 'period', 'amount', 'late_fee', 'total_amount', 'due_date', 'payment_method']
      },
      {
        category: 'Notice',
        name_en: 'Late Payment Notice',
        name_so: 'Ogeysiiska Dib-u-dhaca Lacagta',
        content_en: `# FINAL NOTICE: LATE PAYMENT

**DATE:** {{date}}
**TO:** {{tenant_name}}
**DAYS OVERDUE:** {{days}}

**URGENT:** Your rent payment is severely overdue. Despite previous reminders, we have not received your payment for the period of {{period}}.

* **Principal Amount:** \${{rent_amount}}
* **Accumulated Late Fees:** \${{late_fee}}
* **TOTAL OUTSTANDING:** \${{total_remaining}}

Failure to settle the full balance within **{{grace_period_days}} days** of this notice will result in:
1. Legal action to recover the debt.
2. Commencement of eviction proceedings.
3. Reporting of delinquency to credit authorities.

Please contact the management office immediately at {{contact_phone}} to arrange payment.

Sincerely,
Legal Department`,
        content_so: `# OGEYSIISKA UGU DAMBEEYA: DIB-U-DHACA LACAGTA

**TAARIIKHDA:** {{date}}
**KU:** {{tenant_name}}
**MAALMAHA DIB LOO DHACAY:** {{days}}

**DEGDEG:** Lacag bixinta kiradaadu si xun bay dib u dhacaday. In kasta oo xusuusino hore laguu soo diray, haddana uma aanan helin lacagtaadii muddada {{period}}.

* **Cadadka Kirada:** \${{rent_amount}}
* **Ganaaxa isbiirsaday:** \${{late_fee}}
* **WARTA GUUD EE LAGU LEEYAHAY:** \${{total_remaining}}

Bixin la'aanta warta guud muddo **{{grace_period_days}} maalmood** gudahood ah waxay keeni doontaa:
1. Dacwad sharci ah oo lagu soo celinayo lacagta.
2. Bilaabidda habraaca guriceeriska.
3. In lagu soo wargeliyo hay'adaha ku habboon.

Fadlan si degdeg ah ula xiriir xafiiska maamulka {{contact_phone}} si aad u qabanqaabiso lacag bixinta.

Mahadsanid,
Waaxda Sharciga`,
        placeholders: ['date', 'tenant_name', 'days', 'period', 'rent_amount', 'late_fee', 'total_remaining', 'grace_period_days', 'contact_phone']
      },
      {
        category: 'Financial',
        name_en: 'Rent Receipt',
        name_so: 'Rasiidka Kirada (Boono)',
        content_en: `# OFFICIAL RENT RECEIPT

**RECEIPT NO:** {{receipt_number}}
**DATE:** {{date}}

This is to acknowledge the official receipt of payment from:
**TENANT:** {{tenant_name}}

* **Amount Paid:** \${{amount}}
* **For Period:** {{period}}
* **Property:** {{property_address}}
* **Unit:** {{unit_number}}

**PAYMENT DETAILS:**
* **Method:** {{payment_method}}
* **Reference:** {{reference_number}}
* **Balance Remaining:** \${{balance}}

Thank you for your prompt payment.

Issued by: {{issued_by}}`,
        content_so: `# RASIIDKA KIRADA (BOONO)

**LAMBARKA RASIIDKA:** {{receipt_number}}
**TAARIIKHDA:** {{date}}

Tani waxay caddaynaysaa in lacag laga helay:
**KIREYSTAHA:** {{tenant_name}}

* **Cadadka la bixiyey:** \${{amount}}
* **Muddada:** {{period}}
* **Guriga:** {{property_address}}
* **Lambarka Guriga:** {{unit_number}}

**FAAHFAAHINTA LACAG BIXINTA:**
* **Habka:** {{payment_method}}
* **Tixraaca:** {{reference_number}}
* **Warta hartay:** \${{balance}}

Waad ku mahadsan tahay lacag bixintaada degdegga ah.

Waxaa soo saaray: {{issued_by}}`,
        placeholders: ['receipt_number', 'date', 'tenant_name', 'amount', 'period', 'property_address', 'unit_number', 'payment_method', 'reference_number', 'balance', 'issued_by']
      },
      {
        category: 'Financial',
        name_en: 'Security Deposit Return Statement',
        name_so: 'Bayaanka Soo Celinta Dhiboomadka',
        content_en: `# SECURITY DEPOSIT RETURN STATEMENT

**DATE:** {{date}}
**TO:** {{tenant_name}}
**FORWARDING ADDRESS:** {{forwarding_address}}

### 1. SUMMARY OF ACCOUNT
The following is a breakdown of your security deposit held for the property at **{{property_address}}**, Unit **{{unit_number}}**.

* **Original Deposit Amount:** \${{original_deposit}}
* **Interest Earned (if any):** \${{interest_earned}}
* **TOTAL CREDITS:** \${{total_credits}}

### 2. DEDUCTIONS & CHARGES
* **Unpaid Rent:** \${{unpaid_rent}}
* **Cleaning Fees:** \${{cleaning_charges}}
* **Damages (Beyond Wear & Tear):** \${{damage_charges}}
* **Other Charges ({{other_desc}}):** \${{other_charges}}
* **TOTAL DEDUCTIONS:** \${{total_deductions}}

### 3. FINAL DISPOSITION
* **NET REFUND AMOUNT:** **\${{refund_amount}}**
* **AMOUNT OWED TO LANDLORD (if negative):** \${{amount_owed}}

### 4. EXPLANATION OF DAMAGES
{{damage_explanation}}

### 5. PAYMENT INFORMATION
Your refund check (No: {{check_number}}) is enclosed herewith. Please acknowledge receipt.

**Issued by:** ________________________ (Management)`,
        content_so: `# BAYAANKA SOO CELINTA DHIBOOMADKA (DEPOSIT)

**TAARIIKHDA:** {{date}}
**KU:** {{tenant_name}}

### 1. KOOBIDDA KOONTADA
Kani waa faahfaahinta dhiboomadkii laguu hayay ee guriga **{{property_address}}**, Lambarka **{{unit_number}}**.

* **Cadadka Deposit-ka:** \${{original_deposit}}
* **WARTA GUUD:** \${{total_credits}}

### 2. LACAG-KA-GOOSASHADA
* **Kiro aan la bixin:** \${{unpaid_rent}}
* **Kharashka Nadiifinta:** \${{cleaning_charges}}
* **Waxyeellada Guriga:** \${{damage_charges}}
* **Kharashyo kale ({{other_desc}}):** \${{other_charges}}
* **WARTA LAGA GOOYEY:** \${{total_deductions}}

### 3. GO'AANKA UGU DAMBEEYA
* **NET REFUND (Lacagta lagu soo celinayo):** **\${{refund_amount}}**

**Waxaa soo saaray:** ________________________ (Maamulka)`,
        placeholders: ['date', 'tenant_name', 'forwarding_address', 'property_address', 'unit_number', 'original_deposit', 'interest_earned', 'total_credits', 'unpaid_rent', 'cleaning_charges', 'damage_charges', 'other_desc', 'other_charges', 'total_deductions', 'refund_amount', 'amount_owed', 'damage_explanation', 'check_number']
      },
      {
        category: 'Legal',
        name_en: 'Investment Property Sale Agreement',
        name_so: 'Heshiiska Iibka Hantida Maalgashiga',
        content_en: `# INVESTMENT PROPERTY PURCHASE & SALE AGREEMENT

**DATE:** {{date}}
**PURCHASE REF:** {{purchase_ref}}

### 1. PARTIES
**THE SELLER:** {{seller_name}} (Address: {{seller_address}})
**THE BUYER:** {{buyer_name}} (Address: {{buyer_address}})

### 2. PROPERTY DESCRIPTION
The Seller agrees to sell and the Buyer agrees to buy the investment property located at:
**ADDRESS:** {{property_address}}
**LEGAL DESCRIPTION:** {{legal_description}}
**ZONING:** {{zoning_type}}

### 3. PURCHASE PRICE & FINANCING
* **Total Purchase Price:** \${{purchase_price}}
* **Earnest Money Deposit:** \${{earnest_money}}
* **Balance at Closing:** \${{closing_balance}}
* **Financing Terms:** {{financing_details}}

### 4. DUE DILIGENCE PERIOD
The Buyer shall have {{due_diligence_days}} days to conduct inspections, reviews of leases, and financial audits. Buyer may terminate this agreement if results are unsatisfactory.

### 5. REVENUE & EXPENSE PRORATION
All rental income and operating expenses shall be prorated as of the date of closing. Existing security deposits amounting to \${{total_deposits}} shall be transferred to the Buyer.

### 6. REPRESENTATIONS & WARRANTIES
The Seller represents that:
* They have clear title to the property.
* There are no undisclosed environmental hazards.
* All existing lease agreements are valid and in full force.

### 7. CLOSING DATE
Closing shall take place on or before **{{closing_date}}** at the offices of {{closing_agent}}.

### 8. GOVERNING LAW
This agreement is governed by the laws of the Federal Republic of Somalia.

**SIGNATURES:**

**Seller:** ________________________  Date: __________

**Buyer:** ________________________  Date: __________`,
        content_so: `# HESHIISKA IIBKA HANTIDA MAALGASHIGA

**TAARIIKHDA:** {{date}}

### 1. DHINACYADA HESHIISKA
**IIBIYAHA:** {{seller_name}}
**IBSADAHA:** {{buyer_name}}

### 2. FAAHFAAHINTA HANTIDA
Iibiyaha wuxuu ogolaaday inuu iibiyo, Ibsadaha wuxuu ogolaaday inuu iibsado hantida ku taal:
**CINWAANKA:** {{property_address}}
**FAAHFAAHINTA SHARCIGA AH:** {{legal_description}}

### 3. QIIMAHA IIBKA
* **Qiimaha Guud:** \${{purchase_price}}
* **Lacag dammaanad ah:** \${{earnest_money}}
* **Xilliga kama dambaysta ah:** {{closing_date}}

### 4. SHURUUDAHA KALE
Heshiiskani wuxuu hoos imaanayaa sharciyada Jamhuuriyadda Federaalka Soomaaliya.

**SAXIIXADA:**

**Iibiyaha:** ________________________  Taariikh: __________

**Ibsadaha:** ________________________  Taariikh: __________`,
        placeholders: ['date', 'purchase_ref', 'seller_name', 'seller_address', 'buyer_name', 'buyer_address', 'property_address', 'legal_description', 'zoning_type', 'purchase_price', 'earnest_money', 'closing_balance', 'financing_details', 'due_diligence_days', 'total_deposits', 'closing_date', 'closing_agent']
      },
      {
        category: 'Operational',
        name_en: 'Property Inspection Checklist',
        name_so: 'Liiska Kormeerka Hantida (Checklist)',
        content_en: `# PROPERTY INSPECTION CHECKLIST (MOVE-IN/MOVE-OUT)

**DATE:** {{date}}
**PROPERTY:** {{property_address}}
**UNIT:** {{unit_number}}
**TENANT:** {{tenant_name}}
**INSPECTION TYPE:** {{inspection_type}} (Move-In / Move-Out)

### 1. GENERAL CONDITION
* **Entry/Hallway:** {{entry_status}}
* **Living Room:** {{living_room_status}}
* **Kitchen:** {{kitchen_status}}
* **Bedrooms:** {{bedroom_status}}
* **Bathrooms:** {{bathroom_status}}

### 2. APPLIANCES & SYSTEMS
* **Refrigerator:** {{fridge_status}}
* **Stove/Oven:** {{stove_status}}
* **Water/Plumbing:** {{plumbing_status}}
* **Electrical/Lights:** {{electrical_status}}
* **AC/Heating:** {{hvac_status}}

### 3. WALLS, FLOORS & WINDOWS
* **Paint Condition:** {{paint_status}}
* **Flooring/Carpets:** {{floor_status}}
* **Windows/Locks:** {{window_status}}

### 4. SMOKE DETECTORS & SAFETY
* **Smoke Alarms:** {{smoke_alarm_status}}
* **Keys Provided:** {{keys_issued}}

### 5. NOTES & PHOTOGRAPHS
**COMMENTS:** {{inspection_notes}}
**PHOTOS ATTACHED:** {{photos_attached}} (Yes/No)

### 6. SIGN-OFF
The parties agree that this checklist accurately reflects the condition of the premises as of the date above.

**Tenant Signature:** ____________________
**Manager Signature:** ____________________`,
        content_so: `# LIISKA KORMEERKA HANTIDA (CHECKLIST)

**TAARIIKHDA:** {{date}}
**GURIGA:** {{property_address}}
**TENANT:** {{tenant_name}}

### 1. XAALADDA GUUD
* **Irridda/Hoolka:** {{entry_status}}
* **Fadhiga:** {{living_room_status}}
* **Jikada:** {{kitchen_status}}
* **Qolalka Hurdada:** {{bedroom_status}}
* **Musqulaha:** {{bathroom_status}}

### 2. QALABKA & NIDAAMYADA
* **Talaajadda:** {{fridge_status}}
* **Shooladda:** {{stove_status}}
* **Biyaha/Tuubooyinka:** {{plumbing_status}}
* **Korontada/Nuurka:** {{electrical_status}}

### 3. DARBIYADA & DHULKA
* **Rinjiga:** {{paint_status}}
* **Dabaqa/Roogga:** {{floor_status}}
* **Daaqadaha/Qufulada:** {{window_status}}

### 4. AMNIGA 
* **Hallaashka Qiiqa (Smoke Alarms):** {{smoke_alarm_status}}
* **Furayaasha la bixiyey:** {{keys_issued}}

### 5. SAXIIX
**Kireystaha:** ____________________
**Maamulaha:** ____________________`,
        placeholders: ['date', 'property_address', 'unit_number', 'tenant_name', 'inspection_type', 'entry_status', 'living_room_status', 'kitchen_status', 'bedroom_status', 'bathroom_status', 'fridge_status', 'stove_status', 'plumbing_status', 'electrical_status', 'hvac_status', 'paint_status', 'floor_status', 'window_status', 'smoke_alarm_status', 'keys_issued', 'inspection_notes', 'photos_attached']
      },
      {
        category: 'Lease',
        name_en: 'Lease Renewal Amendment',
        name_so: 'Lifaaqa Cusboonaysiinta Kirada',
        content_en: `# LEASE RENEWAL AMENDMENT

**DATE:** {{date}}
**ORIGINAL LEASE REF:** {{original_lease_ref}}

### 1. PARTIES
This Amendment is made between **{{landlord_name}}** (Landlord) and **{{tenant_name}}** (Tenant) regarding the lease for **{{property_address}}**, Unit **{{unit_number}}**.

### 2. EXTENSION OF TERM
The parties agree to extend the term of the original lease for an additional period of **{{renewal_duration}} months**, starting on **{{new_start_date}}** and expiring on **{{new_end_date}}**.

### 3. MODIFICATION OF RENT
Effective from {{new_start_date}}, the monthly rent shall be adjusted as follows:
* **Current Rent:** \${{old_rent}}
* **New Base Rent:** \${{new_rent}}
* **Payment Terms:** Same as the original lease unless specified: {{rent_notes}}.

### 4. OTHER AMENDMENTS
The following terms are also modified:
* **Security Deposit:** {{deposit_adjustment}}
* **Parking/Utilities:** {{other_modifications}}

### 5. RATIFICATION
All other terms and conditions of the original Lease Agreement remain in full force and effect, except as modified by this Amendment.

**SIGNATURES:**

**Landlord:** ________________________  Date: __________

**Tenant:** ________________________  Date: __________`,
        content_so: `# LIFAAQA CUSBOONAYSIINTA KIRADA (HESHIISKA MUDDO KORDHINTA)

**TAARIIKHDA:** {{date}}
**TIXRAAC-KA HESHIISKII HORE:** {{original_lease_ref}}

### 1. DHINACYADA
Heshiiskani wuxuu u dhexeeyaa **{{landlord_name}}** (Mulkiilaha) iyo **{{tenant_name}}** (Kireystaha) ee ku saabsan guriga **{{property_address}}**, Lambarka **{{unit_number}}**.

### 2. KORDHINTA MUDDADA
Dhinacyadu waxay ku heshiiyeen in mudada heshiiska kireynta la kordhiyo **{{renewal_duration}} bilood**, oo ka bilaabanaysa **{{new_start_date}}** kuna dhammaanaysa **{{new_end_date}}**.

### 3. WAX KA BEDDELKA KIRADA
Laga bilaabo {{new_start_date}}, kirada bishii waxay noqonaysaa:
* **Kiradii Hore:** \${{old_rent}}
* **Kirada Cusub:** \${{new_rent}}

### 4. SHURUUDAHA KALE
Dhammaan shuruudihii kale ee heshiiskii hore sidoodii bay ahaanayaan.

**SAXIIXADA:**

**Mulkiilaha:** ________________________  Taariikh: __________

**Kireystaha:** ________________________  Taariikh: __________`,
        placeholders: ['date', 'original_lease_ref', 'landlord_name', 'tenant_name', 'property_address', 'unit_number', 'renewal_duration', 'new_start_date', 'new_end_date', 'old_rent', 'new_rent', 'rent_notes', 'deposit_adjustment', 'other_modifications']
      },
      {
        category: 'Financial',
        name_en: 'Investment Performance Report',
        name_so: 'Warbixinta Waxqabadka Maalgashiga',
        content_en: `# MONTHLY INVESTMENT PERFORMANCE REPORT

**DATE:** {{date}}
**REPORTING PERIOD:** {{period}}
**PROPERTY:** {{property_name}} ({{property_address}})

### 1. FINANCIAL PERFORMANCE SUMMARY
* **Gross Rental Income:** \${{gross_income}}
* **Operating Expenses:** \${{total_expenses}}
* **Net Operating Income (NOI):** **\${{noi}}**

### 2. INVESTMENT METRICS
* **Capitalization Rate (Cap Rate):** {{cap_rate}}%
* **Cash-on-Cash Return:** {{cash_return}}%
* **Occupancy Rate:** {{occupancy_rate}}%
* **Year-to-Date Growth:** {{ytd_growth}}%

### 3. EXPENSE BREAKDOWN
* **Management Fees:** \${{mgmt_fees}}
* **Maintenance & Repairs:** \${{maint_costs}}
* **Taxes & Insurance:** \${{tax_ins_costs}}
* **Utilities (Owner Paid):** \${{utility_costs}}

### 4. LEASING ACTIVITY
* **New Leases Signed:** {{new_leases}}
* **Renewals:** {{renewals}}
* **Vacancies:** {{vacancies}}

### 5. MARKET ANALYSIS & STRATEGY
**LOCAL MARKET TRENDS:** {{market_trends}}
**MANAGEMENT STRATEGY:** {{strategy_notes}}

### 6. PORTFOLIO MANAGER COMMENTS
{{manager_comments}}

**Prepared by:** {{manager_name}}`,
        content_so: `# WARBIXINTA WAXQABADKA MAALGASHIGA

**TAARIIKHDA:** {{date}}
**MUDDADA:** {{period}}
**HANTIDA:** {{property_name}}

### 1. KOOBIDDA MAALIYADDA
* **Kirada guud ee soo gashay:** \${{gross_income}}
* **Kharashyada bixi:** \${{total_expenses}}
* **Dakhliga Saafiga ah (NOI):** **\${{noi}}**

### 2. TILMAAMAHA MAALGASHIGA
* **Heerka Soo-celinta (Cap Rate):** {{cap_rate}}%
* **Heerka Degenaanshaha:** {{occupancy_rate}}%

### 3. FAAHFAAHINTA KHARASHYADA
* **Khidmadda Maamulka:** \${{mgmt_fees}}
* **Dayactirka:** \${{maint_costs}}
* **Canshuurta & Caymiska:** \${{tax_ins_costs}}

### 4. MAAMULAHA AYAA DIYAARIYEY
{{manager_comments}}
**Magaca:** {{manager_name}}`,
        placeholders: ['date', 'period', 'property_name', 'property_address', 'gross_income', 'total_expenses', 'noi', 'cap_rate', 'cash_return', 'occupancy_rate', 'ytd_growth', 'mgmt_fees', 'maint_costs', 'tax_ins_costs', 'utility_costs', 'new_leases', 'renewals', 'vacancies', 'market_trends', 'strategy_notes', 'manager_comments', 'manager_name']
      }
    ];

    for (const t of templates) {
      const { data: existing } = await supabase.from('document_templates').select('id').eq('name_en', t.name_en).maybeSingle();
      if (existing) {
        await supabase.from('document_templates').update(t).eq('id', existing.id);
      } else {
        await supabase.from('document_templates').insert(t);
      }
    }
  }
};
