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
    const { phone, password } = await req.json();

    if (!phone || typeof phone !== "string" || phone.trim().length < 8) {
      return new Response(JSON.stringify({ error: "Telefone inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!password || typeof password !== "string") {
      return new Response(JSON.stringify({ error: "Senha inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const identifier = phone.trim();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check recent failed attempts
    const windowStart = new Date(
      Date.now() - WINDOW_MINUTES * 60 * 1000
    ).toISOString();

    const { count } = await supabaseAdmin
      .from("login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("identifier", identifier)
      .eq("success", false)
      .gte("attempted_at", windowStart);

    if ((count ?? 0) >= MAX_ATTEMPTS) {
      // Check if blocked
      const blockStart = new Date(
        Date.now() - BLOCK_MINUTES * 60 * 1000
      ).toISOString();

      const { count: recentCount } = await supabaseAdmin
        .from("login_attempts")
        .select("id", { count: "exact", head: true })
        .eq("identifier", identifier)
        .eq("success", false)
        .gte("attempted_at", blockStart);

      if ((recentCount ?? 0) >= MAX_ATTEMPTS) {
        return new Response(
          JSON.stringify({
            error: `Muitas tentativas. Tente novamente em ${BLOCK_MINUTES} minutos.`,
            blocked: true,
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Call the secure login function
    const { data, error } = await supabaseAdmin.rpc("lead_login", {
      p_phone: identifier,
      p_password: password,
    });

    const result = data as Record<string, unknown> | null;
    const loginSuccess = !error && result && !result.error;

    // Log attempt
    await supabaseAdmin.from("login_attempts").insert({
      identifier,
      success: !!loginSuccess,
    });

    if (!loginSuccess) {
      const errorMsg =
        (result?.error as string) || error?.message || "Credenciais inválidas";
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
