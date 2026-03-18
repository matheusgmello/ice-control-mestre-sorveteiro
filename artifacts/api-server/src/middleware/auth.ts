import jwt from "jsonwebtoken";

const JWT_SECRET = process.env["JWT_SECRET"] ?? "icecontrol-secret-2025";

export interface AuthPayload {
  id: number;
  email: string;
  nome: string;
  role: string;
}

export function extractUser(req: any): AuthPayload | null {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}
