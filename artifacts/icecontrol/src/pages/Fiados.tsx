import { useState } from "react";
import { useAppFiados, useAppFiado, useAppClientes, useAppPagamentoFiado } from "@/hooks/use-fiados";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, UserSquare2, CheckCircle2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const FORMAS_PAGAMENTO = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "pix", label: "PIX" },
];

function PagamentoDialog({
  open,
  fiadoId,
  saldo,
  onClose,
}: {
  open: boolean;
  fiadoId: number;
  saldo: number;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const pagamentoMutation = useAppPagamentoFiado();

  const [valor, setValor] = useState("");
  const [forma, setForma] = useState("dinheiro");

  async function handleSave() {
    const v = parseFloat(valor);
    if (!valor || isNaN(v) || v <= 0) {
      toast({ title: "Informe um valor válido", variant: "destructive" });
      return;
    }
    if (v > saldo) {
      toast({ title: "Valor maior que o saldo devedor", variant: "destructive" });
      return;
    }
    try {
      await pagamentoMutation.mutateAsync({
        id: fiadoId,
        data: { valor: v, formaPagamento: forma },
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fiados", fiadoId] });
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      toast({ title: "Pagamento registrado com sucesso!" });
      setValor("");
      setForma("dinheiro");
      onClose();
    } catch {
      toast({ title: "Erro ao registrar pagamento", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Saldo Devedor</p>
            <p className="text-2xl font-bold text-destructive mt-1">{formatCurrency(saldo)}</p>
          </div>
          <div className="space-y-1">
            <Label>Forma de Pagamento</Label>
            <Select value={forma} onValueChange={setForma}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAS_PAGAMENTO.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="pag-valor">Valor do Pagamento (R$) *</Label>
            <Input
              id="pag-valor"
              type="number"
              step="0.01"
              min="0.01"
              max={saldo}
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={pagamentoMutation.isPending}>
            {pagamentoMutation.isPending ? "Registrando..." : "Confirmar Pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Fiados() {
  const [busca, setBusca] = useState("");
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
  const [dialogPagamento, setDialogPagamento] = useState(false);

  const { data: clientes, isLoading: loadingClientes } = useAppClientes();
  const filtered = clientes?.filter(
    (c) => c.nome.toLowerCase().includes(busca.toLowerCase()) && c.saldoFiado > 0
  );

  const { data: fiadoConta, isLoading: loadingFiado } = useAppFiado(selectedClienteId || 0);

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* LEFT LIST */}
      <Card className="w-1/3 flex flex-col overflow-hidden border-2 border-border shadow-md">
        <CardHeader className="py-4 border-b bg-card">
          <CardTitle className="text-lg flex items-center">
            <UserSquare2 className="w-5 h-5 mr-2 text-primary" /> Clientes com Fiado
          </CardTitle>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar cliente..."
              className="pl-9 h-10 bg-background"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          {loadingClientes ? (
            <div className="p-6 text-center text-muted-foreground text-sm">Carregando...</div>
          ) : filtered?.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Nenhum cliente com fiado em aberto.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered?.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setSelectedClienteId(c.id)}
                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors flex justify-between items-center ${
                      selectedClienteId === c.id
                        ? "bg-primary/5 border-l-4 border-primary"
                        : "border-l-4 border-transparent"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-foreground">{c.nome}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Desde {format(new Date(c.createdAt), "dd/MM/yyyy")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-destructive">{formatCurrency(c.saldoFiado)}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                        Saldo Devedor
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* RIGHT DETAILS */}
      <Card className="w-2/3 flex flex-col overflow-hidden border-2 border-border shadow-md">
        {!selectedClienteId ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
            <FileText className="w-16 h-16 mb-4" />
            <p>Selecione um cliente ao lado para ver os detalhes da conta.</p>
          </div>
        ) : loadingFiado ? (
          <div className="h-full flex items-center justify-center">Carregando...</div>
        ) : fiadoConta ? (
          <>
            <CardHeader className="py-6 border-b bg-primary text-primary-foreground">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{fiadoConta.clienteNome}</CardTitle>
                  <p className="text-primary-foreground/70 text-sm mt-1">
                    Conta criada em{" "}
                    {format(new Date(fiadoConta.data), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                  <div className="text-xs uppercase tracking-widest text-primary-foreground/80 mb-1">
                    Saldo Restante
                  </div>
                  <div className="text-3xl font-display font-bold text-white">
                    {formatCurrency(fiadoConta.saldo)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-8">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-foreground">Itens Consumidos</h3>
                  <Badge variant="outline">
                    Total da Conta: {formatCurrency(fiadoConta.total)}
                  </Badge>
                </div>
                <div className="bg-muted/30 rounded-xl border border-border p-1">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="text-left p-3 rounded-tl-lg">Produto</th>
                        <th className="text-center p-3">Qtd</th>
                        <th className="text-right p-3 rounded-tr-lg">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {fiadoConta.itens.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/50">
                          <td className="p-3 font-medium">{item.produto}</td>
                          <td className="p-3 text-center text-muted-foreground">
                            {item.quantidade}x {formatCurrency(item.preco)}
                          </td>
                          <td className="p-3 text-right font-semibold">
                            {formatCurrency(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg text-foreground mb-4">Histórico de Pagamentos</h3>
                {fiadoConta.pagamentos.length === 0 ? (
                  <div className="text-muted-foreground italic text-sm p-4 bg-muted/30 rounded-xl border border-dashed">
                    Nenhum pagamento registrado ainda.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fiadoConta.pagamentos.map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between items-center p-3 rounded-xl border border-green-500/20 bg-green-500/5"
                      >
                        <div className="flex items-center">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
                          <div>
                            <p className="font-medium text-green-800 text-sm">
                              Pagamento em {p.formaPagamento.toUpperCase()}
                            </p>
                            <p className="text-xs text-green-700/70">
                              {format(new Date(p.dataPagamento), "dd/MM/yyyy HH:mm")}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-green-700">{formatCurrency(p.valor)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <div className="p-4 border-t border-border bg-card">
              <Button
                size="lg"
                className="w-full text-base h-12 shadow-lg bg-green-600 hover:bg-green-700"
                onClick={() => setDialogPagamento(true)}
                disabled={fiadoConta.saldo <= 0}
              >
                {fiadoConta.saldo <= 0 ? "Conta Quitada" : "Registrar Novo Pagamento"}
              </Button>
            </div>
          </>
        ) : null}
      </Card>

      {fiadoConta && (
        <PagamentoDialog
          open={dialogPagamento}
          fiadoId={fiadoConta.id}
          saldo={fiadoConta.saldo}
          onClose={() => setDialogPagamento(false)}
        />
      )}
    </div>
  );
}
