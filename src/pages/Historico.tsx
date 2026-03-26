import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History, Loader2 } from "lucide-react";

export default function Historico() {
  const { data: deposits = [], isLoading } = useQuery({
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

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    confirmed: { label: "Pago", variant: "default" },
    pending: { label: "Pendente", variant: "secondary" },
    failed: { label: "Falhou", variant: "destructive" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Histórico de Depósitos</h1>
        <p className="text-muted-foreground">Todos os depósitos realizados na plataforma</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Depósitos ({deposits.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : deposits.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum depósito encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Confirmado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deposits.map((dep) => {
                  const status = statusConfig[dep.status] ?? { label: dep.status, variant: "outline" as const };
                  return (
                    <TableRow key={dep.id}>
                      <TableCell className="font-medium">{dep.lead_name ?? "—"}</TableCell>
                      <TableCell>{dep.lead_phone ?? "—"}</TableCell>
                      <TableCell>{formatCurrency(Number(dep.amount_cents))}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(dep.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {dep.confirmed_at
                          ? format(new Date(dep.confirmed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
