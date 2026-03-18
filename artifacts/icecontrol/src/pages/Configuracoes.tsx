import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Target, CheckCircle2 } from "lucide-react";

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

export default function Configuracoes() {
  const queryClient = useQueryClient();
  const [valorMeta, setValorMeta] = useState<string>("");
  const [salvo, setSalvo] = useState(false);

  const { data: meta, isLoading } = useQuery({ queryKey: ["meta-mensal"], queryFn: fetchMeta });

  useEffect(() => {
    if (meta) setValorMeta(String(meta.valor));
    else if (!isLoading) setValorMeta("5000");
  }, [meta, isLoading]);

  const mutation = useMutation({
    mutationFn: () => salvarMeta(Number(valorMeta)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meta-mensal"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    },
  });

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
          {isLoading ? (
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
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || !valorMeta}
              >
                {salvo ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Salvo!</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> {mutation.isPending ? "Salvando..." : "Salvar"}</>
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
    </div>
  );
}
