// /api/public/registrations/route.js
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import Registration from "@/models/Registration";
import { generateRefNoByCourse } from "@/lib/refNo";
import { sendWithTemplate } from "@/lib/postmark";
import { verifyRecaptchaV3 } from "@/lib/recaptchaServer";
import { rateLimitHit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------------- helpers ---------------- */
function isValidEmail(x) {
  const s = String(x || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function normalizeDigits(x) {
  return String(x || "").replace(/\D/g, "");
}

function clean(s) {
  return String(s || "").trim();
}

function pickDraft(draft = {}) {
  return {
    courseSlug: clean(draft.courseSlug),
    locale: clean(draft.locale || "th"),

    trainee_count: Math.max(1, Number(draft.trainee_count || 1)),
    training_location: clean(draft.training_location),
    month_interest: clean(draft.month_interest),
    year_interest: clean(draft.year_interest),

    first_name: clean(draft.first_name),
    last_name: clean(draft.last_name),
    position: clean(draft.position),
    department: clean(draft.department),
    contact_phone: normalizeDigits(
      draft.contact_phone || draft.contact_phone_raw
    ),
    email: clean(draft.email),

    company: clean(draft.company),

    // ✅ NEW: branch (default ให้ปลอดภัย เผื่อ draft เก่า)
    branch: clean(draft.branch) || "สำนักงานใหญ่",

    tax_id: normalizeDigits(draft.tax_id),
    company_phone: normalizeDigits(
      draft.company_phone || draft.company_phone_raw
    ),
    receipt_address: clean(draft.receipt_address),
    province: clean(draft.province),
    district: clean(draft.district),
    subdistrict: clean(draft.subdistrict),
    postcode: clean(draft.postcode),

    note: clean(draft.note),
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

  // ✅ NEW: branch required
  if (!p.branch) errs.push("branch is required");

  if (!p.tax_id) errs.push("tax_id is required");
  if (p.tax_id && p.tax_id.length > 13)
    errs.push("tax_id must be <= 13 digits");
  if (!p.receipt_address) errs.push("receipt_address is required");

  return errs;
}

function adminBccList() {
  return (process.env.ADMIN_NOTIFY_EMAILS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(",");
}

/* ---------------- route ---------------- */
export async function POST(req) {
  await dbConnect();

  // IP / UA
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || "";

  // ✅ rate limit (5 ครั้ง/นาที/IP)
  const rl = rateLimitHit(`nxreg:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return Response.json(
      { ok: false, error: "rate limited" },
      { status: 429, headers: { "retry-after": "60" } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const draft = body?.draft || body || {};
  const payload = pickDraft(draft);

  // ✅ verify reCAPTCHA v3 (server-side)
  const recaptchaToken = clean(body?.recaptchaToken);
  const vr = await verifyRecaptchaV3(recaptchaToken, "nx_register_submit");
  if (!vr.ok) {
    return Response.json(
      { ok: false, error: "recaptcha failed", reason: vr.reason },
      { status: 400 }
    );
  }

  const errs = validatePayload(payload);
  if (errs.length) {
    return Response.json({ ok: false, errors: errs }, { status: 400 });
  }

  // หา courseCode จาก courseSlug (ถ้าไม่มี fallback เป็น slug)
  const course = await Course.findOne({ slug: payload.courseSlug })
    .select("course_code slug title_th title_en")
    .lean();

  const courseCode = course?.course_code || payload.courseSlug || "COURSE";

  // ✅ refNo แยกตามคอร์ส
  const refNo = await generateRefNoByCourse({
    prefix: "NX",
    courseCode,
  });

  // ✅ create registration
  const doc = await Registration.create({
    ref_no: refNo,
    course_code: clean(courseCode).toUpperCase(),
    ...payload,
    ip,
    userAgent,
    status: "new",
    source: "web",
  });

  // ✅ BCC admin หลายคน
  const adminBcc = adminBccList();

  // ✅ title สำหรับ email (เอาชื่อคอร์สจริง ถ้ามี)
  const courseTitle =
    (payload.locale === "en" ? course?.title_en : course?.title_th) ||
    course?.title_th ||
    course?.title_en ||
    payload.courseSlug;

  // ✅ Template Model (ต้องตรงกับตัวแปรใน Postmark Template)
  const templateModel = {
    ref_no: doc.ref_no,
    submitted_at: new Date(doc.createdAt).toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
    }),

    course_title: courseTitle,
    trainee_count: payload.trainee_count,
    month_interest: payload.month_interest,
    year_interest: payload.year_interest,
    training_location: payload.training_location,

    coordinator_name: `${payload.first_name} ${payload.last_name}`.trim(),
    coordinator_email: payload.email,
    coordinator_phone: payload.contact_phone,

    company_name: payload.company,

    // ✅ NEW: map ไปให้ template ที่คุณใส่ {{company_branch}}
    company_branch: payload.branch,

    company_tax_id: payload.tax_id,
    company_address: payload.receipt_address,

    current_status: doc.status,
    note: payload.note || "",
  };

  // ✅ ส่งด้วย Postmark Template (template เดียว ส่งให้ user + BCC admin)
  try {
    const tplId =
      payload.locale === "en"
        ? process.env.POSTMARK_NX_REG_USER_EN_TEMPLATE_ID
        : process.env.POSTMARK_NX_REG_USER_TH_TEMPLATE_ID;

    if (tplId) {
      await sendWithTemplate({
        to: payload.email,
        bcc: adminBcc || undefined,
        templateId: tplId,
        model: templateModel,
        tag: "nx-registration",
      });
    } else {
      console.warn("Missing Postmark template env for locale:", payload.locale);
    }
  } catch (e) {
    console.error("Send template email failed:", e);
    // ไม่ throw เพื่อไม่ให้การลงทะเบียนพัง
  }

  return Response.json({
    ok: true,
    registrationId: String(doc._id),
    refNo: doc.ref_no,
    createdAt: doc.createdAt,
  });
}
