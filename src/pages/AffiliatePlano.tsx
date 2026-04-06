import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Crown, Percent, DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompliance } from "@/contexts/ComplianceContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Affiliate } from "@/types/database";

export default function AffiliatePlano() {
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

  const commission = Number(affiliate.commission);
  const depositValue = Number(affiliate.deposit_value);
  const earnings = depositValue * (commission / 100);

  return (
    <div className="p-6 space-y-6 animate-reveal-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meu Plano</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Detalhes da sua comissão e ganhos
        </p>
      </div>

      <Card className="bg-card border-border/60 max-w-lg">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plano Atual</p>
              <p className="text-lg font-bold text-foreground">Afiliado</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border/60 p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Percent className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Comissão</span>
              </div>
              <p className="text-3xl font-bold text-primary">{commission}%</p>
              <p className="text-xs text-muted-foreground">sobre cada depósito dos seus indicados</p>
            </div>

            <div className="rounded-lg border border-border/60 p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Total Ganho</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {earnings.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground">
                de {depositValue.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} em depósitos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
