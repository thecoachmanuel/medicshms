const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkHospitalSlug() {
  const { data, error } = await supabaseAdmin
    .from('hospitals')
    .select('id, name, slug')
    .eq('id', 'b271f659-398e-4e01-a229-400360e990b4')
    .single();

  if (error) {
    console.error('Error fetching hospital:', error);
    return;
  }

  console.log('Hospital Info:', data);
}

checkHospitalSlug();
