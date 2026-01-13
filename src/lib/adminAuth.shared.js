// src/lib/adminAuth.shared.js
import jwt from "jsonwebtoken";

const SECRET =
  process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || "dev-secret";

// ใช้สำหรับ verify token string (เช่น ใน middleware หรือกรณีรับ token มาเอง)
export function verifyAdminToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}
