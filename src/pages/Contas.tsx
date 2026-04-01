import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Search, Shield, Users, Gamepad2, Loader2, ShieldPlus, Coins, MinusCircle, Star } from "lucide-react";
import { useAdmins } from "@/hooks/useAdmins";
import { useAffiliates } from "@/hooks/useAffiliates";
import { useLeads } from "@/hooks/useLeads";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type AccountRole = "admin" | "affiliate" | "player";

interface AccountRow {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  status: string;
  createdAt: string;
  userId?: string | null;
  balanceCents?: number;
  isInfluencer?: boolean;
}

const roleConfig: Record<AccountRole, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: "Administrador", icon: Shield, color: "text-amber-500" },
  affiliate: { label: "Afiliado", icon: Users, color: "text-primary" },
  player: { label: "Jogador", icon: Gamepad2, color: "text-emerald-500" },
};

function AccountRowComponent({
  account,
  onMakeAdmin,
  onAddBalance,
  onRemoveBalance,
  onToggleInfluencer,
}: {
  account: AccountRow;
  onMakeAdmin: (account: AccountRow) => void;
  onAddBalance: (account: AccountRow) => void;
  onRemoveBalance: (account: AccountRow) => void;
  onToggleInfluencer: (account: AccountRow) => void;
}) {
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
      {account.role === "player" && (
        <td className="px-5 py-4 text-foreground text-sm font-medium">
          R$ {((account.balanceCents || 0) / 100).toFixed(2)}
        </td>
      )}
      {account.role !== "player" && (
        <td className="px-5 py-4">
          <Badge variant={account.status === "active" ? "default" : "secondary"}>
            {account.status === "active" ? "Ativo" : "Congelado"}
          </Badge>
        </td>
      )}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          {account.role !== "admin" && account.role === "affiliate" && account.userId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMakeAdmin(account)}
              className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
              title="Tornar Administrador"
            >
              <ShieldPlus className="h-4 w-4" />
            </Button>
          )}
          {account.role === "player" && (
            <>
              <div className="flex items-center gap-1.5" title={account.isInfluencer ? "Influencer (clique para remover)" : "Marcar como Influencer"}>
                <Star className={`h-3.5 w-3.5 ${account.isInfluencer ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
                <Switch
                  checked={!!account.isInfluencer}
                  onCheckedChange={() => onToggleInfluencer(account)}
                  className="scale-75"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddBalance(account)}
                className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                title="Adicionar Saldo"
              >
                <Coins className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveBalance(account)}
                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                title="Remover Saldo"
              >
                <MinusCircle className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function AccountTable({
  accounts,
  onMakeAdmin,
  onAddBalance,
  onRemoveBalance,
  onToggleInfluencer,
}: {
  accounts: AccountRow[];
  onMakeAdmin: (account: AccountRow) => void;
  onAddBalance: (account: AccountRow) => void;
  onRemoveBalance: (account: AccountRow) => void;
  onToggleInfluencer: (account: AccountRow) => void;
}) {
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
            <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status / Saldo</th>
            <th className="text-left px-5 py-3 font-medium text-muted-foreground">Ações</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <AccountRowComponent
              key={a.id}
              account={a}
              onMakeAdmin={onMakeAdmin}
              onAddBalance={onAddBalance}
              onRemoveBalance={onRemoveBalance}
              onToggleInfluencer={onToggleInfluencer}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Contas() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [makeAdminTarget, setMakeAdminTarget] = useState<AccountRow | null>(null);
  const [makingAdmin, setMakingAdmin] = useState(false);
  const [balanceTarget, setBalanceTarget] = useState<AccountRow | null>(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [addingBalance, setAddingBalance] = useState(false);
  const [removeBalanceTarget, setRemoveBalanceTarget] = useState<AccountRow | null>(null);
  const [removeAmount, setRemoveAmount] = useState("");
  const [removingBalance, setRemovingBalance] = useState(false);
  const [togglingInfluencer, setTogglingInfluencer] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: admins = [], isLoading: loadingAdmins } = useAdmins();
  const { data: affiliates = [], isLoading: loadingAffiliates } = useAffiliates();
  const { data: leads = [], isLoading: loadingLeads } = useLeads();

  const isLoading = loadingAdmins || loadingAffiliates || loadingLeads;

  const allAccounts: AccountRow[] = [
    ...admins.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      role: "admin" as AccountRole,
      status: a.status,
      createdAt: a.created_at,
      userId: a.user_id,
    })),
    ...affiliates.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      role: "affiliate" as AccountRole,
      status: a.status,
      createdAt: a.created_at,
      userId: a.user_id,
    })),
    ...leads.map((l) => ({
      id: l.id,
      name: l.name || "Sem nome",
      email: l.phone || "—",
      role: "player" as AccountRole,
      status: "active",
      createdAt: l.created_at,
      userId: null,
      balanceCents: l.balance_cents,
      isInfluencer: !!l.is_influencer,
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

  const handleMakeAdmin = async () => {
    if (!makeAdminTarget || !makeAdminTarget.userId) return;
    setMakingAdmin(true);
    try {
      const { error } = await supabase.from("admins").insert({
        user_id: makeAdminTarget.userId,
        name: makeAdminTarget.name,
        email: makeAdminTarget.email,
      });
      if (error) throw error;
      toast.success(`${makeAdminTarget.name} agora é administrador!`);
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      setMakeAdminTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Erro ao tornar administrador");
    } finally {
      setMakingAdmin(false);
    }
  };

  const handleAddBalance = async () => {
    if (!balanceTarget) return;
    const cents = Math.round(parseFloat(balanceAmount) * 100);
    if (isNaN(cents) || cents <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    setAddingBalance(true);
    try {
      const { error } = await supabase.rpc("increment_balance", {
        p_lead_id: balanceTarget.id,
        p_amount: cents,
      });
      if (error) throw error;
      toast.success(`R$ ${parseFloat(balanceAmount).toFixed(2)} adicionado ao saldo de ${balanceTarget.name}`);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setBalanceTarget(null);
      setBalanceAmount("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar saldo");
    } finally {
      setAddingBalance(false);
    }
  };

  const handleRemoveBalance = async () => {
    if (!removeBalanceTarget) return;
    const cents = Math.round(parseFloat(removeAmount) * 100);
    if (isNaN(cents) || cents <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    if (cents > (removeBalanceTarget.balanceCents || 0)) {
      toast.error("Valor maior que o saldo disponível");
      return;
    }
    setRemovingBalance(true);
    try {
      const { error } = await supabase.rpc("deduct_balance", {
        p_lead_id: removeBalanceTarget.id,
        p_amount: cents,
      });
      if (error) throw error;
      toast.success(`R$ ${parseFloat(removeAmount).toFixed(2)} removido do saldo de ${removeBalanceTarget.name}`);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setRemoveBalanceTarget(null);
      setRemoveAmount("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover saldo");
    } finally {
      setRemovingBalance(false);
    }
  };

  const handleToggleInfluencer = async (account: AccountRow) => {
    setTogglingInfluencer(account.id);
    try {
      const newValue = !account.isInfluencer;
      const { error } = await supabase
        .from("leads")
        .update({ is_influencer: newValue })
        .eq("id", account.id);
      if (error) throw error;
      toast.success(
        newValue
          ? `${account.name} agora é Influencer (modo fácil)`
          : `${account.name} voltou ao modo normal`
      );
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar status de influencer");
    } finally {
      setTogglingInfluencer(null);
    }
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
            <AccountTable
              accounts={filtered}
              onMakeAdmin={setMakeAdminTarget}
              onAddBalance={setBalanceTarget}
              onRemoveBalance={setRemoveBalanceTarget}
              onToggleInfluencer={handleToggleInfluencer}
            />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Tornar Admin */}
      <Dialog open={!!makeAdminTarget} onOpenChange={(open) => !open && setMakeAdminTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tornar Administrador</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja tornar <strong>{makeAdminTarget?.name}</strong> ({makeAdminTarget?.email}) um administrador? Essa conta terá acesso total ao painel admin.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMakeAdminTarget(null)}>Cancelar</Button>
            <Button onClick={handleMakeAdmin} disabled={makingAdmin}>
              {makingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldPlus className="h-4 w-4" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Adicionar Saldo */}
      <Dialog open={!!balanceTarget} onOpenChange={(open) => { if (!open) { setBalanceTarget(null); setBalanceAmount(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Saldo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-1">
            Adicionar saldo para <strong>{balanceTarget?.name}</strong>
          </p>
          <p className="text-xs text-muted-foreground mb-2">
            Saldo atual: <strong className="text-foreground">R$ {((balanceTarget?.balanceCents || 0) / 100).toFixed(2)}</strong>
          </p>
          <div className="space-y-2">
            <Label htmlFor="balance-amount">Valor (R$)</Label>
            <Input
              id="balance-amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={balanceAmount}
              onChange={(e) => setBalanceAmount(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBalanceTarget(null); setBalanceAmount(""); }}>Cancelar</Button>
            <Button onClick={handleAddBalance} disabled={addingBalance}>
              {addingBalance ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Remover Saldo */}
      <Dialog open={!!removeBalanceTarget} onOpenChange={(open) => { if (!open) { setRemoveBalanceTarget(null); setRemoveAmount(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Saldo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-2">
            Remover saldo de <strong>{removeBalanceTarget?.name}</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            Saldo atual: <strong className="text-foreground">R$ {((removeBalanceTarget?.balanceCents || 0) / 100).toFixed(2)}</strong>
          </p>
          <div className="space-y-2">
            <Label htmlFor="remove-amount">Valor a remover (R$)</Label>
            <Input
              id="remove-amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={removeAmount}
              onChange={(e) => setRemoveAmount(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRemoveBalanceTarget(null); setRemoveAmount(""); }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRemoveBalance} disabled={removingBalance}>
              {removingBalance ? <Loader2 className="h-4 w-4 animate-spin" /> : <MinusCircle className="h-4 w-4" />}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
