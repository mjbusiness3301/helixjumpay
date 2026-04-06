import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History, Loader2, CalendarIcon, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function Historico() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [page, setPage] = useState(1);

  const { data: deposits = [], isLoading: loadingDeposits } = useQuery({
    queryKey: ["all-deposits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deposits")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["leads-with-affiliate"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, affiliate_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: affiliates = [], isLoading: loadingAffiliates } = useQuery({
    queryKey: ["affiliates-names"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("id, name");
      if (error) throw error;
      return data;
    },
  });

  const isLoading = loadingDeposits || loadingLeads || loadingAffiliates;

  const affiliateMap = useMemo(() => {
    const map = new Map<string, string>();
    affiliates.forEach((a) => map.set(a.id, a.name));
    return map;
  }, [affiliates]);

  const leadAffiliateMap = useMemo(() => {
    const map = new Map<string, string | null>();
    leads.forEach((l) => map.set(l.id, l.affiliate_id));
    return map;
  }, [leads]);

  const getAffiliateName = (leadId: string | null) => {
    if (!leadId) return null;
    const affiliateId = leadAffiliateMap.get(leadId);
    if (!affiliateId) return null;
    return affiliateMap.get(affiliateId) ?? null;
  };

  const filtered = useMemo(() => {
    return deposits.filter((dep) => {
      if (statusFilter !== "all" && dep.status !== statusFilter) return false;
      const created = new Date(dep.created_at);
      if (dateFrom && isBefore(created, startOfDay(dateFrom))) return false;
      if (dateTo && isAfter(created, endOfDay(dateTo))) return false;
      return true;
    });
  }, [deposits, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  const handleStatusChange = (v: string) => { setStatusFilter(v); setPage(1); };
  const handleDateFrom = (d: Date | undefined) => { setDateFrom(d); setPage(1); };
  const handleDateTo = (d: Date | undefined) => { setDateTo(d); setPage(1); };

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

  const hasFilters = statusFilter !== "all" || dateFrom || dateTo;

  const formatCurrencyLocal = (cents: number) =>
    "R$ " + (cents / 100).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    confirmed: { label: "Pago", variant: "default" },
    pending: { label: "Pendente", variant: "secondary" },
    failed: { label: "Falhou", variant: "destructive" },
  };

  return (
    <div className="p-6 space-y-6 animate-reveal-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Histórico de Depósitos</h1>
        <p className="text-muted-foreground">Todos os depósitos realizados na plataforma</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Status</label>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="confirmed">Pago</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Data início</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Selecionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={handleDateFrom} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Data fim</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "dd/MM/yyyy") : "Selecionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={handleDateTo} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
            </PopoverContent>
          </Popover>
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="mr-1 h-4 w-4" /> Limpar
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Depósitos ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum depósito encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Afiliado</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Confirmado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((dep) => {
                  const status = statusConfig[dep.status] ?? { label: dep.status, variant: "outline" as const };
                  return (
                    <TableRow key={dep.id}>
                      <TableCell className="font-medium">{dep.lead_name ?? "—"}</TableCell>
                      <TableCell>{dep.lead_phone ?? "—"}</TableCell>
                      <TableCell>
                        {(() => {
                          const name = getAffiliateName(dep.lead_id);
                          return name ? (
                            <Badge variant="outline">{name}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>{formatCurrencyLocal(Number(dep.amount_cents))}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(dep.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {dep.confirmed_at
                          ? format(new Date(dep.confirmed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <span className="text-sm text-muted-foreground">
                Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
