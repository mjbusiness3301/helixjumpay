import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Users,
  Wallet,
  DollarSign,
  CalendarDays,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useHourlyChartData } from "@/hooks/useActivityLogs";

type FilterType = "today" | "yesterday" | "7days" | "custom";

const chartConfig = {
  cadastros: {
    label: "Cadastros",
    color: "hsl(152 60% 48%)",
  },
  depositos: {
    label: "Depósitos",
    color: "hsl(38 92% 50%)",
  },
};

const Dashboard = () => {
  const [filter, setFilter] = useState<FilterType>("today");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { data: stats, isLoading } = useDashboardStats({
    filter,
    from: dateRange?.from,
    to: dateRange?.to,
  });
  const chartDateRange = useMemo(() => {
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
    const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();

    switch (filter) {
      case "today":
        return { from: startOfDay(now), to: endOfDay(now) };
      case "yesterday": {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        return { from: startOfDay(y), to: endOfDay(y) };
      }
      case "7days": {
        const s = new Date(now);
        s.setDate(s.getDate() - 6);
        return { from: startOfDay(s), to: endOfDay(now) };
      }
      case "custom":
        if (dateRange?.from && dateRange?.to) {
          return { from: startOfDay(dateRange.from), to: endOfDay(dateRange.to) };
        }
        return { from: startOfDay(now), to: endOfDay(now) };
    }
  }, [filter, dateRange]);

  const { hourlyData } = useHourlyChartData(undefined, chartDateRange.from, chartDateRange.to);

  const totalCadastros = stats?.totalCadastros ?? 0;
  const totalDepositos = stats?.totalDepositos ?? 0;
  const totalValorDepositos = stats?.totalValorDepositos ?? 0;
  const totalSaldo = stats?.totalSaldo ?? 0;
  const lucro = stats?.lucro ?? 0;
  const totalComissoes = stats?.totalComissoes ?? 0;

  const filterLabels: Record<FilterType, string> = {
    today: "Hoje",
    yesterday: "Ontem",
    "7days": "Últimos 7 dias",
    custom: "Personalizado",
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

  const statCards = [
    {
      title: "Total de Cadastros",
      value: totalCadastros.toLocaleString("pt-BR"),
      icon: Users,
      color: "text-primary",
      bgIcon: "bg-primary/10",
    },
    {
      title: "Total de Depósitos",
      value: totalDepositos.toLocaleString("pt-BR"),
      icon: Wallet,
      color: "text-warning",
      bgIcon: "bg-[hsl(var(--warning)/0.1)]",
    },
    {
      title: "Valor de Depósitos",
      value: `R$ ${totalValorDepositos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-[hsl(200_80%_55%)]",
      bgIcon: "bg-[hsl(200_80%_55%/0.1)]",
    },
    {
      title: "Lucro Líquido",
      value: `R$ ${lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: lucro >= 0 ? "text-primary" : "text-destructive",
      bgIcon: lucro >= 0 ? "bg-primary/10" : "bg-destructive/10",
      subtitle: totalComissoes > 0 ? `Comissões: R$ ${totalComissoes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : undefined,
    },
    {
      title: "Saldo em Contas",
      value: `R$ ${totalSaldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-foreground",
      bgIcon: "bg-secondary",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 animate-reveal-up">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acompanhe suas métricas em tempo real</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 animate-reveal-up opacity-0 animation-delay-100">
        {(["today", "yesterday", "7days"] as FilterType[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterClick(f)}
            className="transition-all duration-200"
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
              className="transition-all duration-200"
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

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card, i) => (
          <Card
            key={card.title}
            className="border-border bg-card/80 backdrop-blur-sm opacity-0 animate-reveal-up hover:border-primary/20 transition-all duration-300"
            style={{ animationDelay: `${160 + i * 80}ms` }}
          >
            <CardContent className="flex items-start justify-between p-5">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                  {card.value}
                </p>
              </div>
              <div className={`rounded-xl p-2.5 ${card.bgIcon}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border bg-card/80 backdrop-blur-sm opacity-0 animate-reveal-up animation-delay-400">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Atividade por Horário</h2>
              <p className="text-xs text-muted-foreground">Cadastros e depósitos ao longo do dia</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Cadastros</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--warning))]" />
                <span className="text-xs text-muted-foreground">Depósitos</span>
              </div>
            </div>
          </div>

          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart data={hourlyData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCadastros" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(152 60% 48%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(152 60% 48%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDepositos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(38 92% 50%)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(38 92% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220 14% 18%)" />
              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} interval={2} />
              <YAxis hide />
              <ChartTooltip content={<ChartTooltipContent />} cursor={{ stroke: "hsl(152 60% 48% / 0.2)" }} />
              <Area type="monotone" dataKey="cadastros" stroke="hsl(152 60% 48%)" strokeWidth={2} fill="url(#gradCadastros)" />
              <Area type="monotone" dataKey="depositos" stroke="hsl(38 92% 50%)" strokeWidth={2} fill="url(#gradDepositos)" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
