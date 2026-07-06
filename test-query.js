const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('budget_entries').select('id, type, category, amount, description, entry_date, is_transfer, account_id, entry_method, bank_accounts(institution_name, custom_label)').limit(5);
  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data, null, 2));
}
run();
