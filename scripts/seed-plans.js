const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envConfig = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const processEnv = envConfig.split('\n').reduce((acc, line) => {
  const [key, ...valueParts] = line.split('=');
  const value = valueParts.join('=');
  if (key && value) acc[key.trim()] = value.trim().replace(/^"|"$/g, '');
  return acc;
}, {});

const supabaseUrl = processEnv['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = processEnv['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const plans = [
  {
    name: 'Free Trial',
    slug: 'free-trial',
    description: 'Perfect for evaluating our platform',
    price_monthly: 0,
    price_yearly: 0,
    currency: 'NGN',
    features: ['All Hospital Features', '5 Staff Members', 'Unlimited Patients', 'Community Support'],
    is_active: true,
    is_recommended: false
  },
  {
    name: 'Standard Hospital',
    slug: 'standard',
    description: 'Ideal for small clinics and private practices',
    price_monthly: 45000,
    price_yearly: 450000,
    currency: 'NGN',
    features: ['Standard Support', '20 Staff Members', 'Custom Site Settings', 'Paystack Ready', 'Basic Reports'],
    is_active: true,
    is_recommended: true
  },
  {
    name: 'Pro Hospital',
    slug: 'pro',
    description: 'For established medical centers and multiple branches',
    price_monthly: 95000,
    price_yearly: 950000,
    currency: 'NGN',
    features: ['Priority SaaS Support', 'Unlimited Staff', 'Custom Branding', 'Advanced Analytics', 'White-label Options'],
    is_active: true,
    is_recommended: false
  }
];

async function seed() {
  console.log('Seeding subscription plans...');
  
  for (const plan of plans) {
    const { data, error } = await supabase
      .from('subscription_plans')
      .upsert(plan, { onConflict: 'slug' })
      .select();

    if (error) {
      console.error(`Error seeding plan ${plan.name}:`, error.message);
    } else {
      console.log(`Successfully seeded plan: ${plan.name}`);
    }
  }
  
  console.log('Seeding complete.');
}

seed();
