// src/lib/adminAuth.js
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const TOKEN_NAME = process.env.ADMIN_TOKEN_NAME || "admin_token";
const SECRET =
  process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || "dev-secret";

/**
 * ✅ Next 15/16: cookies() เป็น async ต้อง await ก่อนใช้งาน .get()
 */
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

/**
 * บังคับให้ต้องเป็นแอดมิน ไม่งั้น throw
 */
export async function requireAdmin() {
  const admin = await getAdminFromCookies();
  if (!admin) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  return admin;
}

/**
 * สิทธิ์เขียน (ถ้าคุณอยากแยก role)
 * ตอนนี้ให้ผ่านถ้ามี admin เฉยๆ ไปก่อน
 */
export async function canWriteAdmin() {
  const admin = await requireAdmin();
  // ตัวอย่าง: if (admin.role !== "admin") throw ...
  return admin;
}
