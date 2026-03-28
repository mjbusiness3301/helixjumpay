import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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
  Shield,
  DollarSign,
  UserCog,
  ArrowDownToLine,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PAGE_SIZE = 20;

const actionLabels: Record<string, string> = {
  withdraw_approved: "Saque aprovado",
  withdraw_rejected: "Saque rejeitado",
  withdraw_status_changed: "Status de saque alterado",
  balance_changed: "Saldo alterado",
  status_changed: "Status alterado",
  commission_changed: "Comissão alterada",
  affiliate_updated: "Afiliado atualizado",
  lead_balance_changed: "Saldo do jogador alterado",
  admin_status_changed: "Status de admin alterado",
};

const actionIcons: Record<string, typeof Shield> = {
  withdraw_approved: ArrowDownToLine,
  withdraw_rejected: ArrowDownToLine,
  withdraw_status_changed: ArrowDownToLine,
  balance_changed: DollarSign,
  status_changed: UserCog,
  commission_changed: DollarSign,
  affiliate_updated: UserCog,
  lead_balance_changed: DollarSign,
  admin_status_changed: Shield,
};

const actionColors: Record<string, string> = {
  withdraw_approved: "bg-green-500/15 text-green-400",
  withdraw_rejected: "bg-destructive/15 text-destructive",
  balance_changed: "bg-yellow-500/15 text-yellow-400",
  status_changed: "bg-blue-500/15 text-blue-400",
  commission_changed: "bg-purple-500/15 text-purple-400",
  lead_balance_changed: "bg-orange-500/15 text-orange-400",
  admin_status_changed: "bg-red-500/15 text-red-400",
};

interface AuditLog {
  id: string;
  actor_id: string;
  actor_email: string | null;
  action: string;
  target_table: string;
  target_id: string | null;
  details: Record<string, any>;
  created_at: string;
}

export default function AuditLogs() {
  const [page, setPage] = useState(0);
  const [filterAction, setFilterAction] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, filterAction],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filterAction !== "all") {
        query = query.eq("action", filterAction);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { logs: data as AuditLog[], total: count ?? 0 };
    },
  });

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const renderDetails = (log: AuditLog) => {
    const d = log.details;
    const changes = d?.changes as Record<string, { old: any; new: any }> | undefined;

    if (changes) {
      return Object.entries(changes).map(([key, val]) => (
        <span key={key} className="text-xs text-muted-foreground">
          {key}: <span className="text-destructive line-through">{String(val.old)}</span>
          {" → "}
          <span className="text-primary font-medium">{String(val.new)}</span>
        </span>
      ));
    }

    if (d?.old_status && d?.new_status) {
      return (
        <span className="text-xs text-muted-foreground">
          <span className="text-destructive line-through">{d.old_status}</span>
          {" → "}
          <span className="text-primary font-medium">{d.new_status}</span>
          {d.amount && ` · R$ ${Number(d.amount).toFixed(2)}`}
        </span>
      );
    }

    if (d?.old_balance !== undefined && d?.new_balance !== undefined) {
      const diff = d.diff ?? d.new_balance - d.old_balance;
      return (
        <span className="text-xs text-muted-foreground">
          {d.old_balance} → {d.new_balance} ({diff > 0 ? "+" : ""}{diff} centavos)
        </span>
      );
    }

    return null;
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-reveal-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Logs de Auditoria</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Registro de todas as ações sensíveis do sistema
          </p>
        </div>
        <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setPage(0); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            <SelectItem value="withdraw_approved">Saques aprovados</SelectItem>
            <SelectItem value="withdraw_rejected">Saques rejeitados</SelectItem>
            <SelectItem value="balance_changed">Saldo alterado</SelectItem>
            <SelectItem value="status_changed">Status alterado</SelectItem>
            <SelectItem value="commission_changed">Comissão alterada</SelectItem>
            <SelectItem value="lead_balance_changed">Saldo de jogador</SelectItem>
            <SelectItem value="admin_status_changed">Status de admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : logs.length === 0 ? (
        <Card className="bg-card/80 border-border">
          <CardContent className="p-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum log de auditoria encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const Icon = actionIcons[log.action] ?? Shield;
            const colorClass = actionColors[log.action] ?? "bg-muted text-muted-foreground";
            const targetName = log.details?.affiliate_name || log.details?.lead_name || log.details?.name || log.target_id?.slice(0, 8);

            return (
              <Card key={log.id} className="bg-card/80 border-border hover:border-primary/20 transition-colors">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={`rounded-lg p-2 shrink-0 ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">
                        {actionLabels[log.action] ?? log.action}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {log.target_table}
                      </Badge>
                      {targetName && (
                        <span className="text-xs text-muted-foreground">
                          · {targetName}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {renderDetails(log)}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page + 1} de {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
