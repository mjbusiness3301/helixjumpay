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
    mutationFn: async (affiliate: { name: string; email: string; commission: number }) => {
      const { data, error } = await supabase
        .from("affiliates")
        .insert({
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
