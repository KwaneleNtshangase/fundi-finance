const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { error } = await supabase.from('budget_entries').select('id, missing_column').limit(1);
  console.log(JSON.stringify(error, null, 2));
}
run();
