import { useState } from "react";
import { useAppRelatorioVendas } from "@/hooks/use-relatorios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FileText, Calendar } from "lucide-react";

export default function Relatorios() {
  const [dataInicio, setDataInicio] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: vendas, isLoading } = useAppRelatorioVendas({ dataInicio, dataFim });

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Relatórios</h2>
          <p className="text-muted-foreground mt-1">Análise de vendas e faturamento.</p>
        </div>
      </div>

      <Card className="bg-card shadow-sm border-border">
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Data Início</label>
            <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-40 h-10" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Data Fim</label>
            <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="w-40 h-10" />
          </div>
          <Button className="h-10 px-6 bg-secondary hover:bg-secondary/90"><Calendar className="w-4 h-4 mr-2" /> Filtrar</Button>
          <Button variant="outline" className="h-10 ml-auto"><FileText className="w-4 h-4 mr-2" /> Exportar PDF</Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Carregando relatório...</div>
      ) : vendas && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-primary text-primary-foreground border-none">
              <CardContent className="p-6">
                <p className="text-primary-foreground/70 text-sm font-medium mb-1">Faturamento Bruto</p>
                <h3 className="text-3xl font-display font-bold">{formatCurrency(vendas.total)}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-sm font-medium mb-1">Total Vendas</p>
                <h3 className="text-3xl font-display font-bold text-foreground">{vendas.totalVendas}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-sm font-medium mb-1">Ticket Médio</p>
                <h3 className="text-3xl font-display font-bold text-foreground">{formatCurrency(vendas.ticketMedio)}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-sm font-medium mb-1">Descontos Concedidos</p>
                <h3 className="text-3xl font-display font-bold text-destructive">{formatCurrency(vendas.totalDesconto)}</h3>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Receita por Forma de Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vendas.formasPagamento}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="total"
                      nameKey="forma"
                      stroke="none"
                    >
                      {vendas.formasPagamento.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento Formas de Pagto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vendas.formasPagamento.map((fp, i) => (
                    <div key={fp.forma} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <div>
                          <p className="font-semibold capitalize">{fp.forma}</p>
                          <p className="text-xs text-muted-foreground">{fp.quantidade} transações</p>
                        </div>
                      </div>
                      <span className="font-bold text-lg">{formatCurrency(fp.total)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
