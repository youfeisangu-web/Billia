"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { getReconcileSummary } from "@/app/actions/payment";
import { markInvoicePaid } from "@/app/actions/invoice";
import type { ReconcileResult, ReconcileCandidate } from "@/types/reconcile";
import { Upload, CheckCircle2, ExternalLink } from "lucide-react";

type Summary = { totalBilledAmount: number; invoiceCount: number };

export default function ReconcileClient({
  initialSummary,
}: {
  initialSummary: Summary;
}) {
  const [summary, setSummary] = useState<Summary>(initialSummary);
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ReconcileResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [executed, setExecuted] = useState(false);
  const [executedInvoiceIds, setExecutedInvoiceIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      const s = await getReconcileSummary();
      setSummary(s);
    } catch {
      // ignore
    }
  }, []);

  const [parseError, setParseError] = useState<string | null>(null);
  const [lastMeta, setLastMeta] = useState<{ unpaidInvoiceCount: number } | null>(null);

  const runReconcile = useCallback(async (fileList: File[]) => {
    setResults([]);
    setExecuted(false);
    setParseError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      for (const f of fileList) {
        formData.append("file", f);
      }
      const res = await fetch("/api/reconcile", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success) {
        const rows = json.data ?? [];
        setResults(rows);
        setLastMeta(json.meta ?? null);
        if (rows.length === 0) {
          setParseError(
            "ファイルは読み込めましたが、有効な入金明細が1件も抽出できませんでした。ファイルの形式をご確認ください。",
          );
        }
      } else {
        const msg = json.error ?? "ファイルの読み込みに失敗しました";
        setParseError(msg);
        alert("エラー: " + msg);
      }
    } catch (e) {
      const msg = "通信エラーが発生しました";
      setParseError(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const isValidFile = useCallback((f: File) => {
    const fileName = f.name.toLowerCase();
    const fileType = f.type.toLowerCase();
    const isCsv = fileName.endsWith(".csv") || fileType === "text/csv" || fileType === "application/vnd.ms-excel" || fileType === "application/csv";
    const isImage = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(fileType) || fileName.match(/\.(jpg|jpeg|png|gif|webp)$/);
    const isPdf = fileType === "application/pdf" || fileName.endsWith(".pdf");
    return isCsv || isImage || isPdf;
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const dropped = Array.from(e.dataTransfer.files ?? []);
      const valid = dropped.filter(isValidFile);
      const invalid = dropped.filter((f) => !isValidFile(f));
      if (invalid.length > 0) {
        alert("CSV、画像（JPEG、PNG、GIF、WebP）、またはPDFファイルのみ選択できます。");
      }
      if (valid.length > 0) {
        setFiles((prev) => [...prev, ...valid]);
        setParseError(null);
      }
    },
    [isValidFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? []);
      const valid = selected.filter((f) => {
        const fn = f.name.toLowerCase();
        const ft = f.type.toLowerCase();
        return fn.endsWith(".csv") || ft === "text/csv" || ft === "application/vnd.ms-excel" || ft === "application/csv" ||
          ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(ft) || fn.match(/\.(jpg|jpeg|png|gif|webp)$/) ||
          ft === "application/pdf" || fn.endsWith(".pdf");
      });
      if (valid.length > 0) {
        setFiles((prev) => [...prev, ...valid]);
        setParseError(null);
      }
      e.target.value = "";
    },
    [],
  );

  const handleStartReconcile = useCallback(() => {
    if (files.length === 0 || loading) return;
    runReconcile(files);
  }, [files, loading, runReconcile]);

  const completableRows = results.filter(
    (r) => (r.status === "完了" || r.status === "確認") && r.invoiceId && r.date,
  );

  const handleExecute = async () => {
    if (completableRows.length === 0) {
      alert("消し込みできる行がありません（「完了」または「確認」で請求書が決まっている行を支払済にできます）");
      return;
    }
    setConfirming(true);
    const ok = window.confirm(
      `以下の${completableRows.length}件の請求書を支払済にします。よろしいですか？`,
    );
    setConfirming(false);
    if (!ok) return;

    setLoading(true);
    const doneIds = new Set<string>();
    try {
      for (const row of completableRows) {
        if (row.invoiceId) {
          const result = await markInvoicePaid(row.invoiceId);
          if (result.success) doneIds.add(row.invoiceId);
          else alert(result.message);
        }
      }
      setExecuted(true);
      setExecutedInvoiceIds(doneIds);
      await loadSummary();
      alert(`${doneIds.size}件の請求書を支払済にしました。`);
    } catch (err) {
      alert(
        "更新に失敗しました: " +
          (err instanceof Error ? err.message : "不明なエラー"),
      );
    } finally {
      setLoading(false);
    }
  };

  const selectCandidate = useCallback((rowIndex: number, candidate: ReconcileCandidate) => {
    setResults((prev) =>
      prev.map((r, i) => {
        if (i !== rowIndex) return r;
        return {
          ...r,
          invoiceId: candidate.invoiceId,
          invoiceNumber: candidate.invoiceNumber,
          clientName: candidate.clientName,
          status: '確認' as const,
          message: `選択: ${candidate.clientName}（ユーザーが選択）`,
          candidates: undefined,
        };
      }),
    );
  }, []);

  const handleClear = () => {
    setFiles([]);
    setResults([]);
    setExecuted(false);
    setExecutedInvoiceIds(new Set());
    setParseError(null);
    setLastMeta(null);
  };

  const paidRows = results.filter((r) => r.invoiceId && executedInvoiceIds.has(r.invoiceId));
  const pendingCandidateRows = results.filter((r) => r.candidates && r.candidates.length > 0);
  const unmatchedRows = results.filter(
    (r) => r.status === "未完了" || r.status === "エラー" || (r.candidates && r.candidates.length > 0),
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* 請求金額（未払い請求書） */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500">
          請求金額（未回収）
        </h2>
        <p className="mt-2 text-3xl font-bold text-slate-900">
          ¥{summary.totalBilledAmount.toLocaleString()}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          未払い・部分払いの請求書 計{summary.invoiceCount}件（入金明細と照合して支払済にします）
        </p>
        <Link
          href="/dashboard/invoices"
          className="mt-3 inline-block text-sm text-blue-600 hover:underline"
        >
          請求書一覧はこちら →
        </Link>
      </section>

      {/* ファイルドロップ */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          入金消し込み（CSV・画像・PDF読み込み）
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          銀行の入金明細（CSV、通帳の写真、入金通知書のPDFなど）をドロップするか、選択して読み込みます。AIが自動で入金情報を抽出し、内容を確認してから「消し込みを実行」でマッチした請求書を支払済にします。
        </p>
        <p className="text-xs text-slate-500 mb-4 rounded-lg bg-slate-100 p-3">
          <strong>手順：</strong> ファイルを選択（複数可）したら「消し込み開始」を押して解析します。<strong>金額は完全に同じ</strong>未払い請求書と照合し、<strong>名前は完全でなくてもあってそうな候補</strong>を表示します。確認後に「消し込みを実行」で支払済にします。
          <br />
          <strong>対応形式：</strong> CSV（Shift_JIS / UTF-8）、画像（JPEG、PNG、GIF、WebP）、PDF　<strong>複数ファイルを一括で処理できます</strong>
        </p>
        <div
          role="button"
          tabIndex={0}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById("reconcile-file")?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              document.getElementById("reconcile-file")?.click();
            }
          }}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 px-6 transition-colors cursor-pointer select-none ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
          }`}
        >
          <input
            id="reconcile-file"
            type="file"
            multiple
            accept=".csv,text/csv,application/vnd.ms-excel,application/csv,.pdf,application/pdf,image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileInput}
            className="sr-only"
            aria-label="ファイルを選択"
          />
          <Upload className="h-10 w-10 text-slate-400 pointer-events-none" />
          <span className="font-medium text-slate-600 pointer-events-none">
            {files.length > 0 ? `${files.length}件のファイルを選択済み` : "ファイルをドロップまたはクリックして選択（複数可）"}
          </span>
          <span className="text-xs text-slate-500 pointer-events-none">
            CSV、画像（JPEG、PNG、GIF、WebP）、PDF対応（AIで自動読み取り）
          </span>
        </div>
        {files.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-600">
              選択中: {files.length}件
              {files.length <= 5 && `（${files.map((f) => f.name).join(", ")}）`}
            </span>
            <button
              type="button"
              onClick={() => setFiles([])}
              className="text-sm text-slate-500 hover:text-slate-700 underline"
            >
              クリア
            </button>
            <button
              type="button"
              onClick={handleStartReconcile}
              disabled={loading}
              className="inline-flex items-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "解析中です…" : "消し込み開始"}
            </button>
          </div>
        )}
        {loading && (
          <p className="mt-3 text-center text-sm text-slate-500">入金明細を解析しています。しばらくお待ちください。</p>
        )}
        {parseError && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {parseError}
          </div>
        )}
        {results.length > 0 && (lastMeta?.unpaidInvoiceCount ?? summary.invoiceCount) === 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">未払いの請求書が0件のため、マッチする請求書がありません。</p>
            <p className="mt-1 text-xs">請求書を発行し、ステータスが「未払い」「部分払い」のものと入金明細を照合します。</p>
          </div>
        )}
        {results.length > 0 && completableRows.length === 0 && (lastMeta?.unpaidInvoiceCount ?? summary.invoiceCount) > 0 && !executed && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-medium">未払い請求書はありますが、CSVの名義・金額と一致しませんでした。</p>
            <p className="mt-1 text-xs">入金明細の名義（振込人名）と請求書の取引先名・請求金額が近いか確認してください。</p>
          </div>
        )}
      </section>

      {/* 消込結果と確認 */}
      {results.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {executed && paidRows.length > 0 && (
            <div className="border-b border-emerald-200 bg-emerald-50 px-6 py-4">
              <h2 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                消し込み結果：{paidRows.length}件を支払済にしました
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-emerald-800">
                {paidRows.map((row, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2">
                    {row.invoiceId ? (
                      <Link
                        href={`/dashboard/invoices/${row.invoiceId}`}
                        className="font-medium text-emerald-700 hover:underline inline-flex items-center gap-1"
                      >
                        {row.invoiceNumber ?? row.invoiceId}
                        <ExternalLink className="h-3.5 w-3" />
                      </Link>
                    ) : null}
                    <span>{row.clientName && ` ${row.clientName}`}</span>
                    <span className="text-emerald-600">¥{row.amount.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">入金確認・消込結果</h2>
            <p className="text-sm text-slate-600 mt-1">
              金額が一致した請求書のうち、名前が近い候補を表示しています。問題なければ「消し込みを実行」で支払済にします。
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">日付</th>
                  <th className="px-4 py-3 font-medium">入金名義 (CSV)</th>
                  <th className="px-4 py-3 font-medium">金額</th>
                  <th className="px-4 py-3 font-medium">判定</th>
                  <th className="px-4 py-3 font-medium">請求書</th>
                  <th className="px-4 py-3 font-medium">コメント</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {results.map((row, i) => {
                  const isPaid = row.invoiceId && executedInvoiceIds.has(row.invoiceId);
                  return (
                    <tr
                      key={i}
                      className={
                        isPaid
                          ? "bg-emerald-50/50 border-l-4 border-l-emerald-500"
                          : "bg-white"
                      }
                    >
                      <td className="px-4 py-3 text-slate-700">{row.date}</td>
                      <td className="px-4 py-3 font-mono text-slate-800">{row.rawName}</td>
                      <td className="px-4 py-3 text-slate-800">
                        ¥{row.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isPaid
                              ? "bg-emerald-200 text-emerald-900"
                              : row.status === "完了"
                                ? "bg-emerald-100 text-emerald-800"
                                : row.status === "エラー"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isPaid && <CheckCircle2 className="h-3.5 w-3.5" />}
                          {isPaid ? "支払済" : row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {row.candidates && row.candidates.length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-amber-700">どの請求書か選択してください：</span>
                            {row.candidates.map((c) => (
                              <button
                                key={c.invoiceId}
                                type="button"
                                onClick={() => selectCandidate(i, c)}
                                className="text-left rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-slate-800 hover:border-amber-400 hover:bg-amber-100 transition-colors"
                              >
                                <span className="font-medium">{c.clientName}</span>
                                <span className="ml-2 text-slate-500">発行: {c.issueDate}</span>
                              </button>
                            ))}
                          </div>
                        ) : row.invoiceId ? (
                          <Link
                            href={`/dashboard/invoices/${row.invoiceId}`}
                            className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                          >
                            {row.invoiceNumber ?? row.invoiceId}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                        {!row.candidates && row.clientName && (
                          <span className="block text-xs text-slate-500 mt-0.5">{row.clientName}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.message}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <div>
              {!executed && (
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="text-emerald-700 font-medium">消込可能: {completableRows.length}件</span>
                  {pendingCandidateRows.length > 0 && (
                    <span className="text-amber-600 font-medium">候補選択待ち: {pendingCandidateRows.length}件</span>
                  )}
                  {unmatchedRows.filter(r => !r.candidates?.length).length > 0 && (
                    <span className="text-slate-500">未照合: {unmatchedRows.filter(r => !r.candidates?.length).length}件</span>
                  )}
                </div>
              )}
              {executed && (
                <p className="text-sm text-slate-600">{paidRows.length}件を支払済にしました</p>
              )}
              {results.length > 0 && completableRows.length === 0 && !executed && (
                <p className="mt-1 text-xs text-amber-700">
                  「完了」「確認」の行が0件です。未払い請求書の取引先名・金額と入金明細が一致するか確認してください。
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                クリア
              </button>
              <button
                type="button"
                onClick={handleExecute}
                disabled={loading || confirming || completableRows.length === 0 || executed}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "更新中..." : executed ? "支払済にしました" : `消し込みを実行（${completableRows.length}件を支払済に）`}
              </button>
            </div>
          </div>

          {/* 消し込み結果サマリー */}
          {(executed || (results.length > 0 && unmatchedRows.length > 0)) && (
            <div className="border-t border-slate-200">
              {executed && (
                <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0">
                  {/* 消込できた */}
                  <div className="px-6 py-5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-700 mb-3">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs">✓</span>
                      消し込み完了 {paidRows.length}件
                      {paidRows.length > 0 && (
                        <span className="text-xs font-normal text-emerald-600">
                          ¥{paidRows.reduce((s, r) => s + r.amount, 0).toLocaleString()}
                        </span>
                      )}
                    </h3>
                    {paidRows.length === 0 ? (
                      <p className="text-xs text-slate-400">なし</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {paidRows.map((r, i) => (
                          <li key={i} className="flex items-center justify-between text-xs text-slate-700">
                            <span className="truncate max-w-[60%]">{r.clientName ?? r.rawName}</span>
                            <span className="font-medium text-emerald-700">¥{r.amount.toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {/* 消込できなかった */}
                  <div className="px-6 py-5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-3">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500 text-xs">—</span>
                      照合できなかった {unmatchedRows.length + pendingCandidateRows.length}件
                      {(unmatchedRows.length + pendingCandidateRows.length) > 0 && (
                        <span className="text-xs font-normal text-slate-500">
                          ¥{[...unmatchedRows, ...pendingCandidateRows].reduce((s, r) => s + r.amount, 0).toLocaleString()}
                        </span>
                      )}
                    </h3>
                    {(unmatchedRows.length === 0 && pendingCandidateRows.length === 0) ? (
                      <p className="text-xs text-slate-400">なし（すべて消し込み完了）</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {unmatchedRows.map((r, i) => (
                          <li key={i} className="text-xs">
                            <span className="text-slate-700 font-medium truncate block">{r.rawName}</span>
                            <span className="text-slate-400">¥{r.amount.toLocaleString()} — {r.message}</span>
                          </li>
                        ))}
                        {pendingCandidateRows.map((r, i) => (
                          <li key={`cand-${i}`} className="text-xs">
                            <span className="text-amber-700 font-medium truncate block">{r.rawName}</span>
                            <span className="text-slate-400">¥{r.amount.toLocaleString()} — 候補が選択されませんでした</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
              {!executed && unmatchedRows.length > 0 && (
                <div className="px-6 py-4 bg-slate-50">
                  <p className="text-xs font-medium text-slate-500 mb-2">照合できていない入金明細 ({unmatchedRows.length}件)</p>
                  <ul className="space-y-1">
                    {unmatchedRows.slice(0, 5).map((r, i) => (
                      <li key={i} className="flex items-center justify-between text-xs text-slate-600">
                        <span className="truncate max-w-[55%]">{r.rawName}</span>
                        <span className="text-slate-500">¥{r.amount.toLocaleString()} — {r.message.slice(0, 30)}{r.message.length > 30 ? '…' : ''}</span>
                      </li>
                    ))}
                    {unmatchedRows.length > 5 && (
                      <li className="text-xs text-slate-400">…他{unmatchedRows.length - 5}件</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
