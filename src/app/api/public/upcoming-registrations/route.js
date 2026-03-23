import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import UpcomingRegistration from "@/models/UpcomingRegistration";
import Course from "@/models/Course";
import { sendWithTemplate } from "@/lib/postmark";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------------- env ---------------- */
const CUSTOMER_TEMPLATE_ID = Number(
  process.env.POSTMARK_TEMPLATE_UPCOMING_REGISTER_CONFIRM_ID || 0,
);

const NOTIFY_TEMPLATE_ID = Number(
  process.env.POSTMARK_TEMPLATE_UPCOMING_REGISTER_NOTIFY_ID || 0,
);

const NOTIFY_TO =
  process.env.REGISTRATION_NOTIFY_EMAIL || process.env.POSTMARK_FROM || "";

/* ---------------- helpers ---------------- */
function clean(x) {
  return String(x ?? "").trim();
}

function digitsOnly(x) {
  return clean(x).replace(/\D/g, "");
}

function isValidEmail(x) {
  const s = clean(x);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function jsonError(message, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function bool(x) {
  return !!x;
}

function formatSubmittedAt(date, locale = "th") {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";

  try {
    return d.toLocaleString(locale === "en" ? "en-GB" : "th-TH", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d.toISOString();
  }
}

function buildRefNo() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `UP-${y}${m}${day}-${rnd}`;
}

async function ensureUniqueRefNo() {
  let ref = buildRefNo();
  let guard = 0;

  while (await UpcomingRegistration.exists({ ref_no: ref })) {
    guard += 1;
    if (guard > 20) break;
    ref = buildRefNo();
  }

  return ref;
}

function buildTraineesSummary(doc) {
  if (doc?.no_trainees_yet) {
    return "ยังไม่ประสงค์แจ้งรายชื่อผู้เข้าอบรม";
  }

  const list = Array.isArray(doc?.trainees) ? doc.trainees : [];
  if (!list.length) return "-";

  return list
    .map((t, i) => {
      const fullName = [clean(t?.first_name), clean(t?.last_name)]
        .filter(Boolean)
        .join(" ");
      const email = clean(t?.email) || "-";
      const phone = clean(t?.phone_raw) || clean(t?.phone) || "-";
      return `${i + 1}. ${fullName || "-"} | ${email} | ${phone}`;
    })
    .join("\n");
}

function buildInvoiceName(tax) {
  if (!tax || typeof tax !== "object") return "-";

  if (tax.type === "company") {
    return clean(tax.company_name) || "-";
  }

  return (
    [clean(tax.personal_first_name), clean(tax.personal_last_name)]
      .filter(Boolean)
      .join(" ") || "-"
  );
}

function buildInvoiceBranch(tax) {
  if (!tax || typeof tax !== "object") return "-";
  if (tax.type !== "company") return "-";
  return clean(tax.branch) || "สำนักงานใหญ่";
}

function buildInvoiceAddress(tax) {
  if (!tax || typeof tax !== "object") return "-";

  const parts = [
    clean(tax.address),
    clean(tax.subdistrict),
    clean(tax.district),
    clean(tax.province),
    clean(tax.postcode),
  ].filter(Boolean);

  return parts.join(" ") || "-";
}

function buildSourceChannelText(sourceChannel, sourceOther) {
  const c = clean(sourceChannel);
  if (!c) return "-";
  if (c === "Other")
    return sourceOther ? `Other: ${clean(sourceOther)}` : "Other";
  return c;
}

function buildCoordinatorName(coordinator) {
  return (
    [clean(coordinator?.first_name), clean(coordinator?.last_name)]
      .filter(Boolean)
      .join(" ") || "-"
  );
}

function pickCourseDateText(course, locale = "th") {
  const direct =
    clean(course?.upcomingDateText) ||
    clean(course?.upcoming_date_text) ||
    clean(course?.upcomingDateLabel) ||
    clean(course?.upcoming_date_label) ||
    clean(course?.courseDateText) ||
    clean(course?.course_date_text);

  if (direct) return direct;

  const startRaw =
    course?.upcomingStartDate ||
    course?.upcoming_start_date ||
    course?.startDate ||
    course?.start_date;

  const endRaw =
    course?.upcomingEndDate ||
    course?.upcoming_end_date ||
    course?.endDate ||
    course?.end_date;

  const start = startRaw ? new Date(startRaw) : null;
  const end = endRaw ? new Date(endRaw) : null;

  if (start && !Number.isNaN(start.getTime())) {
    const fmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "th-TH", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    if (end && !Number.isNaN(end.getTime())) {
      return `${fmt.format(start)} - ${fmt.format(end)}`;
    }
    return fmt.format(start);
  }

  return "";
}

function normalizePayload(raw = {}) {
  const draft =
    raw?.draft && typeof raw.draft === "object" ? raw.draft : raw || {};

  const coordinator = draft.coordinator || {};
  const tax = draft.tax || {};

  const traineeCount = Math.max(
    1,
    Math.min(50, Number(draft.trainee_count || 1)),
  );

  const trainees = (Array.isArray(draft.trainees) ? draft.trainees : [])
    .slice(0, traineeCount)
    .map((t) => ({
      first_name: clean(t?.first_name),
      last_name: clean(t?.last_name),
      email: clean(t?.email),
      phone_raw: digitsOnly(t?.phone_raw),
      phone: digitsOnly(t?.phone),
    }));

  return {
    courseSlug: clean(draft.courseSlug),
    locale: clean(draft.locale) === "en" ? "en" : "th",

    coordinator: {
      first_name: clean(coordinator.first_name),
      last_name: clean(coordinator.last_name),
      email: clean(coordinator.email),
      phone_raw: digitsOnly(coordinator.phone_raw),
      phone: digitsOnly(coordinator.phone),
    },

    trainee_count: traineeCount,
    coordinator_is_trainee: bool(draft.coordinator_is_trainee),
    no_trainees_yet: bool(draft.no_trainees_yet),
    trainees,

    tax: {
      type: clean(tax.type) === "company" ? "company" : "personal",

      personal_first_name: clean(tax.personal_first_name),
      personal_last_name: clean(tax.personal_last_name),

      company_name: clean(tax.company_name),
      branch: clean(tax.branch),

      tax_id: digitsOnly(tax.tax_id).slice(0, 13),
      phone_raw: digitsOnly(tax.phone_raw),
      phone: digitsOnly(tax.phone),

      address: clean(tax.address),
      province: clean(tax.province),
      district: clean(tax.district),
      subdistrict: clean(tax.subdistrict),
      postcode: clean(tax.postcode),
    },

    source_channel: clean(draft.source_channel),
    source_other: clean(draft.source_other),
    note: clean(draft.note),
  };
}

function validatePayload(payload) {
  const errors = [];

  if (!payload.courseSlug) errors.push("courseSlug is required");

  if (!payload.coordinator.first_name)
    errors.push("Coordinator first name is required");
  if (!payload.coordinator.last_name)
    errors.push("Coordinator last name is required");
  if (!isValidEmail(payload.coordinator.email))
    errors.push("Coordinator email is invalid");
  if (payload.coordinator.phone_raw.length < 9)
    errors.push("Coordinator phone is invalid");

  if (!payload.no_trainees_yet) {
    if (
      !Array.isArray(payload.trainees) ||
      payload.trainees.length !== payload.trainee_count
    ) {
      errors.push("Trainee count mismatch");
    } else {
      payload.trainees.forEach((t, i) => {
        if (!t.first_name)
          errors.push(`Trainee #${i + 1} first name is required`);
        if (!t.last_name)
          errors.push(`Trainee #${i + 1} last name is required`);
        if (!isValidEmail(t.email))
          errors.push(`Trainee #${i + 1} email is invalid`);
        if (t.phone_raw.length < 9)
          errors.push(`Trainee #${i + 1} phone is invalid`);
      });
    }
  }

  if (payload.tax.type === "company") {
    if (!payload.tax.company_name) errors.push("Company name is required");
    if (!payload.tax.branch) errors.push("Branch is required");
  } else {
    if (!payload.tax.personal_first_name)
      errors.push("Personal first name is required");
    if (!payload.tax.personal_last_name)
      errors.push("Personal last name is required");
  }

  if (payload.tax.tax_id && payload.tax.tax_id.length !== 13) {
    errors.push("Tax ID must be 13 digits");
  }

  if (!payload.tax.address) errors.push("Tax address is required");
  if (!payload.tax.province) errors.push("Province is required");
  if (!payload.tax.district) errors.push("District is required");
  if (!payload.tax.subdistrict) errors.push("Subdistrict is required");
  if (!payload.tax.postcode) errors.push("Postcode is required");

  if (!payload.source_channel) errors.push("source_channel is required");
  if (
    payload.source_channel !== "Bitkub Academy" &&
    payload.source_channel !== "9Expert Training" &&
    payload.source_channel !== "Key Solutions Training" &&
    payload.source_channel !== "Other"
  ) {
    errors.push("source_channel is invalid");
  }
  if (payload.source_channel === "Other" && !payload.source_other) {
    errors.push("source_other is required");
  }

  return errors;
}

/* ---------------- route ---------------- */
export async function POST(req) {
  await dbConnect();

  const body = await req.json().catch(() => ({}));
  const payload = normalizePayload(body);

  const errors = validatePayload(payload);
  if (errors.length) {
    return NextResponse.json(
      { ok: false, error: errors[0], errors },
      { status: 400 },
    );
  }

  const course = await Course.findOne({
    slug: payload.courseSlug,
    isActive: true,
    status: "published",
  })
    .select({
      slug: 1,
      title_th: 1,
      title_en: 1,
      isUpcoming: 1,
      upcomingTag: 1,
      upcomingDateText: 1,
    })
    .lean();

  if (!course) return jsonError("Course not found", 404);
  if (!course.isUpcoming) {
    return jsonError(
      "This course is not available for upcoming registration",
      400,
    );
  }
  if (clean(course.upcomingTag) === "full") {
    return jsonError("This class is full", 400);
  }

  let trainees = payload.trainees;
  if (
    !payload.no_trainees_yet &&
    payload.coordinator_is_trainee &&
    trainees.length
  ) {
    trainees = [...trainees];
    trainees[0] = {
      first_name: payload.coordinator.first_name,
      last_name: payload.coordinator.last_name,
      email: payload.coordinator.email,
      phone_raw: payload.coordinator.phone_raw,
      phone: payload.coordinator.phone,
    };
  }

  const refNo = await ensureUniqueRefNo();

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "";

  const userAgent = req.headers.get("user-agent") || "";

  const doc = await UpcomingRegistration.create({
    ref_no: refNo,
    courseSlug: payload.courseSlug,
    locale: payload.locale,

    coordinator: payload.coordinator,

    trainee_count: payload.trainee_count,
    coordinator_is_trainee: payload.coordinator_is_trainee,
    no_trainees_yet: payload.no_trainees_yet,
    trainees: payload.no_trainees_yet ? [] : trainees,

    tax: {
      ...payload.tax,
      branch:
        payload.tax.type === "company"
          ? payload.tax.branch ||
            (payload.locale === "en" ? "Head Office" : "สำนักงานใหญ่")
          : "",
    },

    source_channel: payload.source_channel,
    source_other:
      payload.source_channel === "Other" ? payload.source_other : "",
    note: payload.note,

    status: "new",
    source: "web",

    ip,
    userAgent,
  });

  const courseTitle =
    payload.locale === "en"
      ? clean(course.title_en) || clean(course.title_th)
      : clean(course.title_th) || clean(course.title_en);

  const submittedAt = formatSubmittedAt(doc.createdAt, payload.locale);
  const courseDateText = pickCourseDateText(course, payload.locale);

  const customerModel = {
    ref_no: refNo,
    submitted_at: submittedAt,
    course_title: courseTitle,

    // ✅ ใช้ใน subject
    course_title_subject: courseDateText
      ? `${courseTitle} (${courseDateText})`
      : courseTitle,

    // ✅ ใช้ใน body
    course_date_text: courseDateText || "-",

    coordinator_name: buildCoordinatorName(doc.coordinator),
    coordinator_email: clean(doc.coordinator?.email) || "-",
    coordinator_phone:
      clean(doc.coordinator?.phone_raw) || clean(doc.coordinator?.phone) || "-",

    trainee_count: String(doc.trainee_count || 1),
    coordinator_is_trainee_text: doc.coordinator_is_trainee ? "ใช่" : "ไม่ใช่",
    trainee_notice_text: doc.no_trainees_yet
      ? "ยังไม่ประสงค์แจ้งรายชื่อผู้เข้าอบรม"
      : "แจ้งรายชื่อผู้เข้าอบรมแล้ว",

    trainees_summary: buildTraineesSummary(doc),

    tax_type_label:
      doc.tax?.type === "company" ? "นิติบุคคล / บริษัท" : "บุคคลทั่วไป",

    invoice_name: buildInvoiceName(doc.tax),
    invoice_branch: buildInvoiceBranch(doc.tax),
    invoice_tax_id: clean(doc.tax?.tax_id) || "-",
    invoice_address: buildInvoiceAddress(doc.tax),

    source_channel_text: buildSourceChannelText(
      doc.source_channel,
      doc.source_other,
    ),

    note: clean(doc.note) || "-",
  };

  const notifyModel = {
    ...customerModel,
    registration_id: String(doc._id),
    locale: doc.locale || "th",
    course_slug: doc.courseSlug || "",
    status: doc.status || "new",
    created_at_iso: doc.createdAt ? new Date(doc.createdAt).toISOString() : "",
    ip: clean(doc.ip) || "-",
    user_agent: clean(doc.userAgent) || "-",
  };

  try {
    if (CUSTOMER_TEMPLATE_ID > 0 && clean(doc.coordinator?.email)) {
      await sendWithTemplate({
        to: doc.coordinator.email,
        templateId: CUSTOMER_TEMPLATE_ID,
        model: customerModel,
        tag: "upcoming-register-confirm",
      });
    } else {
      console.warn(
        "Skip customer email: missing POSTMARK_TEMPLATE_UPCOMING_REGISTER_CONFIRM_ID or coordinator email",
      );
    }
  } catch (err) {
    console.error("Customer upcoming confirm email failed:", err);
  }

  try {
    if (NOTIFY_TEMPLATE_ID > 0 && NOTIFY_TO) {
      await sendWithTemplate({
        to: NOTIFY_TO,
        templateId: NOTIFY_TEMPLATE_ID,
        model: notifyModel,
        tag: "upcoming-register-notify",
      });
    }
  } catch (err) {
    console.error("Upcoming internal notify email failed:", err);
  }

  return NextResponse.json({
    ok: true,
    id: String(doc._id),
    refNo,
  });
}
