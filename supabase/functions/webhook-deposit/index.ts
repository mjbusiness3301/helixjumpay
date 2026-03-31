import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { external_id, status } = body;

    if (!external_id || typeof external_id !== "string") {
      return new Response(JSON.stringify({ error: "external_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!status || !["confirmed", "rejected", "failed"].includes(status)) {
      return new Response(
        JSON.stringify({ error: "status deve ser: confirmed, rejected ou failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the deposit by external_id
    const { data: deposit, error: findError } = await supabase
      .from("deposits")
      .select("id, lead_id, amount_cents, status")
      .eq("external_id", external_id)
      .single();

    if (findError || !deposit) {
      return new Response(
        JSON.stringify({ error: "Depósito não encontrado", external_id }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (deposit.status === "confirmed") {
      return new Response(
        JSON.stringify({ message: "Depósito já confirmado", deposit_id: deposit.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update deposit status
    const updateData: Record<string, unknown> = { status };
    if (status === "confirmed") {
      updateData.confirmed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("deposits")
      .update(updateData)
      .eq("id", deposit.id);

    if (updateError) {
      console.error("Erro ao atualizar depósito:", updateError);
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar depósito" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Credit lead balance if confirmed
    if (status === "confirmed" && deposit.lead_id) {
      const { error: balanceError } = await supabase.rpc("increment_balance", {
        p_lead_id: deposit.lead_id,
        p_amount: deposit.amount_cents,
      });

      if (balanceError) {
        console.error("Erro ao creditar saldo:", balanceError);
        return new Response(
          JSON.stringify({ error: "Depósito confirmado mas erro ao creditar saldo" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deposit_id: deposit.id,
        status,
        credited: status === "confirmed" && !!deposit.lead_id,
        amount_cents: deposit.amount_cents,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
