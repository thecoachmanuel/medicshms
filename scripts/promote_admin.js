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

async function promoteUser() {
  const email = 'admin@hospital.com'; // This user exists
  console.log(`Promoting user: ${email}...`);

  // 1. Get user ID
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.error('User not found!');
    return;
  }
  
  const userId = user.id;
  console.log('User ID:', userId);

  // 2. Update role in profiles
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ 
        id: userId, 
        email: email, 
        role: 'platform_admin', 
        hospital_id: null,
        name: 'Platform Administrator'
    });

  if (profileError) {
    console.error('Error updating profile:', profileError.message);
  } else {
    console.log('User promoted to platform_admin successfully.');
  }

  // 3. Update password to be sure (hms@admin)
  await supabase.auth.admin.updateUserById(userId, { password: 'hms@admin' });
  console.log('Password set to: hms@admin');
}

promoteUser();
