import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History, Loader2 } from "lucide-react";

interface AffiliateDepositHistoryProps {
  affiliateId: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  confirmed: { label: "Pago", variant: "default" },
  pending: { label: "Pendente", variant: "secondary" },
  failed: { label: "Falhou", variant: "destructive" },
};

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

export function AffiliateDepositHistory({ affiliateId }: AffiliateDepositHistoryProps) {
  // Get lead IDs belonging to this affiliate
  const { data: leadIds = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["affiliate-lead-ids", affiliateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id")
        .eq("affiliate_id", affiliateId);
      if (error) throw error;
      return data.map((l) => l.id);
    },
    enabled: !!affiliateId,
  });

  // Get deposits for those leads
  const { data: deposits = [], isLoading: loadingDeposits } = useQuery({
    queryKey: ["affiliate-deposits", leadIds],
    queryFn: async () => {
      if (leadIds.length === 0) return [];
      const { data, error } = await supabase
        .from("deposits")
        .select("*")
        .in("lead_id", leadIds)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: leadIds.length > 0,
  });

  const isLoading = loadingLeads || loadingDeposits;

  const totalConfirmed = useMemo(
    () => deposits.filter((d) => d.status === "confirmed").reduce((sum, d) => sum + Number(d.amount_cents), 0),
    [deposits]
  );

  return (
    <Card className="bg-card border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <History className="h-4 w-4" />
            Histórico de Depósitos
          </div>
          {deposits.length > 0 && (
            <span className="text-xs font-medium text-muted-foreground">
              Total confirmado: <strong className="text-primary">{formatCurrency(totalConfirmed)}</strong>
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : deposits.length === 0 ? (
          <p className="text-center py-8 text-sm text-muted-foreground">
            Nenhum depósito encontrado dos seus indicados.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jogador</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.map((dep) => {
                const status = statusConfig[dep.status] ?? { label: dep.status, variant: "outline" as const };
                return (
                  <TableRow key={dep.id}>
                    <TableCell className="font-medium">{dep.lead_name ?? "—"}</TableCell>
                    <TableCell>{dep.lead_phone ?? "—"}</TableCell>
                    <TableCell>{formatCurrency(Number(dep.amount_cents))}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(dep.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
