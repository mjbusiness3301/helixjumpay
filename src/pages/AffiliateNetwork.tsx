import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Users, Network } from "lucide-react";
import { useAffiliateNetwork, useAffiliateCommissions } from "@/hooks/useAffiliates";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AffiliateNetworkNode } from "@/types/database";

function levelLabel(level: number) {
  return `Nível ${level}`;
}

function levelBadgeClass(level: number) {
  if (level === 1) return "bg-primary/15 text-primary";
  if (level === 2) return "bg-blue-500/15 text-blue-400";
  return "bg-amber-500/15 text-amber-400";
}

function formatEuros(cents: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default function AffiliateNetwork() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Admin can pass ?id=xxx to view any affiliate's network
  // Affiliates see their own network automatically
  const idFromParams = searchParams.get("id");

  const { data: myAffiliate } = useQuery({
    queryKey: ["my-affiliate-id", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliates")
        .select("id")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id && !idFromParams,
  });

  const affiliateId = idFromParams ?? myAffiliate?.id ?? null;

  const { data: network = [], isLoading: networkLoading } = useAffiliateNetwork(affiliateId);
  const { data: commissions = [], isLoading: commissionsLoading } = useAffiliateCommissions(affiliateId);

  const rootNode = network.find((n) => n.level === 0) ?? null;

  // Group sub-affiliates by level (exclude level 0 which is the root)
  const byLevel = new Map<number, AffiliateNetworkNode[]>();
  for (const node of network) {
    if (node.level === 0) continue;
    if (!byLevel.has(node.level)) byLevel.set(node.level, []);
    byLevel.get(node.level)!.push(node);
  }

  const levels = Array.from(byLevel.keys()).sort();

  if (!affiliateId) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 gap-4">
        <Network className="h-12 w-12 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">Nenhum afiliado selecionado.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    );
  }

  if (networkLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-reveal-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Network className="h-6 w-6 text-primary" />
            Rede de Afiliados
          </h1>
          {rootNode && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {rootNode.name} — {rootNode.email}
            </p>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border/60">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sub-afiliados</p>
            <p className="text-2xl font-bold text-foreground">{network.filter((n) => n.level > 0).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/60">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total de Leads</p>
            <p className="text-2xl font-bold text-foreground">
              {network.reduce((sum, n) => sum + (n.leads_count ?? 0), 0).toLocaleString("pt-PT")}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/60">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Ganhos Totais da Rede</p>
            <p className="text-2xl font-bold text-primary">
              {formatEuros(network.reduce((sum, n) => sum + (n.total_earnings ?? 0), 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Network tree grouped by level */}
      {levels.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Este afiliado ainda não tem sub-afiliados na rede.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {levels.map((level) => (
            <Card key={level} className="bg-card border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${levelBadgeClass(level)}`}>
                    {levelLabel(level)}
                  </span>
                  <span className="text-muted-foreground font-normal text-sm">
                    {byLevel.get(level)!.length} afiliado{byLevel.get(level)!.length !== 1 ? "s" : ""}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y divide-border/40">
                  {byLevel.get(level)!.map((node) => (
                    <div key={node.affiliate_id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                          {node.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{node.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{node.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 shrink-0 text-right">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Comissão</p>
                          <p className="text-sm font-semibold text-foreground">{(node.commission_rate * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Leads</p>
                          <p className="text-sm font-semibold text-foreground">{node.leads_count ?? 0}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ganhos</p>
                          <p className="text-sm font-semibold text-primary">{formatEuros(node.total_earnings ?? 0)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent commissions */}
      <Card className="bg-card border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Comissões Recentes</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {commissionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : commissions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma comissão registada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Nível</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Depósito</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Comissão</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Taxa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {commissions.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString("pt-PT")}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${levelBadgeClass(c.level)}`}>
                          {levelLabel(c.level)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-foreground whitespace-nowrap">
                        {formatEuros(c.deposit_amount_cents)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-primary whitespace-nowrap">
                        {formatEuros(c.commission_cents)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground whitespace-nowrap">
                        {Number(c.commission_pct).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
