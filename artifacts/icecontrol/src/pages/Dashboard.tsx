import { useAppDashboard } from "@/hooks/use-dashboard";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingBag, TrendingUp, Users, AlertTriangle, PackageX } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data, isLoading, error } = useAppDashboard();

  if (isLoading) return <div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (error || !data) return <div className="text-destructive font-semibold p-6">Erro ao carregar dashboard.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold text-primary">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Resumo das atividades da sorveteria.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-elevate transition-all duration-300 border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendas Hoje</CardTitle>
            <DollarSign className="h-5 w-5 text-primary opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{formatCurrency(data.totalHoje)}</div>
            <p className="text-xs text-muted-foreground mt-1">{data.totalVendasHoje} pedidos realizados</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all duration-300 border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total do Mês</CardTitle>
            <TrendingUp className="h-5 w-5 text-secondary opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{formatCurrency(data.totalMes)}</div>
            {data.metaMes && (
              <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-secondary transition-all duration-1000" 
                  style={{ width: `${Math.min(data.progressoMeta, 100)}%` }}
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {data.metaMes ? `${data.progressoMeta.toFixed(1)}% da meta de ${formatCurrency(data.metaMes)}` : "Sem meta definida"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all duration-300 border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
            <ShoppingBag className="h-5 w-5 text-amber-500 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{formatCurrency(data.ticketMedio)}</div>
            <p className="text-xs text-muted-foreground mt-1">Gasto médio por cliente</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all duration-300 border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fiados em Aberto</CardTitle>
            <Users className="h-5 w-5 text-destructive opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{formatCurrency(data.saldoFiadosAbertos)}</div>
            <p className="text-xs text-muted-foreground mt-1">{data.totalFiadosAbertos} contas ativas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>Vendas dos Últimos Dias</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.vendasDiarias}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="data" 
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getDate()}/${d.getMonth()+1}`;
                  }}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={(val) => `R$ ${val}`}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar 
                  dataKey="total" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-6 flex flex-col">
          <Card className="flex-1 border-destructive/20 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-destructive flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Estoque Baixo - Sabores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.saboresBaixoEstoque.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum sabor com estoque baixo.</p>
              ) : (
                <ul className="space-y-3">
                  {data.saboresBaixoEstoque.map(sabor => (
                    <li key={sabor.id} className="flex justify-between items-center bg-card p-3 rounded-xl border border-destructive/10">
                      <span className="font-medium text-sm">{sabor.nome}</span>
                      <Badge variant={sabor.estoqueBolas === 0 ? "destructive" : "warning"}>
                        {sabor.estoqueBolas} bolas
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="flex-1 border-amber-500/20 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-amber-700 flex items-center">
                <PackageX className="w-5 h-5 mr-2" />
                Estoque Baixo - Produtos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.produtosBaixoEstoque.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum produto com estoque baixo.</p>
              ) : (
                <ul className="space-y-3">
                  {data.produtosBaixoEstoque.map(prod => (
                    <li key={prod.id} className="flex justify-between items-center bg-card p-3 rounded-xl border border-amber-500/10">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{prod.nome}</span>
                        <span className="text-xs text-muted-foreground">{prod.categoria}</span>
                      </div>
                      <Badge variant={prod.estoque === 0 ? "destructive" : "warning"}>
                        {prod.estoque} {prod.unidadeMedida}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
