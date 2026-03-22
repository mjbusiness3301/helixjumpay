import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArrowDownToLine, CheckCircle2, XCircle, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type WithdrawalStatus = "pending" | "approved" | "rejected";

interface Withdrawal {
  id: string;
  affiliateName: string;
  affiliateEmail: string;
  amount: number;
  requestedAt: string;
  status: WithdrawalStatus;
}

const MOCK_WITHDRAWALS: Withdrawal[] = [
  { id: "w1", affiliateName: "Carlos Mendes", affiliateEmail: "carlos@email.com", amount: 1250.00, requestedAt: "2026-03-22T14:30:00", status: "pending" },
  { id: "w2", affiliateName: "Ana Souza", affiliateEmail: "ana@email.com", amount: 870.50, requestedAt: "2026-03-22T10:15:00", status: "pending" },
  { id: "w3", affiliateName: "Carlos Mendes", affiliateEmail: "carlos@email.com", amount: 2100.00, requestedAt: "2026-03-21T18:45:00", status: "approved" },
  { id: "w4", affiliateName: "Pedro Lima", affiliateEmail: "pedro@email.com", amount: 450.00, requestedAt: "2026-03-21T09:20:00", status: "rejected" },
  { id: "w5", affiliateName: "Ana Souza", affiliateEmail: "ana@email.com", amount: 1680.00, requestedAt: "2026-03-20T16:00:00", status: "approved" },
  { id: "w6", affiliateName: "Pedro Lima", affiliateEmail: "pedro@email.com", amount: 320.75, requestedAt: "2026-03-19T11:30:00", status: "pending" },
];

const statusConfig: Record<WithdrawalStatus, { label: string; variant: "default" | "secondary" | "destructive"; icon: typeof Clock }> = {
  pending: { label: "Pendente", variant: "secondary", icon: Clock },
  approved: { label: "Aprovado", variant: "default", icon: CheckCircle2 },
  rejected: { label: "Rejeitado", variant: "destructive", icon: XCircle },
};

export default function Saques() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(MOCK_WITHDRAWALS);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const { toast } = useToast();

  const filtered = withdrawals.filter((w) => {
    const matchesStatus = filter === "all" || w.status === filter;
    const matchesSearch = w.affiliateName.toLowerCase().includes(search.toLowerCase()) ||
      w.affiliateEmail.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingTotal = withdrawals
    .filter((w) => w.status === "pending")
    .reduce((sum, w) => sum + w.amount, 0);

  const handleAction = () => {
    if (!confirmDialog) return;
    const { id, action } = confirmDialog;
    setWithdrawals((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: action === "approve" ? "approved" : "rejected" } : w))
    );
    toast({
      title: action === "approve" ? "Saque aprovado" : "Saque rejeitado",
      description: action === "approve" ? "O valor será enviado ao afiliado." : "A solicitação foi recusada.",
    });
    setConfirmDialog(null);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
      " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-6 space-y-6 animate-reveal-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Saques</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie as solicitações de saque dos afiliados
          </p>
        </div>
        <Card className="bg-card border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <ArrowDownToLine className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Pendente Total</p>
              <p className="text-lg font-bold text-foreground">
                {pendingTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar afiliado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary border-border/40"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px] bg-secondary border-border/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="approved">Aprovados</SelectItem>
            <SelectItem value="rejected">Rejeitados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-card border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-secondary/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Afiliado</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Valor</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Data</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                    Nenhuma solicitação encontrada.
                  </td>
                </tr>
              )}
              {filtered.map((w) => {
                const cfg = statusConfig[w.status];
                const StatusIcon = cfg.icon;
                return (
                  <tr key={w.id} className="border-b border-border/20 last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-foreground">{w.affiliateName}</p>
                      <p className="text-xs text-muted-foreground">{w.affiliateEmail}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-foreground tabular-nums">
                      {w.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDate(w.requestedAt)}</td>
                    <td className="px-5 py-4">
                      <Badge variant={cfg.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {w.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1 border-green-500/30 text-green-500 hover:bg-green-500/10 hover:text-green-400"
                            onClick={() => setConfirmDialog({ id: w.id, action: "approve" })}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                            onClick={() => setConfirmDialog({ id: w.id, action: "reject" })}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Rejeitar
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              {confirmDialog?.action === "approve" ? "Aprovar Saque" : "Rejeitar Saque"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog?.action === "approve"
                ? "Tem certeza que deseja aprovar esta solicitação de saque?"
                : "Tem certeza que deseja rejeitar esta solicitação? O saldo voltará para o afiliado."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancelar
            </Button>
            <Button
              variant={confirmDialog?.action === "approve" ? "default" : "destructive"}
              onClick={handleAction}
            >
              {confirmDialog?.action === "approve" ? "Aprovar" : "Rejeitar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
