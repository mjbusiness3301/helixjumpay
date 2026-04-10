import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, Network } from "lucide-react";
import logo from "@/assets/logo.png";

export default function AfiliarPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refCode = searchParams.get("ref");

  const [referrer, setReferrer] = useState<{ id: string; name: string } | null>(null);
  const [loadingRef, setLoadingRef] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!refCode) { setLoadingRef(false); return; }
    supabase
      .from("affiliates")
      .select("id, name")
      .eq("ref_code", refCode)
      .maybeSingle()
      .then(({ data }) => {
        setReferrer(data ?? null);
        setLoadingRef(false);
      });
  }, [refCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Insira o seu nome.");
    if (!email.trim()) return setError("Insira o seu e-mail.");
    if (password.length < 6) return setError("A senha deve ter no mínimo 6 caracteres.");
    if (password !== confirm) return setError("As senhas não coincidem.");

    setLoading(true);
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim() } },
      });

      if (authError) {
        if (authError.message?.includes("already")) throw new Error("Este e-mail já está cadastrado.");
        throw authError;
      }
      if (!authData.user) throw new Error("Falha ao criar conta.");

      // 2. Insert affiliate record
      const payload: Record<string, unknown> = {
        user_id: authData.user.id,
        name: name.trim(),
        email: email.trim(),
        commission: 0,
      };
      if (referrer?.id) payload.parent_affiliate_id = referrer.id;

      const { error: insertError } = await supabase
        .from("affiliates")
        .insert(payload);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => navigate("/painel"), 2500);
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">Conta criada!</h2>
          <p className="text-muted-foreground">A redirecionar para o painel…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="Logo" className="h-14 w-14 rounded-xl object-contain" />
          <h1 className="text-2xl font-bold text-foreground">Criar conta de afiliado</h1>
          {loadingRef ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : referrer ? (
            <div className="flex items-center gap-2 bg-primary/10 text-primary text-sm px-4 py-2 rounded-full">
              <Network className="h-4 w-4" />
              Convidado por <strong>{referrer.name}</strong>
            </div>
          ) : refCode ? (
            <p className="text-sm text-destructive">Link de convite inválido.</p>
          ) : null}
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" placeholder="O seu nome" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirmar senha</Label>
                <Input id="confirm" type="password" placeholder="Repita a senha" value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={loading} />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />A criar conta…</> : "Criar conta"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Já tem conta?{" "}
          <button onClick={() => navigate("/")} className="text-primary hover:underline">Entrar</button>
        </p>
      </div>
    </div>
  );
}
