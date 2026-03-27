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

export function useHourlyChartData(affiliateId?: string) {
  const { data: logs = [], isLoading } = useActivityLogs(affiliateId);

  // Aggregate logs by hour
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hour = `${String(i).padStart(2, "0")}:00`;
    const hourLogs = logs.filter((log) => {
      const logHour = new Date(log.created_at).getHours();
      return logHour === i;
    });

    return {
      hour,
      cadastros: hourLogs.filter((l) => l.event_type === "registration").length,
      depositos: hourLogs.filter((l) => l.event_type === "deposit").length,
    };
  });

  return { hourlyData, isLoading };
}
