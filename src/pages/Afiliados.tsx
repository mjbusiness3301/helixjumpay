import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  ArrowLeft,
  CalendarDays,
  MousePointerClick,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalRegistrations: number;
  totalDeposits: number;
  depositValue: number;
  balance: number;
  commission: number;
  status: "active" | "inactive";
  joinedAt: string;
  trend: number;
}

const MOCK_AFFILIATES: Affiliate[] = [
  {
    id: "1",
    name: "Carlos Mendes",
    email: "carlos@email.com",
    phone: "(11) 98765-4321",
    totalRegistrations: 147,
    totalDeposits: 89,
    depositValue: 23450.0,
    balance: 3120.5,
    commission: 15,
    status: "active",
    joinedAt: "2024-01-15",
    trend: 12.4,
  },
  {
    id: "2",
    name: "Ana Oliveira",
    email: "ana@email.com",
    phone: "(21) 91234-5678",
    totalRegistrations: 203,
    totalDeposits: 134,
    depositValue: 41280.0,
    balance: 5430.0,
    commission: 12,
    status: "active",
    joinedAt: "2024-02-08",
    trend: 18.7,
  },
  {
    id: "3",
    name: "Rafael Costa",
    email: "rafael@email.com",
    phone: "(31) 99876-5432",
    totalRegistrations: 56,
    totalDeposits: 28,
    depositValue: 7890.0,
    balance: 940.0,
    commission: 10,
    status: "inactive",
    joinedAt: "2024-03-22",
    trend: -5.2,
  },
  {
    id: "4",
    name: "Juliana Santos",
    email: "juliana@email.com",
    phone: "(41) 93456-7890",
    totalRegistrations: 312,
    totalDeposits: 198,
    depositValue: 67340.0,
    balance: 8720.0,
    commission: 18,
    status: "active",
    joinedAt: "2023-11-05",
    trend: 24.1,
  },
  {
    id: "5",
    name: "Pedro Almeida",
    email: "pedro@email.com",
    phone: "(51) 97654-3210",
    totalRegistrations: 91,
    totalDeposits: 52,
    depositValue: 14670.0,
    balance: 1890.0,
    commission: 8,
    status: "active",
    joinedAt: "2024-04-10",
    trend: 8.3,
  },
  {
    id: "6",
    name: "Mariana Lima",
    email: "mariana@email.com",
    phone: "(61) 92345-6789",
    totalRegistrations: 28,
    totalDeposits: 11,
    depositValue: 2340.0,
    balance: 310.0,
    commission: 5,
    status: "inactive",
    joinedAt: "2024-05-18",
    trend: -12.8,
  },
];

function generateHourlyData() {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, "0")}:00`,
    cadastros: Math.floor(Math.random() * 15) + 1,
    depositos: Math.floor(Math.random() * 10),
  }));
}

function AffiliateDashboard({
  affiliate,
  onBack,
}: {
  affiliate: Affiliate;
  onBack: () => void;
}) {
  const hourlyData = generateHourlyData();

  const stats = [
    {
      label: "Cadastros",
      value: affiliate.totalRegistrations,
      icon: Users,
      trend: affiliate.trend,
      format: (v: number) => v.toLocaleString("pt-BR"),
    },
    {
      label: "Depósitos",
      value: affiliate.totalDeposits,
      icon: MousePointerClick,
      trend: affiliate.trend * 0.8,
      format: (v: number) => v.toLocaleString("pt-BR"),
    },
    {
      label: "Valor de Depósitos",
      value: affiliate.depositValue,
      icon: DollarSign,
      trend: affiliate.trend * 1.2,
      format: (v: number) =>
        v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    },
    {
      label: "Saldo",
      value: affiliate.balance,
      icon: Wallet,
      trend: affiliate.trend * 0.5,
      format: (v: number) =>
        v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    },
  ];

  const chartConfig = {
    cadastros: { label: "Cadastros", color: "hsl(var(--primary))" },
    depositos: { label: "Depósitos", color: "hsl(142 71% 45%)" },
  };

  return (
    <div className="p-6 space-y-6 animate-reveal-up">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {affiliate.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {affiliate.email} · Desde{" "}
            {new Date(affiliate.joinedAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <span
          className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full ${
            affiliate.status === "active"
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {affiliate.status === "active" ? "Ativo" : "Inativo"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const isPositive = stat.trend >= 0;
          return (
            <Card
              key={stat.label}
              className="bg-card border-border/60 hover:border-primary/30 transition-colors"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stat.format(stat.value)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-primary" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-destructive" />
                  )}
                  <span
                    className={`text-xs font-medium ${isPositive ? "text-primary" : "text-destructive"}`}
                  >
                    {isPositive ? "+" : ""}
                    {stat.trend.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-card border-border/60">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Atividade por Horário
          </h3>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="afGradCad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="afGradDep" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(142 71% 45%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(142 71% 45%)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
              />
              <XAxis
                dataKey="hour"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="cadastros"
                stroke="hsl(var(--primary))"
                fill="url(#afGradCad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="depositos"
                stroke="hsl(142 71% 45%)"
                fill="url(#afGradDep)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Afiliados() {
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ name: "", email: "", commission: "" });

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setStep(1);
      setForm({ name: "", email: "", commission: "" });
    }
  };

  if (selectedAffiliate) {
    return (
      <AffiliateDashboard
        affiliate={selectedAffiliate}
        onBack={() => setSelectedAffiliate(null)}
      />
    );
  }

  return (
    <div className="p-6 space-y-6 animate-reveal-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Afiliados</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie seus afiliados e acompanhe o desempenho
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Cadastrar Afiliado
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>
                {step === 1 ? "Novo Afiliado" : "Comissão por Depósito"}
              </DialogTitle>
            </DialogHeader>

            {step === 1 ? (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="af-name">Nome</Label>
                  <Input
                    id="af-name"
                    placeholder="Nome completo"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="af-email">E-mail</Label>
                  <Input
                    id="af-email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => setStep(2)}
                  disabled={!form.name.trim() || !form.email.trim()}
                >
                  Próximo
                </Button>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  Defina a porcentagem que <strong className="text-foreground">{form.name}</strong> irá ganhar sobre cada depósito.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="af-commission">Comissão (%)</Label>
                  <div className="relative">
                    <Input
                      id="af-commission"
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="Ex: 10"
                      value={form.commission}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, commission: e.target.value }))
                      }
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    Voltar
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!form.commission}
                    onClick={() => {
                      handleDialogChange(false);
                    }}
                  >
                    Cadastrar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_AFFILIATES.map((affiliate) => {
          const isPositive = affiliate.trend >= 0;
          return (
            <Card
              key={affiliate.id}
              className="bg-card border-border/60 hover:border-primary/30 cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/5 group"
              onClick={() => setSelectedAffiliate(affiliate)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {affiliate.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {affiliate.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {affiliate.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      affiliate.status === "active"
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {affiliate.status === "active" ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                      Cadastros
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {affiliate.totalRegistrations.toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                      Depósitos
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {affiliate.totalDeposits.toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                      Comissão
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {affiliate.commission}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                      Valor Dep.
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {affiliate.depositValue.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                      Saldo
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {affiliate.balance.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                      Lucro
                    </p>
                    <p className="text-sm font-bold text-primary">
                      {(affiliate.depositValue * (affiliate.commission / 100)).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/40">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-primary" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-destructive" />
                  )}
                  <span
                    className={`text-xs font-medium ${isPositive ? "text-primary" : "text-destructive"}`}
                  >
                    {isPositive ? "+" : ""}
                    {affiliate.trend.toFixed(1)}% vs ontem
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
