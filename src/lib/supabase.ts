import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ytzexfjlrstqvsbcnvdj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0emV4ZmpscnN0cXZzYmNudmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMzk4NjEsImV4cCI6MjA4OTcxNTg2MX0.rkvP5UthsmtUYvB5Ca7zu6DUeku_6IJ4NtcbJMpjp5Y";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
