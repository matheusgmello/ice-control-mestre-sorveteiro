import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IceCream2, Eye, EyeOff, LogIn } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

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

        <p className="text-center text-xs text-[#8a5a2b]">
          IceControl v2.0 — Gestão de sorveteria
        </p>
      </div>
    </div>
  );
}
