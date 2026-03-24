import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Shield, Users, Gamepad2, Loader2 } from "lucide-react";
import { useAdmins } from "@/hooks/useAdmins";
import { useAffiliates } from "@/hooks/useAffiliates";
import { useLeads } from "@/hooks/useLeads";

type AccountRole = "admin" | "affiliate" | "player";

interface AccountRow {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  status: string;
  createdAt: string;
}

const roleConfig: Record<AccountRole, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: "Administrador", icon: Shield, color: "text-amber-500" },
  affiliate: { label: "Afiliado", icon: Users, color: "text-primary" },
  player: { label: "Jogador", icon: Gamepad2, color: "text-emerald-500" },
};

function AccountRowComponent({ account }: { account: AccountRow }) {
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

function AccountTable({ accounts }: { accounts: AccountRow[] }) {
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
            <AccountRowComponent key={a.id} account={a} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Contas() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const { data: admins = [], isLoading: loadingAdmins } = useAdmins();
  const { data: affiliates = [], isLoading: loadingAffiliates } = useAffiliates();
  const { data: leads = [], isLoading: loadingLeads } = useLeads();

  const isLoading = loadingAdmins || loadingAffiliates || loadingLeads;

  // Merge admins + affiliates into unified account list
  const allAccounts: AccountRow[] = [
    ...admins.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      role: "admin" as AccountRole,
      status: a.status,
      createdAt: a.created_at,
    })),
    ...affiliates.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      role: "affiliate" as AccountRole,
      status: a.status,
      createdAt: a.created_at,
    })),
    ...leads.map((l) => ({
      id: l.id,
      name: l.name || "Sem nome",
      email: l.phone || "—",
      role: "player" as AccountRole,
      status: "active",
      createdAt: l.created_at,
    })),
  ];

  const filtered = allAccounts.filter((a) => {
    const matchesTab = tab === "all" || a.role === tab;
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const counts = {
    all: allAccounts.length,
    admin: allAccounts.filter((a) => a.role === "admin").length,
    affiliate: allAccounts.filter((a) => a.role === "affiliate").length,
    player: allAccounts.filter((a) => a.role === "player").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
