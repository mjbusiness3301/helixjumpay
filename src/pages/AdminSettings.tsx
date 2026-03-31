import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, MessageCircle, Save, Percent } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [whatsappLink, setWhatsappLink] = useState("");
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappInitialLoading, setWhatsappInitialLoading] = useState(true);

  const [gatewayFee, setGatewayFee] = useState("");
  const [gatewayFeeFixed, setGatewayFeeFixed] = useState("");
  const [gatewayFeeLoading, setGatewayFeeLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("settings")
      .select("key, value")
      .in("key", ["whatsapp_group_link", "gateway_fee_percent", "gateway_fee_fixed"])
      .then(({ data }) => {
        for (const row of data ?? []) {
          if (row.key === "whatsapp_group_link") setWhatsappLink(row.value);
          if (row.key === "gateway_fee_percent") setGatewayFee(row.value);
          if (row.key === "gateway_fee_fixed") setGatewayFeeFixed(row.value);
        }
        setWhatsappInitialLoading(false);
      });
  }, []);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "A nova senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Senha alterada com sucesso!" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Erro ao alterar senha", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWhatsapp = async () => {
    setWhatsappLoading(true);
    try {
      const { error } = await supabase
        .from("settings")
        .update({ value: whatsappLink, updated_at: new Date().toISOString() })
        .eq("key", "whatsapp_group_link");
      if (error) throw error;
      toast({ title: "Link do WhatsApp salvo com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setWhatsappLoading(false);
    }
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 animate-reveal-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie sua conta de administrador</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

      <Card className="bg-card/80 backdrop-blur-sm border-border">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Alterar Senha</h3>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input id="new-password" type="password" placeholder="Mínimo 6 caracteres" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input id="confirm-password" type="password" placeholder="Repita a nova senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <Button className="w-full" disabled={!newPassword || !confirmPassword || loading} onClick={handleChangePassword}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {loading ? "Alterando..." : "Alterar Senha"}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur-sm border-border">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Grupo WhatsApp dos Afiliados</h3>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp-link">Link do grupo</Label>
            <Input
              id="whatsapp-link"
              type="url"
              placeholder="https://chat.whatsapp.com/..."
              value={whatsappLink}
              onChange={(e) => setWhatsappLink(e.target.value)}
              disabled={whatsappInitialLoading}
            />
            <p className="text-xs text-muted-foreground">Este link será exibido como botão flutuante no painel dos afiliados.</p>
          </div>
          <Button className="w-full" disabled={whatsappLoading || whatsappInitialLoading} onClick={handleSaveWhatsapp}>
            {whatsappLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {whatsappLoading ? "Salvando..." : "Salvar Link"}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur-sm border-border max-w-md">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Percent className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Taxa do Gateway de Pagamento</h3>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="gateway-fee">Taxa percentual (%)</Label>
              <div className="relative">
                <Input
                  id="gateway-fee"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Ex: 3.99"
                  value={gatewayFee}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || (Number(v) >= 0 && Number(v) <= 100)) setGatewayFee(v);
                  }}
                  disabled={whatsappInitialLoading}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gateway-fee-fixed">Taxa fixa por transação (R$)</Label>
              <div className="relative">
                <Input
                  id="gateway-fee-fixed"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 1.50"
                  value={gatewayFeeFixed}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || Number(v) >= 0) setGatewayFeeFixed(v);
                  }}
                  disabled={whatsappInitialLoading}
                  className="pl-10"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Percentual + valor fixo cobrados pelo gateway sobre cada depósito. Serão descontados no cálculo de lucro líquido.</p>
          </div>
          <Button
            className="w-full"
            disabled={gatewayFeeLoading || whatsappInitialLoading}
            onClick={async () => {
              setGatewayFeeLoading(true);
              try {
                const now = new Date().toISOString();
                const { error } = await supabase
                  .from("settings")
                  .upsert([
                    { key: "gateway_fee_percent", value: gatewayFee || "0", updated_at: now },
                    { key: "gateway_fee_fixed", value: gatewayFeeFixed || "0", updated_at: now },
                  ]);
                if (error) throw error;
                toast({ title: "Taxas do gateway salvas com sucesso!" });
              } catch (err: any) {
                toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
              } finally {
                setGatewayFeeLoading(false);
              }
            }}
          >
            {gatewayFeeLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {gatewayFeeLoading ? "Salvando..." : "Salvar Taxa"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
