import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompliance } from "@/contexts/ComplianceContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Affiliate } from "@/types/database";

const PAGE_SIZE = 10;

interface LeadWithDeposits {
  id: string;
  name: string;
  total_deposited_cents: number;
}

export default function AffiliateIndicados() {
  const { user } = useAuth();
  const { complianceAffiliate, isComplianceMode } = useCompliance();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("id, name")
        .eq("affiliate_id", affiliate!.id)
        .order("created_at", { ascending: false });

      if (leadsError) throw leadsError;

      const leadIds = leadsData.map((l) => l.id);
      if (leadIds.length === 0) return [] as LeadWithDeposits[];

      const { data: depositsData, error: depositsError } = await supabase
        .from("deposits")
        .select("lead_id, amount_cents, status")
        .in("lead_id", leadIds);

      if (depositsError) throw depositsError;

      const depositMap = new Map<string, number>();
      for (const d of depositsData || []) {
        if (!d.lead_id || d.status !== "confirmed") continue;
        depositMap.set(d.lead_id, (depositMap.get(d.lead_id) || 0) + d.amount_cents);
      }

      return leadsData.map((lead) => ({
        id: lead.id,
        name: lead.name,
        total_deposited_cents: depositMap.get(lead.id) || 0,
      })) as LeadWithDeposits[];
    },
    enabled: !!affiliate?.id,
  });

  const filtered = (leads || []).filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when search changes
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

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
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
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
            <>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-right">Valor Depositado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell className="text-right font-medium">
                          {"R$ " + (lead.total_deposited_cents / 100).toLocaleString("pt-PT", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-muted-foreground">
                    {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={currentPage <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={currentPage >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
