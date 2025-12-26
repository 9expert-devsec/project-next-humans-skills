import dbConnect from "@/lib/dbConnect";
import Registration from "@/models/Registration";
import { sendWithTemplate } from "@/lib/postmark";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidEmail(x) {
  const s = String(x || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function normalizeDigits(x) {
  return String(x || "").replace(/\D/g, "");
}

function pickDraft(draft = {}) {
  return {
    courseSlug: String(draft.courseSlug || "").trim(),
    locale: String(draft.locale || "th").trim(),

    trainee_count: Math.max(1, Number(draft.trainee_count || 1)),
    training_location: String(draft.training_location || "").trim(),
    month_interest: String(draft.month_interest || "").trim(),
    year_interest: String(draft.year_interest || "").trim(),

    first_name: String(draft.first_name || "").trim(),
    last_name: String(draft.last_name || "").trim(),
    position: String(draft.position || "").trim(),
    department: String(draft.department || "").trim(),
    contact_phone: normalizeDigits(
      draft.contact_phone || draft.contact_phone_raw
    ),
    email: String(draft.email || "").trim(),

    company: String(draft.company || "").trim(),
    tax_id: normalizeDigits(draft.tax_id),
    company_phone: normalizeDigits(
      draft.company_phone || draft.company_phone_raw
    ),
    receipt_address: String(draft.receipt_address || "").trim(),
    province: String(draft.province || "").trim(),
    district: String(draft.district || "").trim(),
    subdistrict: String(draft.subdistrict || "").trim(),
    postcode: String(draft.postcode || "").trim(),

    note: String(draft.note || "").trim(),
  };
}

function validatePayload(p) {
  const errs = [];
  if (!p.courseSlug) errs.push("courseSlug is required");

  if (!p.month_interest) errs.push("month_interest is required");
  if (!p.year_interest) errs.push("year_interest is required");
  if (!p.training_location) errs.push("training_location is required");

  if (!p.first_name) errs.push("first_name is required");
  if (!p.last_name) errs.push("last_name is required");
  if (!p.contact_phone) errs.push("contact_phone is required");
  if (!p.email) errs.push("email is required");
  if (p.email && !isValidEmail(p.email)) errs.push("email is invalid");

  if (!p.company) errs.push("company is required");
  if (!p.tax_id) errs.push("tax_id is required");
  if (p.tax_id && p.tax_id.length > 13)
    errs.push("tax_id must be <= 13 digits");
  if (!p.receipt_address) errs.push("receipt_address is required");

  return errs;
}

export async function POST(req) {
  await dbConnect();

  const body = await req.json().catch(() => ({}));
  const draft = body?.draft || body || {};
  const payload = pickDraft(draft);

  const errs = validatePayload(payload);
  if (errs.length) {
    return Response.json({ ok: false, errors: errs }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "";
  const userAgent = req.headers.get("user-agent") || "";

  const doc = await Registration.create({
    ...payload,
    ip,
    userAgent,
    status: "new",
    source: "web",
  });

  const refNo = String(doc._id);

  // ✅ BCC admin หลายคน
  const adminBcc = (process.env.ADMIN_NOTIFY_EMAILS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(",");

  // ✅ Template Model (ต้องตรงกับตัวแปรใน Postmark Template)
  const templateModel = {
    ref_no: refNo,
    submitted_at: new Date(doc.createdAt).toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
    }),

    course_title: payload.courseSlug,
    trainee_count: payload.trainee_count,
    month_interest: payload.month_interest,
    year_interest: payload.year_interest,
    training_location: payload.training_location,

    coordinator_name: `${payload.first_name} ${payload.last_name}`.trim(),
    coordinator_email: payload.email,
    coordinator_phone: payload.contact_phone,

    company_name: payload.company,
    company_tax_id: payload.tax_id,
    company_address: payload.receipt_address,

    note: payload.note || "",
  };

  // ✅ ส่งด้วย Postmark Template
  try {
    await sendWithTemplate({
      to: payload.email,
      bcc: adminBcc || undefined,
      templateId: process.env.POSTMARK_NX_REG_USER_TH_TEMPLATE_ID,
      model: templateModel,
      tag: "nx-registration",
    });
  } catch (e) {
    console.error("Send template email failed:", e);
    // ไม่ throw เพื่อไม่ให้การลงทะเบียนพัง
  }

  return Response.json({
    ok: true,
    registrationId: refNo,
    createdAt: doc.createdAt,
  });
}
