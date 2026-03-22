import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

type FilterType = "today" | "yesterday" | "7days" | "custom";

const generateHourlyData = () => {
  const hours = [];
  for (let i = 0; i < 24; i++) {
    hours.push({
      hour: `${String(i).padStart(2, "0")}:00`,
      cadastros: Math.floor(Math.random() * 18 + 2),
      depositos: Math.floor(Math.random() * 12 + 1),
    });
  }
  return hours;
};

const MOCK_STATS = {
  today: { cadastros: 147, depositos: 63, saldo: 12847.5, valorDepositos: 8420.0, lucro: 2526.0 },
  yesterday: { cadastros: 132, depositos: 58, saldo: 11230.0, valorDepositos: 7350.0, lucro: 2205.0 },
  "7days": { cadastros: 891, depositos: 412, saldo: 78450.25, valorDepositos: 54230.75, lucro: 16269.23 },
  custom: { cadastros: 2341, depositos: 1087, saldo: 198320.0, valorDepositos: 142870.5, lucro: 42861.15 },
};

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

  const stats = MOCK_STATS[filter];
  const hourlyData = useMemo(() => generateHourlyData(), [filter]);

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

  const prevStats = MOCK_STATS.yesterday;
  const cadastroDiff =
    filter === "today"
      ? ((stats.cadastros - prevStats.cadastros) / prevStats.cadastros) * 100
      : 0;
  const depositoDiff =
    filter === "today"
      ? ((stats.depositos - prevStats.depositos) / prevStats.depositos) * 100
      : 0;

  const valorDepDiff =
    filter === "today"
      ? ((stats.valorDepositos - prevStats.valorDepositos) / prevStats.valorDepositos) * 100
      : 0;

  const lucroDiff =
    filter === "today"
      ? ((stats.lucro - prevStats.lucro) / prevStats.lucro) * 100
      : 0;

  const statCards = [
    {
      title: "Total de Cadastros",
      value: stats.cadastros.toLocaleString("pt-BR"),
      icon: Users,
      diff: cadastroDiff,
      color: "text-primary",
      bgIcon: "bg-primary/10",
    },
    {
      title: "Total de Depósitos",
      value: stats.depositos.toLocaleString("pt-BR"),
      icon: Wallet,
      diff: depositoDiff,
      color: "text-warning",
      bgIcon: "bg-[hsl(var(--warning)/0.1)]",
    },
    {
      title: "Valor de Depósitos",
      value: `R$ ${stats.valorDepositos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      diff: valorDepDiff,
      color: "text-[hsl(200_80%_55%)]",
      bgIcon: "bg-[hsl(200_80%_55%/0.1)]",
    },
    {
      title: "Saldo em Contas",
      value: `R$ ${stats.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      diff: null,
      color: "text-foreground",
      bgIcon: "bg-secondary",
    },
    {
      title: "Lucro Total",
      value: `R$ ${stats.lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      diff: lucroDiff,
      color: "text-primary",
      bgIcon: "bg-primary/10",
    },
  ];

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
        {/* Greeting + Filters */}
        <div className="mb-8 animate-reveal-up">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe suas métricas em tempo real
          </p>
        </div>

        {/* Date Filters */}
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

        {/* Stat Cards */}
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
                  {card.diff !== null && card.diff !== 0 && (
                    <div
                      className={`flex items-center gap-1 text-xs font-medium ${
                        card.diff > 0 ? "text-primary" : "text-destructive"
                      }`}
                    >
                      {card.diff > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{Math.abs(card.diff).toFixed(1)}% vs ontem</span>
                    </div>
                  )}
                </div>
                <div className={`rounded-xl p-2.5 ${card.bgIcon}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart */}
        <Card className="border-border bg-card/80 backdrop-blur-sm opacity-0 animate-reveal-up animation-delay-400">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Atividade por Horário
                </h2>
                <p className="text-xs text-muted-foreground">
                  Cadastros e depósitos ao longo do dia
                </p>
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
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(220 14% 18%)"
                />
                <XAxis
                  dataKey="hour"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  interval={2}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={{ stroke: "hsl(152 60% 48% / 0.2)" }}
                />
                <Area
                  type="monotone"
                  dataKey="cadastros"
                  stroke="hsl(152 60% 48%)"
                  strokeWidth={2}
                  fill="url(#gradCadastros)"
                />
                <Area
                  type="monotone"
                  dataKey="depositos"
                  stroke="hsl(38 92% 50%)"
                  strokeWidth={2}
                  fill="url(#gradDepositos)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
    </div>
  );
};

export default Dashboard;
