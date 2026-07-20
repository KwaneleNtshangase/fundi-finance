-- Anonymized budget benchmarking view
-- Shows average category spend as % of income across all users (min 3 users per category)
CREATE OR REPLACE VIEW budget_benchmarks AS
WITH user_monthly AS (
  SELECT
    user_id,
    DATE_TRUNC('month', entry_date::timestamptz) AS month,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income
  FROM budget_entries
  GROUP BY user_id, DATE_TRUNC('month', entry_date::timestamptz)
  HAVING SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) > 0
),
user_cat_pct AS (
  SELECT
    be.user_id,
    DATE_TRUNC('month', be.entry_date::timestamptz) AS month,
    be.category,
    ROUND(
      (SUM(be.amount) / NULLIF(um.total_income, 0) * 100)::numeric, 1
    ) AS pct_of_income
  FROM budget_entries be
  JOIN user_monthly um
    ON be.user_id = um.user_id
    AND DATE_TRUNC('month', be.entry_date::timestamptz) = um.month
  WHERE be.type = 'expense'
  GROUP BY be.user_id, DATE_TRUNC('month', be.entry_date::timestamptz), be.category, um.total_income
)
SELECT
  category,
  ROUND(AVG(pct_of_income)::numeric, 1) AS avg_pct,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY pct_of_income)::numeric, 1) AS median_pct,
  COUNT(DISTINCT user_id) AS user_count
FROM user_cat_pct
GROUP BY category
HAVING COUNT(DISTINCT user_id) >= 3
ORDER BY avg_pct DESC;

GRANT SELECT ON budget_benchmarks TO authenticated;
