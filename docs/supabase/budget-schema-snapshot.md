# Budget tables — production schema snapshot

**Project:** `bcwoyhypupuezgcbwqfy`  
**Pulled:** 2026-06-24 (inferred from app usage + migrations; **verify DDL in Supabase SQL editor**)

Run in Supabase → SQL Editor to confirm live columns before applying `20260624100000_budget_import_and_merchant_rules.sql`:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('budget_entries', 'budget_targets')
ORDER BY table_name, ordinal_position;
```

## `budget_entries` (actual transactions)

| Column | Type (inferred) | Notes |
|--------|-----------------|-------|
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK → `auth.users` | RLS: `auth.uid() = user_id` |
| `type` | `text` | `'income'` \| `'expense'` |
| `category` | `text` | Static id or `custom_budget_categories.id` |
| `amount` | `numeric` | **Positive**; sign encoded in `type` |
| `description` | `text` nullable | |
| `entry_date` | `date` | `YYYY-MM-DD` |
| `created_at` | `timestamptz` | Used for ordering |

**Import extension (migration):** `source`, `import_batch_id`, `dedupe_hash` (nullable; **unique per user** when set — `UNIQUE (user_id, dedupe_hash)` partial index). Hash includes running balance or within-file occurrence ordinal so same-day identical purchases stay distinct.

## `budget_targets` (planned monthly limits)

| Column | Type (inferred) | Notes |
|--------|-----------------|-------|
| `user_id` | `uuid` | |
| `category` | `text` | Expense category id |
| `monthly_limit` | `numeric` | Planned spend for month |
| `month_year` | `text` | `YYYY-MM` |

Unique constraint (inferred from upsert): `(user_id, category, month_year)`.

## `custom_budget_categories`

See migration `20260404000000_custom_budget_categories.sql`.

## Report budgeted figures

- **Whole calendar months:** exact match to `budget_targets.monthly_limit`.
- **Partial / custom ranges:** prorated from monthly limits → labelled **estimate** in UI and PDF (not presented as exact).
