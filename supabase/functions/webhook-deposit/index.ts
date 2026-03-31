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
    console.log("Webhook received:", JSON.stringify(body));

    // Support multiple payload formats:
    // Format 1 (Master Pagamentos): { event: "charge.paid", data: { id, ... } }
    // Format 2 (generic): { external_id, status }
    let externalId: string | null = null;
    let depositStatus: string | null = null;

    if (body.event && body.data) {
      // Master Pagamentos / gateway format
      // Priority: transaction_id matches what we store as external_id in deposits table
      externalId = body.data?.transaction_id || body.data?.id || body.data?.external_id || null;

      const eventMap: Record<string, string> = {
        "charge.paid": "confirmed",
        "charge.created": "pending",
        "charge.failed": "failed",
        "charge.refunded": "rejected",
        "charge.chargeback": "rejected",
        "CHARGE-APPROVED": "confirmed",
        "CHARGE-PENDING": "pending",
        "CHARGE-REFUND": "rejected",
        "CHARGE-NOT_AUTHORIZED": "failed",
      };

      depositStatus = eventMap[body.event] || null;

      if (!depositStatus) {
        // Event not relevant, acknowledge
        return new Response(JSON.stringify({ ok: true, message: "Event ignored", event: body.event }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Generic format
      externalId = body.external_id || null;
      if (body.status && ["confirmed", "rejected", "failed"].includes(body.status)) {
        depositStatus = body.status;
      }
    }

    if (!externalId) {
      return new Response(JSON.stringify({ error: "external_id não encontrado no payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!depositStatus) {
      return new Response(JSON.stringify({ error: "Status não reconhecido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find deposit by external_id
    const { data: deposit, error: findError } = await supabase
      .from("deposits")
      .select("id, lead_id, amount_cents, status")
      .eq("external_id", externalId)
      .single();

    if (findError || !deposit) {
      console.log("Deposit not found for external_id:", externalId);
      return new Response(
        JSON.stringify({ error: "Depósito não encontrado", external_id: externalId }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (deposit.status === "confirmed") {
      return new Response(
        JSON.stringify({ ok: true, message: "Depósito já confirmado", deposit_id: deposit.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update deposit
    const updateData: Record<string, unknown> = { status: depositStatus };
    if (depositStatus === "confirmed") {
      updateData.confirmed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("deposits")
      .update(updateData)
      .eq("id", deposit.id);

    if (updateError) {
      console.error("Error updating deposit:", updateError);
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar depósito" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Credit balance if confirmed
    if (depositStatus === "confirmed" && deposit.lead_id) {
      const { error: balanceError } = await supabase.rpc("increment_balance", {
        p_lead_id: deposit.lead_id,
        p_amount: deposit.amount_cents,
      });

      if (balanceError) {
        console.error("Error crediting balance:", balanceError);
        return new Response(
          JSON.stringify({ error: "Depósito confirmado mas erro ao creditar saldo" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`Deposit ${deposit.id} updated to ${depositStatus}`);

    return new Response(
      JSON.stringify({
        ok: true,
        deposit_id: deposit.id,
        status: depositStatus,
        credited: depositStatus === "confirmed" && !!deposit.lead_id,
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
