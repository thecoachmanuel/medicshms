const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdminApi() {
  try {
    const { data: departments, error } = await supabase
      .from('departments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Dept Fetch Error:', error);
      return;
    }

    console.log(`Found ${departments.length} departments.`);

    for (const dept of departments) {
      console.log(`Checking counts for ${dept.name} (${dept.id})...`);
      
      // Test the .or query separately to see if it's the culprit
      const { count, error: countError } = await supabase
        .from('doctors')
        .select('*', { count: 'exact', head: true })
        .or(`department_id.eq.${dept.id},additional_department_ids.cs.{${dept.id}}`);

      if (countError) {
        console.error(`Count Error for ${dept.name}:`, countError);
      } else {
        console.log(`Count for ${dept.name}: ${count}`);
      }
    }
  } catch (err) {
    console.error('Script Error:', err);
  }
}

testAdminApi();
