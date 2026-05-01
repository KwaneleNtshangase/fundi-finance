-- ============================================================
-- Drip Email Cron Migration
-- Adds a daily pg_cron job that fires D+7, D+14, D+30 milestone
-- emails by calling the send-email edge function with type "drip-batch".
-- ============================================================

SELECT cron.schedule(
  'drip-milestone-emails',
  '30 7 * * *',   -- 07:30 UTC daily = 09:30 SAST, avoids peak load window
  $$
  SELECT net.http_post(
    url     := 'https://bcwoyhypupuezgcbwqfy.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body    := '{"type":"drip-batch"}'::jsonb
  );
  $$
);
