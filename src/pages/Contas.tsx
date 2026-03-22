import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Shield, Users, Gamepad2 } from "lucide-react";

type AccountRole = "admin" | "affiliate" | "player";

interface Account {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  status: "active" | "frozen";
  createdAt: string;
}

const MOCK_ACCOUNTS: Account[] = [
  { id: "a1", name: "Admin Principal", email: "admin@helixpay.com", role: "admin", status: "active", createdAt: "2025-01-10" },
  { id: "a2", name: "Suporte HelixPay", email: "suporte@helixpay.com", role: "admin", status: "active", createdAt: "2025-02-15" },
  { id: "f1", name: "Carlos Mendes", email: "carlos@email.com", role: "affiliate", status: "active", createdAt: "2025-06-20" },
  { id: "f2", name: "Ana Souza", email: "ana@email.com", role: "affiliate", status: "active", createdAt: "2025-07-05" },
  { id: "f3", name: "Pedro Lima", email: "pedro@email.com", role: "affiliate", status: "frozen", createdAt: "2025-08-12" },
  { id: "p1", name: "Lucas Ferreira", email: "lucas.f@gmail.com", role: "player", status: "active", createdAt: "2026-01-14" },
  { id: "p2", name: "Mariana Costa", email: "mari.costa@gmail.com", role: "player", status: "active", createdAt: "2026-01-22" },
  { id: "p3", name: "Rafael Oliveira", email: "rafa.oli@hotmail.com", role: "player", status: "active", createdAt: "2026-02-03" },
  { id: "p4", name: "Juliana Santos", email: "ju.santos@yahoo.com", role: "player", status: "frozen", createdAt: "2026-02-18" },
  { id: "p5", name: "Thiago Almeida", email: "thiago.alm@gmail.com", role: "player", status: "active", createdAt: "2026-03-01" },
  { id: "p6", name: "Beatriz Rocha", email: "bia.rocha@gmail.com", role: "player", status: "active", createdAt: "2026-03-10" },
];

const roleConfig: Record<AccountRole, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: "Administrador", icon: Shield, color: "text-amber-500" },
  affiliate: { label: "Afiliado", icon: Users, color: "text-primary" },
  player: { label: "Jogador", icon: Gamepad2, color: "text-emerald-500" },
};

function AccountRow({ account }: { account: Account }) {
  const cfg = roleConfig[account.role];
  const RoleIcon = cfg.icon;

  return (
    <tr className="border-b border-border/20 last:border-0 hover:bg-secondary/30 transition-colors">
      <td className="px-5 py-4">
        <p className="font-medium text-foreground">{account.name}</p>
        <p className="text-xs text-muted-foreground">{account.email}</p>
      </td>
      <td className="px-5 py-4">
        <span className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
          <RoleIcon className="h-3.5 w-3.5" />
          {cfg.label}
        </span>
      </td>
      <td className="px-5 py-4 text-muted-foreground text-sm">
        {new Date(account.createdAt).toLocaleDateString("pt-BR")}
      </td>
      <td className="px-5 py-4">
        <Badge variant={account.status === "active" ? "default" : "secondary"}>
          {account.status === "active" ? "Ativo" : "Congelado"}
        </Badge>
      </td>
    </tr>
  );
}

function AccountTable({ accounts }: { accounts: Account[] }) {
  if (accounts.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-muted-foreground">
        Nenhuma conta encontrada.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40 bg-secondary/50">
            <th className="text-left px-5 py-3 font-medium text-muted-foreground">Usuário</th>
            <th className="text-left px-5 py-3 font-medium text-muted-foreground">Tipo</th>
            <th className="text-left px-5 py-3 font-medium text-muted-foreground">Criado em</th>
            <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <AccountRow key={a.id} account={a} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Contas() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const filtered = MOCK_ACCOUNTS.filter((a) => {
    const matchesTab = tab === "all" || a.role === tab;
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const counts = {
    all: MOCK_ACCOUNTS.length,
    admin: MOCK_ACCOUNTS.filter((a) => a.role === "admin").length,
    affiliate: MOCK_ACCOUNTS.filter((a) => a.role === "affiliate").length,
    player: MOCK_ACCOUNTS.filter((a) => a.role === "player").length,
  };

  return (
    <div className="p-6 space-y-6 animate-reveal-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Todas as contas do sistema separadas por categoria
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary border-border/40"
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-secondary/60">
          <TabsTrigger value="all">Todas ({counts.all})</TabsTrigger>
          <TabsTrigger value="admin">Administradores ({counts.admin})</TabsTrigger>
          <TabsTrigger value="affiliate">Afiliados ({counts.affiliate})</TabsTrigger>
          <TabsTrigger value="player">Jogadores ({counts.player})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <Card className="bg-card border-border/60 overflow-hidden">
            <AccountTable accounts={filtered} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
