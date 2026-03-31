import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  Wallet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowDownToLine,
  Link2,
  Copy,
  Check,
  Loader2,
  CalendarDays,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { useAuth } from "@/contexts/AuthContext";
import { useCompliance } from "@/contexts/ComplianceContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCreateWithdrawal } from "@/hooks/useWithdrawals";
import { useToast } from "@/hooks/use-toast";
import { useHourlyChartData } from "@/hooks/useActivityLogs";
import type { Affiliate } from "@/types/database";

type FilterType = "today" | "yesterday" | "7days" | "custom";

const chartConfig = {
  cadastros: { label: "Cadastros", color: "hsl(var(--primary))" },
  depositos: { label: "Depósitos", color: "hsl(142 71% 45%)" },
};

const filterLabels: Record<FilterType, string> = {
  today: "Hoje",
  yesterday: "Ontem",
  "7days": "Últimos 7 dias",
  custom: "Personalizado",
};

export default function AffiliateDashboard() {
  const { user } = useAuth();
  const { complianceAffiliate, isComplianceMode } = useCompliance();
  const { toast } = useToast();
  const [withdrawDialog, setWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<FilterType>("today");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const createWithdrawal = useCreateWithdrawal();

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

  // Compute date range for filtering
  const dateFilterRange = useMemo(() => {
    const now = new Date();
    const sod = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
    const eod = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();
    switch (filter) {
      case "today":
        return { from: sod(now), to: eod(now) };
      case "yesterday": {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        return { from: sod(y), to: eod(y) };
      }
      case "7days": {
        const s = new Date(now);
        s.setDate(s.getDate() - 6);
        return { from: sod(s), to: eod(now) };
      }
      case "custom":
        if (dateRange?.from && dateRange?.to) {
          return { from: sod(dateRange.from), to: eod(dateRange.to) };
        }
        return { from: sod(now), to: eod(now) };
    }
  }, [filter, dateRange]);

  // Fetch real stats from leads + deposits tables
  const { data: realStats } = useQuery({
    queryKey: ["affiliate-real-stats", affiliate?.id, dateFilterRange.from, dateFilterRange.to],
    queryFn: async () => {
      const [leadsRes, depositsRes] = await Promise.all([
        supabase
          .from("leads")
          .select("id", { count: "exact" })
          .eq("affiliate_id", affiliate!.id)
          .gte("created_at", dateFilterRange.from)
          .lte("created_at", dateFilterRange.to),
        supabase
          .from("deposits")
          .select("amount_cents, status, lead_id")
          .gte("created_at", dateFilterRange.from)
          .lte("created_at", dateFilterRange.to),
      ]);

      if (leadsRes.error) throw leadsRes.error;
      if (depositsRes.error) throw depositsRes.error;

      // Get affiliate's lead IDs to filter deposits
      const { data: affLeads } = await supabase
        .from("leads")
        .select("id")
        .eq("affiliate_id", affiliate!.id);

      const affLeadIds = new Set((affLeads || []).map((l) => l.id));
      const affDeposits = (depositsRes.data || []).filter(
        (d) => d.lead_id && affLeadIds.has(d.lead_id) && d.status === "confirmed"
      );

      const totalRegistrations = leadsRes.count ?? 0;
      const totalDeposits = affDeposits.length;
      const depositValue = affDeposits.reduce((s, d) => s + Number(d.amount_cents), 0) / 100;

      return { totalRegistrations, totalDeposits, depositValue };
    },
    enabled: !!affiliate?.id,
  });

  const { hourlyData } = useHourlyChartData(affiliate?.id, dateFilterRange.from, dateFilterRange.to);

  if (isLoading || !affiliate) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const referralLink = `https://helixjumpay.online?ref=${affiliate.ref_code || affiliate.id}`;
  const balance = Number(affiliate.balance);
  const pendingBalance = Number(affiliate.pending_balance || 0);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = async () => {
    try {
      await createWithdrawal.mutateAsync({
        affiliate_id: affiliate.id,
        affiliate_name: affiliate.name,
        affiliate_email: affiliate.email,
        amount: Number(withdrawAmount),
      });
      toast({ title: "Solicitação de saque enviada!" });
      setWithdrawDialog(false);
      setWithdrawAmount("");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleFilterClick = (f: FilterType) => {
    if (f === "custom") {
      setCalendarOpen(true);
    } else {
      setFilter(f);
      setCalendarOpen(false);
    }
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setFilter("custom");
      setCalendarOpen(false);
    }
  };

  const totalReg = realStats?.totalRegistrations ?? 0;
  const totalDep = realStats?.totalDeposits ?? 0;
  const depValue = realStats?.depositValue ?? 0;
  const earningsCalc = depValue * (Number(affiliate.commission) / 100);

  const stats = [
    {
      label: "Cadastros",
      value: totalReg.toLocaleString("pt-BR"),
      icon: Users,
      trend: null,
    },
    {
      label: "Depósitos",
      value: totalDep.toLocaleString("pt-BR"),
      icon: Wallet,
      trend: null,
    },
    {
      label: "Ganhos",
      value: earningsCalc.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      icon: DollarSign,
      trend: null,
    },
    {
      label: "Saldo Disponível",
      value: balance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      icon: Wallet,
      trend: null,
      subtitle: pendingBalance > 0
        ? `+ ${pendingBalance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} pendente`
        : undefined,
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-reveal-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Olá, {affiliate.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            <span className="font-mono">ID: {affiliate.display_id}</span> · Acompanhe seu desempenho e ganhos
          </p>
        </div>
        {!isComplianceMode && (
          <Button className="gap-2" onClick={() => setWithdrawDialog(true)}>
            <ArrowDownToLine className="h-4 w-4" />
            Solicitar Saque
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(["today", "yesterday", "7days"] as FilterType[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterClick(f)}
          >
            {filterLabels[f]}
          </Button>
        ))}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={filter === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterClick("custom")}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {filter === "custom" && dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, "dd/MM", { locale: ptBR })} - ${format(dateRange.to, "dd/MM", { locale: ptBR })}`
                : "Personalizado"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateSelect}
              locale={ptBR}
              numberOfMonths={1}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <Card className="bg-card border-border/60">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <Link2 className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Seu Link de Divulgação</h3>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary">
              {affiliate.commission}% de comissão
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg bg-secondary px-4 py-2.5 text-sm text-foreground font-mono truncate border border-border/40">
              {referralLink}
            </div>
            <Button variant="outline" size="icon" className="shrink-0 h-10 w-10" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const isPositive = stat.trend !== null && stat.trend >= 0;
          return (
            <Card key={stat.label} className="bg-card border-border/60 hover:border-primary/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                {(stat as any).subtitle && (
                  <p className="text-xs text-amber-400 mt-1">{(stat as any).subtitle}</p>
                )}
                {stat.trend !== null && (
                  <div className="flex items-center gap-1 mt-2">
                    {isPositive ? <TrendingUp className="h-3 w-3 text-primary" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
                    <span className={`text-xs font-medium ${isPositive ? "text-primary" : "text-destructive"}`}>
                      {isPositive ? "+" : ""}{stat.trend.toFixed(1)}% vs ontem
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-card border-border/60">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Atividade por Horário</h3>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="affGradCad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="affGradDep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="hour" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="cadastros" stroke="hsl(var(--primary))" fill="url(#affGradCad)" strokeWidth={2} />
              <Area type="monotone" dataKey="depositos" stroke="hsl(142 71% 45%)" fill="url(#affGradDep)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Dialog open={withdrawDialog} onOpenChange={setWithdrawDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Solicitar Saque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Saldo disponível: <strong className="text-foreground">
                {balance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Valor do saque</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <Input
                  id="withdraw-amount"
                  type="number"
                  min="0"
                  max={balance}
                  step="0.01"
                  placeholder="0,00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              className="w-full"
              disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > balance || createWithdrawal.isPending}
              onClick={handleWithdraw}
            >
              {createWithdrawal.isPending ? "Enviando..." : "Solicitar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
