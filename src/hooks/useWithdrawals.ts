import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Withdrawal {
  id: string;
  affiliate_id: string;
  affiliate_name: string;
  affiliate_email: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
}

export function useWithdrawals() {
  return useQuery({
    queryKey: ["withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return data as Withdrawal[];
    },
  });
}

export function useUpdateWithdrawalStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase
        .from("withdrawals")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["withdrawals"] }),
  });
}

export function useCreateWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (withdrawal: {
      affiliate_id: string;
      affiliate_name: string;
      affiliate_email: string;
      amount: number;
    }) => {
      const { error } = await supabase
        .from("withdrawals")
        .insert({ ...withdrawal, status: "pending" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["withdrawals"] }),
  });
}
