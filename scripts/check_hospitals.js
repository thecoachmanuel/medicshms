const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.join('=').trim().replace(/^"|"$/g, '');
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkHospitals() {
  const { data: hospitals, error } = await supabase.from('hospitals').select('*');
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  console.log('Current hospitals:', hospitals.map(h => ({ name: h.name, slug: h.slug, status: h.status })));
}

checkHospitals();
