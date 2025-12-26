import Counter from "@/models/Counter";

function cleanCode(x) {
  return String(x || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
}

export async function generateRefNoByCourse({
  prefix = "NX",
  courseCode,
  date = new Date(),
  pad = 5,
}) {
  const year = new Date(date).getFullYear();
  const code = cleanCode(courseCode) || "COURSE";

  // key สำหรับ counter แยกตามคอร์ส+ปี
  // เช่น NX:NSL:2025
  const key = `${prefix}:${code}:${year}`;

  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seq = String(doc.seq).padStart(pad, "0");

  // รูปแบบ ref_no ที่โชว์ให้ user/admin
  // เช่น NX-NSL-2025-00023
  return `${prefix}-${code}-${year}-${seq}`;
}
