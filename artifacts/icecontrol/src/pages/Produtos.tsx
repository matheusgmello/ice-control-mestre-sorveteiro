import { useState } from "react";
import { useAppProdutos, useAppSabores } from "@/hooks/use-produtos";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Edit, Plus, Search } from "lucide-react";

export default function Produtos() {
  const [tab, setTab] = useState<"produtos" | "sabores">("produtos");
  const [busca, setBusca] = useState("");

  const { data: produtos, isLoading: loadingProd } = useAppProdutos();
  const { data: sabores, isLoading: loadingSab } = useAppSabores();

  const filteredProdutos = produtos?.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()) || p.sku.toLowerCase().includes(busca.toLowerCase()));
  const filteredSabores = sabores?.filter(s => s.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Catálogo</h2>
          <p className="text-muted-foreground mt-1">Gerencie produtos e sabores da sorveteria.</p>
        </div>
        <Button className="shadow-md">
          <Plus className="w-4 h-4 mr-2" />
          Novo {tab === "produtos" ? "Produto" : "Sabor"}
        </Button>
      </div>

      <div className="flex gap-2 p-1 bg-muted rounded-xl w-fit">
        <Button variant={tab === "produtos" ? "default" : "ghost"} onClick={() => setTab("produtos")} className="w-32 shadow-none">Produtos</Button>
        <Button variant={tab === "sabores" ? "default" : "ghost"} onClick={() => setTab("sabores")} className="w-32 shadow-none">Sabores</Button>
      </div>

      <Card>
        <div className="p-4 border-b flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Buscar..." className="pl-9" value={busca} onChange={e => setBusca(e.target.value)} />
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
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : filteredProdutos?.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.sku}</TableCell>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell>{p.categoria}</TableCell>
                    <TableCell className="font-semibold text-primary">{formatCurrency(p.preco)}</TableCell>
                    <TableCell>
                      <Badge variant={p.estoque <= p.estoqueMinimo ? (p.estoque === 0 ? "destructive" : "warning") : "secondary"}>
                        {p.estoque} {p.unidadeMedida}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.ativo ? "success" : "outline"}>{p.ativo ? "Ativo" : "Inativo"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon"><Edit className="w-4 h-4 text-muted-foreground" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
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
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : filteredSabores?.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.nome}</TableCell>
                    <TableCell>
                      <Badge variant={s.estoqueBolas <= s.estoqueMinimo ? (s.estoqueBolas === 0 ? "destructive" : "warning") : "secondary"}>
                        {s.estoqueBolas} bolas
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.estoqueMinimo} bolas</TableCell>
                    <TableCell>
                      <Badge variant={s.ativo ? "success" : "outline"}>{s.ativo ? "Ativo" : "Inativo"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon"><Edit className="w-4 h-4 text-muted-foreground" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
