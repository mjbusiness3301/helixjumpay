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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  History,
  Loader2,
  CalendarIcon,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

const formatCurrencyDecimal = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const depositStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  confirmed: { label: "Pago", variant: "default" },
  pending: { label: "Pendente", variant: "secondary" },
  failed: { label: "Falhou", variant: "destructive" },
  rejected: { label: "Rejeitado", variant: "destructive" },
};

const withdrawalStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  approved: { label: "Aprovado", variant: "default" },
  pending: { label: "Pendente", variant: "secondary" },
  rejected: { label: "Rejeitado", variant: "destructive" },
};

function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-[160px] justify-start text-left font-normal", !value && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "dd/MM/yyyy") : "Selecionar"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value} onSelect={onChange} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (total <= PAGE_SIZE) return null;
  return (
    <div className="flex items-center justify-between pt-4 border-t mt-4">
      <span className="text-sm text-muted-foreground">
        Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={onPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{page} / {totalPages}</span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function Historico() {
  const [tab, setTab] = useState("deposits");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [page, setPage] = useState(1);

  // ── Queries ──
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

  const { data: withdrawals = [], isLoading: loadingWithdrawals } = useQuery({
    queryKey: ["all-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: leadWithdrawals = [], isLoading: loadingLeadWithdrawals } = useQuery({
    queryKey: ["all-lead-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_withdrawals")
        .select("*, leads:lead_id(name, phone)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads-with-affiliate"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id, affiliate_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: affiliates = [] } = useQuery({
    queryKey: ["affiliates-names"],
    queryFn: async () => {
      const { data, error } = await supabase.from("affiliates").select("id, name");
      if (error) throw error;
      return data;
    },
  });

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

  // ── Filter helpers ──
  const resetPage = () => setPage(1);
  const handleStatusChange = (v: string) => { setStatusFilter(v); resetPage(); };
  const handleDateFrom = (d: Date | undefined) => { setDateFrom(d); resetPage(); };
  const handleDateTo = (d: Date | undefined) => { setDateTo(d); resetPage(); };
  const handleTabChange = (t: string) => { setTab(t); setStatusFilter("all"); setDateFrom(undefined); setDateTo(undefined); resetPage(); };

  const clearFilters = () => { setStatusFilter("all"); setDateFrom(undefined); setDateTo(undefined); resetPage(); };
  const hasFilters = statusFilter !== "all" || dateFrom || dateTo;

  const filterByDate = <T extends Record<string, any>>(items: T[], dateField: string) =>
    items.filter((item) => {
      const created = new Date(item[dateField]);
      if (dateFrom && isBefore(created, startOfDay(dateFrom))) return false;
      if (dateTo && isAfter(created, endOfDay(dateTo))) return false;
      return true;
    });

  // ── Filtered data ──
  const filteredDeposits = useMemo(() => {
    let result = deposits;
    if (statusFilter !== "all") result = result.filter((d) => d.status === statusFilter);
    return filterByDate(result, "created_at");
  }, [deposits, statusFilter, dateFrom, dateTo]);

  const filteredWithdrawals = useMemo(() => {
    let result = withdrawals;
    if (statusFilter !== "all") result = result.filter((w) => w.status === statusFilter);
    return filterByDate(result, "requested_at");
  }, [withdrawals, statusFilter, dateFrom, dateTo]);

  const filteredLeadWithdrawals = useMemo(() => {
    let result = leadWithdrawals;
    if (statusFilter !== "all") result = result.filter((w) => w.status === statusFilter);
    return filterByDate(result, "created_at");
  }, [leadWithdrawals, statusFilter, dateFrom, dateTo]);

  const currentFiltered = tab === "deposits" ? filteredDeposits : tab === "withdrawals" ? filteredWithdrawals : filteredLeadWithdrawals;
  const totalPages = Math.max(1, Math.ceil(currentFiltered.length / PAGE_SIZE));
  const paged = currentFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const isLoading = loadingDeposits || loadingWithdrawals || loadingLeadWithdrawals;

  const statusOptions = tab === "deposits"
    ? [{ value: "confirmed", label: "Pago" }, { value: "pending", label: "Pendente" }, { value: "failed", label: "Falhou" }]
    : [{ value: "approved", label: "Aprovado" }, { value: "pending", label: "Pendente" }, { value: "rejected", label: "Rejeitado" }];

  return (
    <div className="p-6 space-y-6 animate-reveal-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Histórico de Transações</h1>
        <p className="text-muted-foreground">Todas as transações realizadas na plataforma</p>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="deposits" className="gap-2">
            <ArrowDownCircle className="h-4 w-4" />
            Depósitos
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-2">
            <ArrowUpCircle className="h-4 w-4" />
            Saques Afiliados
          </TabsTrigger>
          <TabsTrigger value="lead-withdrawals" className="gap-2">
            <Wallet className="h-4 w-4" />
            Saques Jogadores
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4 mt-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {statusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DateFilter label="Data início" value={dateFrom} onChange={handleDateFrom} />
          <DateFilter label="Data fim" value={dateTo} onChange={handleDateTo} />
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="mr-1 h-4 w-4" /> Limpar
            </Button>
          )}
        </div>

        {/* Deposits Tab */}
        <TabsContent value="deposits">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownCircle className="h-5 w-5" />
                Depósitos ({filteredDeposits.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : filteredDeposits.length === 0 ? (
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
                    {(paged as typeof deposits).map((dep) => {
                      const status = depositStatusConfig[dep.status] ?? { label: dep.status, variant: "outline" as const };
                      return (
                        <TableRow key={dep.id}>
                          <TableCell className="font-medium">{dep.lead_name ?? "—"}</TableCell>
                          <TableCell>{dep.lead_phone ?? "—"}</TableCell>
                          <TableCell>
                            {(() => {
                              const name = getAffiliateName(dep.lead_id);
                              return name ? <Badge variant="outline">{name}</Badge> : <span className="text-muted-foreground">—</span>;
                            })()}
                          </TableCell>
                          <TableCell>{formatCurrency(Number(dep.amount_cents))}</TableCell>
                          <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                          <TableCell>{format(new Date(dep.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                          <TableCell>{dep.confirmed_at ? format(new Date(dep.confirmed_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
              <Pagination page={page} totalPages={totalPages} total={filteredDeposits.length} onPrev={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Affiliate Withdrawals Tab */}
        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5" />
                Saques de Afiliados ({filteredWithdrawals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingWithdrawals ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : filteredWithdrawals.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nenhum saque de afiliado encontrado.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Afiliado</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Solicitado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(paged as typeof withdrawals).map((w) => {
                      const status = withdrawalStatusConfig[w.status] ?? { label: w.status, variant: "outline" as const };
                      return (
                        <TableRow key={w.id}>
                          <TableCell className="font-medium">{w.affiliate_name}</TableCell>
                          <TableCell>{w.affiliate_email}</TableCell>
                          <TableCell>{formatCurrencyDecimal(Number(w.amount))}</TableCell>
                          <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                          <TableCell>{format(new Date(w.requested_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
              <Pagination page={page} totalPages={totalPages} total={filteredWithdrawals.length} onPrev={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lead Withdrawals Tab */}
        <TabsContent value="lead-withdrawals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Saques de Jogadores ({filteredLeadWithdrawals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLeadWithdrawals ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : filteredLeadWithdrawals.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Nenhum saque de jogador encontrado.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jogador</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Chave PIX</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Solicitado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(paged as any[]).map((w) => {
                      const status = withdrawalStatusConfig[w.status] ?? { label: w.status, variant: "outline" as const };
                      const lead = w.leads as { name: string; phone: string } | null;
                      return (
                        <TableRow key={w.id}>
                          <TableCell className="font-medium">{lead?.name ?? "—"}</TableCell>
                          <TableCell>{lead?.phone ?? "—"}</TableCell>
                          <TableCell className="font-mono text-xs max-w-[200px] truncate">{w.pix_key}</TableCell>
                          <TableCell>{formatCurrency(Number(w.amount_cents))}</TableCell>
                          <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                          <TableCell>{format(new Date(w.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
              <Pagination page={page} totalPages={totalPages} total={filteredLeadWithdrawals.length} onPrev={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
