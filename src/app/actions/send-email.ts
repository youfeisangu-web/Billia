"use server";

import { auth } from "@clerk/nextjs/server";
import { Resend } from "resend";

export type SendEmailResult = { success: boolean; message: string };

export async function sendDocumentEmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}): Promise<SendEmailResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, message: "認証が必要です" };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, message: "メール送信が設定されていません（RESEND_API_KEY）" };

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@billia.app";

  const resend = new Resend(apiKey);

  const htmlBody = body
    .split("\n")
    .map((line) => (line === "" ? "<br>" : `<p style="margin:0 0 4px">${line}</p>`))
    .join("\n");

  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1e293b">
        ${htmlBody}
      </div>
    `,
  });

  if (error) {
    return { success: false, message: error.message ?? "送信に失敗しました" };
  }

  return { success: true, message: "送信しました" };
}
