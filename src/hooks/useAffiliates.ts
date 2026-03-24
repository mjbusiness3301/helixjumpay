import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Affiliate } from "@/types/database";

export function useAffiliates() {
  return useQuery({
    queryKey: ["affiliates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Affiliate[];
    },
  });
}

export function useCreateAffiliate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (affiliate: { name: string; email: string; password: string; commission: number }) => {
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
      const { data, error } = await supabase
        .from("affiliates")
        .insert({
          user_id: authData.user.id,
          name: affiliate.name,
          email: affiliate.email,
          commission: affiliate.commission,
        })
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
