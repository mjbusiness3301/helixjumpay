import { useAuth } from "@/contexts/AuthContext";
import { useCompliance } from "@/contexts/ComplianceContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { AffiliateDepositHistory } from "@/components/AffiliateDepositHistory";
import type { Affiliate } from "@/types/database";

export default function AffiliateHistorico() {
  const { user } = useAuth();
  const { complianceAffiliate, isComplianceMode } = useCompliance();

  const { data: fetchedAffiliate, isLoading } = useQuery({
    queryKey: ["my-affiliate", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data as Affiliate;
    },
    enabled: !!user?.id && !isComplianceMode,
  });

  const affiliate = isComplianceMode ? complianceAffiliate : fetchedAffiliate;

  if (isLoading || !affiliate) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-reveal-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Histórico de Depósitos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Depósitos realizados pelos seus indicados
        </p>
      </div>

      <AffiliateDepositHistory affiliateId={affiliate.id} />
    </div>
  );
}
