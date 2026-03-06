"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, useState, useMemo } from "react";
import { updateInvoiceStatusBulk, updateInvoiceFolder } from "@/app/actions/invoice";
import ImportDocumentButton from "./import-document-button";
import { ChevronUp, ChevronDown, ChevronsUpDown, FolderOpen, X } from "lucide-react";

const formatDate = (date: Date | string) =>
  new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(
    typeof date === "string" ? new Date(date) : date,
  );

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ja-JP").format(value);

const STATUS_OPTIONS = [
  { value: "未払い", label: "未払い" },
  { value: "部分払い", label: "部分払い" },
  { value: "支払済", label: "支払済" },
] as const;

type InvoiceRow = {
  id: string;
  issueDate: Date | string;
  totalAmount: number;
  status: string;
  folder: string | null;
  client: { name: string | null } | null;
};

type SortKey = "id" | "client" | "issueDate" | "totalAmount" | "status";

const statusTone: Record<string, string> = {
  未払い: "text-amber-600",
  部分払い: "text-orange-600",
  支払済: "text-emerald-600",
};

const statusBg: Record<string, string> = {
  未払い: "bg-amber-50",
  部分払い: "bg-orange-50",
  支払済: "bg-emerald-50",
};

const FOLDER_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-purple-50 text-purple-700 border-purple-200",
  "bg-pink-50 text-pink-700 border-pink-200",
  "bg-orange-50 text-orange-700 border-orange-200",
  "bg-teal-50 text-teal-700 border-teal-200",
];

export default function InvoicesTableWithBulkStatus({
  invoices,
}: {
  invoices: InvoiceRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [bulkStatus, setBulkStatus] = useState<string>("支払済");
  const [folderFilter, setFolderFilter] = useState<string | null>(null); // null = すべて
  const [sortKey, setSortKey] = useState<SortKey>("issueDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [folderInput, setFolderInput] = useState("");
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [activeFolderCardId, setActiveFolderCardId] = useState<string | null>(null);
  const [mobileFolderInput, setMobileFolderInput] = useState("");

  // 既存フォルダ一覧
  const folders = useMemo(
    () => Array.from(new Set(invoices.map((i) => i.folder).filter((f): f is string => !!f))),
    [invoices],
  );

  // フィルタ
  const filtered = useMemo(() => {
    if (folderFilter === null) return invoices;
    if (folderFilter === "__none__") return invoices.filter((i) => !i.folder);
    return invoices.filter((i) => i.folder === folderFilter);
  }, [invoices, folderFilter]);

  // ソート
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "id":
          cmp = a.id.localeCompare(b.id);
          break;
        case "client":
          cmp = (a.client?.name ?? "").localeCompare(b.client?.name ?? "");
          break;
        case "issueDate":
          cmp = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
          break;
        case "totalAmount":
          cmp = a.totalAmount - b.totalAmount;
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronsUpDown className="inline h-3 w-3 opacity-30 ml-0.5" />;
    return sortDir === "asc"
      ? <ChevronUp className="inline h-3 w-3 ml-0.5" />
      : <ChevronDown className="inline h-3 w-3 ml-0.5" />;
  };

  const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checkboxes = document.querySelectorAll<HTMLInputElement>('input[name="invoice-select"]');
    checkboxes.forEach((cb) => { cb.checked = e.target.checked; });
  };

  const getSelectedIds = (): string[] => {
    const checkboxes = document.querySelectorAll<HTMLInputElement>('input[name="invoice-select"]:checked');
    return Array.from(checkboxes).map((cb) => cb.value);
  };

  const handleBulkStatusChange = () => {
    const ids = getSelectedIds();
    if (ids.length === 0) {
      alert("ステータスを変更する請求書にチェックを入れてください。");
      return;
    }
    if (!confirm(`選択した${ids.length}件の請求書を「${bulkStatus}」に変更しますか？`)) return;
    startTransition(async () => {
      const result = await updateInvoiceStatusBulk(ids, bulkStatus);
      if (!result.success) { alert(result.message); return; }
      alert(result.message);
      router.refresh();
    });
  };

  const handleBulkFolderAssign = () => {
    const ids = getSelectedIds();
    if (ids.length === 0) {
      alert("フォルダを設定する請求書にチェックを入れてください。");
      return;
    }
    startTransition(async () => {
      await updateInvoiceFolder(ids, folderInput.trim() || null);
      router.refresh();
      setFolderInput("");
      setShowFolderInput(false);
    });
  };

  const assignFolderSingle = (id: string, folder: string | null) => {
    startTransition(async () => {
      await updateInvoiceFolder([id], folder);
      router.refresh();
      setActiveFolderCardId(null);
      setMobileFolderInput("");
    });
  };

  const folderColor = (name: string) =>
    FOLDER_COLORS[Math.abs([...name].reduce((s, c) => s + c.charCodeAt(0), 0)) % FOLDER_COLORS.length];

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <p className="billia-label mb-0.5">一覧</p>
          <p className="text-xs text-billia-text-muted hidden md:block">
            発行日・金額・ステータスを確認できます。チェックして一括でステータス変更・フォルダ移動ができます。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ImportDocumentButton />
          <Link
            href="/dashboard/invoices/new?tab=memo"
            className="inline-flex rounded-xl border border-billia-blue bg-white px-3 py-2 text-xs font-medium text-billia-blue transition-colors hover:bg-billia-blue/5 md:px-4 md:py-2.5 md:text-sm"
          >
            メモから作成
          </Link>
          <Link
            href="/dashboard/invoices/new"
            className="inline-flex rounded-xl bg-billia-sidebar px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-95 md:px-4 md:py-2.5 md:text-sm"
          >
            請求書を作成
          </Link>
        </div>
      </div>

      {/* フォルダフィルター */}
      {folders.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <FolderOpen className="h-3.5 w-3.5 text-billia-text-muted shrink-0" />
          <button
            type="button"
            onClick={() => setFolderFilter(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              folderFilter === null
                ? "bg-billia-sidebar text-white border-billia-sidebar"
                : "bg-white text-billia-text-muted border-billia-border hover:bg-billia-bg"
            }`}
          >
            すべて ({invoices.length})
          </button>
          {folders.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFolderFilter(folderFilter === f ? null : f)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                folderFilter === f
                  ? "bg-billia-sidebar text-white border-billia-sidebar"
                  : `${folderColor(f)} hover:opacity-80`
              }`}
            >
              {f} ({invoices.filter((i) => i.folder === f).length})
            </button>
          ))}
          {invoices.some((i) => !i.folder) && (
            <button
              type="button"
              onClick={() => setFolderFilter(folderFilter === "__none__" ? null : "__none__")}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                folderFilter === "__none__"
                  ? "bg-billia-sidebar text-white border-billia-sidebar"
                  : "bg-white text-billia-text-muted border-billia-border hover:bg-billia-bg"
              }`}
            >
              未分類 ({invoices.filter((i) => !i.folder).length})
            </button>
          )}
        </div>
      )}

      {/* 一括操作バー（デスクトップのみ） */}
      {invoices.length > 0 && (
        <div className="mt-4 hidden md:flex flex-wrap items-center gap-3 rounded-lg border border-billia-border-subtle bg-billia-bg px-4 py-3">
          <span className="text-sm font-medium text-billia-text-muted">一括操作：</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="rounded-lg border border-billia-border bg-white px-3 py-2 text-sm text-billia-text"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleBulkStatusChange}
            disabled={isPending}
            className="inline-flex rounded-xl bg-billia-green px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-95 disabled:opacity-50"
          >
            {isPending ? "更新中..." : "ステータスを変更"}
          </button>

          <div className="h-5 w-px bg-billia-border" />

          {showFolderInput ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleBulkFolderAssign(); if (e.key === "Escape") setShowFolderInput(false); }}
                placeholder="フォルダ名（空にすると解除）"
                list="folder-suggestions"
                autoFocus
                className="rounded-lg border border-billia-border bg-white px-3 py-2 text-sm text-billia-text w-52"
              />
              <datalist id="folder-suggestions">
                {folders.map((f) => <option key={f} value={f} />)}
              </datalist>
              <button
                type="button"
                onClick={handleBulkFolderAssign}
                disabled={isPending}
                className="inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                設定
              </button>
              <button
                type="button"
                onClick={() => setShowFolderInput(false)}
                className="p-2 text-billia-text-muted hover:text-billia-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowFolderInput(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-billia-border bg-white px-4 py-2.5 text-sm font-medium text-billia-text hover:bg-billia-bg"
            >
              <FolderOpen className="h-4 w-4" />
              フォルダに移動
            </button>
          )}
        </div>
      )}

      {/* モバイル：並び替えコントロール */}
      <div className="mt-3 flex items-center gap-2 md:hidden">
        <span className="text-xs text-billia-text-muted shrink-0">並び替え:</span>
        <select
          value={`${sortKey}_${sortDir}`}
          onChange={(e) => {
            const [k, d] = e.target.value.split("_");
            setSortKey(k as SortKey);
            setSortDir(d as "asc" | "desc");
          }}
          className="flex-1 text-xs rounded-xl border border-billia-border bg-white px-3 py-2 text-billia-text"
        >
          <option value="issueDate_desc">発行日（新しい順）</option>
          <option value="issueDate_asc">発行日（古い順）</option>
          <option value="totalAmount_desc">金額（高い順）</option>
          <option value="totalAmount_asc">金額（低い順）</option>
          <option value="client_asc">取引先名順</option>
          <option value="status_asc">ステータス順</option>
        </select>
      </div>

      {/* モバイル：カード表示 */}
      <div className="mt-3 space-y-2 md:hidden">
        {sorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-billia-text-muted">
            {folderFilter ? "このフォルダに請求書がありません。" : "まだ請求書が登録されていません。作成ボタンから追加してください。"}
          </p>
        ) : (
          sorted.map((invoice) => (
            <div key={invoice.id} className="rounded-xl border border-billia-border-subtle bg-white overflow-hidden">
              <div className="relative">
                <Link href={`/dashboard/invoices/${invoice.id}`} className="block p-4 pr-12 hover:bg-billia-bg transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-billia-blue truncate">{invoice.id}</p>
                      <p className="text-sm text-billia-text mt-0.5 truncate">{invoice.client?.name ?? "-"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusTone[invoice.status] ?? "text-billia-text-muted"} ${statusBg[invoice.status] ?? "bg-gray-50"}`}>
                        {invoice.status}
                      </span>
                      {invoice.folder && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${folderColor(invoice.folder)}`}>{invoice.folder}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <p className="text-xs text-billia-text-muted">{formatDate(invoice.issueDate)}</p>
                    <p className="text-sm font-semibold text-billia-text">¥{formatCurrency(invoice.totalAmount)}</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => { setActiveFolderCardId(activeFolderCardId === invoice.id ? null : invoice.id); setMobileFolderInput(""); }}
                  className={`absolute top-3 right-3 p-2 rounded-lg transition-colors ${activeFolderCardId === invoice.id ? "bg-billia-blue/10 text-billia-blue" : "text-billia-text-muted hover:bg-billia-bg"}`}
                  aria-label="フォルダを設定"
                >
                  <FolderOpen className="w-4 h-4" />
                </button>
              </div>

              {activeFolderCardId === invoice.id && (
                <div className="px-4 pb-4 pt-3 border-t border-billia-border-subtle bg-billia-bg">
                  <p className="text-xs font-medium text-billia-text-muted mb-2">フォルダを設定:</p>
                  {folders.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {folders.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => assignFolderSingle(invoice.id, f)}
                          disabled={isPending}
                          className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${invoice.folder === f ? "bg-billia-sidebar text-white border-billia-sidebar" : folderColor(f)}`}
                        >
                          {f}
                        </button>
                      ))}
                      {invoice.folder && (
                        <button
                          type="button"
                          onClick={() => assignFolderSingle(invoice.id, null)}
                          disabled={isPending}
                          className="rounded-full px-3 py-1 text-xs font-medium border border-red-200 bg-red-50 text-red-600"
                        >
                          解除
                        </button>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={mobileFolderInput}
                      onChange={(e) => setMobileFolderInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && mobileFolderInput.trim()) assignFolderSingle(invoice.id, mobileFolderInput.trim()); }}
                      placeholder="新しいフォルダ名を入力"
                      list="mobile-folder-inv"
                      className="flex-1 text-sm rounded-xl border border-billia-border bg-white px-3 py-2"
                    />
                    <datalist id="mobile-folder-inv">
                      {folders.map((f) => <option key={f} value={f} />)}
                    </datalist>
                    <button
                      type="button"
                      onClick={() => { if (mobileFolderInput.trim()) assignFolderSingle(invoice.id, mobileFolderInput.trim()); }}
                      disabled={!mobileFolderInput.trim() || isPending}
                      className="rounded-xl bg-billia-blue px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      設定
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* デスクトップ：テーブル表示 */}
      <div className="mt-6 hidden overflow-hidden rounded-xl border border-billia-border-subtle md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-billia-bg billia-label">
            <tr>
              <th className="w-10 px-4 py-3">
                {invoices.length > 0 ? (
                  <input type="checkbox" aria-label="すべて選択" onChange={handleToggleAll}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                ) : null}
              </th>
              <th className="px-4 py-3 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort("id")}>
                請求書番号 <SortIcon k="id" />
              </th>
              <th className="px-4 py-3 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort("client")}>
                取引先名 <SortIcon k="client" />
              </th>
              <th className="px-4 py-3 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort("issueDate")}>
                発行日 <SortIcon k="issueDate" />
              </th>
              <th className="px-4 py-3 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort("totalAmount")}>
                金額 (円) <SortIcon k="totalAmount" />
              </th>
              <th className="px-4 py-3 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort("status")}>
                ステータス <SortIcon k="status" />
              </th>
              <th className="px-4 py-3">フォルダ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-billia-border-subtle">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-billia-text-muted">
                  {folderFilter ? "このフォルダに請求書がありません。" : "まだ請求書が登録されていません。作成ボタンから追加してください。"}
                </td>
              </tr>
            ) : (
              sorted.map((invoice) => (
                <tr key={invoice.id} className="text-billia-text-muted hover:bg-billia-bg/40">
                  <td className="px-4 py-4">
                    <input
                      name="invoice-select"
                      type="checkbox"
                      value={invoice.id}
                      aria-label={`${invoice.id} を選択`}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="px-4 py-4 font-medium text-billia-blue">
                    <Link href={`/dashboard/invoices/${invoice.id}`}>{invoice.id}</Link>
                  </td>
                  <td className="px-4 py-4">{invoice.client?.name ?? "-"}</td>
                  <td className="px-4 py-4">{formatDate(invoice.issueDate)}</td>
                  <td className="px-4 py-4">¥{formatCurrency(invoice.totalAmount)}</td>
                  <td className="px-4 py-4">
                    <span className={`font-medium ${statusTone[invoice.status] ?? "text-billia-text-muted"}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {invoice.folder ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${folderColor(invoice.folder)}`}>
                        {invoice.folder}
                      </span>
                    ) : (
                      <span className="text-billia-text-muted text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
