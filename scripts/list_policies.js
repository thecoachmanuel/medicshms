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

async function listPolicies() {
  console.log('--- Listing Policies for "profiles" ---');
  const { data, error } = await supabase.rpc('get_policies', { table_name: 'profiles' });
  
  if (error) {
    // Fallback: use raw query if RPC not available
    const { data: rawData, error: rawError } = await supabase.from('pg_policies').select('*').eq('tablename', 'profiles');
    if (rawError) {
      console.error('Error fetching policies:', rawError.message);
      
      // Try another way: query pg_policy join pg_class
      const { data: sqlData, error: sqlError } = await supabase.rpc('execute_sql', { 
        sql_query: "SELECT polname, polcmd, polqual FROM pg_policy WHERE polrelid = 'public.profiles'::regclass"
      });
      if (sqlError) console.error('SQL Error:', sqlError.message);
      else console.log(sqlData);
    } else {
      console.log(rawData);
    }
  } else {
    console.log(data);
  }
}

listPolicies();
