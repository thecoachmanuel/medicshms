const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAdmins() {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role, hospital_id, hospital:hospitals(slug)')
    .eq('role', 'Admin')
    .limit(5);

  if (error) {
    console.error('Error fetching admins:', error);
    return;
  }

  console.log('Sample Admins:');
  data.forEach(p => {
    console.log(`- Email: ${p.email}, Slug: ${p.hospital?.slug || 'MISSING'}, Hospital ID: ${p.hospital_id}`);
  });
}

checkAdmins();
