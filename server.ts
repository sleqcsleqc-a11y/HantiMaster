import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("proppulse.db");

// Check if owner_id column exists in properties table, if not, add it
try {
  const tableInfo = db.prepare("PRAGMA table_info(properties)").all() as any[];
  const hasOwnerId = tableInfo.some(col => col.name === 'owner_id');
  if (!hasOwnerId) {
    db.exec("ALTER TABLE properties ADD COLUMN owner_id INTEGER REFERENCES owners(id)");
  }
} catch (e) {
  console.error("Error checking/adding owner_id column:", e);
}

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
    FOREIGN KEY (unit_id) REFERENCES units(id)
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (unit_id) REFERENCES units(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
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
`);

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/properties", (req, res) => {
    const properties = db.prepare(`
      SELECT 
        p.*, 
        o.first_name || ' ' || o.last_name as owner_name,
        COUNT(u.id) as unit_count,
        CAST(SUM(CASE WHEN u.status = 'Occupied' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(u.id) * 100 as occupancy_rate
      FROM properties p
      LEFT JOIN owners o ON p.owner_id = o.id
      LEFT JOIN units u ON p.id = u.property_id
      GROUP BY p.id
    `).all();
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
    const { name, address, type, image_url, property_value, owner_id } = req.body;
    db.prepare(`
      UPDATE properties 
      SET name = ?, address = ?, type = ?, image_url = ?, property_value = ?, owner_id = ?
      WHERE id = ?
    `).run(name, address, type, image_url, property_value || 0, owner_id || null, req.params.id);
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

  app.get("/api/maintenance", (req, res) => {
    const requests = db.prepare(`
      SELECT m.*, u.unit_number, t.first_name, t.last_name
      FROM maintenance_requests m
      JOIN units u ON m.unit_id = u.id
      JOIN tenants t ON m.tenant_id = t.id
      ORDER BY m.created_at DESC
    `).all();
    res.json(requests);
  });

  app.post("/api/maintenance", (req, res) => {
    const { unit_id, tenant_id, title, description, priority } = req.body;
    const info = db.prepare(`
      INSERT INTO maintenance_requests (unit_id, tenant_id, title, description, priority)
      VALUES (?, ?, ?, ?, ?)
    `).run(unit_id, tenant_id, title, description, priority);
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

    res.json({ ...owner, properties, transactions });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
