import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { IceCream2, Eye, EyeOff, LogIn, UserPlus, ArrowLeft } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Login() {
  const { login } = useAuth();

  const [tela, setTela] = useState<"login" | "cadastro">("login");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loginErro, setLoginErro] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [cadNome, setCadNome] = useState("");
  const [cadEmail, setCadEmail] = useState("");
  const [cadSenha, setCadSenha] = useState("");
  const [cadSenhaVer, setCadSenhaVer] = useState("");
  const [cadMostrarSenha, setCadMostrarSenha] = useState(false);
  const [cadErro, setCadErro] = useState("");
  const [cadLoading, setCadLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErro("");
    setLoginLoading(true);
    try {
      await login(email, senha);
    } catch (err: any) {
      setLoginErro(err.message ?? "Erro ao fazer login");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setCadErro("");
    if (cadSenha !== cadSenhaVer) { setCadErro("As senhas não coincidem."); return; }
    if (cadSenha.length < 6) { setCadErro("A senha deve ter no mínimo 6 caracteres."); return; }
    setCadLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: cadNome, email: cadEmail, senha: cadSenha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar conta");
      await login(cadEmail, cadSenha);
    } catch (err: any) {
      setCadErro(err.message ?? "Erro ao criar administrador");
    } finally {
      setCadLoading(false);
    }
  };

  const voltarLogin = () => {
    setTela("login");
    setCadErro("");
    setCadNome(""); setCadEmail(""); setCadSenha(""); setCadSenhaVer("");
  };

  return (
    <div className="min-h-screen bg-[#f2e6d8] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#5a3a1b] text-white shadow-lg mb-2">
            <IceCream2 className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-bold text-[#5a3a1b] tracking-tight">IceControl</h1>
          <p className="text-[#8a5a2b] text-sm">Sistema de gestão para sorveteria</p>
        </div>

        <Card className="shadow-xl border-0 bg-[#fcf7f2]">
          <CardContent className="pt-6">

            {tela === "login" ? (
              <>
                <h2 className="text-xl font-bold text-[#5a3a1b] mb-1">Entrar</h2>
                <p className="text-sm text-[#8a5a2b] mb-5">Faça login para acessar o sistema</p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
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

                  <div className="space-y-1">
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

                  {loginErro && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
                      {loginErro}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 bg-[#5a3a1b] hover:bg-[#3a2414] text-white font-semibold"
                    disabled={loginLoading}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    {loginLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>

                <div className="mt-5 pt-4 border-t border-[#e8d5bf]">
                  <p className="text-center text-sm text-[#8a5a2b] mb-3">Não tem conta ainda?</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-[#5a3a1b]/30 text-[#5a3a1b] hover:bg-[#5a3a1b]/5"
                    onClick={() => { setTela("cadastro"); setLoginErro(""); }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Criar novo administrador
                  </Button>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={voltarLogin}
                  className="flex items-center gap-1 text-sm text-[#8a5a2b] hover:text-[#5a3a1b] mb-4 -mt-1 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar ao login
                </button>

                <h2 className="text-xl font-bold text-[#5a3a1b] mb-1">Novo Administrador</h2>
                <p className="text-sm text-[#8a5a2b] mb-5">Crie uma conta de acesso ao sistema</p>

                <form onSubmit={handleCadastro} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-[#3a2414]">Nome completo</label>
                    <Input
                      type="text"
                      placeholder="Seu nome"
                      value={cadNome}
                      onChange={(e) => setCadNome(e.target.value)}
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
                      value={cadEmail}
                      onChange={(e) => setCadEmail(e.target.value)}
                      required
                      className="bg-white border-[#d4b896]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-[#3a2414]">Senha</label>
                    <div className="relative">
                      <Input
                        type={cadMostrarSenha ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={cadSenha}
                        onChange={(e) => setCadSenha(e.target.value)}
                        required
                        className="bg-white border-[#d4b896] pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a5a2b] hover:text-[#5a3a1b]"
                        onClick={() => setCadMostrarSenha(!cadMostrarSenha)}
                      >
                        {cadMostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-[#3a2414]">Confirmar senha</label>
                    <Input
                      type={cadMostrarSenha ? "text" : "password"}
                      placeholder="Repita a senha"
                      value={cadSenhaVer}
                      onChange={(e) => setCadSenhaVer(e.target.value)}
                      required
                      className="bg-white border-[#d4b896]"
                    />
                  </div>

                  {cadErro && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
                      {cadErro}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 bg-[#5a3a1b] hover:bg-[#3a2414] text-white font-semibold mt-1"
                    disabled={cadLoading}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {cadLoading ? "Criando conta..." : "Criar conta e entrar"}
                  </Button>
                </form>
              </>
            )}

          </CardContent>
        </Card>

        <p className="text-center text-xs text-[#8a5a2b]">
          IceControl v2.0 — Gestão de sorveteria
        </p>
      </div>
    </div>
  );
}
