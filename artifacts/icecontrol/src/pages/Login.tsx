import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IceCream2, Eye, EyeOff, LogIn, UserPlus, CheckCircle2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Login() {
  const { login } = useAuth();

  const [modo, setModo] = useState<"verificando" | "login" | "setup">("verificando");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const [setupNome, setSetupNome] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupSenha, setSetupSenha] = useState("");
  const [setupSenhaVer, setSetupSenhaVer] = useState("");
  const [setupMostrarSenha, setSetupMostrarSenha] = useState(false);
  const [setupErro, setSetupErro] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/auth/setup-status`)
      .then((r) => r.json())
      .then((d) => setModo(d.precisaSetup ? "setup" : "login"))
      .catch(() => setModo("login"));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      await login(email, senha);
    } catch (err: any) {
      setErro(err.message ?? "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupErro("");
    if (setupSenha !== setupSenhaVer) {
      setSetupErro("As senhas não coincidem.");
      return;
    }
    if (setupSenha.length < 6) {
      setSetupErro("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    setSetupLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: setupNome, email: setupEmail, senha: setupSenha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar administrador");
      await login(setupEmail, setupSenha);
    } catch (err: any) {
      setSetupErro(err.message ?? "Erro ao criar administrador");
    } finally {
      setSetupLoading(false);
    }
  };

  const logo = (
    <div className="text-center space-y-2">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#5a3a1b] text-white shadow-lg mb-2">
        <IceCream2 className="w-9 h-9" />
      </div>
      <h1 className="text-3xl font-bold text-[#5a3a1b] tracking-tight">IceControl</h1>
      <p className="text-[#8a5a2b] text-sm">Sistema de gestão para sorveteria</p>
    </div>
  );

  if (modo === "verificando") {
    return (
      <div className="min-h-screen bg-[#f2e6d8] flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          {logo}
          <p className="text-center text-[#8a5a2b] text-sm animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2e6d8] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {logo}

        {modo === "setup" ? (
          <Card className="shadow-xl border-0 bg-[#fcf7f2]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-[#5a3a1b]/10 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-[#5a3a1b]" />
                </div>
                <CardTitle className="text-[#5a3a1b] text-xl">Primeiro Acesso</CardTitle>
              </div>
              <CardDescription className="text-xs leading-relaxed">
                Nenhum administrador cadastrado. Crie sua conta de administrador para começar a usar o sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSetup} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#3a2414]">Nome completo</label>
                  <Input
                    type="text"
                    placeholder="Seu nome"
                    value={setupNome}
                    onChange={(e) => setSetupNome(e.target.value)}
                    required
                    autoFocus
                    className="bg-white border-[#d4b896]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#3a2414]">Email</label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={setupEmail}
                    onChange={(e) => setSetupEmail(e.target.value)}
                    required
                    className="bg-white border-[#d4b896]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#3a2414]">Senha</label>
                  <div className="relative">
                    <Input
                      type={setupMostrarSenha ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={setupSenha}
                      onChange={(e) => setSetupSenha(e.target.value)}
                      required
                      className="bg-white border-[#d4b896] pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a5a2b] hover:text-[#5a3a1b]"
                      onClick={() => setSetupMostrarSenha(!setupMostrarSenha)}
                    >
                      {setupMostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#3a2414]">Confirmar senha</label>
                  <Input
                    type={setupMostrarSenha ? "text" : "password"}
                    placeholder="Repita a senha"
                    value={setupSenhaVer}
                    onChange={(e) => setSetupSenhaVer(e.target.value)}
                    required
                    className="bg-white border-[#d4b896]"
                  />
                </div>

                {setupErro && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
                    {setupErro}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-[#5a3a1b] hover:bg-[#3a2414] text-white font-semibold mt-1"
                  disabled={setupLoading}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {setupLoading ? "Criando conta..." : "Criar Administrador e Entrar"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-xl border-0 bg-[#fcf7f2]">
            <CardHeader className="pb-4">
              <CardTitle className="text-[#5a3a1b] text-xl">Entrar</CardTitle>
              <CardDescription>Faça login para acessar o sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#3a2414]">Email</label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="bg-white border-[#d4b896]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#3a2414]">Senha</label>
                  <div className="relative">
                    <Input
                      type={mostrarSenha ? "text" : "password"}
                      placeholder="••••••"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      required
                      className="bg-white border-[#d4b896] pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a5a2b] hover:text-[#5a3a1b]"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                    >
                      {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {erro && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
                    {erro}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-[#5a3a1b] hover:bg-[#3a2414] text-white font-semibold"
                  disabled={loading}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-[#8a5a2b]">
          IceControl v2.0 — Gestão de sorveteria
        </p>
      </div>
    </div>
  );
}
