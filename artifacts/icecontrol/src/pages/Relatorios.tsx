import { useState } from "react";
import { useAppRelatorioVendas, useAppRelatorioProdutos, useAppRelatorioSabores } from "@/hooks/use-relatorios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Calendar, TrendingUp, Package, IceCream, FileDown, Loader2 } from "lucide-react";

const COLORS = [
  "hsl(var(--primary))",
  "#8a5a2b",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const COLORS_HEX = ["#5a3a1b", "#8a5a2b", "#b07d50", "#d4a96a", "#e8c99a"];

function fmtPDF(val: number) {
  return `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function gerarPDF(params: {
  filtro: { dataInicio: string; dataFim: string };
  vendas: any;
  produtos: any[];
  sabores: any[];
}) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const { filtro, vendas, produtos, sabores } = params;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const BROWN = [90, 58, 27] as [number, number, number];
  const BROWN_LIGHT = [138, 90, 43] as [number, number, number];
  const CREAM = [242, 230, 216] as [number, number, number];
  const WHITE: [number, number, number] = [255, 255, 255];
  const GRAY = [100, 100, 100] as [number, number, number];

  const pageW = 210;
  const margin = 14;

  // ── Header ──────────────────────────────────────────
  doc.setFillColor(...BROWN);
  doc.rect(0, 0, pageW, 34, "F");

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text("IceControl v2.0", margin, 14);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Relatório de Vendas", margin, 22);

  const dataInicioFmt = format(new Date(filtro.dataInicio + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR });
  const dataFimFmt = format(new Date(filtro.dataFim + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR });
  const geradoEm = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  doc.setFontSize(9);
  doc.setTextColor(220, 190, 160);
  doc.text(`Período: ${dataInicioFmt} – ${dataFimFmt}`, margin, 30);
  doc.text(`Gerado em: ${geradoEm}`, pageW - margin, 30, { align: "right" });

  let y = 44;

  // ── KPIs ──────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BROWN);
  doc.text("Resumo do Período", margin, y);
  y += 6;

  const kpis = [
    { label: "Faturamento Bruto", value: fmtPDF(vendas.total), highlight: true },
    { label: "Total de Vendas", value: `${vendas.totalVendas} pedidos`, highlight: false },
    { label: "Ticket Médio", value: fmtPDF(vendas.ticketMedio), highlight: false },
    { label: "Descontos Concedidos", value: fmtPDF(vendas.totalDesconto), highlight: false },
  ];

  const cardW = (pageW - margin * 2 - 12) / 4;
  kpis.forEach((kpi, i) => {
    const x = margin + i * (cardW + 4);
    if (kpi.highlight) {
      doc.setFillColor(...BROWN);
      doc.roundedRect(x, y, cardW, 22, 2, 2, "F");
      doc.setTextColor(...WHITE);
    } else {
      doc.setFillColor(...CREAM);
      doc.roundedRect(x, y, cardW, 22, 2, 2, "F");
      doc.setTextColor(...BROWN);
    }
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(kpi.label, x + cardW / 2, y + 7, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(kpi.value, x + cardW / 2, y + 16, { align: "center" });
  });
  y += 30;

  // ── Formas de Pagamento ──────────────────────────────
  if (vendas.formasPagamento && vendas.formasPagamento.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BROWN);
    doc.text("Formas de Pagamento", margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Forma de Pagamento", "Transações", "Total"]],
      body: vendas.formasPagamento.map((fp: any, i: number) => [
        fp.forma.replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
        fp.quantidade,
        fmtPDF(fp.total),
      ]),
      headStyles: { fillColor: BROWN, textColor: WHITE, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: CREAM },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 30, halign: "center" },
        2: { cellWidth: 40, halign: "right" },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── Produtos Mais Vendidos ─────────────────────────
  if (produtos && produtos.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BROWN);
    doc.text("Produtos Mais Vendidos", margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["#", "Produto", "Qtd Vendida", "Total Faturado"]],
      body: produtos.map((p: any, i: number) => [
        `#${i + 1}`,
        p.nome,
        `${p.quantidade} un`,
        fmtPDF(p.totalFaturado),
      ]),
      headStyles: { fillColor: BROWN_LIGHT, textColor: WHITE, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: CREAM },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 30, halign: "center" },
        3: { cellWidth: 40, halign: "right" },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── Sabores Mais Pedidos ───────────────────────────
  if (sabores && sabores.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BROWN);
    doc.text("Sabores Mais Pedidos", margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["#", "Sabor", "Pedidos"]],
      body: sabores.slice(0, 15).map((s: any, i: number) => [
        `#${i + 1}`,
        s.nome,
        `${s.quantidade} pedidos`,
      ]),
      headStyles: { fillColor: BROWN_LIGHT, textColor: WHITE, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: CREAM },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 40, halign: "center" },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── Rodapé ────────────────────────────────────────
  const pageCount = (doc as any).internal.pages.length - 1;
  for (let pg = 1; pg <= pageCount; pg++) {
    doc.setPage(pg);
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.setFont("helvetica", "normal");
    doc.text(`IceControl v2.0 — Relatório gerado em ${geradoEm}`, margin, 290);
    doc.text(`Página ${pg} de ${pageCount}`, pageW - margin, 290, { align: "right" });
  }

  const nomeArquivo = `relatorio-icecontrol-${filtro.dataInicio}-${filtro.dataFim}.pdf`;
  doc.save(nomeArquivo);
}

export default function Relatorios() {
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [dataFim, setDataFim] = useState(format(new Date(), "yyyy-MM-dd"));
  const [filtroAtivo, setFiltroAtivo] = useState({ dataInicio: format(startOfMonth(new Date()), "yyyy-MM-dd"), dataFim: format(new Date(), "yyyy-MM-dd") });
  const [gerandoPDF, setGerandoPDF] = useState(false);

  const { data: vendas, isLoading: loadingVendas } = useAppRelatorioVendas(filtroAtivo);
  const { data: produtosRanking, isLoading: loadingProd } = useAppRelatorioProdutos({ ...filtroAtivo, limit: 10 });
  const { data: saboresRanking, isLoading: loadingSab } = useAppRelatorioSabores(filtroAtivo);

  function aplicarFiltro() {
    setFiltroAtivo({ dataInicio, dataFim });
  }

  async function handleGerarPDF() {
    if (!vendas) return;
    setGerandoPDF(true);
    try {
      await gerarPDF({
        filtro: filtroAtivo,
        vendas,
        produtos: produtosRanking ?? [],
        sabores: saboresRanking ?? [],
      });
    } finally {
      setGerandoPDF(false);
    }
  }

  const isLoading = loadingVendas || loadingProd || loadingSab;
  const temDados = !!vendas;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Relatórios</h2>
          <p className="text-muted-foreground mt-1">Análise de vendas e faturamento.</p>
        </div>
        {temDados && (
          <Button
            onClick={handleGerarPDF}
            disabled={gerandoPDF || isLoading}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            {gerandoPDF ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Gerando PDF...</>
            ) : (
              <><FileDown className="w-4 h-4" /> Exportar PDF</>
            )}
          </Button>
        )}
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
                        {vendas.formasPagamento.map((_: any, index: number) => (
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
                    {vendas.formasPagamento.map((fp: any, i: number) => (
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
