import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ActivityLog {
  id: string;
  event_type: "registration" | "deposit";
  affiliate_id: string | null;
  amount: number | null;
  created_at: string;
}

export function useActivityLogs(affiliateId?: string) {
  return useQuery({
    queryKey: ["activity-logs", affiliateId],
    queryFn: async () => {
      let query = supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(5000);

      if (affiliateId) {
        query = query.eq("affiliate_id", affiliateId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ActivityLog[];
    },
  });
}

export function useHourlyChartData(affiliateId?: string, dateFrom?: string, dateTo?: string) {
  const { data: logs = [], isLoading } = useActivityLogs(affiliateId);

  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hour = `${String(i).padStart(2, "0")}:00`;
    const hourLogs = logs.filter((log) => {
      const logDate = new Date(log.created_at);
      const logHour = logDate.getHours();
      if (logHour !== i) return false;

      if (dateFrom && dateTo) {
        return logDate >= new Date(dateFrom) && logDate <= new Date(dateTo);
      }
      // Default: today
      const now = new Date();
      return (
        logDate.getFullYear() === now.getFullYear() &&
        logDate.getMonth() === now.getMonth() &&
        logDate.getDate() === now.getDate()
      );
    });

    return {
      hour,
      cadastros: hourLogs.filter((l) => l.event_type === "registration").length,
      depositos: hourLogs.filter((l) => l.event_type === "deposit").length,
    };
  });

  return { hourlyData, isLoading };
}
