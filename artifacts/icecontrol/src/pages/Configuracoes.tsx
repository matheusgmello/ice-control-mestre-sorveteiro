import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Target, CheckCircle2, UserPlus, Users, Trash2, Eye, EyeOff, ShieldCheck, Download, Upload, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchMeta() {
  const now = new Date();
  const ano = now.getFullYear();
  const mes = now.getMonth() + 1;
  const mesStr = `${ano}-${String(mes).padStart(2, "0")}`;
  const res = await fetch(`${BASE}/api/metas`);
  if (!res.ok) throw new Error("Erro ao buscar meta");
  const data: any[] = await res.json();
  return data.find((m) => m.mes === mesStr) ?? null;
}

async function salvarMeta(valor: number) {
  const now = new Date();
  const ano = now.getFullYear();
  const mes = now.getMonth() + 1;
  const mesStr = `${ano}-${String(mes).padStart(2, "0")}`;
  const res = await fetch(`${BASE}/api/metas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mes: mesStr, valor }),
  });
  if (!res.ok) throw new Error("Erro ao salvar meta");
  return res.json();
}

function useUsuarios() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/auth/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao buscar usuários");
      return res.json() as Promise<{ usuarios: any[]; total: number }>;
    },
    enabled: !!token,
  });
}

export default function Configuracoes() {
  const queryClient = useQueryClient();
  const { token, usuario: usuarioAtual } = useAuth();

  const [valorMeta, setValorMeta] = useState<string>("");
  const [salvo, setSalvo] = useState(false);

  const [dialogAberto, setDialogAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erroCadastro, setErroCadastro] = useState("");
  const [salvandoCadastro, setSalvandoCadastro] = useState(false);

  const { data: meta, isLoading: loadingMeta } = useQuery({ queryKey: ["meta-mensal"], queryFn: fetchMeta });
  const { data: dadosUsuarios, isLoading: loadingUsuarios } = useUsuarios();

  useEffect(() => {
    if (meta) setValorMeta(String(meta.valor));
    else if (!loadingMeta) setValorMeta("5000");
  }, [meta, loadingMeta]);

  const mutationMeta = useMutation({
    mutationFn: () => salvarMeta(Number(valorMeta)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meta-mensal"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    },
  });

  const handleCadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroCadastro("");
    if (senha.length < 6) { setErroCadastro("Senha deve ter ao menos 6 caracteres"); return; }
    setSalvandoCadastro(true);
    try {
      const res = await fetch(`${BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nome, email, senha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao cadastrar");
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setDialogAberto(false);
      setNome(""); setEmail(""); setSenha("");
    } catch (err: any) {
      setErroCadastro(err.message);
    } finally {
      setSalvandoCadastro(false);
    }
  };

  const handleRemover = async (id: number) => {
    if (!confirm("Remover este administrador?")) return;
    await fetch(`${BASE}/api/auth/usuarios/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    queryClient.invalidateQueries({ queryKey: ["usuarios"] });
  };

  const podeAdicionarMais = true;

  const [exportando, setExportando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [importErro, setImportErro] = useState("");
  const [importOk, setImportOk] = useState(false);

  const handleExportar = async () => {
    setExportando(true);
    try {
      const res = await fetch(`${BASE}/api/backup/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao exportar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-icecontrol-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message ?? "Erro ao exportar banco");
    } finally {
      setExportando(false);
    }
  };

  const handleImportar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("ATENÇÃO: Isso substituirá TODOS os dados atuais pelo conteúdo do arquivo. Tem certeza?")) {
      e.target.value = "";
      return;
    }
    setImportando(true);
    setImportErro("");
    setImportOk(false);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const res = await fetch(`${BASE}/api/backup/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(json),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erro ao importar");
        setImportOk(true);
        queryClient.invalidateQueries();
        setTimeout(() => setImportOk(false), 4000);
      } catch (err: any) {
        setImportErro(err.message ?? "Erro ao importar arquivo");
      } finally {
        setImportando(false);
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-3xl font-display font-bold text-primary">Configurações</h2>
        <p className="text-muted-foreground mt-1">Ajustes do sistema e metas.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2 text-secondary" /> Meta Mensal
          </CardTitle>
          <CardDescription>
            Defina o objetivo de faturamento para o mês atual. Usado no Dashboard para o progresso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingMeta ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : (
            <div className="flex gap-4 items-end">
              <div className="space-y-2 flex-1">
                <label className="text-sm font-semibold text-foreground">Valor da Meta (R$)</label>
                <Input
                  type="number"
                  value={valorMeta}
                  onChange={(e) => setValorMeta(e.target.value)}
                  className="font-bold text-lg text-primary"
                  min="0"
                  step="500"
                />
              </div>
              <Button
                className="w-36 h-11"
                onClick={() => mutationMeta.mutate()}
                disabled={mutationMeta.isPending || !valorMeta}
              >
                {salvo ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Salvo!</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> {mutationMeta.isPending ? "Salvando..." : "Salvar"}</>
                )}
              </Button>
            </div>
          )}
          {meta && (
            <p className="text-xs text-muted-foreground">
              Meta atual: <span className="font-semibold text-primary">R$ {Number(meta.valor).toLocaleString("pt-BR")}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-secondary" /> Administradores
              </CardTitle>
              <CardDescription>
                Gerencie os usuários com acesso ao sistema. {dadosUsuarios?.total ?? 0} administrador(es) cadastrado(s).
              </CardDescription>
            </div>
            {podeAdicionarMais && (
              <Button onClick={() => { setDialogAberto(true); setErroCadastro(""); }} size="sm">
                <UserPlus className="w-4 h-4 mr-2" /> Novo Admin
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingUsuarios ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : dadosUsuarios?.usuarios.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum administrador cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {dadosUsuarios?.usuarios.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border">
                  <div className="w-9 h-9 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-sm">
                    {u.nome.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-foreground truncate">{u.nome}</p>
                      {u.id === usuarioAtual?.id && (
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">você</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-secondary font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" /> Admin
                    </span>
                    {u.id !== usuarioAtual?.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                        onClick={() => handleRemover(u.id)}
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup e Restauração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="w-5 h-5 mr-2 text-secondary" /> Backup e Restauração
          </CardTitle>
          <CardDescription>
            Exporte todos os dados do sistema para um arquivo seguro, ou restaure a partir de um backup anterior.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleExportar}
              disabled={exportando}
              variant="outline"
              className="flex-1 border-primary/30 hover:bg-primary/5"
            >
              <Download className="w-4 h-4 mr-2" />
              {exportando ? "Exportando..." : "Exportar Banco de Dados"}
            </Button>

            <label className="flex-1">
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportar}
                disabled={importando}
              />
              <span
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md border text-sm font-medium cursor-pointer transition-colors w-full
                  ${importando
                    ? "opacity-50 pointer-events-none bg-muted border-muted-foreground/20"
                    : "border-destructive/30 text-destructive hover:bg-destructive/5"
                  }`}
              >
                <Upload className="w-4 h-4" />
                {importando ? "Importando..." : "Importar Banco de Dados"}
              </span>
            </label>
          </div>

          {importErro && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              {importErro}
            </div>
          )}
          {importOk && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Banco de dados restaurado com sucesso!
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            O arquivo exportado contém todos os dados: produtos, vendas, fiados, estoque e configurações.
            Recomendamos fazer backup regularmente e guardar o arquivo em local seguro.
          </p>
        </CardContent>
      </Card>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-secondary" /> Novo Administrador
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCadastrar} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Nome completo</label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João Silva" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joao@email.com" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Senha</label>
              <div className="relative">
                <Input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {erroCadastro && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
                {erroCadastro}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogAberto(false)}>Cancelar</Button>
              <Button type="submit" disabled={salvandoCadastro}>
                <UserPlus className="w-4 h-4 mr-2" />
                {salvandoCadastro ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
