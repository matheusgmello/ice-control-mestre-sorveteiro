import { useState } from "react";
import { useAppMovimentacoes, useAppRegistrarMovimentacao } from "@/hooks/use-estoque";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownRight, ArrowUpRight, Plus, PackageSearch } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Estoque() {
  const { data: movimentacoes, isLoading } = useAppMovimentacoes();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Controle de Estoque</h2>
          <p className="text-muted-foreground mt-1">Histórico de entradas e saídas de mercadoria.</p>
        </div>
        <Button className="shadow-md">
          <Plus className="w-4 h-4 mr-2" /> Registrar Movimentação
        </Button>
      </div>

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
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : movimentacoes?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma movimentação encontrada.</TableCell></TableRow>
              ) : movimentacoes?.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm">
                    {format(new Date(m.dataMovimentacao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">{m.produtoNome}</TableCell>
                  <TableCell>
                    {m.tipo === 'entrada' ? (
                      <Badge variant="success" className="flex w-fit items-center"><ArrowDownRight className="w-3 h-3 mr-1"/> Entrada</Badge>
                    ) : (
                      <Badge variant="destructive" className="flex w-fit items-center"><ArrowUpRight className="w-3 h-3 mr-1"/> Saída</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-bold">{m.quantidade}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.estoqueAntes} &rarr; <span className="font-bold text-foreground">{m.estoqueDepois}</span>
                  </TableCell>
                  <TableCell className="text-sm">{m.motivo || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
