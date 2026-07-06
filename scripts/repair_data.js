const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// You must provide the service role key to bypass RLS, or an anon key + user token
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function repairData() {
  console.log("Starting data repair...");
  
  // Note: if you are using the anon key, you must authenticate first:
  // await supabase.auth.signInWithPassword({ email: '...', password: '...' });

  // 1. Repair categories
  console.log("Scanning for corrupted categories (UUIDs)...");
  
  // We fetch all entries, but in a real scenario we might filter. 
  // RLS will restrict this to the logged-in user if not using Service Role.
  const { data: entries, error } = await supabase
    .from("budget_entries")
    .select("id, category, description");

  if (error) {
    console.error("Error fetching entries:", error.message);
    return;
  }

  const corrupted = entries.filter(e => e.category && UUID_REGEX.test(e.category.replace('.pdf', '')));
  console.log(`Found ${corrupted.length} entries with UUID-like categories.`);

  let fixedCount = 0;
  for (const entry of corrupted) {
    // Re-run simple categorisation based on description or set to 'other'
    let newCategory = "other";
    const desc = entry.description ? entry.description.toLowerCase() : "";
    if (desc.includes("woolworth") || desc.includes("checkers") || desc.includes("pick n pay")) newCategory = "food";
    else if (desc.includes("uber") || desc.includes("engen") || desc.includes("shell")) newCategory = "transport";
    else if (desc.includes("rent") || desc.includes("home loan")) newCategory = "housing";
    
    const { error: updateErr } = await supabase
      .from("budget_entries")
      .update({ category: newCategory })
      .eq("id", entry.id);
      
    if (!updateErr) fixedCount++;
  }
  console.log(`Fixed ${fixedCount} corrupted categories.`);

  // 2. Legacy Bank Backfill
  console.log("Scanning for legacy entries missing account_id...");
  const { data: legacyEntries, error: legErr } = await supabase
    .from("budget_entries")
    .select("id, description, account_id, user_id")
    .is("account_id", null)
    .not("entry_method", "eq", "manual");

  if (legErr) {
    console.error("Error fetching legacy entries:", legErr.message);
    return;
  }

  // We need to group by user to create bank_accounts if using service role
  const missingAccounts = legacyEntries || [];
  console.log(`Found ${missingAccounts.length} legacy imported entries with no account_id.`);

  // In a robust script, we'd extract the bank from the description or metadata and create the bank account.
  // We'll set them to a generic "Legacy Import" bank account for now.
  let legacyBankCount = 0;
  for (const entry of missingAccounts) {
    let institutionName = "Legacy Bank";
    const desc = entry.description ? entry.description.toLowerCase() : "";
    if (desc.includes("fnb")) institutionName = "FNB";
    else if (desc.includes("capitec")) institutionName = "Capitec";
    else if (desc.includes("standard bank")) institutionName = "Standard Bank";
    
    // Find or create bank account
    let accId = null;
    const { data: existingBanks } = await supabase
      .from("bank_accounts")
      .select("id")
      .eq("institution_name", institutionName)
      .eq("user_id", entry.user_id)
      .limit(1);
      
    if (existingBanks && existingBanks.length > 0) {
      accId = existingBanks[0].id;
    } else {
      const { data: newBank } = await supabase
        .from("bank_accounts")
        .insert({ user_id: entry.user_id, institution_name: institutionName, custom_label: "Legacy" })
        .select("id")
        .single();
      if (newBank) accId = newBank.id;
    }

    if (accId) {
      const { error: upErr } = await supabase
        .from("budget_entries")
        .update({ account_id: accId })
        .eq("id", entry.id);
      if (!upErr) legacyBankCount++;
    }
  }
  console.log(`Backfilled ${legacyBankCount} legacy entries with account_id.`);
  console.log("Data repair complete.");
}

repairData();
