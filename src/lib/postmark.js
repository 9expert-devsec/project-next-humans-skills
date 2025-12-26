import Postmark from "postmark";

const API_KEY = process.env.POSTMARK_API_KEY;
const FROM = process.env.POSTMARK_FROM;
const STREAM = process.env.POSTMARK_MESSAGE_STREAM || "outbound";

if (!API_KEY) console.warn("Missing POSTMARK_API_KEY");
if (!FROM) console.warn("Missing POSTMARK_FROM");

const client = API_KEY ? new Postmark.ServerClient(API_KEY) : null;

// ส่งแบบปกติ (ถ้ายังอยากเก็บไว้ใช้)
export async function sendEmail({ to, bcc, subject, html, text, tag }) {
  if (!client) throw new Error("Postmark client not initialized");
  return client.sendEmail({
    From: FROM,
    To: to,
    Bcc: bcc || undefined,
    Subject: subject,
    HtmlBody: html,
    TextBody: text,
    MessageStream: STREAM,
    Tag: tag,
  });
}

// ✅ ส่งแบบใช้ Postmark Template
export async function sendWithTemplate({ to, bcc, templateId, model, tag }) {
  if (!client) throw new Error("Postmark client not initialized");
  if (!templateId) throw new Error("Missing templateId");

  return client.sendEmailWithTemplate({
    From: FROM,
    To: to,
    Bcc: bcc || undefined,
    TemplateId: Number(templateId),
    TemplateModel: model || {},
    MessageStream: STREAM,
    Tag: tag,
  });
}
