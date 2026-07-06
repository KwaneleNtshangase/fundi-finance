const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({ email: "test@example.com", password: "password123" }); // or another way to get a session
  console.log('Auth:', authError || "Logged in");

  const { error } = await supabase.from('budget_entries').insert({
    user_id: user?.id || '00000000-0000-0000-0000-000000000000',
    type: 'income',
    category: 'salary',
    amount: 5000,
    description: null,
    entry_date: '2026-07-06'
  });
  console.log('Error:', error);
}
run();
