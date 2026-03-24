import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [leadsRes, depositsRes, affiliatesRes] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("deposits").select("amount_cents, status"),
        supabase.from("affiliates").select("balance"),
      ]);

      if (leadsRes.error) throw leadsRes.error;
      if (depositsRes.error) throw depositsRes.error;
      if (affiliatesRes.error) throw affiliatesRes.error;

      const totalCadastros = leadsRes.count ?? 0;

      const confirmedDeposits = depositsRes.data.filter(d => d.status === "confirmed");
      const totalDepositos = confirmedDeposits.length;
      const totalValorDepositos = confirmedDeposits.reduce(
        (sum, d) => sum + Number(d.amount_cents),
        0
      ) / 100;

      const totalSaldo = affiliatesRes.data.reduce(
        (sum, a) => sum + Number(a.balance),
        0
      );

      return { totalCadastros, totalDepositos, totalValorDepositos, totalSaldo };
    },
  });
}
