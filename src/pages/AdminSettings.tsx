import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, MessageCircle, Save } from "lucide-react";
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

  useEffect(() => {
    supabase
      .from("settings")
      .select("value")
      .eq("key", "whatsapp_group_link")
      .single()
      .then(({ data }) => {
        if (data) setWhatsappLink(data.value);
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
    <div className="px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-reveal-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie sua conta de administrador</p>
      </div>

      <Card className="bg-card/80 backdrop-blur-sm border-border max-w-md">
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

      <Card className="bg-card/80 backdrop-blur-sm border-border max-w-md">
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
    </div>
  );
}
