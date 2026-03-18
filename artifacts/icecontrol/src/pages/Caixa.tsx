import { useState, useMemo } from "react";
import { useAppProdutos, useAppSabores, useAppTiposSorvete, useAppAdicionais } from "@/hooks/use-produtos";
import { useAppCriarVenda } from "@/hooks/use-vendas";
import { useAppClientes } from "@/hooks/use-fiados";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Search, Plus, Minus, IceCream2, Package, ShoppingCart, CheckCircle2, ChevronRight, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ItemVendaInput, PagamentoInput } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

type CartItem = ItemVendaInput & { tempId: string; nomeExibicao: string };

export default function Caixa() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"simples" | "montar">("simples");
  
  // Data hooks
  const { data: produtos } = useAppProdutos({ ativo: true });
  const { data: sabores } = useAppSabores({ ativo: true });
  const { data: tiposSorvete } = useAppTiposSorvete();
  const { data: adicionaisTodos } = useAppAdicionais();
  const { data: clientes } = useAppClientes({ ativo: true });
  const criarVenda = useAppCriarVenda();

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [wizTipo, setWizTipo] = useState<number | null>(null);
  const [wizSabores, setWizSabores] = useState<number[]>([]);
  const [wizCobertura, setWizCobertura] = useState<number | null>(null);
  const [wizAddGratis, setWizAddGratis] = useState<number[]>([]);
  const [wizAddPagos, setWizAddPagos] = useState<number[]>([]);

  // Simple product state
  const [buscaSimples, setBuscaSimples] = useState("");
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [desconto, setDesconto] = useState(0);
  const [acrescimo, setAcrescimo] = useState(0);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [pagamentos, setPagamentos] = useState<PagamentoInput[]>([{ forma: "dinheiro", valor: 0 }]);

  // Derived state
  const coberturas = useMemo(() => adicionaisTodos?.filter(a => a.tipo === 'cobertura') || [], [adicionaisTodos]);
  const adicionais = useMemo(() => adicionaisTodos?.filter(a => a.tipo === 'adicional') || [], [adicionaisTodos]);
  
  const produtosFiltrados = useMemo(() => {
    if (!produtos) return [];
    if (!buscaSimples) return produtos.slice(0, 10);
    const b = buscaSimples.toLowerCase();
    return produtos.filter(p => p.nome.toLowerCase().includes(b) || p.sku.toLowerCase().includes(b));
  }, [produtos, buscaSimples]);

  const subtotalCart = useMemo(() => cart.reduce((acc, item) => acc + (item.precoUnitario * item.quantidade), 0), [cart]);
  const totalCart = subtotalCart - desconto + acrescimo;
  const totalPago = pagamentos.reduce((acc, p) => acc + (p.valor || 0), 0);
  const troco = totalPago > totalCart && pagamentos.some(p => p.forma === 'dinheiro') ? totalPago - totalCart : 0;
  
  const tipoSelecionadoObj = tiposSorvete?.find(t => t.id === wizTipo);

  // Actions
  const addToCartProduto = (prod: any) => {
    if (prod.estoque <= 0) {
      toast({ title: "Estoque insuficiente", variant: "destructive" });
      return;
    }
    const existing = cart.find(c => c.tipo === "produto" && c.produtoId === prod.id);
    if (existing) {
      setCart(cart.map(c => c.tempId === existing.tempId ? { ...c, quantidade: c.quantidade + 1 } : c));
    } else {
      setCart([...cart, {
        tempId: Math.random().toString(),
        tipo: "produto",
        produtoId: prod.id,
        quantidade: 1,
        precoUnitario: prod.preco,
        nomeExibicao: prod.nome
      }]);
    }
    toast({ title: "Adicionado ao carrinho", description: prod.nome });
  };

  const finishWizard = () => {
    if (!wizTipo) return;
    
    let basePrice = tipoSelecionadoObj?.preco || 0;
    let extraPrice = wizAddPagos.reduce((acc, id) => {
      const add = adicionais.find(a => a.id === id);
      return acc + (add?.precoExtra || 0);
    }, 0);

    const nome = `Sorvete ${tipoSelecionadoObj?.nome}`;
    
    setCart([...cart, {
      tempId: Math.random().toString(),
      tipo: "sorvete",
      tipoSorveteId: wizTipo,
      saboresIds: wizSabores,
      coberturaId: wizCobertura,
      adicionaisIds: wizAddGratis,
      adicionaisPagosIds: wizAddPagos,
      quantidade: 1,
      precoUnitario: basePrice + extraPrice,
      nomeExibicao: nome
    }]);

    // reset wizard
    setWizardStep(1);
    setWizTipo(null);
    setWizSabores([]);
    setWizCobertura(null);
    setWizAddGratis([]);
    setWizAddPagos([]);
    toast({ title: "Sorvete adicionado", description: nome });
  };

  const removeFromCart = (tempId: string) => {
    setCart(cart.filter(c => c.tempId !== tempId));
  };

  const updateCartQty = (tempId: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.tempId === tempId) {
        const nq = c.quantidade + delta;
        return nq > 0 ? { ...c, quantidade: nq } : c;
      }
      return c;
    }));
  };

  const handleFinalizar = () => {
    if (cart.length === 0) return toast({ title: "Carrinho vazio", variant: "destructive" });
    if (totalPago < totalCart && !pagamentos.some(p => p.forma === 'fiado')) {
      return toast({ title: "Valor pago insuficiente", variant: "destructive" });
    }

    const payload = {
      itens: cart.map(({ tempId, nomeExibicao, ...rest }) => rest),
      pagamentos: pagamentos.map(p => ({
        forma: p.forma,
        // if fiado or exact match, we send exactly what is needed. If troco exists, we adjust the dinheiro payment so total matches.
        valor: (p.forma === 'dinheiro' && troco > 0) ? p.valor - troco : p.valor
      })),
      desconto: desconto > 0 ? desconto : undefined,
      acrescimo: acrescimo > 0 ? acrescimo : undefined,
      clienteId: clienteId || undefined
    };

    criarVenda.mutate({ data: payload }, {
      onSuccess: () => {
        toast({ title: "Venda finalizada com sucesso!", variant: "success" });
        setCart([]);
        setPagamentos([{ forma: "dinheiro", valor: 0 }]);
        setDesconto(0);
        setAcrescimo(0);
        setClienteId(null);
      },
      onError: (err: any) => {
        toast({ title: "Erro ao finalizar", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      
      {/* LEFT PANEL - PRODUCTS & WIZARD */}
      <div className="w-full md:w-3/5 flex flex-col gap-4">
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          <Button 
            variant={activeTab === "simples" ? "default" : "ghost"} 
            className="flex-1 shadow-none"
            onClick={() => setActiveTab("simples")}
          >
            <Package className="w-4 h-4 mr-2" />
            Produtos Simples
          </Button>
          <Button 
            variant={activeTab === "montar" ? "default" : "ghost"} 
            className="flex-1 shadow-none"
            onClick={() => setActiveTab("montar")}
          >
            <IceCream2 className="w-4 h-4 mr-2" />
            Montar Sorvete
          </Button>
        </div>

        {activeTab === "simples" ? (
          <Card className="flex-1 flex flex-col overflow-hidden border-2 border-border shadow-md">
            <CardHeader className="py-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input 
                  placeholder="Buscar por nome ou código..." 
                  className="pl-10 bg-muted/30 border-transparent"
                  value={buscaSimples}
                  onChange={(e) => setBuscaSimples(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {produtosFiltrados.map(prod => (
                  <button
                    key={prod.id}
                    onClick={() => addToCartProduto(prod)}
                    disabled={prod.estoque <= 0}
                    className="flex flex-col text-left p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed hover-elevate"
                  >
                    <span className="font-bold text-foreground line-clamp-2">{prod.nome}</span>
                    <span className="text-xs text-muted-foreground mt-1">{prod.categoria}</span>
                    <div className="flex items-center justify-between w-full mt-3">
                      <span className="font-semibold text-primary">{formatCurrency(prod.preco)}</span>
                      <Badge variant={prod.estoque > 0 ? "secondary" : "destructive"} className="text-[10px]">
                        {prod.estoque} {prod.unidadeMedida}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex-1 flex flex-col overflow-hidden border-2 border-border shadow-md bg-gradient-to-br from-card to-accent/20">
            <CardHeader className="py-4 border-b bg-card z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg">
                  <IceCream2 className="w-5 h-5 mr-2 text-secondary" />
                  Passo {wizardStep} de 4
                </CardTitle>
                <div className="flex space-x-1">
                  {[1,2,3,4].map(s => (
                    <div key={s} className={`h-2 w-8 rounded-full ${s <= wizardStep ? 'bg-primary' : 'bg-muted-foreground/20'}`} />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 relative">
              <AnimatePresence mode="wait">
                {wizardStep === 1 && (
                  <motion.div key="step1" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-4">
                    <h3 className="font-bold text-xl mb-4">Escolha a Base</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {tiposSorvete?.map(t => (
                        <button
                          key={t.id}
                          onClick={() => { setWizTipo(t.id); setWizardStep(2); }}
                          className={`p-5 rounded-2xl border-2 text-left transition-all ${wizTipo === t.id ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-border bg-card hover:border-primary/50 hover-elevate'}`}
                        >
                          <span className="block font-bold text-lg">{t.nome}</span>
                          <span className="block text-sm text-muted-foreground mt-1">Até {t.numeroBolas} {t.numeroBolas === 1 ? 'sabor' : 'sabores'}</span>
                          <span className="block font-bold text-primary mt-3 text-xl">{formatCurrency(t.preco)}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {wizardStep === 2 && tipoSelecionadoObj && (
                  <motion.div key="step2" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-xl">Escolha os Sabores</h3>
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        {wizSabores.length} de {tipoSelecionadoObj.numeroBolas}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {sabores?.map(s => {
                        const count = wizSabores.filter(id => id === s.id).length;
                        const canAdd = wizSabores.length < tipoSelecionadoObj.numeroBolas && s.estoqueBolas > 0;
                        return (
                          <div key={s.id} className="relative flex flex-col p-3 rounded-xl border border-border bg-card items-center text-center">
                            <span className="font-semibold text-sm mb-2">{s.nome}</span>
                            <span className="text-xs text-muted-foreground mb-3">{s.estoqueBolas} bolas em est.</span>
                            
                            <div className="flex items-center justify-between w-full mt-auto bg-muted rounded-lg p-1">
                              <Button 
                                size="icon" variant="ghost" className="h-7 w-7 rounded-md" 
                                onClick={() => {
                                  const idx = wizSabores.indexOf(s.id);
                                  if(idx > -1) {
                                    const newSabores = [...wizSabores];
                                    newSabores.splice(idx, 1);
                                    setWizSabores(newSabores);
                                  }
                                }}
                                disabled={count === 0}
                              ><Minus className="h-3 w-3" /></Button>
                              <span className="font-bold w-6">{count}</span>
                              <Button 
                                size="icon" variant="ghost" className="h-7 w-7 rounded-md"
                                onClick={() => {
                                  if(canAdd) setWizSabores([...wizSabores, s.id]);
                                }}
                                disabled={!canAdd}
                              ><Plus className="h-3 w-3" /></Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="pt-6 flex justify-between">
                      <Button variant="outline" onClick={() => setWizardStep(1)}>Voltar</Button>
                      <Button 
                        onClick={() => setWizardStep(3)} 
                        disabled={wizSabores.length === 0}
                        className="bg-secondary hover:bg-secondary/90"
                      >
                        Próximo <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {wizardStep === 3 && (
                  <motion.div key="step3" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-4">
                    <h3 className="font-bold text-xl mb-4">Cobertura (Opcional)</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setWizCobertura(null)}
                        className={`p-4 rounded-xl border text-center transition-all ${wizCobertura === null ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
                      >
                        <X className="w-6 h-6 mx-auto mb-2 opacity-50" />
                        <span className="font-medium">Sem Cobertura</span>
                      </button>
                      {coberturas.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setWizCobertura(c.id)}
                          disabled={c.estoque <= 0}
                          className={`p-4 rounded-xl border text-center transition-all disabled:opacity-50 ${wizCobertura === c.id ? 'border-primary bg-primary/10 font-bold' : 'border-border bg-card'}`}
                        >
                          <CheckCircle2 className={`w-6 h-6 mx-auto mb-2 ${wizCobertura === c.id ? 'text-primary' : 'text-muted-foreground/30'}`} />
                          <span className="font-medium block">{c.nome}</span>
                        </button>
                      ))}
                    </div>
                    <div className="pt-6 flex justify-between">
                      <Button variant="outline" onClick={() => setWizardStep(2)}>Voltar</Button>
                      <Button onClick={() => setWizardStep(4)} className="bg-secondary hover:bg-secondary/90">
                        Próximo <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {wizardStep === 4 && (
                  <motion.div key="step4" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-lg">Adicional Grátis (Max 1)</h3>
                        <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">Opcional</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                         {adicionais.map(a => (
                           <button
                             key={a.id}
                             onClick={() => {
                               if (wizAddGratis.includes(a.id)) setWizAddGratis([]);
                               else setWizAddGratis([a.id]);
                             }}
                             className={`px-3 py-2 rounded-lg border text-sm text-left flex justify-between items-center ${wizAddGratis.includes(a.id) ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
                           >
                             <span className="truncate pr-2">{a.nome}</span>
                             {wizAddGratis.includes(a.id) && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                           </button>
                         ))}
                      </div>
                    </div>

                    <div className="border-t border-border pt-4">
                      <h3 className="font-bold text-lg mb-3">Adicionais Extras (Pagos)</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         {adicionais.map(a => {
                           const count = wizAddPagos.filter(id => id === a.id).length;
                           return (
                             <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                               <div>
                                 <span className="block font-medium text-sm">{a.nome}</span>
                                 <span className="text-xs text-primary font-bold">+{formatCurrency(a.precoExtra)}</span>
                               </div>
                               <div className="flex items-center bg-muted rounded-md p-1">
                                 <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                                    const idx = wizAddPagos.indexOf(a.id);
                                    if(idx > -1) { const n = [...wizAddPagos]; n.splice(idx,1); setWizAddPagos(n); }
                                 }} disabled={count===0}><Minus className="h-3 w-3"/></Button>
                                 <span className="w-5 text-center text-sm font-bold">{count}</span>
                                 <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setWizAddPagos([...wizAddPagos, a.id])}>
                                    <Plus className="h-3 w-3"/>
                                 </Button>
                               </div>
                             </div>
                           );
                         })}
                      </div>
                    </div>

                    <div className="pt-6 flex justify-between items-center border-t border-border mt-6">
                      <Button variant="outline" onClick={() => setWizardStep(3)}>Voltar</Button>
                      <Button size="lg" className="px-8 shadow-xl shadow-primary/20" onClick={finishWizard}>
                        <ShoppingCart className="w-5 h-5 mr-2" /> Adicionar ao Carrinho
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        )}
      </div>

      {/* RIGHT PANEL - CART & PAYMENT */}
      <Card className="w-full md:w-2/5 flex flex-col h-full border-2 border-primary/20 shadow-xl overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground py-4 rounded-t-xl">
          <CardTitle className="text-xl flex items-center justify-between">
            <span className="flex items-center"><ShoppingCart className="w-5 h-5 mr-2" /> Carrinho</span>
            <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none text-sm">
              {cart.reduce((a,c) => a + c.quantidade, 0)} itens
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-0 bg-muted/10">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 p-8 text-center">
              <ShoppingCart className="w-16 h-16 mb-4" />
              <p>O carrinho está vazio.<br/>Adicione produtos ou monte um sorvete.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {cart.map((item) => (
                <li key={item.tempId} className="p-4 bg-white hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <div className="font-bold text-foreground">{item.nomeExibicao}</div>
                      {item.tipo === 'sorvete' && (
                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                          {item.saboresIds && item.saboresIds.length > 0 && (
                            <p>Sabores: {item.saboresIds.map(id => sabores?.find(s=>s.id===id)?.nome).join(', ')}</p>
                          )}
                          {item.coberturaId && <p>Cob: {coberturas.find(c=>c.id===item.coberturaId)?.nome}</p>}
                          {item.adicionaisIds && item.adicionaisIds.length > 0 && (
                            <p>Add Grátis: {item.adicionaisIds.map(id => adicionais.find(a=>a.id===id)?.nome).join(', ')}</p>
                          )}
                          {item.adicionaisPagosIds && item.adicionaisPagosIds.length > 0 && (
                            <p>Add Pagos: {item.adicionaisPagosIds.map(id => adicionais.find(a=>a.id===id)?.nome).join(', ')}</p>
                          )}
                        </div>
                      )}
                      <div className="font-semibold text-primary mt-1">{formatCurrency(item.precoUnitario)} un</div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => removeFromCart(item.tempId)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center bg-muted rounded-lg p-0.5">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateCartQty(item.tempId, -1)}><Minus className="h-3 w-3"/></Button>
                        <span className="w-6 text-center font-bold text-sm">{item.quantidade}</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateCartQty(item.tempId, 1)}><Plus className="h-3 w-3"/></Button>
                      </div>
                      <div className="font-bold text-base">{formatCurrency(item.precoUnitario * item.quantidade)}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>

        <div className="border-t border-border bg-card p-4 space-y-4">
          {/* Resumo Valores */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotalCart)}</span>
            </div>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Desc. R$</span>
                <Input 
                  type="number" min="0" step="0.01" 
                  className="h-8 pl-14 text-right" 
                  value={desconto || ''} 
                  onChange={e => setDesconto(Number(e.target.value))}
                />
              </div>
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Acresc. R$</span>
                <Input 
                  type="number" min="0" step="0.01" 
                  className="h-8 pl-16 text-right" 
                  value={acrescimo || ''} 
                  onChange={e => setAcrescimo(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex justify-between items-end pt-2 border-t border-border mt-2">
              <span className="font-bold text-lg">Total</span>
              <span className="font-display font-bold text-3xl text-primary">{formatCurrency(totalCart)}</span>
            </div>
          </div>

          {/* Pagamentos */}
          <div className="bg-muted p-3 rounded-xl space-y-2 border border-border">
            {pagamentos.map((p, i) => (
              <div key={i} className="flex gap-2">
                <Select value={p.forma} onValueChange={(val: any) => {
                  const n = [...pagamentos]; n[i].forma = val; setPagamentos(n);
                }}>
                  <SelectTrigger className="flex-1 bg-background h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="fiado">Fiado</SelectItem>
                  </SelectContent>
                </Select>
                <Input 
                  type="number" className="w-24 bg-background h-10 text-right font-bold" 
                  value={p.valor || ''} 
                  onChange={e => {
                    const n = [...pagamentos]; n[i].valor = Number(e.target.value); setPagamentos(n);
                  }}
                  placeholder="0,00"
                />
                {i > 0 && (
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive" onClick={() => setPagamentos(pagamentos.filter((_, idx) => idx !== i))}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <div className="flex justify-between mt-2 pt-2 border-t border-muted-foreground/20">
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setPagamentos([...pagamentos, { forma: 'pix', valor: 0 }])}>
                + Forma Pgto
              </Button>
              <div className="flex gap-4 text-xs font-medium">
                <span className={totalPago < totalCart ? 'text-destructive' : 'text-green-600'}>Pago: {formatCurrency(totalPago)}</span>
                {troco > 0 && <span className="text-primary font-bold">Troco: {formatCurrency(troco)}</span>}
              </div>
            </div>
          </div>

          {pagamentos.some(p => p.forma === 'fiado') && (
            <Select value={clienteId?.toString() || ''} onValueChange={v => setClienteId(Number(v))}>
              <SelectTrigger className="w-full border-amber-500 bg-amber-500/5">
                <SelectValue placeholder="Selecione o Cliente para Fiado" />
              </SelectTrigger>
              <SelectContent>
                {clientes?.map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button 
            className="w-full h-14 text-lg font-bold shadow-xl hover:-translate-y-0.5" 
            disabled={cart.length === 0 || criarVenda.isPending}
            onClick={handleFinalizar}
          >
            {criarVenda.isPending ? "Finalizando..." : "Finalizar Venda"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
