import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Affiliate, AffiliateCommission, AffiliateNetworkNode } from "@/types/database";

export function useAffiliates() {
  return useQuery({
    queryKey: ["affiliates"],
    queryFn: async () => {
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from("affiliates")
        .select("*")
        .order("created_at", { ascending: false });

      if (affiliatesError) throw affiliatesError;

      const affiliates = (affiliatesData ?? []) as Affiliate[];
      if (affiliates.length === 0) return affiliates;

      const affiliateIds = affiliates.map((affiliate) => affiliate.id);

      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("id, affiliate_id")
        .in("affiliate_id", affiliateIds);

      if (leadsError) throw leadsError;

      const registrationsByAffiliate = new Map<string, number>();
      const leadToAffiliate = new Map<string, string>();

      for (const lead of leadsData ?? []) {
        if (!lead.affiliate_id) continue;
        leadToAffiliate.set(lead.id, lead.affiliate_id);
        registrationsByAffiliate.set(
          lead.affiliate_id,
          (registrationsByAffiliate.get(lead.affiliate_id) ?? 0) + 1
        );
      }

      const leadIds = Array.from(leadToAffiliate.keys());
      const depositsByAffiliate = new Map<string, number>();
      const depositValueByAffiliate = new Map<string, number>();

      if (leadIds.length > 0) {
        const { data: depositsData, error: depositsError } = await supabase
          .from("deposits")
          .select("lead_id, amount_cents, status")
          .eq("status", "confirmed")
          .in("lead_id", leadIds);

        if (depositsError) throw depositsError;

        for (const deposit of depositsData ?? []) {
          if (!deposit.lead_id) continue;

          const affiliateId = leadToAffiliate.get(deposit.lead_id);
          if (!affiliateId) continue;

          depositsByAffiliate.set(
            affiliateId,
            (depositsByAffiliate.get(affiliateId) ?? 0) + 1
          );

          depositValueByAffiliate.set(
            affiliateId,
            (depositValueByAffiliate.get(affiliateId) ?? 0) + Number(deposit.amount_cents) / 100
          );
        }
      }

      return affiliates.map((affiliate) => ({
        ...affiliate,
        total_registrations: registrationsByAffiliate.get(affiliate.id) ?? 0,
        total_deposits: depositsByAffiliate.get(affiliate.id) ?? 0,
        deposit_value: depositValueByAffiliate.get(affiliate.id) ?? 0,
      })) as Affiliate[];
    },
  });
}

export function useCreateAffiliate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (affiliate: { name: string; email: string; password: string; commission: number; parent_affiliate_id?: string | null }) => {
      // Save admin session before creating affiliate account
      const { data: { session: adminSession } } = await supabase.auth.getSession();
      if (!adminSession) throw new Error("Sessão de admin não encontrada");

      // 1. Create auth user (this will auto-login as the new user)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: affiliate.email,
        password: affiliate.password,
        options: {
          data: { name: affiliate.name },
        },
      });

      if (authError) {
        if (authError.message?.includes("rate limit") || authError.status === 429) {
          throw new Error("Limite de cadastros excedido. Aguarde alguns minutos e tente novamente.");
        }
        if (authError.message?.includes("already registered") || authError.message?.includes("already been registered")) {
          throw new Error("Este e-mail já está cadastrado no sistema.");
        }
        throw authError;
      }
      if (!authData.user) throw new Error("Falha ao criar conta do afiliado");

      // 2. Restore admin session immediately
      await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      });

      // 3. Insert into affiliates table with user_id
      const insertPayload: Record<string, unknown> = {
        user_id: authData.user.id,
        name: affiliate.name,
        email: affiliate.email,
        commission: affiliate.commission,
      };
      if (affiliate.parent_affiliate_id) {
        insertPayload.parent_affiliate_id = affiliate.parent_affiliate_id;
      }
      const { data, error } = await supabase
        .from("affiliates")
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;
      return data as Affiliate;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["affiliates"] }),
  });
}

export function useUpdateAffiliate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Affiliate> }) => {
      const { data, error } = await supabase
        .from("affiliates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Affiliate;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["affiliates"] }),
  });
}

export function useAffiliateNetwork(affiliateId: string | null) {
  return useQuery({
    queryKey: ['affiliate-network', affiliateId],
    queryFn: async () => {
      if (!affiliateId) return [];
      const { data, error } = await supabase.rpc('get_affiliate_network', { p_affiliate_id: affiliateId });
      if (error) throw error;
      return (data || []) as AffiliateNetworkNode[];
    },
    enabled: !!affiliateId,
  });
}

export function useAffiliateCommissions(affiliateId: string | null) {
  return useQuery({
    queryKey: ['affiliate-commissions', affiliateId],
    queryFn: async () => {
      if (!affiliateId) return [];
      const { data, error } = await supabase
        .from('affiliate_commissions')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as AffiliateCommission[];
    },
    enabled: !!affiliateId,
  });
}
