require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zjvuwujfhqujewbuyikv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("Error: Missing SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const newPlans = [
  { name: '1 Credit Pack', plan_type: 'exam_based', billing_cycle: 'none', price: 299, credits_awarded: 1, is_active: true },
  { name: '3 Credits Pack', plan_type: 'exam_based', billing_cycle: 'none', price: 799, credits_awarded: 3, is_active: true },
  { name: '6 Credits Pack', plan_type: 'exam_based', billing_cycle: 'none', price: 1499, credits_awarded: 6, is_active: true },
  { name: '9 Credits Pack', plan_type: 'exam_based', billing_cycle: 'none', price: 2099, credits_awarded: 9, is_active: true },
  { name: '12 Credits Pack', plan_type: 'exam_based', billing_cycle: 'none', price: 2699, credits_awarded: 12, is_active: true },
];

async function updatePlans() {
  console.log("Deactivating old plans...");
  await supabase.from('plans').update({ is_active: false }).neq('name', 'dummy'); 
  
  console.log("Inserting new plans...");
  for (const plan of newPlans) {
    const { data, error } = await supabase.from('plans').insert(plan).select().single();
    if (error) {
      console.error("Error inserting plan:", plan.name, error.message);
    } else {
      console.log(`Inserted ${plan.name} with ID ${data.id}`);
    }
  }
  
  console.log("Done!");
}

updatePlans();
