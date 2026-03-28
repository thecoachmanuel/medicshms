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

async function runMigration() {
  console.log('Running branding migration...');
  
  // 1. Make hospital_id nullable
  const { error: err1 } = await supabase.rpc('exec_sql', { 
    sql_string: 'ALTER TABLE public.site_settings ALTER COLUMN hospital_id DROP NOT NULL;' 
  });
  if (err1) console.error('Error 1:', err1.message);

  // 2. Add Platform Settings
  const { error: err2 } = await supabase.from('site_settings').insert([{
    hospital_name: 'MedicsHMS SaaS',
    hospital_short_name: 'MedicsHMS',
    logo_url: 'https://res.cloudinary.com/dmet98v6q/image/upload/v1711280000/saas_logo.png',
    primary_color: '#2563eb',
    secondary_color: '#0f172a',
    contact_email: 'platform@medicshms.com',
    emergency_phone: '+1 (800) PLATFORM',
    hospital_id: null
  }]);
  if (err2) console.error('Error 2:', err2.message);

  console.log('Migration finished.');
}

runMigration();
