SELECT cron.schedule(
  'release-commissions-every-10min',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url:='https://ytzexfjlrstqvsbcnvdj.supabase.co/functions/v1/release-commissions',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0emV4ZmpscnN0cXZzYmNudmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMzk4NjEsImV4cCI6MjA4OTcxNTg2MX0.rkvP5UthsmtUYvB5Ca7zu6DUeku_6IJ4NtcbJMpjp5Y"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);