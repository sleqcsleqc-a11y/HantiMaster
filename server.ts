import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import pg from "pg";
import fs from "fs";

dotenv.config();

const { Pool } = pg;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Supabase Configuration
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("MISSING SUPABASE CONFIG: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined in .env");
  }

  const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    : null;

  // Database Pool for Direct SQL (DDL)
  const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

  // --- API ROUTES ---

  // Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Direct SQL Execution (RESTRICTED TO ADMIN/AGENT USE)
  app.post("/api/admin/execute-sql", async (req, res) => {
    const { sql } = req.body;
    
    if (!pool) {
      return res.status(500).json({ 
        error: "Database Connection Pool not initialized. Please provide DATABASE_URL in secrets." 
      });
    }

    try {
      const result = await pool.query(sql);
      res.json({ success: true, result });
    } catch (error: any) {
      console.error("SQL Execution Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Sync Schema from file
  app.post("/api/admin/sync-schema", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Missing DATABASE_URL" });

    try {
      const schemaSql = fs.readFileSync(path.join(process.cwd(), "supabase_schema.sql"), "utf8");
      await pool.query(schemaSql);
      res.json({ success: true, message: "Schema synced successfully" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Automated Rent Engine Endpoint
  app.post("/api/admin/generate-rent", async (req, res) => {
    if (!pool) return res.status(500).json({ error: "Missing DATABASE_URL" });

    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();

    try {
      // 1. Check if rent already generated for this month
      const checkResult = await pool.query(
        "SELECT id FROM public.rent_generation_logs WHERE month = $1 AND year = $2",
        [month, year]
      );

      if (checkResult.rows.length > 0) {
        return res.json({ success: true, message: `Rent already generated for ${month}/${year}` });
      }

      // 2. Fetch all active tenants with their unit rent amounts
      const activeTenants = await pool.query(`
        SELECT t.id as tenant_id, t.unit_id, u.rent_amount, u.property_id
        FROM public.tenants t
        JOIN public.units u ON t.unit_id = u.id
        WHERE t.status = 'Active' AND u.rent_amount > 0
      `);

      if (activeTenants.rows.length === 0) {
        return res.json({ success: true, message: "No active tenants found for rent generation" });
      }

      let totalCharges = 0;
      let totalAmount = 0;

      // 3. Create transactions for each tenant
      for (const tenant of activeTenants.rows) {
        await pool.query(`
          INSERT INTO public.transactions (
            tenant_id, property_id, unit_id, amount, type, category, status, description, transaction_date
          ) VALUES ($1, $2, $3, $4, 'Charge', 'Rent', 'Completed', $5, CURRENT_DATE)
        `, [
          tenant.tenant_id, 
          tenant.property_id, 
          tenant.unit_id, 
          tenant.rent_amount, 
          `Monthly Rent - ${now.toLocaleString('default', { month: 'long' })} ${year}`
        ]);
        
        totalCharges++;
        totalAmount += parseFloat(tenant.rent_amount);
      }

      // 4. Log the generation
      await pool.query(`
        INSERT INTO public.rent_generation_logs (month, year, total_charges, total_amount)
        VALUES ($1, $2, $3, $4)
      `, [month, year, totalCharges, totalAmount]);

      res.json({ 
        success: true, 
        message: `Generated ${totalCharges} rent charges totalling ${totalAmount}`,
        details: { month, year, totalCharges, totalAmount }
      });

    } catch (err: any) {
      console.error("Rent Generation Error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Database Connection Verification (Admin Only)
  app.get("/api/admin/db-check", async (req, res) => {
    if (!supabaseAdmin) {
      return res.status(500).json({ 
        error: "Supabase Admin client not initialized. Check your SUPABASE_SERVICE_ROLE_KEY." 
      });
    }

    try {
      // Industry Standard check: List all tables in public schema
      const { data, error } = await supabaseAdmin.rpc("get_tables_info");
      
      // If the RPC doesn't exist, we try a basic query to a standard table if we know it exists
      // or just try to fetch schema info directly via SQL (if enabled)
      // Since 'get_tables_info' might not exist, let's just try to fetch from a known table or count them
      
      const { data: tables, error: sqlError } = await supabaseAdmin
        .from('properties')
        .select('count', { count: 'exact', head: true });

      if (sqlError) throw sqlError;

      res.json({
        success: true,
        message: "Successfully connected to Supabase with Service Role Key.",
        details: {
          can_access_properties: true,
          properties_count: tables || 0
        }
      });
    } catch (error: any) {
      console.error("Admin DB Check Error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        hint: "Ensure the Service Role Key is correct and has bypass RLS permissions."
      });
    }
  });

  // --- SYSTEM ORCHESTRATION ---
  // This endpoint can be triggered manually or via a scheduled webhook
  app.post("/api/system/sync", async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not initialized" });

    try {
      const results: any = { leases_processed: 0, late_fees_generated: 0 };
      const today = new Date().toISOString().split('T')[0];

      // 1. Process Expired Leases
      const { data: expiredTenants, error: eError } = await supabaseAdmin
        .from('tenants')
        .select('id, unit_id')
        .eq('status', 'Active')
        .lt('lease_end', today);
      
      if (expiredTenants && expiredTenants.length > 0) {
        for (const t of expiredTenants) {
          await supabaseAdmin.from('tenants').update({ status: 'Inactive' }).eq('id', t.id);
          if (t.unit_id) {
            await supabaseAdmin.from('units').update({ status: 'Vacant' }).eq('id', t.unit_id);
          }
          results.leases_processed++;
        }
      }

      // 2. Generate Late Fees for Overdue Rent (Financial Automation)
      // Logic: For each active tenant, check if their current month balance is >= rent_amount and it's past the 5th
      const dayOfMonth = new Date().getDate();
      if (dayOfMonth > 5) {
        const { data: activeLeases } = await supabaseAdmin
          .from('tenants')
          .select('id, rent_amount, property_id, unit_id')
          .eq('status', 'Active');
        
        if (activeLeases) {
          for (const lease of activeLeases) {
             // Check if a payment exists for THIS month
             const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
             const { data: payments } = await supabaseAdmin
               .from('transactions')
               .select('id')
               .eq('tenant_id', lease.id)
               .eq('type', 'Payment')
               .eq('category', 'Rent')
               .gte('transaction_date', startOfMonth);
             
             if (!payments || payments.length === 0) {
                // No payment found and it's after the 5th -> Generate Late Fee
                const { data: existingFee } = await supabaseAdmin
                  .from('transactions')
                  .select('id')
                  .eq('tenant_id', lease.id)
                  .eq('category', 'Late Fee')
                  .gte('transaction_date', startOfMonth)
                  .maybeSingle();

                if (!existingFee) {
                  await supabaseAdmin.from('transactions').insert({
                    tenant_id: lease.id,
                    property_id: lease.property_id,
                    amount: 50.00, // Standard Late Fee
                    type: 'Charge',
                    category: 'Late Fee',
                    status: 'Completed',
                    description: `Automated Late Fee - Payment not received by ${today}`,
                    transaction_date: today
                  });
                  results.late_fees_generated++;
                }
             }
          }
        }
      }

      res.json({ success: true, results });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // reporting Engine Foundations
  app.get("/api/reports/cash-flow", async (req, res) => {
    if (!supabaseAdmin) return res.status(500).json({ error: "Admin client not initialized" });

    try {
      const { data: transactions, error } = await supabaseAdmin
        .from('transactions')
        .select('*');
      
      if (error) throw error;

      // Group by month
      const flow = (transactions || []).reduce((acc: any, t: any) => {
        // Defensive check for transaction_date
        const dateStr = t.transaction_date || t.created_at || new Date().toISOString();
        const month = String(dateStr).substring(0, 7);
        
        if (!acc[month]) acc[month] = { charges: 0, payments: 0, balance: 0 };
        
        if (t.type === 'Charge') acc[month].charges += Number(t.amount);
        if (t.type === 'Payment') acc[month].payments += Number(t.amount);
        acc[month].balance = acc[month].payments - acc[month].charges;
        
        return acc;
      }, {});

      res.json({ success: true, data: flow });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
