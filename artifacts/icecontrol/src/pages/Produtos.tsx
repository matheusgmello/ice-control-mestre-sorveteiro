import { useState } from "react";
import {
  useAppProdutos,
  useAppSabores,
  useAppCriarProduto,
  useAppAtualizarProduto,
  useAppCriarSabor,
  useAppAtualizarSabor,
} from "@/hooks/use-produtos";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { formatCurrency } from "@/lib/utils";
import { Edit, Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Produto = {
  id: number;
  nome: string;
  sku: string;
  categoria: string;
  preco: number | string;
  estoque: number;
  estoqueMinimo: number;
  unidadeMedida: string;
  ativo: boolean;
};

type Sabor = {
  id: number;
  nome: string;
  estoqueBolas: number;
  estoqueMinimo: number;
  ativo: boolean;
};

const CATEGORIAS = ["bebida", "sorvete_pote", "picole", "embalagem", "outro"];
const UNIDADES = ["un", "kg", "L", "cx"];

function ProdutoDialog({
  open,
  produto,
  onClose,
}: {
  open: boolean;
  produto: Produto | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const criarMutation = useAppCriarProduto();
  const atualizarMutation = useAppAtualizarProduto();

  const [form, setForm] = useState({
    nome: produto?.nome ?? "",
    sku: produto?.sku ?? "",
    categoria: produto?.categoria ?? "bebida",
    preco: produto ? String(Number(produto.preco).toFixed(2)) : "",
    estoqueMinimo: produto ? String(produto.estoqueMinimo) : "5",
    unidadeMedida: produto?.unidadeMedida ?? "un",
    ativo: produto?.ativo ?? true,
  });

  const field = (key: keyof typeof form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  async function handleSave() {
    if (!form.nome || !form.sku || !form.categoria || form.preco === "") {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    const payload = {
      nome: form.nome,
      sku: form.sku,
      categoria: form.categoria,
      preco: parseFloat(form.preco),
      estoqueMinimo: parseInt(form.estoqueMinimo) || 5,
      unidadeMedida: form.unidadeMedida,
    };
    try {
      if (produto) {
        await atualizarMutation.mutateAsync({ id: produto.id, data: payload });
        toast({ title: "Produto atualizado com sucesso!" });
      } else {
        await criarMutation.mutateAsync({ data: { ...payload, estoque: 0 } });
        toast({ title: "Produto criado com sucesso!" });
      }
      onClose();
    } catch {
      toast({ title: "Erro ao salvar produto", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{produto ? "Editar Produto" : "Novo Produto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="prod-nome">Nome *</Label>
            <Input id="prod-nome" placeholder="Nome do produto" {...field("nome")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="prod-sku">SKU *</Label>
              <Input id="prod-sku" placeholder="BEB-001" {...field("sku")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prod-preco">Preço (R$) *</Label>
              <Input
                id="prod-preco"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                {...field("preco")}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Categoria *</Label>
              <Select
                value={form.categoria}
                onValueChange={(v) => setForm((f) => ({ ...f, categoria: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Unidade</Label>
              <Select
                value={form.unidadeMedida}
                onValueChange={(v) => setForm((f) => ({ ...f, unidadeMedida: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="prod-estmin">Estoque Mínimo</Label>
            <Input
              id="prod-estmin"
              type="number"
              min="0"
              placeholder="5"
              {...field("estoqueMinimo")}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={criarMutation.isPending || atualizarMutation.isPending}
          >
            {criarMutation.isPending || atualizarMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SaborDialog({
  open,
  sabor,
  onClose,
}: {
  open: boolean;
  sabor: Sabor | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const criarMutation = useAppCriarSabor();
  const atualizarMutation = useAppAtualizarSabor();

  const [form, setForm] = useState({
    nome: sabor?.nome ?? "",
    estoqueBolas: sabor ? String(sabor.estoqueBolas) : "0",
    estoqueMinimo: sabor ? String(sabor.estoqueMinimo) : "20",
  });

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  async function handleSave() {
    if (!form.nome) {
      toast({ title: "Preencha o nome do sabor", variant: "destructive" });
      return;
    }
    const payload = {
      nome: form.nome,
      estoqueBolas: parseInt(form.estoqueBolas) || 0,
      estoqueMinimo: parseInt(form.estoqueMinimo) || 20,
    };
    try {
      if (sabor) {
        await atualizarMutation.mutateAsync({ id: sabor.id, data: payload });
        toast({ title: "Sabor atualizado com sucesso!" });
      } else {
        await criarMutation.mutateAsync({ data: payload });
        toast({ title: "Sabor criado com sucesso!" });
      }
      onClose();
    } catch {
      toast({ title: "Erro ao salvar sabor", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{sabor ? "Editar Sabor" : "Novo Sabor"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="sabor-nome">Nome do Sabor *</Label>
            <Input id="sabor-nome" placeholder="Ex: Morango" {...field("nome")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="sabor-estoque">Estoque (bolas)</Label>
              <Input
                id="sabor-estoque"
                type="number"
                min="0"
                placeholder="0"
                {...field("estoqueBolas")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sabor-estmin">Est. Mínimo (bolas)</Label>
              <Input
                id="sabor-estmin"
                type="number"
                min="0"
                placeholder="20"
                {...field("estoqueMinimo")}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={criarMutation.isPending || atualizarMutation.isPending}
          >
            {criarMutation.isPending || atualizarMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Produtos() {
  const [tab, setTab] = useState<"produtos" | "sabores">("produtos");
  const [busca, setBusca] = useState("");
  const [dialogProduto, setDialogProduto] = useState<{
    open: boolean;
    produto: Produto | null;
  }>({ open: false, produto: null });
  const [dialogSabor, setDialogSabor] = useState<{
    open: boolean;
    sabor: Sabor | null;
  }>({ open: false, sabor: null });

  const { data: produtos, isLoading: loadingProd } = useAppProdutos();
  const { data: sabores, isLoading: loadingSab } = useAppSabores();

  const filteredProdutos = produtos?.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.sku.toLowerCase().includes(busca.toLowerCase())
  );
  const filteredSabores = sabores?.filter((s) =>
    s.nome.toLowerCase().includes(busca.toLowerCase())
  );

  function openNovoProduto() {
    setDialogProduto({ open: true, produto: null });
  }
  function openEditarProduto(p: Produto) {
    setDialogProduto({ open: true, produto: p });
  }
  function closeDialogProduto() {
    setDialogProduto({ open: false, produto: null });
  }

  function openNovoSabor() {
    setDialogSabor({ open: true, sabor: null });
  }
  function openEditarSabor(s: Sabor) {
    setDialogSabor({ open: true, sabor: s });
  }
  function closeDialogSabor() {
    setDialogSabor({ open: false, sabor: null });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Catálogo</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie produtos e sabores da sorveteria.
          </p>
        </div>
        <Button
          className="shadow-md"
          onClick={tab === "produtos" ? openNovoProduto : openNovoSabor}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo {tab === "produtos" ? "Produto" : "Sabor"}
        </Button>
      </div>

      <div className="flex gap-2 p-1 bg-muted rounded-xl w-fit">
        <Button
          variant={tab === "produtos" ? "default" : "ghost"}
          onClick={() => setTab("produtos")}
          className="w-32 shadow-none"
        >
          Produtos
        </Button>
        <Button
          variant={tab === "sabores" ? "default" : "ghost"}
          onClick={() => setTab("sabores")}
          className="w-32 shadow-none"
        >
          Sabores
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar..."
              className="pl-9"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0">
          {tab === "produtos" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingProd ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredProdutos?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum produto encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProdutos?.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {p.sku}
                      </TableCell>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell>{p.categoria}</TableCell>
                      <TableCell className="font-semibold text-primary">
                        {formatCurrency(p.preco)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.estoque <= p.estoqueMinimo
                              ? p.estoque === 0
                                ? "destructive"
                                : "warning"
                              : "secondary"
                          }
                        >
                          {p.estoque} {p.unidadeMedida}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.ativo ? "success" : "outline"}>
                          {p.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditarProduto(p as Produto)}
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Sabor</TableHead>
                  <TableHead>Estoque Atual (Bolas)</TableHead>
                  <TableHead>Estoque Mínimo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingSab ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredSabores?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum sabor encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSabores?.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.nome}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.estoqueBolas <= s.estoqueMinimo
                              ? s.estoqueBolas === 0
                                ? "destructive"
                                : "warning"
                              : "secondary"
                          }
                        >
                          {s.estoqueBolas} bolas
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.estoqueMinimo} bolas
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.ativo ? "success" : "outline"}>
                          {s.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditarSabor(s as Sabor)}
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ProdutoDialog
        open={dialogProduto.open}
        produto={dialogProduto.produto}
        onClose={closeDialogProduto}
      />
      <SaborDialog
        open={dialogSabor.open}
        sabor={dialogSabor.sabor}
        onClose={closeDialogSabor}
      />
    </div>
  );
}
