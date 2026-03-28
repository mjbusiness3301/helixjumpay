import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const BLOCK_MINUTES = 30;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { email, password } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "E-mail inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return new Response(JSON.stringify({ error: "Senha inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const identifier = email.trim().toLowerCase();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check recent failed attempts
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

    const { count } = await supabaseAdmin
      .from("login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("identifier", identifier)
      .eq("success", false)
      .gte("attempted_at", windowStart);

    if ((count ?? 0) >= MAX_ATTEMPTS) {
      const blockStart = new Date(Date.now() - BLOCK_MINUTES * 60 * 1000).toISOString();

      const { count: recentCount } = await supabaseAdmin
        .from("login_attempts")
        .select("id", { count: "exact", head: true })
        .eq("identifier", identifier)
        .eq("success", false)
        .gte("attempted_at", blockStart);

      if ((recentCount ?? 0) >= MAX_ATTEMPTS) {
        return new Response(
          JSON.stringify({
            error: `Muitas tentativas de login. Tente novamente em ${BLOCK_MINUTES} minutos.`,
            blocked: true,
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Attempt Supabase Auth login using admin API to get tokens
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: identifier,
      password,
    });

    const loginSuccess = !authError && authData?.session;

    // Log attempt
    await supabaseAdmin.from("login_attempts").insert({
      identifier,
      success: !!loginSuccess,
    });

    if (!loginSuccess) {
      return new Response(
        JSON.stringify({ error: "E-mail ou senha incorretos." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Return session tokens so the client can set the session
    return new Response(
      JSON.stringify({
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_in: authData.session.expires_in,
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (_err) {
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
