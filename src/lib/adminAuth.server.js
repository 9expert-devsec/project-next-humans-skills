// src/lib/adminAuth.server.js
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const TOKEN_NAME = process.env.ADMIN_TOKEN_NAME || "admin_token";
const SECRET =
  process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || "dev-secret";

export async function getAdminFromCookies() {
  const store = await cookies();
  const token = store.get(TOKEN_NAME)?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const admin = await getAdminFromCookies();
  if (!admin) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  return admin;
}
