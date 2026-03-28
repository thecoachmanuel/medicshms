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

async function syncHospitalAdmins() {
  console.log('--- Syncing Hospital Admins ---');
  
  // 1. Get all hospitals
  const { data: hospitals, error: hError } = await supabase.from('hospitals').select('*');
  if (hError) {
    console.error('Error fetching hospitals:', hError.message);
    return;
  }

  for (const hospital of hospitals) {
    console.log(`Checking admin for: ${hospital.name} (${hospital.email})`);
    
    // Check if auth user exists
    const { data: { users } } = await supabase.auth.admin.listUsers();
    let user = users.find(u => u.email === hospital.email);
    if (!user) {
      console.log(`Creating missing admin for ${hospital.name}...`);
      const { data: newUser, error: cError } = await supabase.auth.admin.createUser({
        email: hospital.email,
        password: 'hms@admin',
        email_confirm: true,
        user_metadata: { 
          name: `${hospital.name} Admin`, 
          role: 'Admin',
          hospital_id: hospital.id 
        }
      });
      if (cError) {
        console.error(`Failed to create admin for ${hospital.name}:`, cError.message);
        continue;
      }
      user = newUser.user;
    }

    // Ensure profile exists
    const { error: pError } = await supabase.from('profiles').upsert({
      id: user.id,
      email: hospital.email,
      name: `${hospital.name} Admin`,
      role: 'Admin',
      hospital_id: hospital.id,
      is_active: true
    });

    if (pError) {
      console.error(`Failed to update profile for ${hospital.name}:`, pError.message);
    } else {
      console.log(`Admin for ${hospital.name} is ready.`);
    }
  }
}

syncHospitalAdmins();
