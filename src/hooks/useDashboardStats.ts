import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfDay, endOfDay, subDays } from "date-fns";

type FilterType = "today" | "yesterday" | "7days" | "custom";

interface DateFilter {
  filter: FilterType;
  from?: Date;
  to?: Date;
}

function getDateRange(dateFilter: DateFilter): { from: string; to: string } | null {
  const now = new Date();

  switch (dateFilter.filter) {
    case "today":
      return {
        from: startOfDay(now).toISOString(),
        to: endOfDay(now).toISOString(),
      };
    case "yesterday": {
      const yesterday = subDays(now, 1);
      return {
        from: startOfDay(yesterday).toISOString(),
        to: endOfDay(yesterday).toISOString(),
      };
    }
    case "7days":
      return {
        from: startOfDay(subDays(now, 6)).toISOString(),
        to: endOfDay(now).toISOString(),
      };
    case "custom":
      if (dateFilter.from && dateFilter.to) {
        return {
          from: startOfDay(dateFilter.from).toISOString(),
          to: endOfDay(dateFilter.to).toISOString(),
        };
      }
      return null;
    default:
      return null;
  }
}

export function useDashboardStats(dateFilter?: DateFilter) {
  const range = dateFilter ? getDateRange(dateFilter) : null;

  return useQuery({
    queryKey: ["dashboard-stats", dateFilter?.filter, range?.from, range?.to],
    queryFn: async () => {
      let leadsQuery = supabase.from("leads").select("id", { count: "exact" });
      let depositsQuery = supabase.from("deposits").select("amount_cents, status, created_at");
      const leadsBalanceQuery = supabase.from("leads").select("balance_cents");
      let commissionsQuery = supabase.from("affiliate_commissions").select("amount, created_at");
      const gatewayFeeQuery = supabase.from("settings").select("key, value").in("key", ["gateway_fee_percent", "gateway_fee_fixed"]);

      if (range) {
        leadsQuery = leadsQuery.gte("created_at", range.from).lte("created_at", range.to);
        depositsQuery = depositsQuery.gte("created_at", range.from).lte("created_at", range.to);
        commissionsQuery = commissionsQuery.gte("created_at", range.from).lte("created_at", range.to);
      }

      const [leadsRes, depositsRes, leadsBalanceRes, commissionsRes, gatewayFeeRes] = await Promise.all([
        leadsQuery,
        depositsQuery,
        leadsBalanceQuery,
        commissionsQuery,
        gatewayFeeQuery,
      ]);

      if (leadsRes.error) throw leadsRes.error;
      if (depositsRes.error) throw depositsRes.error;
      if (leadsBalanceRes.error) throw leadsBalanceRes.error;
      if (commissionsRes.error) throw commissionsRes.error;

      const totalCadastros = leadsRes.count ?? 0;

      const confirmedDeposits = depositsRes.data.filter(d => d.status === "confirmed");
      const totalDepositos = confirmedDeposits.length;
      const totalValorDepositos = confirmedDeposits.reduce(
        (sum, d) => sum + Number(d.amount_cents),
        0
      ) / 100;

      const totalSaldo = leadsBalanceRes.data.reduce(
        (sum, l) => sum + Number(l.balance_cents),
        0
      ) / 100;

      const totalComissoes = commissionsRes.data.reduce(
        (sum, c) => sum + Number(c.amount),
        0
      ) / 100;

      const gatewayFeePercent = Number(gatewayFeeRes.data?.value || "0");
      const totalTaxaGateway = totalValorDepositos * (gatewayFeePercent / 100);

      // Lucro = depósitos - comissões - taxa gateway
      const lucro = totalValorDepositos - totalComissoes - totalTaxaGateway;

      return { totalCadastros, totalDepositos, totalValorDepositos, totalSaldo, totalComissoes, lucro, totalTaxaGateway };
    },
  });
}
