const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://bcwoyhypupuezgcbwqfy.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjd295aHlwdXB1ZXpnY2J3cWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2ODkxOTMsImV4cCI6MjA4OTI2NTE5M30.cWB39zrGUl3X31FWK2bhAdLmBkRkgvwlszGdw35fVBg');

async function run() {
  const { data, error } = await supabase.auth.signUp({
    email: 'e2e-test@fundi.test',
    password: 'FundiTest123!',
    options: { data: { full_name: 'E2E Test User', age: 25 } }
  });
  console.log('Signup result:', { data, error });
}
run();
