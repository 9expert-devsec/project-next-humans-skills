import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Registration from "@/models/Registration";
import { sendWithTemplate } from "@/lib/postmark";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function adminBccList() {
  return (process.env.ADMIN_NOTIFY_EMAILS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(",");
}

function buildTemplateModel(item) {
  return {
    ref_no: String(item._id),
    submitted_at: new Date(item.createdAt).toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
    }),

    course_title: item.courseSlug || "",
    trainee_count: item.trainee_count || 1,
    month_interest: item.month_interest || "",
    year_interest: item.year_interest || "",
    training_location: item.training_location || "",

    coordinator_name: `${item.first_name || ""} ${item.last_name || ""}`.trim(),
    coordinator_email: item.email || "",
    coordinator_phone: item.contact_phone || "",

    company_name: item.company || "",
    company_tax_id: item.tax_id || "",
    company_address: item.receipt_address || "",

    note: item.note || "",
    current_status: item.status || "new",
  };
}

export async function POST(_req, ctx) {
  await dbConnect();
  const { id } = await ctx.params;

  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json(
      { ok: false, error: "invalid id" },
      { status: 400 }
    );
  }

  const item = await Registration.findById(id).lean();
  if (!item) {
    return NextResponse.json(
      { ok: false, error: "not found" },
      { status: 404 }
    );
  }

  const to = item.email;
  if (!to) {
    return NextResponse.json(
      { ok: false, error: "registration has no email" },
      { status: 400 }
    );
  }

  const tplId =
    item.locale === "en"
      ? process.env.POSTMARK_NX_REG_USER_EN_TEMPLATE_ID
      : process.env.POSTMARK_NX_REG_USER_TH_TEMPLATE_ID;

  if (!tplId) {
    return NextResponse.json(
      { ok: false, error: "missing template id env" },
      { status: 500 }
    );
  }

  try {
    await sendWithTemplate({
      to,
      bcc: adminBccList() || undefined,
      templateId: tplId,
      model: buildTemplateModel(item),
      tag: "nx-registration-resend",
    });
  } catch (e) {
    console.error("resend-email failed:", e);
    return NextResponse.json(
      { ok: false, error: "send failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
