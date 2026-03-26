import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompliance } from "@/contexts/ComplianceContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Affiliate } from "@/types/database";

interface LeadWithDeposits {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  total_deposits: number;
  total_deposited_cents: number;
}

export default function AffiliateIndicados() {
  const { user } = useAuth();
  const { complianceAffiliate, isComplianceMode } = useCompliance();
  const [search, setSearch] = useState("");

  const { data: fetchedAffiliate } = useQuery({
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

  const { data: leads, isLoading } = useQuery({
    queryKey: ["affiliate-leads", affiliate?.id],
    queryFn: async () => {
      // Get leads for this affiliate
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("id, name, phone, created_at")
        .eq("affiliate_id", affiliate!.id)
        .order("created_at", { ascending: false });

      if (leadsError) throw leadsError;

      // Get deposit counts for each lead
      const leadIds = leadsData.map((l) => l.id);
      if (leadIds.length === 0) return [] as LeadWithDeposits[];

      const { data: depositsData, error: depositsError } = await supabase
        .from("deposits")
        .select("lead_id, amount_cents, status")
        .in("lead_id", leadIds);

      if (depositsError) throw depositsError;

      // Aggregate deposits per lead
      const depositMap = new Map<string, { count: number; total: number }>();
      for (const d of depositsData || []) {
        if (!d.lead_id) continue;
        const entry = depositMap.get(d.lead_id) || { count: 0, total: 0 };
        if (d.status === "confirmed") {
          entry.count++;
          entry.total += d.amount_cents;
        }
        depositMap.set(d.lead_id, entry);
      }

      return leadsData.map((lead) => ({
        ...lead,
        total_deposits: depositMap.get(lead.id)?.count || 0,
        total_deposited_cents: depositMap.get(lead.id)?.total || 0,
      })) as LeadWithDeposits[];
    },
    enabled: !!affiliate?.id,
  });

  const filtered = (leads || []).filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search)
  );

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
        <h1 className="text-2xl font-bold text-foreground">Indicados</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Usuários que se cadastraram pelo seu link de indicação
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Card className="bg-card border-border/60 flex-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{leads?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Total de indicados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border/60">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhum indicado encontrado</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead className="text-center">Depósitos</TableHead>
                    <TableHead className="text-right">Valor Depositado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell className="text-muted-foreground">{lead.phone}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={lead.total_deposits > 0 ? "default" : "secondary"}>
                          {lead.total_deposits}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(lead.total_deposited_cents / 100).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
