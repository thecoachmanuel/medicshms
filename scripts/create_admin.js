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

async function finalizeAdmin() {
  const email = 'superadmin@hms.com';
  const password = 'hms@admin';

  console.log('--- Fresh Super Admin with JWT Metadata ---');
  console.log('Target Email:', email);
  
  // 1. Delete existing if any
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const existing = users.find(u => u.email === email);
  if (existing) {
    console.log('Found existing, deleting:', existing.id);
    await supabase.auth.admin.deleteUser(existing.id);
  }

  // 2. Create fresh auth user
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: { role: 'platform_admin', name: 'Super Admin', hospital_id: null }
  });

  if (createError) {
    console.error('CRITICAL: Failed to create alternative admin:', createError.message);
    return;
  }

  const user = newUser.user;
  console.log('Auth user created successfully:', user.id);

  // 2. Create fresh profile
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    email: email,
    name: 'Super Admin',
    role: 'platform_admin',
    hospital_id: null,
    is_active: true
  });

  if (profileError) {
    console.error('Profile creation failed:', profileError.message);
  } else {
    console.log('Super Admin is ready.');
    console.log('Email:', email);
    console.log('Password:', password);
  }
}

finalizeAdmin();
