const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function run() {
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

  const { data, error } = await supabase
    .from('hospitals')
    .select('id, name, slug')
    .eq('id', 'b271f659-398e-4e01-a229-400360e990b4')
    .single();

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Result:', data);
  }
}

run();
