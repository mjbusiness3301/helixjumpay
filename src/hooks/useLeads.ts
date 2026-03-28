import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Lead {
  id: string;
  name: string | null;
  phone: string | null;
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  balance_cents: number;
  created_at: string;
}

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, phone, ip_address, user_agent, referrer, utm_source, utm_medium, utm_campaign, balance_cents, bonus_balance_cents, affiliate_id, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });
}
