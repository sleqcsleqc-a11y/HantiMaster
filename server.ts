import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("proppulse.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS owners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT
  );

  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    type TEXT NOT NULL,
    image_url TEXT,
    property_value REAL DEFAULT 0,
    owner_id INTEGER,
    FOREIGN KEY (owner_id) REFERENCES owners(id)
  );

  CREATE TABLE IF NOT EXISTS units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER,
    unit_number TEXT NOT NULL,
    rent_amount REAL NOT NULL,
    status TEXT DEFAULT 'Vacant',
    FOREIGN KEY (property_id) REFERENCES properties(id)
  );

  CREATE TABLE IF NOT EXISTS tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id INTEGER,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    lease_start DATE,
    lease_end DATE,
    notes TEXT,
    auto_rent_reminders BOOLEAN DEFAULT 0,
    FOREIGN KEY (unit_id) REFERENCES units(id)
  );

  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_locked BOOLEAN DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- In a real app, this would be hashed
    property_scope TEXT DEFAULT 'Assigned', -- 'Global' or 'Assigned'
    tenant_id INTEGER,
    owner_id INTEGER,
    status TEXT DEFAULT 'Active', -- 'Active', 'Suspended', 'Locked', 'Terminated'
    phone TEXT,
    address TEXT,
    last_login DATETIME,
    mfa_enabled BOOLEAN DEFAULT 0,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (owner_id) REFERENCES owners(id)
  );

  CREATE TABLE IF NOT EXISTS tenant_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  );

  CREATE TABLE IF NOT EXISTS maintenance_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id INTEGER,
    tenant_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Open',
    cost REAL DEFAULT 0,
    time_spent REAL DEFAULT 0,
    assigned_to INTEGER, -- User ID of the Repair Team member
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id INTEGER,
    tenant_id INTEGER,
    amount REAL NOT NULL,
    type TEXT NOT NULL, -- 'Rent', 'Late Fee', 'Maintenance', etc.
    status TEXT DEFAULT 'Pending',
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  );

  CREATE TABLE IF NOT EXISTS property_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER,
    image_url TEXT NOT NULL,
    FOREIGN KEY (property_id) REFERENCES properties(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    sender_type TEXT NOT NULL,
    receiver_id INTEGER NOT NULL,
    receiver_type TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    read BOOLEAN DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS owner_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(id)
  );

  CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module TEXT NOT NULL,
    action TEXT NOT NULL,
    UNIQUE(module, action)
  );

  CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER,
    permission_id INTEGER,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
  );

  CREATE TABLE IF NOT EXISTS permission_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    module TEXT NOT NULL,
    action TEXT NOT NULL,
    justification TEXT,
    status TEXT DEFAULT 'Pending', -- 'Pending', 'Approved', 'Denied'
    reviewed_by INTEGER,
    expiration_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS permission_overrides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    override_type TEXT NOT NULL, -- 'Grant', 'Deny'
    expiration_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
  );

  CREATE TABLE IF NOT EXISTS user_property_access (
    user_id INTEGER,
    property_id INTEGER,
    PRIMARY KEY (user_id, property_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (property_id) REFERENCES properties(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    entity_type TEXT,
    entity_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS role_hierarchy_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- 'Inheritance' or 'Restricted'
    role_a_id INTEGER NOT NULL,
    role_b_id INTEGER NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_a_id) REFERENCES roles(id),
    FOREIGN KEY (role_b_id) REFERENCES roles(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    assignee TEXT NOT NULL,
    due_date DATE NOT NULL,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Pending',
    cost REAL DEFAULT 0,
    time_spent REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Check if owner_id column exists in properties table, if not, add it
try {
  const tableInfo = db.prepare("PRAGMA table_info(properties)").all() as any[];
  const hasOwnerId = tableInfo.some(col => col.name === 'owner_id');
  if (!hasOwnerId) {
    db.exec("ALTER TABLE properties ADD COLUMN owner_id INTEGER REFERENCES owners(id)");
  }
  
  const hasStatus = tableInfo.some(col => col.name === 'status');
  if (!hasStatus) {
    db.exec("ALTER TABLE properties ADD COLUMN status TEXT DEFAULT 'For Sale'");
  }
  
  const hasAmenities = tableInfo.some(col => col.name === 'amenities');
  if (!hasAmenities) {
    db.exec("ALTER TABLE properties ADD COLUMN amenities TEXT DEFAULT '[]'");
  }

  // Add new columns to tenants table
  const tenantInfo = db.prepare("PRAGMA table_info(tenants)").all() as any[];
  const tenantColumns = ['nationality', 'dob', 'id_type', 'id_number', 'id_expiry', 'emergency_contact_name', 'emergency_contact_phone'];
  tenantColumns.forEach(col => {
    if (!tenantInfo.some(c => c.name === col)) {
      db.exec(`ALTER TABLE tenants ADD COLUMN ${col} TEXT`);
    }
  });

  // Add new columns to users table
  const userInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
  if (!userInfo.some(c => c.name === 'phone')) {
    db.exec("ALTER TABLE users ADD COLUMN phone TEXT");
  }
  if (!userInfo.some(c => c.name === 'address')) {
    db.exec("ALTER TABLE users ADD COLUMN address TEXT");
  }
  if (!userInfo.some(c => c.name === 'status')) {
    db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'Active'");
  }
  if (!userInfo.some(c => c.name === 'last_login')) {
    db.exec("ALTER TABLE users ADD COLUMN last_login DATETIME");
  }

  // Add new columns to owners table
  const ownerInfo = db.prepare("PRAGMA table_info(owners)").all() as any[];
  const ownerColumns = ['address', 'nationality', 'dob', 'id_type', 'id_number', 'id_expiry'];
  ownerColumns.forEach(col => {
    if (!ownerInfo.some(c => c.name === col)) {
      db.exec(`ALTER TABLE owners ADD COLUMN ${col} TEXT`);
    }
  });
  if (!userInfo.some(c => c.name === 'mfa_enabled')) {
    db.exec("ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT 0");
  }

  // Add new columns to roles table
  const roleInfo = db.prepare("PRAGMA table_info(roles)").all() as any[];
  if (!roleInfo.some(c => c.name === 'is_locked')) {
    db.exec("ALTER TABLE roles ADD COLUMN is_locked BOOLEAN DEFAULT 0");
  }
} catch (e) {
  console.error("Error migrating database schema:", e);
}

// Seed initial data if empty
const ownerCount = db.prepare("SELECT COUNT(*) as count FROM owners").get() as { count: number };
if (ownerCount.count === 0) {
  const insertOwner = db.prepare("INSERT INTO owners (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)");
  insertOwner.run("Alice", "Johnson", "alice.j@example.com", "555-0201");
  insertOwner.run("Bob", "Williams", "bob.w@example.com", "555-0202");
}

const propertyCount = db.prepare("SELECT COUNT(*) as count FROM properties").get() as { count: number };
if (propertyCount.count === 0) {
  const insertProperty = db.prepare("INSERT INTO properties (name, address, type, image_url, property_value, owner_id) VALUES (?, ?, ?, ?, ?, ?)");
  insertProperty.run("Oakwood Apartments", "123 Oak St, Springfield", "Residential", "https://picsum.photos/seed/oakwood/800/600", 1250000, 1);
  insertProperty.run("Pine View Lofts", "456 Pine Ave, Metropolis", "Residential", "https://picsum.photos/seed/pineview/800/600", 2100000, 2);
  insertProperty.run("Maple Street Retail", "789 Maple St, Gotham", "Commercial", "https://picsum.photos/seed/maple/800/600", 3500000, 1);
  
  const insertUnit = db.prepare("INSERT INTO units (property_id, unit_number, rent_amount, status) VALUES (?, ?, ?, ?)");
  insertUnit.run(1, "101", 1200, "Occupied");
  insertUnit.run(1, "102", 1250, "Vacant");
  insertUnit.run(2, "A-1", 1500, "Occupied");

  const insertTenant = db.prepare("INSERT INTO tenants (unit_id, first_name, last_name, email, phone, lease_start, lease_end) VALUES (?, ?, ?, ?, ?, ?, ?)");
  insertTenant.run(1, "John", "Doe", "john.doe@example.com", "555-0101", "2024-01-01", "2024-12-31");
  insertTenant.run(3, "Jane", "Smith", "jane.smith@example.com", "555-0102", "2024-02-01", "2025-01-31");

  const insertImage = db.prepare("INSERT INTO property_images (property_id, image_url) VALUES (?, ?)");
  insertImage.run(1, "https://picsum.photos/seed/oakwood1/800/600");
  insertImage.run(1, "https://picsum.photos/seed/oakwood2/800/600");
  insertImage.run(2, "https://picsum.photos/seed/pineview1/800/600");
}

const transactionCount = db.prepare("SELECT COUNT(*) as count FROM transactions").get() as { count: number };
if (transactionCount.count === 0) {
  const insertTransaction = db.prepare("INSERT INTO transactions (unit_id, tenant_id, amount, type, status, date) VALUES (?, ?, ?, ?, ?, ?)");
  insertTransaction.run(1, 1, 1200, "Rent", "Paid", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  insertTransaction.run(1, 1, 1200, "Rent", "Paid", new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString());
  insertTransaction.run(3, 2, 1500, "Rent", "Paid", new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString());
  insertTransaction.run(3, 2, 1500, "Rent", "Pending", new Date().toISOString());
}

const taskCount = db.prepare("SELECT COUNT(*) as count FROM tasks").get() as { count: number };
if (taskCount.count === 0) {
  const insertTask = db.prepare("INSERT INTO tasks (title, assignee, due_date, priority, status, cost, time_spent) VALUES (?, ?, ?, ?, ?, ?, ?)");
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  
  insertTask.run("Inspect Unit 204 roof leak", "Maintenance Team", tomorrow.toISOString().split('T')[0], "High", "Pending", 0, 0);
  insertTask.run("Process lease renewal for Unit 101", "Admin", nextWeek.toISOString().split('T')[0], "Medium", "In Progress", 0, 2.5);
  insertTask.run("Schedule annual fire safety inspection", "Admin", nextWeek.toISOString().split('T')[0], "Medium", "Pending", 0, 0);
  insertTask.run("Fix broken window in lobby", "Maintenance Team", yesterday.toISOString().split('T')[0], "Emergency", "Completed", 450, 4);
  insertTask.run("HVAC Maintenance Unit 302", "Contractor", yesterday.toISOString().split('T')[0], "High", "Completed", 1200, 6);
}

// Seed RBAC Data
const roleCount = db.prepare("SELECT COUNT(*) as count FROM roles").get() as { count: number };
if (roleCount.count === 0) {
  const roles = [
    { name: 'System Administrator', desc: 'Full administrative control of the entire platform', locked: 1 },
    { name: 'Property Manager', desc: 'Operational management of properties, units, and tenants', locked: 0 },
    { name: 'Leasing Agent', desc: 'Handles tenant onboarding, leases, and unit availability', locked: 0 },
    { name: 'Maintenance Supervisor', desc: 'Oversees maintenance requests and task assignments', locked: 0 },
    { name: 'Maintenance Technician', desc: 'Executes assigned maintenance tasks and repairs', locked: 0 },
    { name: 'Accountant', desc: 'Manages financial transactions, rent collection, and reporting', locked: 0 },
    { name: 'Property Owner', desc: 'View-only access to their specific property portfolio', locked: 0 },
    { name: 'Tenant', desc: 'Access to personal lease, payments, and maintenance requests', locked: 0 },
    { name: 'HR Manager', desc: 'Manages internal staff users and roles', locked: 0 },
    { name: 'Security Officer', desc: 'Monitors audit logs and security alerts', locked: 0 }
  ];

  const insertRole = db.prepare("INSERT INTO roles (name, description, is_locked) VALUES (?, ?, ?)");
  roles.forEach(r => insertRole.run(r.name, r.desc, r.locked));
}

// Seed Users
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const insertUser = db.prepare("INSERT INTO users (role_id, first_name, last_name, email, password, property_scope, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
  insertUser.run(1, "Admin", "User", "admin@hantimaster.com", "admin123", "Global", "Active");
  insertUser.run(2, "Sarah", "Manager", "sarah@hantimaster.com", "staff123", "Assigned", "Active");
  insertUser.run(3, "Frank", "Finance", "frank@hantimaster.com", "finance123", "Assigned", "Active");
  insertUser.run(4, "Mike", "Maintenance", "mike@hantimaster.com", "maint123", "Assigned", "Active");
  insertUser.run(8, "Helen", "HR", "helen@hantimaster.com", "hr123", "Assigned", "Active");
  
  // Seed Permissions
  const permissionCount = db.prepare("SELECT COUNT(*) as count FROM permissions").get() as { count: number };
  if (permissionCount.count === 0) {
    const perms = [
      { module: 'PROPERTY_MANAGEMENT', action: 'view' },
      { module: 'PROPERTY_MANAGEMENT', action: 'create' },
      { module: 'PROPERTY_MANAGEMENT', action: 'update' },
      { module: 'PROPERTY_MANAGEMENT', action: 'delete' },
      { module: 'TENANT_MANAGEMENT', action: 'view' },
      { module: 'TENANT_MANAGEMENT', action: 'create' },
      { module: 'TENANT_MANAGEMENT', action: 'update' },
      { module: 'FINANCE', action: 'view' },
      { module: 'FINANCE', action: 'export' },
      { module: 'FINANCE', action: 'manage' },
      { module: 'ADMIN_GOVERNANCE', action: 'view' },
      { module: 'USER_MANAGEMENT', action: 'view' },
      { module: 'USER_MANAGEMENT', action: 'create' },
      { module: 'USER_MANAGEMENT', action: 'update' },
      { module: 'USER_MANAGEMENT', action: 'delete' },
      { module: 'ROLE_MANAGEMENT', action: 'view' },
      { module: 'ROLE_MANAGEMENT', action: 'update' },
      { module: 'SECURITY_AUDIT', action: 'view' },
      { module: 'MAINTENANCE', action: 'view' },
      { module: 'MAINTENANCE', action: 'create' },
      { module: 'MAINTENANCE', action: 'update' },
      { module: 'MAINTENANCE', action: 'assign' }
    ];
    const insertPerm = db.prepare("INSERT INTO permissions (module, action) VALUES (?, ?)");
    perms.forEach(p => insertPerm.run(p.module, p.action));

    // Grant all permissions to System Administrator (Role ID 1)
    const allPerms = db.prepare("SELECT id FROM permissions").all() as any[];
    const grantPerm = db.prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
    allPerms.forEach(p => grantPerm.run(1, p.id));
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/properties", (req, res) => {
    const userId = req.query.userId;
    let query = `
      SELECT 
        p.*, 
        o.first_name || ' ' || o.last_name as owner_name,
        COUNT(u.id) as unit_count,
        CAST(SUM(CASE WHEN u.status = 'Occupied' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(u.id) * 100 as occupancy_rate
      FROM properties p
      LEFT JOIN owners o ON p.owner_id = o.id
      LEFT JOIN units u ON p.id = u.property_id
    `;

    const params = [];

    if (userId) {
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
      if (user && user.property_scope === 'Assigned') {
        query += ` WHERE p.id IN (SELECT property_id FROM user_property_access WHERE user_id = ?) `;
        params.push(userId);
      }
    }

    query += ` GROUP BY p.id `;
    
    const properties = db.prepare(query).all(...params);
    res.json(properties);
  });

  app.get("/api/properties/:id", (req, res) => {
    const property = db.prepare(`
      SELECT 
        p.*, 
        o.first_name || ' ' || o.last_name as owner_name,
        COUNT(u.id) as unit_count,
        CAST(SUM(CASE WHEN u.status = 'Occupied' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(u.id) * 100 as occupancy_rate
      FROM properties p
      LEFT JOIN owners o ON p.owner_id = o.id
      LEFT JOIN units u ON p.id = u.property_id
      WHERE p.id = ?
      GROUP BY p.id
    `).get(req.params.id);
    
    if (!property) return res.status(404).json({ error: "Property not found" });
    res.json(property);
  });

  app.post("/api/properties", (req, res) => {
    const { name, address, type, image_url, property_value, owner_id } = req.body;
    const info = db.prepare(`
      INSERT INTO properties (name, address, type, image_url, property_value, owner_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, address, type, image_url, property_value || 0, owner_id || null);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/properties/:id", (req, res) => {
    const { name, address, type, image_url, property_value, owner_id, status, amenities } = req.body;
    db.prepare(`
      UPDATE properties 
      SET name = ?, address = ?, type = ?, image_url = ?, property_value = ?, owner_id = ?, status = ?, amenities = ?
      WHERE id = ?
    `).run(name, address, type, image_url, property_value || 0, owner_id || null, status || 'For Sale', amenities || '[]', req.params.id);
    res.json({ success: true });
  });

  app.get("/api/properties/:id/units", (req, res) => {
    const units = db.prepare("SELECT * FROM units WHERE property_id = ?").all(req.params.id);
    res.json(units);
  });

  app.post("/api/properties/:id/units", (req, res) => {
    const { unit_number, rent_amount, status } = req.body;
    const info = db.prepare(`
      INSERT INTO units (property_id, unit_number, rent_amount, status)
      VALUES (?, ?, ?, ?)
    `).run(req.params.id, unit_number, rent_amount, status);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/units/:id", (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE units SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/properties/:id/images", (req, res) => {
    const images = db.prepare("SELECT * FROM property_images WHERE property_id = ?").all(req.params.id);
    res.json(images);
  });

  app.post("/api/properties/:id/images", (req, res) => {
    const { image_url } = req.body;
    const info = db.prepare(`
      INSERT INTO property_images (property_id, image_url)
      VALUES (?, ?)
    `).run(req.params.id, image_url);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/property_images/:id", (req, res) => {
    const { image_url } = req.body;
    db.prepare("UPDATE property_images SET image_url = ? WHERE id = ?").run(image_url, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/units", (req, res) => {
    const units = db.prepare(`
      SELECT u.*, p.name as property_name 
      FROM units u 
      JOIN properties p ON u.property_id = p.id
    `).all();
    res.json(units);
  });

  app.get("/api/tenants", (req, res) => {
    const tenants = db.prepare(`
      SELECT t.*, u.unit_number, p.name as property_name
      FROM tenants t
      JOIN units u ON t.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
    `).all();
    res.json(tenants);
  });

  app.post("/api/tenants", (req, res) => {
    const { first_name, last_name, email, phone, unit_id, lease_start, lease_end } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO tenants (first_name, last_name, email, phone, unit_id, lease_start, lease_end)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(first_name, last_name, email, phone, unit_id, lease_start, lease_end);
      
      // Update unit status to Occupied
      db.prepare("UPDATE units SET status = 'Occupied' WHERE id = ?").run(unit_id);
      
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/tenants/:id", (req, res) => {
    const tenant = db.prepare(`
      SELECT t.*, u.unit_number, u.rent_amount, p.name as property_name, p.address as property_address
      FROM tenants t
      JOIN units u ON t.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      WHERE t.id = ?
    `).get(req.params.id);
    
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    const transactions = db.prepare(`
      SELECT * FROM transactions
      WHERE tenant_id = ?
      ORDER BY date DESC
    `).all(req.params.id);

    const maintenance = db.prepare(`
      SELECT * FROM maintenance_requests
      WHERE tenant_id = ?
      ORDER BY created_at DESC
    `).all(req.params.id);

    const documents = db.prepare(`
      SELECT * FROM tenant_documents
      WHERE tenant_id = ?
      ORDER BY uploaded_at DESC
    `).all(req.params.id);

    const messages = db.prepare(`
      SELECT * FROM messages
      WHERE (sender_id = ? AND sender_type = 'Tenant') OR (receiver_id = ? AND receiver_type = 'Tenant')
      ORDER BY timestamp DESC
    `).all(req.params.id, req.params.id);

    // Aggregate activities
    const activities = [
      ...transactions.map((t: any) => ({
        id: `tx-${t.id}`,
        type: 'Payment',
        description: `Payment of $${t.amount} (${t.status})`,
        date: t.date
      })),
      ...maintenance.map((m: any) => ({
        id: `maint-${m.id}`,
        type: 'Maintenance',
        description: `Maintenance request: ${m.title}`,
        date: m.created_at
      })),
      ...documents.map((d: any) => ({
        id: `doc-${d.id}`,
        type: 'Document',
        description: `Uploaded document: ${d.name}`,
        date: d.uploaded_at
      })),
      ...messages.map((m: any) => ({
        id: `msg-${m.id}`,
        type: 'Message',
        description: m.sender_type === 'Tenant' ? 'Sent a message' : 'Received a message',
        date: m.timestamp
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ ...tenant, transactions, maintenance, documents, activities });
  });

  app.put("/api/tenants/:id", (req, res) => {
    const { notes, auto_rent_reminders, lease_end, nationality, dob, id_type, id_number, id_expiry, emergency_contact_name, emergency_contact_phone } = req.body;
    
    const updates = [];
    const values = [];
    
    if (notes !== undefined) { updates.push("notes = ?"); values.push(notes); }
    if (auto_rent_reminders !== undefined) { updates.push("auto_rent_reminders = ?"); values.push(auto_rent_reminders ? 1 : 0); }
    if (lease_end !== undefined) { updates.push("lease_end = ?"); values.push(lease_end); }
    if (nationality !== undefined) { updates.push("nationality = ?"); values.push(nationality); }
    if (dob !== undefined) { updates.push("dob = ?"); values.push(dob); }
    if (id_type !== undefined) { updates.push("id_type = ?"); values.push(id_type); }
    if (id_number !== undefined) { updates.push("id_number = ?"); values.push(id_number); }
    if (id_expiry !== undefined) { updates.push("id_expiry = ?"); values.push(id_expiry); }
    if (emergency_contact_name !== undefined) { updates.push("emergency_contact_name = ?"); values.push(emergency_contact_name); }
    if (emergency_contact_phone !== undefined) { updates.push("emergency_contact_phone = ?"); values.push(emergency_contact_phone); }
    
    if (updates.length > 0) {
      values.push(req.params.id);
      db.prepare(`UPDATE tenants SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    }
    
    res.json({ success: true });
  });

  app.post("/api/tenants/:id/documents", (req, res) => {
    const { name, url, type } = req.body;
    const info = db.prepare(`
      INSERT INTO tenant_documents (tenant_id, name, url, type)
      VALUES (?, ?, ?, ?)
    `).run(req.params.id, name, url, type);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/maintenance", (req, res) => {
    const userId = req.query.userId;
    let query = `
      SELECT 
        m.*, 
        u.unit_number, 
        p.name as property_name,
        t.first_name, 
        t.last_name,
        v.first_name || ' ' || v.last_name as assignee_name
      FROM maintenance_requests m
      JOIN units u ON m.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      JOIN tenants t ON m.tenant_id = t.id
      LEFT JOIN users v ON m.assigned_to = v.id
    `;

    const params = [];

    if (userId) {
      const user = db.prepare("SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?").get(userId) as any;
      if (user) {
        if (user.role_name === 'Tenant') {
          query += ` WHERE m.tenant_id = ? `;
          params.push(user.tenant_id);
        } else if (user.role_name === 'Property Owner') {
          query += ` WHERE p.owner_id = ? `;
          params.push(user.owner_id);
        } else if (user.role_name === 'Repair Team') {
          query += ` WHERE m.assigned_to = ? `;
          params.push(userId);
        } else if (user.property_scope === 'Assigned') {
          query += ` WHERE p.id IN (SELECT property_id FROM user_property_access WHERE user_id = ?) `;
          params.push(userId);
        }
      }
    }

    query += ` ORDER BY m.created_at DESC `;
    
    const requests = db.prepare(query).all(...params);
    res.json(requests);
  });

  app.post("/api/maintenance", (req, res) => {
    const { unit_id, tenant_id, title, description, priority } = req.body;
    const info = db.prepare(`
      INSERT INTO maintenance_requests (unit_id, tenant_id, title, description, priority)
      VALUES (?, ?, ?, ?, ?)
    `).run(unit_id, tenant_id, title, description, priority);
    
    // Automatically convert to a task
    const tenant = db.prepare("SELECT first_name, last_name FROM tenants WHERE id = ?").get(tenant_id) as any;
    const unit = db.prepare("SELECT unit_number FROM units WHERE id = ?").get(unit_id) as any;
    const tenantName = tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unknown Tenant';
    const unitNum = unit ? unit.unit_number : 'Unknown Unit';

    db.prepare(`
      INSERT INTO tasks (title, assignee, due_date, priority, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `Maintenance: ${title} (Unit ${unitNum})`,
      'Maintenance Team',
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 2 days due
      priority || 'Medium',
      'Pending'
    );

    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/finance/stats", (req, res) => {
    const stats = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'Rent' AND status = 'Paid' THEN amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END), 0) as pending_payments,
        COUNT(DISTINCT tenant_id) as active_tenants
      FROM transactions
    `).get();
    res.json(stats);
  });

  // Messages Routes
  app.get("/api/messages", (req, res) => {
    const messages = db.prepare("SELECT * FROM messages ORDER BY timestamp ASC").all();
    res.json(messages);
  });

  app.post("/api/messages", (req, res) => {
    const { sender_id, sender_type, receiver_id, receiver_type, content } = req.body;
    const info = db.prepare(`
      INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, content)
      VALUES (?, ?, ?, ?, ?)
    `).run(sender_id, sender_type, receiver_id, receiver_type, content);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/messages/read/:id", (req, res) => {
    db.prepare("UPDATE messages SET read = 1 WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Tasks Routes
  app.get("/api/tasks", (req, res) => {
    const tasks = db.prepare("SELECT * FROM tasks ORDER BY due_date ASC").all();
    res.json(tasks);
  });

  app.post("/api/tasks", (req, res) => {
    const { title, assignee, due_date, priority, status, cost, time_spent } = req.body;
    const info = db.prepare(`
      INSERT INTO tasks (title, assignee, due_date, priority, status, cost, time_spent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, assignee, due_date, priority || 'Medium', status || 'Pending', cost || 0, time_spent || 0);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/tasks/:id", (req, res) => {
    const { title, assignee, due_date, priority, status, cost, time_spent } = req.body;
    db.prepare(`
      UPDATE tasks 
      SET title = ?, assignee = ?, due_date = ?, priority = ?, status = ?, cost = ?, time_spent = ?
      WHERE id = ?
    `).run(title, assignee, due_date, priority, status, cost, time_spent, req.params.id);
    res.json({ success: true });
  });

  // Governance & Permission Control Routes
  app.get("/api/governance/stats", (req, res) => {
    const stats = {
      total_users: db.prepare("SELECT COUNT(*) as count FROM users").get().count,
      active_users: db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'Active'").get().count,
      suspended_users: db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'Suspended'").get().count,
      pending_requests: db.prepare("SELECT COUNT(*) as count FROM permission_requests WHERE status = 'Pending'").get().count,
      role_distribution: db.prepare(`
        SELECT r.name as role, COUNT(u.id) as count 
        FROM roles r 
        LEFT JOIN users u ON r.id = u.role_id 
        GROUP BY r.id
      `).all()
    };
    res.json(stats);
  });

  app.get("/api/governance/users", (req, res) => {
    const users = db.prepare(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id
    `).all();
    res.json(users);
  });

  app.post("/api/governance/users", (req, res) => {
    const { first_name, last_name, email, password, role_id, property_scope, admin_id } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO users (first_name, last_name, email, password, role_id, property_scope, status)
        VALUES (?, ?, ?, ?, ?, ?, 'Active')
      `).run(first_name, last_name, email, password || 'welcome123', role_id, property_scope || 'Assigned');
      
      // Log the creation
      db.prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)")
        .run(admin_id || null, `Created user: ${first_name} ${last_name}`, 'User', info.lastInsertRowid);
        
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/governance/users/:id", (req, res) => {
    const user = db.prepare(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = ?
    `).get(req.params.id) as any;

    if (!user) return res.status(404).json({ error: "User not found" });

    const properties = db.prepare(`
      SELECT p.* 
      FROM properties p
      JOIN user_property_access upa ON p.id = upa.property_id
      WHERE upa.user_id = ?
    `).all(req.params.id);

    const activity = db.prepare(`
      SELECT * FROM audit_logs 
      WHERE user_id = ? OR (entity_type = 'User' AND entity_id = ?)
      ORDER BY timestamp DESC
      LIMIT 20
    `).all(req.params.id, req.params.id);

    const { password: _, ...userWithoutPassword } = user;
    res.json({ ...userWithoutPassword, properties, activity });
  });

  app.put("/api/governance/users/:id", (req, res) => {
    const { status, role_id, first_name, last_name, email, phone, address, admin_id } = req.body;
    const updates = [];
    const params = [];

    if (status) { updates.push("status = ?"); params.push(status); }
    if (role_id) { updates.push("role_id = ?"); params.push(role_id); }
    if (first_name) { updates.push("first_name = ?"); params.push(first_name); }
    if (last_name) { updates.push("last_name = ?"); params.push(last_name); }
    if (email) { updates.push("email = ?"); params.push(email); }
    if (phone !== undefined) { updates.push("phone = ?"); params.push(phone); }
    if (address !== undefined) { updates.push("address = ?"); params.push(address); }

    if (updates.length > 0) {
      params.push(req.params.id);
      db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...params);
      
      // Log the change
      db.prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)")
        .run(admin_id || null, `Updated user ${req.params.id}: ${updates.join(", ")}`, 'User', req.params.id);
    }
    res.json({ success: true });
  });

  app.get("/api/governance/permission-requests", (req, res) => {
    const requests = db.prepare(`
      SELECT pr.*, u.first_name || ' ' || u.last_name as user_name, r.first_name || ' ' || r.last_name as reviewer_name
      FROM permission_requests pr
      JOIN users u ON pr.user_id = u.id
      LEFT JOIN users r ON pr.reviewed_by = r.id
      ORDER BY pr.created_at DESC
    `).all();
    res.json(requests);
  });

  app.post("/api/governance/permission-requests", (req, res) => {
    const { user_id, module, action, justification } = req.body;
    const info = db.prepare(`
      INSERT INTO permission_requests (user_id, module, action, justification)
      VALUES (?, ?, ?, ?)
    `).run(user_id, module, action, justification);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/governance/permission-requests/:id", (req, res) => {
    const { status, reviewed_by, expiration_date } = req.body;
    db.prepare(`
      UPDATE permission_requests 
      SET status = ?, reviewed_by = ?, expiration_date = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, reviewed_by, expiration_date || null, req.params.id);

    // Log the review
    db.prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)")
      .run(reviewed_by || null, `${status} permission request`, 'PermissionRequest', req.params.id);

    if (status === 'Approved') {
      const request = db.prepare("SELECT * FROM permission_requests WHERE id = ?").get(req.params.id) as any;
      const permission = db.prepare("SELECT id FROM permissions WHERE module = ? AND action = ?").get(request.module, request.action) as any;
      
      if (permission) {
        db.prepare(`
          INSERT INTO permission_overrides (user_id, permission_id, override_type, expiration_date)
          VALUES (?, ?, 'Grant', ?)
        `).run(request.user_id, permission.id, expiration_date || null);
      }
    }

    res.json({ success: true });
  });

  app.get("/api/governance/audit-logs", (req, res) => {
    const logs = db.prepare(`
      SELECT al.*, u.first_name || ' ' || u.last_name as user_name 
      FROM audit_logs al 
      LEFT JOIN users u ON al.user_id = u.id 
      ORDER BY al.timestamp DESC
      LIMIT 100
    `).all();
    res.json(logs);
  });

  app.get("/api/governance/security-alerts", (req, res) => {
    // Mocking security alerts for now
    const alerts = [
      { id: 1, type: 'Failed Login', user: 'Unknown', timestamp: new Date().toISOString(), risk: 'Low', description: 'Multiple failed login attempts from IP 192.168.1.45' },
      { id: 2, type: 'Privilege Escalation', user: 'Sarah Manager', timestamp: new Date(Date.now() - 3600000).toISOString(), risk: 'High', description: 'Attempted to access Finance module without permission' },
      { id: 3, type: 'Admin Change', user: 'Admin User', timestamp: new Date(Date.now() - 7200000).toISOString(), risk: 'Medium', description: 'Modified system-wide password policy' },
      { id: 4, type: 'Suspicious Activity', user: 'Frank Finance', timestamp: new Date(Date.now() - 86400000).toISOString(), risk: 'Critical', description: 'Large batch export of financial data outside business hours' }
    ];
    res.json(alerts);
  });

  app.get("/api/governance/system-rules", (req, res) => {
    const rules = {
      password_policy: { min_length: 8, complexity: 'High', rotation_days: 90 },
      mfa_settings: { enforced_roles: ['System Administrator', 'Finance Team'], optional_roles: ['All Others'] },
      session_settings: { timeout_minutes: 30, auto_logout: true }
    };
    
    const hierarchyRules = db.prepare(`
      SELECT rhr.*, ra.name as role_a_name, rb.name as role_b_name
      FROM role_hierarchy_rules rhr
      JOIN roles ra ON rhr.role_a_id = ra.id
      JOIN roles rb ON rhr.role_b_id = rb.id
    `).all();

    res.json({ ...rules, hierarchy_rules: hierarchyRules });
  });

  app.post("/api/governance/hierarchy-rules", (req, res) => {
    const { type, role_a_id, role_b_id, description, admin_id } = req.body;
    const info = db.prepare(`
      INSERT INTO role_hierarchy_rules (type, role_a_id, role_b_id, description)
      VALUES (?, ?, ?, ?)
    `).run(type, role_a_id, role_b_id, description);

    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
      VALUES (?, ?, ?, ?)
    `).run(admin_id || null, `Created hierarchy rule: ${type}`, 'RoleHierarchy', info.lastInsertRowid);

    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/governance/hierarchy-rules/:id", (req, res) => {
    const { admin_id } = req.query;
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
      VALUES (?, ?, ?, ?)
    `).run(admin_id || null, `Deleted hierarchy rule`, 'RoleHierarchy', req.params.id);

    db.prepare("DELETE FROM role_hierarchy_rules WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/governance/matrix", (req, res) => {
    const permissions = db.prepare("SELECT * FROM permissions").all();
    const rolePermissions = db.prepare("SELECT * FROM role_permissions").all();
    res.json({ permissions, rolePermissions });
  });

  app.post("/api/governance/matrix", (req, res) => {
    const { role_id, permission_id, action, admin_id } = req.body; // action: 'grant' or 'revoke'
    if (action === 'grant') {
      db.prepare("INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)").run(role_id, permission_id);
    } else {
      db.prepare("DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?").run(role_id, permission_id);
    }

    // Log the change
    db.prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)")
      .run(admin_id || null, `${action === 'grant' ? 'Granted' : 'Revoked'} permission ${permission_id} for role ${role_id}`, 'RolePermission', role_id);

    res.json({ success: true });
  });

  app.get("/api/governance/overrides/:userId", (req, res) => {
    const overrides = db.prepare(`
      SELECT po.*, p.module, p.action
      FROM permission_overrides po
      JOIN permissions p ON po.permission_id = p.id
      WHERE po.user_id = ? AND (po.expiration_date IS NULL OR po.expiration_date > CURRENT_TIMESTAMP)
    `).all(req.params.userId);
    res.json(overrides);
  });

  // Auth Routes
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE LOWER(u.email) = LOWER(?) AND u.password = ?
    `).get(email, password) as any;

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.status === 'Suspended' || user.status === 'Terminated') {
      return res.status(401).json({ error: "Your account has been suspended or terminated." });
    }

    // Update last login
    db.prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?").run(user.id);

    // In a real app, we would return a JWT
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.get("/api/users/me", (req, res) => {
    // This would normally use a JWT from the header
    const userId = req.query.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = db.prepare(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = ?
    `).get(userId) as any;

    if (!user) return res.status(404).json({ error: "User not found" });
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.get("/api/users", (req, res) => {
    const users = db.prepare(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id
    `).all();
    res.json(users);
  });

  app.get("/api/roles", (req, res) => {
    const roles = db.prepare("SELECT * FROM roles").all();
    res.json(roles);
  });

  app.get("/api/audit-logs", (req, res) => {
    const logs = db.prepare(`
      SELECT a.*, u.first_name || ' ' || u.last_name as user_name
      FROM audit_logs a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.timestamp DESC
      LIMIT 100
    `).all();
    res.json(logs);
  });

  // Owner Routes
  app.get("/api/owners", (req, res) => {
    const owners = db.prepare(`
      SELECT 
        o.*,
        COUNT(DISTINCT p.id) as property_count,
        SUM(p.property_value) as total_portfolio_value
      FROM owners o
      LEFT JOIN properties p ON o.id = p.owner_id
      GROUP BY o.id
    `).all();
    res.json(owners);
  });

  app.post("/api/owners", (req, res) => {
    const { first_name, last_name, email, phone } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO owners (first_name, last_name, email, phone)
        VALUES (?, ?, ?, ?)
      `).run(first_name, last_name, email, phone);
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/owners/:id", (req, res) => {
    const owner = db.prepare("SELECT * FROM owners WHERE id = ?").get(req.params.id);
    if (!owner) return res.status(404).json({ error: "Owner not found" });
    
    const properties = db.prepare(`
      SELECT 
        p.*, 
        COUNT(u.id) as unit_count,
        CAST(SUM(CASE WHEN u.status = 'Occupied' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(u.id) * 100 as occupancy_rate,
        (SELECT t.first_name || ' ' || t.last_name FROM tenants t JOIN units u2 ON t.unit_id = u2.id WHERE u2.property_id = p.id LIMIT 1) as tenant_name,
        (SELECT t.lease_end FROM tenants t JOIN units u2 ON t.unit_id = u2.id WHERE u2.property_id = p.id LIMIT 1) as lease_end
      FROM properties p
      LEFT JOIN units u ON p.id = u.property_id
      WHERE p.owner_id = ?
      GROUP BY p.id
    `).all(req.params.id);

    const transactions = db.prepare(`
      SELECT 
        tr.*,
        t.first_name || ' ' || t.last_name as tenant_name,
        p.name as property_name
      FROM transactions tr
      JOIN tenants t ON tr.tenant_id = t.id
      JOIN units u ON tr.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      WHERE p.owner_id = ? AND tr.type = 'Rent'
      ORDER BY tr.date DESC
    `).all(req.params.id);

    const documents = db.prepare(`
      SELECT * FROM owner_documents
      WHERE owner_id = ?
      ORDER BY uploaded_at DESC
    `).all(req.params.id);

    const messages = db.prepare(`
      SELECT * FROM messages
      WHERE (sender_id = ? AND sender_type = 'Owner') OR (receiver_id = ? AND receiver_type = 'Owner')
      ORDER BY timestamp DESC
    `).all(req.params.id, req.params.id);

    const activities = [
      ...properties.map((p: any) => ({
        id: `prop-${p.id}`,
        type: 'Property',
        description: `Property managed: ${p.name}`,
        date: new Date().toISOString()
      })),
      ...transactions.map((t: any) => ({
        id: `tx-${t.id}`,
        type: 'Payment',
        description: `Rent payment received: $${t.amount}`,
        date: t.date
      })),
      ...documents.map((d: any) => ({
        id: `doc-${d.id}`,
        type: 'Document',
        description: `Document uploaded: ${d.name}`,
        date: d.uploaded_at
      })),
      ...messages.map((m: any) => ({
        id: `msg-${m.id}`,
        type: 'Message',
        description: m.sender_type === 'Owner' ? 'Sent a message' : 'Received a message',
        date: m.timestamp
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ ...owner, properties, transactions, documents, activities });
  });

  app.put("/api/owners/:id", (req, res) => {
    const { address, nationality, dob, id_type, id_number, id_expiry } = req.body;
    const updates = [];
    const values = [];
    
    if (address !== undefined) { updates.push("address = ?"); values.push(address); }
    if (nationality !== undefined) { updates.push("nationality = ?"); values.push(nationality); }
    if (dob !== undefined) { updates.push("dob = ?"); values.push(dob); }
    if (id_type !== undefined) { updates.push("id_type = ?"); values.push(id_type); }
    if (id_number !== undefined) { updates.push("id_number = ?"); values.push(id_number); }
    if (id_expiry !== undefined) { updates.push("id_expiry = ?"); values.push(id_expiry); }
    
    if (updates.length > 0) {
      values.push(req.params.id);
      db.prepare(`UPDATE owners SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    }
    res.json({ success: true });
  });

  app.post("/api/owners/:id/documents", (req, res) => {
    const { name, url, type } = req.body;
    const info = db.prepare(`
      INSERT INTO owner_documents (owner_id, name, url, type)
      VALUES (?, ?, ?, ?)
    `).run(req.params.id, name, url, type);
    res.json({ id: info.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true'
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
