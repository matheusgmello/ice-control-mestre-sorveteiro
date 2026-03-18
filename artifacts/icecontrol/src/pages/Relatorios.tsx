import { useState } from "react";
import { useAppRelatorioVendas, useAppRelatorioProdutos, useAppRelatorioSabores } from "@/hooks/use-relatorios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { format, startOfMonth } from "date-fns";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Calendar, TrendingUp, Package, IceCream } from "lucide-react";

const COLORS = [
  "hsl(var(--primary))",
  "#8a5a2b",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function Relatorios() {
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [dataFim, setDataFim] = useState(format(new Date(), "yyyy-MM-dd"));
  const [filtroAtivo, setFiltroAtivo] = useState({ dataInicio: format(startOfMonth(new Date()), "yyyy-MM-dd"), dataFim: format(new Date(), "yyyy-MM-dd") });

  const { data: vendas, isLoading: loadingVendas } = useAppRelatorioVendas(filtroAtivo);
  const { data: produtosRanking, isLoading: loadingProd } = useAppRelatorioProdutos({ ...filtroAtivo, limit: 10 });
  const { data: saboresRanking, isLoading: loadingSab } = useAppRelatorioSabores(filtroAtivo);

  function aplicarFiltro() {
    setFiltroAtivo({ dataInicio, dataFim });
  }

  const isLoading = loadingVendas || loadingProd || loadingSab;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Relatórios</h2>
          <p className="text-muted-foreground mt-1">Análise de vendas e faturamento.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="bg-card shadow-sm border-border">
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <label htmlFor="data-inicio" className="text-xs font-semibold text-muted-foreground">
              Data Início
            </label>
            <Input
              id="data-inicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-40 h-10"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="data-fim" className="text-xs font-semibold text-muted-foreground">
              Data Fim
            </label>
            <Input
              id="data-fim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-40 h-10"
            />
          </div>
          <Button className="h-10 px-6 bg-secondary hover:bg-secondary/90" onClick={aplicarFiltro}>
            <Calendar className="w-4 h-4 mr-2" /> Filtrar
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Carregando relatório...</div>
      ) : vendas ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-primary text-primary-foreground border-none shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-primary-foreground/70 text-sm font-medium">Faturamento Bruto</p>
                  <TrendingUp className="w-5 h-5 text-primary-foreground/50" />
                </div>
                <h3 className="text-3xl font-display font-bold">{formatCurrency(vendas.total)}</h3>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <p className="text-muted-foreground text-sm font-medium mb-1">Total de Vendas</p>
                <h3 className="text-3xl font-display font-bold text-foreground">{vendas.totalVendas}</h3>
                <p className="text-xs text-muted-foreground mt-1">pedidos finalizados</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <p className="text-muted-foreground text-sm font-medium mb-1">Ticket Médio</p>
                <h3 className="text-3xl font-display font-bold text-foreground">
                  {formatCurrency(vendas.ticketMedio)}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">por venda</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <p className="text-muted-foreground text-sm font-medium mb-1">Descontos Concedidos</p>
                <h3 className="text-3xl font-display font-bold text-destructive">
                  {formatCurrency(vendas.totalDesconto)}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">total de descontos</p>
              </CardContent>
            </Card>
          </div>

          {/* Formas de Pagamento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Receita por Forma de Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {vendas.formasPagamento.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Nenhuma venda no período.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vendas.formasPagamento}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="total"
                        nameKey="forma"
                        stroke="none"
                      >
                        {vendas.formasPagamento.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => formatCurrency(val)} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Detalhamento de Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {vendas.formasPagamento.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhum pagamento no período.</p>
                ) : (
                  <div className="space-y-4">
                    {vendas.formasPagamento.map((fp, i) => (
                      <div
                        key={fp.forma}
                        className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          <div>
                            <p className="font-semibold capitalize">{fp.forma.replace("_", " ")}</p>
                            <p className="text-xs text-muted-foreground">{fp.quantidade} transações</p>
                          </div>
                        </div>
                        <span className="font-bold text-lg">{formatCurrency(fp.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Produtos mais vendidos */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Produtos Mais Vendidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingProd ? (
                  <p className="text-muted-foreground text-sm">Carregando...</p>
                ) : !produtosRanking || produtosRanking.length === 0 ? (
                  <p className="text-muted-foreground text-sm italic">
                    Nenhum produto vendido no período.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {produtosRanking.map((p, i) => (
                      <div key={p.produtoId} className="flex items-center gap-3">
                        <span className="w-6 text-center text-xs font-bold text-muted-foreground">
                          #{i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{p.nome}</p>
                          <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                            <div
                              className="bg-primary h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(100, (p.quantidade / (produtosRanking[0]?.quantidade || 1)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">{p.quantidade} un</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatCurrency(p.totalFaturado)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sabores mais pedidos */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IceCream className="w-5 h-5 text-primary" />
                  Sabores Mais Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSab ? (
                  <p className="text-muted-foreground text-sm">Carregando...</p>
                ) : !saboresRanking || saboresRanking.length === 0 ? (
                  <p className="text-muted-foreground text-sm italic">
                    Nenhum sorvete vendido no período.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {saboresRanking.slice(0, 10).map((s, i) => (
                      <div key={s.saborId} className="flex items-center gap-3">
                        <span className="w-6 text-center text-xs font-bold text-muted-foreground">
                          #{i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{s.nome}</p>
                          <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                            <div
                              className="bg-secondary h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(100, (s.quantidade / (saboresRanking[0]?.quantidade || 1)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <Badge variant="secondary">{s.quantidade} pedidos</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
