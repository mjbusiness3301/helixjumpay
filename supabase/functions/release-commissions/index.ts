import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find matured commissions (available_at <= now and still pending)
    const { data: commissions, error: fetchError } = await supabase
      .from("affiliate_commissions")
      .select("id, affiliate_id, amount")
      .eq("status", "pending")
      .lte("available_at", new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching commissions:", fetchError);
      return new Response(JSON.stringify({ error: "Erro ao buscar comissões" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!commissions || commissions.length === 0) {
      return new Response(JSON.stringify({ ok: true, released: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let released = 0;

    for (const commission of commissions) {
      // Move from pending_balance to balance
      const { error: updateAffError } = await supabase.rpc("release_commission", {
        p_affiliate_id: commission.affiliate_id,
        p_amount: commission.amount,
      });

      if (updateAffError) {
        console.error(`Error releasing commission ${commission.id}:`, updateAffError);
        continue;
      }

      // Mark commission as released
      const { error: updateCommError } = await supabase
        .from("affiliate_commissions")
        .update({ status: "released", released_at: new Date().toISOString() })
        .eq("id", commission.id);

      if (updateCommError) {
        console.error(`Error marking commission ${commission.id} as released:`, updateCommError);
        continue;
      }

      released++;
    }

    console.log(`Released ${released} commissions`);

    return new Response(
      JSON.stringify({ ok: true, released, total: commissions.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Release commissions error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
