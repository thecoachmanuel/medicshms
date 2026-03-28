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

async function checkUser() {
  const email = 'platform-admin@hms.com';
  console.log(`Checking user: ${email}...`);

  // Check auth.users
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error listing users:', authError);
    return;
  }

  console.log('--- Auth Users ---');
  users.forEach(u => {
    console.log(`ID: ${u.id}, Email: ${u.email}, Role: ${u.role}`);
  });

  const authUser = users.find(u => u.email === email);
  if (authUser) {
    console.log('User found in auth.users:', {
      id: authUser.id,
      email: authUser.email,
    });
  } else {
    console.log('User NOT found in auth.users');
  }

  // Check public.profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*');

  if (profileError) {
    console.log('Error fetching profiles:', profileError.message);
  } else {
    console.log('--- Public Profiles ---');
    profiles.forEach(p => {
      console.log(`ID: ${p.id}, Email: ${p.email}, Role: ${p.role}, Active: ${p.is_active}`);
    });
  }
}

checkUser();
