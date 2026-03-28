const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const sql = fs.readFileSync(path.join(__dirname, '../../supabase/migrations/20240325000007_add_append_history_rpc.sql'), 'utf8');
    await client.query(sql);
    console.log('Migration successful: RPC append_medical_history created.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
