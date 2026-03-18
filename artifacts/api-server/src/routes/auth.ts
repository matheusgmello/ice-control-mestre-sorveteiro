import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usuariosTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

const JWT_SECRET = process.env["JWT_SECRET"] ?? "icecontrol-secret-2025";
const MAX_ADMINS = 2;

function signToken(payload: { id: number; email: string; nome: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

router.post("/auth/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ error: "Email e senha são obrigatórios" });

    const [user] = await db.select().from(usuariosTable).where(eq(usuariosTable.email, email.toLowerCase().trim()));
    if (!user) return res.status(401).json({ error: "Email ou senha inválidos" });
    if (!user.ativo) return res.status(401).json({ error: "Usuário inativo" });

    const senhaValida = await bcrypt.compare(senha, user.senhaHash);
    if (!senhaValida) return res.status(401).json({ error: "Email ou senha inválidos" });

    const token = signToken({ id: user.id, email: user.email, nome: user.nome, role: user.role });
    res.json({ token, usuario: { id: user.id, nome: user.nome, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao fazer login" });
  }
});

router.post("/auth/register", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ error: "Nome, email e senha são obrigatórios" });
    if (senha.length < 6) return res.status(400).json({ error: "Senha deve ter no mínimo 6 caracteres" });

    const todos = await db.select().from(usuariosTable);
    if (todos.length >= MAX_ADMINS) {
      return res.status(400).json({ error: `Limite de ${MAX_ADMINS} administradores atingido` });
    }

    const emailNorm = email.toLowerCase().trim();
    const [existente] = await db.select().from(usuariosTable).where(eq(usuariosTable.email, emailNorm));
    if (existente) return res.status(400).json({ error: "Este email já está cadastrado" });

    const senhaHash = await bcrypt.hash(senha, 10);
    const [novo] = await db.insert(usuariosTable).values({ nome: nome.trim(), email: emailNorm, senhaHash, role: "admin" }).returning();

    const token = signToken({ id: novo.id, email: novo.email, nome: novo.nome, role: novo.role });
    res.status(201).json({ token, usuario: { id: novo.id, nome: novo.nome, email: novo.email, role: novo.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao cadastrar usuário" });
  }
});

router.get("/auth/me", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Não autenticado" });

    const payload = jwt.verify(token, JWT_SECRET) as { id: number; email: string; nome: string; role: string };
    const [user] = await db.select({ id: usuariosTable.id, nome: usuariosTable.nome, email: usuariosTable.email, role: usuariosTable.role, ativo: usuariosTable.ativo }).from(usuariosTable).where(eq(usuariosTable.id, payload.id));
    if (!user || !user.ativo) return res.status(401).json({ error: "Usuário não encontrado ou inativo" });

    res.json({ usuario: user });
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
});

router.get("/auth/usuarios", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Não autenticado" });
    jwt.verify(token, JWT_SECRET);

    const usuarios = await db.select({ id: usuariosTable.id, nome: usuariosTable.nome, email: usuariosTable.email, role: usuariosTable.role, ativo: usuariosTable.ativo, createdAt: usuariosTable.createdAt }).from(usuariosTable).orderBy(usuariosTable.createdAt);
    res.json({ usuarios, total: usuarios.length, limite: MAX_ADMINS });
  } catch {
    res.status(401).json({ error: "Não autenticado" });
  }
});

router.delete("/auth/usuarios/:id", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Não autenticado" });
    const payload = jwt.verify(token, JWT_SECRET) as { id: number };

    const targetId = Number(req.params.id);
    if (payload.id === targetId) return res.status(400).json({ error: "Você não pode remover sua própria conta" });

    await db.update(usuariosTable).set({ ativo: false, updatedAt: new Date() }).where(eq(usuariosTable.id, targetId));
    res.json({ ok: true });
  } catch {
    res.status(401).json({ error: "Não autenticado" });
  }
});

export default router;
