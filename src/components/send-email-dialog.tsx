"use client";

import { useState, useTransition } from "react";
import { sendDocumentEmail } from "@/app/actions/send-email";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Loader2 } from "lucide-react";

type Props = {
  to: string;
  subject: string;
  body: string;
  label?: string;
  variant?: "default" | "reminder";
};

export default function SendEmailDialog({
  to,
  subject,
  body,
  label = "メールで送付",
  variant = "default",
}: Props) {
  const [open, setOpen] = useState(false);
  const [toValue, setToValue] = useState(to);
  const [subjectValue, setSubjectValue] = useState(subject);
  const [bodyValue, setBodyValue] = useState(body);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpen = () => {
    setToValue(to);
    setSubjectValue(subject);
    setBodyValue(body);
    setResult(null);
    setOpen(true);
  };

  const handleSend = () => {
    setResult(null);
    startTransition(async () => {
      const res = await sendDocumentEmail({
        to: toValue,
        subject: subjectValue,
        body: bodyValue,
      });
      setResult(res);
      if (res.success) {
        setTimeout(() => setOpen(false), 1500);
      }
    });
  };

  const buttonClass =
    variant === "reminder"
      ? "inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 shadow-sm transition hover:bg-amber-100"
      : "inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50";

  return (
    <>
      <button type="button" onClick={handleOpen} className={buttonClass}>
        {variant === "reminder" ? "⏰ " : "📧 "}
        {label}
      </button>

      <ResponsiveModal
        open={open}
        onOpenChange={setOpen}
        title={variant === "reminder" ? "⏰ リマインドメール送信" : "📧 メール送信"}
      >
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">宛先</label>
              <input
                type="email"
                inputMode="email"
                value={toValue}
                onChange={(e) => setToValue(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">件名</label>
              <input
                type="text"
                value={subjectValue}
                onChange={(e) => setSubjectValue(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">本文</label>
              <textarea
                value={bodyValue}
                onChange={(e) => setBodyValue(e.target.value)}
                rows={8}
                className="w-full min-h-[44px] rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
              />
            </div>

            {result && (
              <p
                className={`text-sm font-medium ${
                  result.success ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {result.success ? "✓ " : "✗ "}
                {result.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="flex-1 min-h-[44px] sm:min-h-0 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={isPending || !toValue}
                className="flex-1 inline-flex min-h-[44px] sm:min-h-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                アプリから送信
              </button>
            </div>
            <a
              href={`mailto:${encodeURIComponent(toValue)}?subject=${encodeURIComponent(subjectValue)}&body=${encodeURIComponent(bodyValue)}`}
              className="w-full inline-flex min-h-[44px] sm:min-h-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              ↗ Gmail / Outlook で開く
            </a>
          </div>
      </ResponsiveModal>
    </>
  );
}
