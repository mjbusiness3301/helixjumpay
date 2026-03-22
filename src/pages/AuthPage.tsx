import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import authBg from "@/assets/auth-bg.jpg";
import logo from "@/assets/logo.png";

const AuthPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: integrar autenticação
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <img
        src={authBg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden
      />
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="animate-reveal-up rounded-2xl border border-border bg-card/90 p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-8 text-center opacity-0 animate-reveal-up">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 glow-primary">
              <span className="text-2xl font-extrabold text-primary">A</span>
            </div>
            <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground">
              Bem-vindo de volta
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acesse seu painel de afiliado
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 opacity-0 animate-reveal-up animation-delay-200">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-foreground">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  className="pl-10 bg-secondary border-border focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-foreground">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-secondary border-border focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full mt-2">
              Entrar
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
