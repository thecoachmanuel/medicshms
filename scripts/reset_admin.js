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

async function resetAdmin() {
  const email = 'platform-admin@hms.com';
  const password = 'hms@admin';

  console.log(`Resetting user: ${email}...`);

  // Check if user exists
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.log('User not found, creating fresh...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { role: 'platform_admin' }
    });
    if (createError) {
      console.error('Error creating user:', createError.message);
      return;
    }
    console.log('User created successfully.');
  } else {
    console.log('User found, resetting password...');
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: password,
      email_confirm: true,
      user_metadata: { role: 'platform_admin' }
    });
    if (updateError) {
      console.error('Error updating user:', updateError.message);
      return;
    }
    console.log('Password reset successfully.');
  }

  // Ensure profile is correct
  console.log('Ensuring profile is platform_admin...');
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user?.id || (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === email).id,
    email: email,
    name: 'Platform Admin',
    role: 'platform_admin',
    hospital_id: null,
    is_active: true
  });

  if (profileError) console.error('Profile error:', profileError.message);
  else console.log('Profile ensured successfully.');
}

resetAdmin();
