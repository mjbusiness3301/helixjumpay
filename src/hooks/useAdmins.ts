import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Admin } from "@/types/database";

export function useAdmins() {
  return useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admins")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Admin[];
    },
  });
}
