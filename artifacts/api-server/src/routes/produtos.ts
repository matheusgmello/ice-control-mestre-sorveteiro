import { Router } from "express";
import { db } from "@workspace/db";
import { produtosTable, saboresSorveteTable } from "@workspace/db/schema";
import { eq, like, or, ilike } from "drizzle-orm";

const router = Router();

// ── Produtos ──────────────────────────────────────────────────────────────────

router.get("/produtos", async (req, res) => {
  try {
    let query = db.select().from(produtosTable).$dynamic();
    const conditions: any[] = [];
    if (req.query.categoria) {
      conditions.push(eq(produtosTable.categoria, req.query.categoria as string));
    }
    if (req.query.busca) {
      const busca = `%${req.query.busca}%`;
      conditions.push(or(ilike(produtosTable.nome, busca), ilike(produtosTable.sku, busca)));
    }
    if (req.query.ativo !== undefined) {
      conditions.push(eq(produtosTable.ativo, req.query.ativo === "true"));
    }
    if (conditions.length > 0) {
      const { and } = await import("drizzle-orm");
      query = query.where(and(...conditions));
    }
    const produtos = await query.orderBy(produtosTable.categoria, produtosTable.nome);
    res.json(produtos.map(p => ({
      ...p,
      preco: Number(p.preco),
      precoCusto: p.precoCusto ? Number(p.precoCusto) : null,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});

router.post("/produtos", async (req, res) => {
  try {
    const { sku, nome, categoria, subcategoria, unidadeMedida = "un", preco, precoCusto, estoque = 0, estoqueMinimo = 5, observacoes } = req.body;
    if (!sku || !nome || !categoria) {
      return res.status(400).json({ error: "SKU, nome e categoria são obrigatórios" });
    }
    const [produto] = await db.insert(produtosTable).values({
      sku, nome, categoria, subcategoria, unidadeMedida,
      preco: String(preco || 0),
      precoCusto: precoCusto != null ? String(precoCusto) : undefined,
      estoque, estoqueMinimo, observacoes,
    }).returning();
    res.status(201).json({ ...produto, preco: Number(produto.preco), precoCusto: produto.precoCusto ? Number(produto.precoCusto) : null });
  } catch (err: any) {
    console.error(err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "SKU já cadastrado" });
    }
    res.status(500).json({ error: "Erro ao criar produto" });
  }
});

router.get("/produtos/:id", async (req, res) => {
  try {
    const [produto] = await db.select().from(produtosTable).where(eq(produtosTable.id, Number(req.params.id)));
    if (!produto) return res.status(404).json({ error: "Produto não encontrado" });
    res.json({ ...produto, preco: Number(produto.preco), precoCusto: produto.precoCusto ? Number(produto.precoCusto) : null });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar produto" });
  }
});

router.put("/produtos/:id", async (req, res) => {
  try {
    const { sku, nome, categoria, subcategoria, unidadeMedida, preco, precoCusto, estoqueMinimo, ativo, observacoes } = req.body;
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (sku !== undefined) updates.sku = sku;
    if (nome !== undefined) updates.nome = nome;
    if (categoria !== undefined) updates.categoria = categoria;
    if (subcategoria !== undefined) updates.subcategoria = subcategoria;
    if (unidadeMedida !== undefined) updates.unidadeMedida = unidadeMedida;
    if (preco !== undefined) updates.preco = String(preco);
    if (precoCusto !== undefined) updates.precoCusto = precoCusto != null ? String(precoCusto) : null;
    if (estoqueMinimo !== undefined) updates.estoqueMinimo = estoqueMinimo;
    if (ativo !== undefined) updates.ativo = ativo;
    if (observacoes !== undefined) updates.observacoes = observacoes;
    const [produto] = await db.update(produtosTable).set(updates).where(eq(produtosTable.id, Number(req.params.id))).returning();
    if (!produto) return res.status(404).json({ error: "Produto não encontrado" });
    res.json({ ...produto, preco: Number(produto.preco), precoCusto: produto.precoCusto ? Number(produto.precoCusto) : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
});

router.delete("/produtos/:id", async (req, res) => {
  try {
    const [produto] = await db.update(produtosTable).set({ ativo: false, updatedAt: new Date() }).where(eq(produtosTable.id, Number(req.params.id))).returning();
    if (!produto) return res.status(404).json({ error: "Produto não encontrado" });
    res.json({ ...produto, preco: Number(produto.preco), precoCusto: produto.precoCusto ? Number(produto.precoCusto) : null });
  } catch (err) {
    res.status(500).json({ error: "Erro ao inativar produto" });
  }
});

// ── Sabores ───────────────────────────────────────────────────────────────────

router.get("/sabores", async (req, res) => {
  try {
    let query = db.select().from(saboresSorveteTable).$dynamic();
    if (req.query.ativo !== undefined) {
      query = query.where(eq(saboresSorveteTable.ativo, req.query.ativo === "true"));
    }
    const sabores = await query.orderBy(saboresSorveteTable.nome);
    res.json(sabores);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar sabores" });
  }
});

router.post("/sabores", async (req, res) => {
  try {
    const { nome, estoqueBolas = 0, estoqueMinimo = 20 } = req.body;
    if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });
    const [sabor] = await db.insert(saboresSorveteTable).values({ nome, estoqueBolas, estoqueMinimo }).returning();
    res.status(201).json(sabor);
  } catch (err) {
    res.status(500).json({ error: "Erro ao criar sabor" });
  }
});

router.put("/sabores/:id", async (req, res) => {
  try {
    const { nome, estoqueMinimo, ativo } = req.body;
    const updates: Record<string, any> = {};
    if (nome !== undefined) updates.nome = nome;
    if (estoqueMinimo !== undefined) updates.estoqueMinimo = estoqueMinimo;
    if (ativo !== undefined) updates.ativo = ativo;
    const [sabor] = await db.update(saboresSorveteTable).set(updates).where(eq(saboresSorveteTable.id, Number(req.params.id))).returning();
    if (!sabor) return res.status(404).json({ error: "Sabor não encontrado" });
    res.json(sabor);
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar sabor" });
  }
});

export default router;
