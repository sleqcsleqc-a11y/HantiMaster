
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

async function syncSchema() {
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log('--- Syncing Schema ---');
    const schemaSql = fs.readFileSync(path.join(process.cwd(), 'supabase_schema.sql'), 'utf8');
    await pool.query(schemaSql);
    console.log('✅ Schema synchronization complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Schema Sync Failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

syncSchema();
