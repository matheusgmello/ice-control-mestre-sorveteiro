import { useState } from "react";
import { useAppMovimentacoes, useAppRegistrarMovimentacao, useAppMovimentarSabor } from "@/hooks/use-estoque";
import { useAppProdutos, useAppSabores } from "@/hooks/use-produtos";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownRight, ArrowUpRight, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

function MovProdutoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const { data: produtos } = useAppProdutos();
  const registrarMov = useAppRegistrarMovimentacao();
  const [form, setForm] = useState({
    produtoId: "",
    tipo: "entrada" as "entrada" | "saida",
    quantidade: "",
    motivo: "",
    custoUnitario: "",
  });

  async function handleSave() {
    if (!form.produtoId || !form.quantidade) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    const qty = parseInt(form.quantidade);
    if (isNaN(qty) || qty <= 0) {
      toast({ title: "Quantidade inválida", variant: "destructive" });
      return;
    }
    try {
      await registrarMov.mutateAsync({
        data: {
          produtoId: parseInt(form.produtoId),
          tipo: form.tipo,
          quantidade: qty,
          motivo: form.motivo || undefined,
          custoUnitario: form.custoUnitario ? parseFloat(form.custoUnitario) : undefined,
        },
      });
      toast({ title: "Movimentação registrada com sucesso!" });
      setForm({ produtoId: "", tipo: "entrada", quantidade: "", motivo: "", custoUnitario: "" });
      onClose();
    } catch {
      toast({ title: "Erro ao registrar movimentação", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Movimentação de Produto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Tipo *</Label>
            <Select value={form.tipo} onValueChange={(v: "entrada" | "saida") => setForm((f) => ({ ...f, tipo: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Produto *</Label>
            <Select value={form.produtoId} onValueChange={(v) => setForm((f) => ({ ...f, produtoId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {produtos?.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nome} ({p.estoque} {p.unidadeMedida})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="mov-qtd">Quantidade *</Label>
              <Input
                id="mov-qtd"
                type="number"
                min="1"
                placeholder="0"
                value={form.quantidade}
                onChange={(e) => setForm((f) => ({ ...f, quantidade: e.target.value }))}
              />
            </div>
            {form.tipo === "entrada" && (
              <div className="space-y-1">
                <Label htmlFor="mov-custo">Custo Unitário (R$)</Label>
                <Input
                  id="mov-custo"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={form.custoUnitario}
                  onChange={(e) => setForm((f) => ({ ...f, custoUnitario: e.target.value }))}
                />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="mov-motivo">Motivo / Observação</Label>
            <Input
              id="mov-motivo"
              placeholder="Ex: Compra do fornecedor, Ajuste de inventário..."
              value={form.motivo}
              onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={registrarMov.isPending}>
            {registrarMov.isPending ? "Salvando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MovSaborDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const { data: sabores } = useAppSabores();
  const movSabor = useAppMovimentarSabor();
  const [form, setForm] = useState({
    saborId: "",
    tipo: "entrada" as "entrada" | "saida",
    quantidade: "",
    motivo: "",
  });

  async function handleSave() {
    if (!form.saborId || !form.quantidade) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    const qty = parseInt(form.quantidade);
    if (isNaN(qty) || qty <= 0) {
      toast({ title: "Quantidade inválida", variant: "destructive" });
      return;
    }
    try {
      await movSabor.mutateAsync({
        data: {
          saborId: parseInt(form.saborId),
          tipo: form.tipo,
          quantidade: qty,
          motivo: form.motivo || undefined,
        },
      });
      toast({ title: "Estoque de sabor atualizado com sucesso!" });
      setForm({ saborId: "", tipo: "entrada", quantidade: "", motivo: "" });
      onClose();
    } catch {
      toast({ title: "Erro ao movimentar estoque do sabor", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Movimentação de Sabor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Tipo *</Label>
            <Select value={form.tipo} onValueChange={(v: "entrada" | "saida") => setForm((f) => ({ ...f, tipo: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada (repor bolas)</SelectItem>
                <SelectItem value="saida">Saída (remover bolas)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Sabor *</Label>
            <Select value={form.saborId} onValueChange={(v) => setForm((f) => ({ ...f, saborId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {sabores?.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.nome} ({s.estoqueBolas} bolas)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="sab-qtd">Quantidade de Bolas *</Label>
            <Input
              id="sab-qtd"
              type="number"
              min="1"
              placeholder="0"
              value={form.quantidade}
              onChange={(e) => setForm((f) => ({ ...f, quantidade: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sab-motivo">Motivo / Observação</Label>
            <Input
              id="sab-motivo"
              placeholder="Ex: Reposição de estoque..."
              value={form.motivo}
              onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={movSabor.isPending}>
            {movSabor.isPending ? "Salvando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Estoque() {
  const [tab, setTab] = useState<"produtos" | "sabores">("produtos");
  const { data: movimentacoes, isLoading: loadingMov } = useAppMovimentacoes();
  const { data: sabores, isLoading: loadingSab } = useAppSabores();
  const [dialogProd, setDialogProd] = useState(false);
  const [dialogSabor, setDialogSabor] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Controle de Estoque</h2>
          <p className="text-muted-foreground mt-1">Gerencie entradas e saídas de mercadoria.</p>
        </div>
        <Button
          className="shadow-md"
          onClick={() => (tab === "produtos" ? setDialogProd(true) : setDialogSabor(true))}
        >
          <Plus className="w-4 h-4 mr-2" />
          {tab === "produtos" ? "Registrar Entrada/Saída" : "Movimentar Sabor"}
        </Button>
      </div>

      <div className="flex gap-2 p-1 bg-muted rounded-xl w-fit">
        <Button
          variant={tab === "produtos" ? "default" : "ghost"}
          onClick={() => setTab("produtos")}
          className="w-44 shadow-none"
        >
          Histórico Produtos
        </Button>
        <Button
          variant={tab === "sabores" ? "default" : "ghost"}
          onClick={() => setTab("sabores")}
          className="w-44 shadow-none"
        >
          Estoque de Sabores
        </Button>
      </div>

      {tab === "produtos" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Saldo (Antes / Depois)</TableHead>
                  <TableHead>Motivo/Obs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingMov ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell>
                  </TableRow>
                ) : movimentacoes?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma movimentação encontrada.
                    </TableCell>
                  </TableRow>
                ) : movimentacoes?.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm">
                      {format(new Date(m.dataMovimentacao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">{m.produtoNome}</TableCell>
                    <TableCell>
                      {m.tipo === "entrada" ? (
                        <Badge variant="success" className="flex w-fit items-center">
                          <ArrowDownRight className="w-3 h-3 mr-1" /> Entrada
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="flex w-fit items-center">
                          <ArrowUpRight className="w-3 h-3 mr-1" /> Saída
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-bold">{m.quantidade}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.estoqueAntes} &rarr;{" "}
                      <span className="font-bold text-foreground">{m.estoqueDepois}</span>
                    </TableCell>
                    <TableCell className="text-sm">{m.motivo || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sabor</TableHead>
                  <TableHead>Estoque Atual (Bolas)</TableHead>
                  <TableHead>Estoque Mínimo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingSab ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">Carregando...</TableCell>
                  </TableRow>
                ) : sabores?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum sabor cadastrado.
                    </TableCell>
                  </TableRow>
                ) : sabores?.map((s) => {
                  const pct = s.estoqueMinimo > 0 ? Math.min(100, (s.estoqueBolas / s.estoqueMinimo) * 100) : 100;
                  const isLow = s.estoqueBolas <= s.estoqueMinimo;
                  const isCritical = s.estoqueBolas === 0;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.nome}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Badge variant={isCritical ? "destructive" : isLow ? "warning" : "secondary"}>
                            {s.estoqueBolas} bolas
                          </Badge>
                          <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isCritical ? "bg-destructive" : isLow ? "bg-yellow-500" : "bg-green-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{s.estoqueMinimo} bolas</TableCell>
                      <TableCell>
                        <Badge variant={s.ativo ? "success" : "outline"}>
                          {isCritical ? "Sem estoque" : isLow ? "Baixo" : "OK"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <MovProdutoDialog open={dialogProd} onClose={() => setDialogProd(false)} />
      <MovSaborDialog open={dialogSabor} onClose={() => setDialogSabor(false)} />
    </div>
  );
}
