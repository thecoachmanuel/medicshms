const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function check() {
  const tables = ['profiles', 'doctors', 'departments', 'public_appointments', 'bills', 'support_tickets', 'announcements', 'site_updates'];
  console.log('--- Checking Tables ---');
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*', { count: 'exact', head: true }).limit(1);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: Exists`);
    }
  }
}

check();
