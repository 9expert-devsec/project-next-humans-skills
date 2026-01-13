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

// ✅ NEW: ช่วยต่อสตริงแบบไม่เอาค่าว่าง
function joinParts(parts, sep = " ") {
  return parts.map(clean).filter(Boolean).join(sep);
}

// ✅ NEW: ประกอบที่อยู่เต็ม (กันบรรทัดว่าง + ฟอร์แมตให้สวย)
function buildCompanyAddressFull(p) {
  const base = clean(p.receipt_address);

  const subdistrict = clean(p.subdistrict);
  const district = clean(p.district);
  const province = clean(p.province);
  const postcode = clean(p.postcode);

  // ปรับคำหน้าได้ตามใจ (บางคนใช้ “ตำบล/อำเภอ”)
  const tail = joinParts([
    subdistrict ? `แขวง/ตำบล ${subdistrict}` : "",
    district ? `เขต/อำเภอ ${district}` : "",
    province ? `จังหวัด ${province}` : "",
    postcode ? `${postcode}` : "",
  ]);

  return joinParts([base, tail]);
}

const SOURCE_ALLOWED = new Set(["Bitkub Academy", "9Expert Training", "Key Solutions Training", "Other", ""]);

function normalizeSourceChannel(x) {
  const v = clean(x);
  return SOURCE_ALLOWED.has(v) ? v : "";
}

function sourceLabel(channel, other, locale = "th") {
  const isEN = locale === "en";
  if (channel === "Bitkub Academy") return isEN ? "Bitkub Academy" : "Bitkub Academy";
  if (channel === "9Expert Training")
    return isEN ? "9Expert Training" : "9Expert Training";
  if (channel === "Key Solutions Training")
    return isEN ? "Key Solutions Training" : "Key Solutions Training";
  if (channel === "Other") return clean(other) || (isEN ? "Other" : "อื่นๆ");
  return "";
}

function pickDraft(draft = {}) {
  const source_channel = normalizeSourceChannel(draft.source_channel);
  const source_other =
    source_channel === "other" ? clean(draft.source_other) : "";

  return {
    courseSlug: clean(draft.courseSlug),
    locale: clean(draft.locale || "th"),

    // section 1
    trainee_count: Math.max(1, Number(draft.trainee_count || 1)),
    training_location: clean(draft.training_location),
    month_interest: clean(draft.month_interest),
    year_interest: clean(draft.year_interest),

    // section 2
    first_name: clean(draft.first_name),
    last_name: clean(draft.last_name),
    position: clean(draft.position),
    department: clean(draft.department),
    contact_phone: normalizeDigits(
      draft.contact_phone || draft.contact_phone_raw
    ),
    email: clean(draft.email),

    // section 3
    company: clean(draft.company),

    // branch
    branch: clean(draft.branch) || "สำนักงานใหญ่",

    // ✅ marketing/source (normalize แล้วเท่านั้น)
    source_channel,
    source_other,

    tax_id: normalizeDigits(draft.tax_id),
    company_phone: normalizeDigits(
      draft.company_phone || draft.company_phone_raw
    ),
    receipt_address: clean(draft.receipt_address),

    // ✅ address pieces
    province: clean(draft.province),
    district: clean(draft.district),
    subdistrict: clean(draft.subdistrict),
    postcode: clean(draft.postcode),

    // section 4
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
  if (!p.branch) errs.push("branch is required");

  if (!p.tax_id) errs.push("tax_id is required");
  if (p.tax_id && p.tax_id.length > 13)
    errs.push("tax_id must be <= 13 digits");
  if (!p.receipt_address) errs.push("receipt_address is required");

  // ✅ NEW: ต้องเลือกช่องทาง
  if (!p.source_channel) errs.push("source_channel is required");
  if (p.source_channel === "other" && !p.source_other)
    errs.push("source_other is required");

  // (optional) ถ้าคุณอยาก “บังคับ” ที่อยู่ให้ครบชุดด้วย ค่อยเปิดใช้
  // if (!p.province) errs.push("province is required");
  // if (!p.district) errs.push("district is required");
  // if (!p.subdistrict) errs.push("subdistrict is required");
  // if (!p.postcode) errs.push("postcode is required");

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

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || "";

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

  const course = await Course.findOne({ slug: payload.courseSlug })
    .select("course_code slug title_th title_en")
    .lean();

  const courseCode = course?.course_code || payload.courseSlug || "COURSE";

  const refNo = await generateRefNoByCourse({
    prefix: "NX",
    courseCode,
  });

  const doc = await Registration.create({
    ref_no: refNo,
    course_code: clean(courseCode).toUpperCase(),
    ...payload,
    ip,
    userAgent,
    status: "new",
    source: "web",
  });

  const adminBcc = adminBccList();

  const courseTitle =
    (payload.locale === "en" ? course?.title_en : course?.title_th) ||
    course?.title_th ||
    course?.title_en ||
    payload.courseSlug;

  // ✅ NEW: ที่อยู่เต็มสำหรับแสดงบนเมล (รวม จังหวัด/อำเภอ/ตำบล/รหัสไปรษณีย์)
  const companyAddressFull = buildCompanyAddressFull(payload);

  // ✅ ส่งเข้าเมลด้วย
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
    company_branch: payload.branch,
    company_tax_id: payload.tax_id,

    // ✅ UPDATED: เดิมส่ง receipt_address อย่างเดียว
    // company_address: payload.receipt_address,
    // ✅ เปลี่ยนเป็น “ที่อยู่เต็ม”
    company_address: companyAddressFull,

    // ✅ (optional) ถ้าคุณอยากแสดงแยกบรรทัดในเมลด้วย ก็ส่งเพิ่มไว้ได้
    company_province: payload.province || "",
    company_district: payload.district || "",
    company_subdistrict: payload.subdistrict || "",
    company_postcode: payload.postcode || "",

    // ✅ NEW: สำหรับ section “ข้อมูลเพิ่มเติม”
    source_channel: payload.source_channel || "",
    source_other: payload.source_other || "",
    source_channel_label: sourceLabel(
      payload.source_channel,
      payload.source_other,
      payload.locale
    ),

    current_status: doc.status,
    note: payload.note || "",
  };

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
    }
  } catch (e) {
    console.error("Send template email failed:", e);
  }

  return Response.json({
    ok: true,
    registrationId: String(doc._id),
    refNo: doc.ref_no,
    createdAt: doc.createdAt,
  });
}
