"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { deleteExpense, updateExpenseFolder } from "@/app/actions/expense";
import NewExpenseDialog from "./new-expense-dialog";
import type { ExpenseInitialValues } from "./new-expense-dialog";
import { Pencil, Trash2, FolderOpen, ChevronUp, ChevronDown, ChevronsUpDown, X } from "lucide-react";

type Expense = {
  id: string;
  title: string;
  amount: number;
  date: Date;
  category: string;
  folder: string | null;
};

type SortKey = "title" | "category" | "date" | "amount";

const fmt = (n: number) => "¥" + new Intl.NumberFormat("ja-JP").format(n);

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(
    typeof d === "string" ? new Date(d) : d,
  );

const toDateStr = (d: Date): string => {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toISOString().split("T")[0];
};

const categoryColor: Record<string, string> = {
  通信費: "bg-blue-50 text-blue-700",
  外注費: "bg-purple-50 text-purple-700",
  消耗品: "bg-orange-50 text-orange-700",
  旅費交通費: "bg-green-50 text-green-700",
  地代家賃: "bg-yellow-50 text-yellow-700",
  広告宣伝費: "bg-pink-50 text-pink-700",
  その他: "bg-gray-100 text-gray-600",
};

const FOLDER_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-purple-50 text-purple-700 border-purple-200",
  "bg-pink-50 text-pink-700 border-pink-200",
  "bg-orange-50 text-orange-700 border-orange-200",
  "bg-teal-50 text-teal-700 border-teal-200",
];

const folderColor = (name: string) =>
  FOLDER_COLORS[Math.abs([...name].reduce((s, c) => s + c.charCodeAt(0), 0)) % FOLDER_COLORS.length];

function getMonthKey(d: Date): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `${y}年${Number(m)}月`;
}

export default function ExpensesList({
  initialExpenses,
}: {
  initialExpenses: Expense[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [editValues, setEditValues] = useState<ExpenseInitialValues | null>(null);
  const [editId, setEditId] = useState<string | undefined>(undefined);
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [folderInput, setFolderInput] = useState("");
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeFolderCardId, setActiveFolderCardId] = useState<string | null>(null);
  const [mobileFolderInput, setMobileFolderInput] = useState("");

  const folders = useMemo(
    () => Array.from(new Set(initialExpenses.map((e) => e.folder).filter((f): f is string => !!f))),
    [initialExpenses],
  );

  const filtered = useMemo(() => {
    if (folderFilter === null) return initialExpenses;
    if (folderFilter === "__none__") return initialExpenses.filter((e) => !e.folder);
    return initialExpenses.filter((e) => e.folder === folderFilter);
  }, [initialExpenses, folderFilter]);

  const displayExpenses = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "title": cmp = a.title.localeCompare(b.title); break;
        case "category": cmp = a.category.localeCompare(b.category); break;
        case "date": cmp = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
        case "amount": cmp = a.amount - b.amount; break;
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

  // group by month (only when no sort override on non-date field and default sort)
  const groupByMonth = sortKey === "date";

  const months = useMemo(
    () => Array.from(new Set(displayExpenses.map((e) => getMonthKey(e.date)))).sort((a, b) =>
      sortDir === "desc" ? b.localeCompare(a) : a.localeCompare(b),
    ),
    [displayExpenses, sortDir],
  );

  const handleEdit = (expense: Expense) => {
    setEditId(expense.id);
    setEditValues({
      title: expense.title,
      amount: expense.amount,
      date: toDateStr(expense.date),
      category: expense.category,
    });
    setEditOpen(true);
  };

  const handleDelete = (expense: Expense) => {
    if (!confirm(`「${expense.title}」を削除しますか？`)) return;
    startTransition(async () => {
      const result = await deleteExpense(expense.id);
      if (!result.success) { alert(result.message); return; }
      router.refresh();
    });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const assignFolderSingle = (id: string, folder: string | null) => {
    startTransition(async () => {
      await updateExpenseFolder([id], folder);
      router.refresh();
      setActiveFolderCardId(null);
      setMobileFolderInput("");
    });
  };

  const handleBulkFolderAssign = () => {
    if (selected.size === 0) { alert("フォルダを設定する経費にチェックを入れてください。"); return; }
    startTransition(async () => {
      await updateExpenseFolder([...selected], folderInput.trim() || null);
      router.refresh();
      setFolderInput("");
      setShowFolderInput(false);
      setSelected(new Set());
    });
  };

  if (initialExpenses.length === 0) {
    return (
      <div className="billia-card p-6 text-center text-sm text-billia-text-muted">
        まだ経費が登録されていません。
      </div>
    );
  }

  const ExpenseRow = ({ expense }: { expense: Expense }) => (
    <tr key={expense.id} className="hover:bg-billia-bg/50 transition-colors">
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={selected.has(expense.id)}
          onChange={() => toggleSelect(expense.id)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
      </td>
      <td className="px-4 py-3 font-medium text-billia-text">{expense.title}</td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${categoryColor[expense.category] ?? "bg-gray-100 text-gray-600"}`}>
          {expense.category}
        </span>
      </td>
      <td className="px-4 py-3 text-billia-text-muted">{fmtDate(expense.date)}</td>
      <td className="px-4 py-3">
        {expense.folder ? (
          <span className={`text-xs px-2 py-0.5 rounded-full border ${folderColor(expense.folder)}`}>{expense.folder}</span>
        ) : (
          <span className="text-billia-text-muted text-xs">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right font-semibold text-billia-text">{fmt(expense.amount)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => handleEdit(expense)}
            className="p-1.5 rounded-lg text-billia-text-muted hover:bg-billia-bg hover:text-billia-blue transition-colors" aria-label="編集">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => handleDelete(expense)} disabled={isPending}
            className="p-1.5 rounded-lg text-billia-text-muted hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40" aria-label="削除">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <>
      {/* フォルダフィルター */}
      {folders.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
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
            すべて ({initialExpenses.length})
          </button>
          {folders.map((f) => (
            <button key={f} type="button" onClick={() => setFolderFilter(folderFilter === f ? null : f)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                folderFilter === f
                  ? "bg-billia-sidebar text-white border-billia-sidebar"
                  : `${folderColor(f)} hover:opacity-80`
              }`}
            >
              {f} ({initialExpenses.filter((e) => e.folder === f).length})
            </button>
          ))}
          {initialExpenses.some((e) => !e.folder) && (
            <button type="button" onClick={() => setFolderFilter(folderFilter === "__none__" ? null : "__none__")}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                folderFilter === "__none__"
                  ? "bg-billia-sidebar text-white border-billia-sidebar"
                  : "bg-white text-billia-text-muted border-billia-border hover:bg-billia-bg"
              }`}
            >
              未分類 ({initialExpenses.filter((e) => !e.folder).length})
            </button>
          )}
        </div>
      )}

      {/* 一括操作バー（デスクトップのみ） */}
      <div className="mb-3 hidden md:flex flex-wrap items-center gap-3 rounded-lg border border-billia-border-subtle bg-billia-bg px-4 py-2.5">
        <span className="text-xs font-medium text-billia-text-muted">一括操作：</span>
        {showFolderInput ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleBulkFolderAssign(); if (e.key === "Escape") setShowFolderInput(false); }}
              placeholder="フォルダ名（空にすると解除）"
              list="folder-suggestions-expense"
              autoFocus
              className="rounded-lg border border-billia-border bg-white px-3 py-1.5 text-sm text-billia-text w-full sm:w-48"
            />
            <datalist id="folder-suggestions-expense">
              {folders.map((f) => <option key={f} value={f} />)}
            </datalist>
            <button type="button" onClick={handleBulkFolderAssign} disabled={isPending}
              className="inline-flex rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              設定
            </button>
            <button type="button" onClick={() => setShowFolderInput(false)} className="p-1.5 text-billia-text-muted hover:text-billia-text">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setShowFolderInput(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-billia-border bg-white px-3 py-1.5 text-xs font-medium text-billia-text hover:bg-billia-bg">
            <FolderOpen className="h-3.5 w-3.5" />
            フォルダに移動 {selected.size > 0 && `(${selected.size}件選択中)`}
          </button>
        )}
      </div>

      {/* モバイル：並び替えコントロール */}
      <div className="mb-3 flex items-center gap-2 md:hidden">
        <span className="text-xs text-billia-text-muted shrink-0">並び替え:</span>
        <select
          value={`${sortKey}_${sortDir}`}
          onChange={(e) => {
            const [k, d] = e.target.value.split("_");
            handleSort(k as SortKey);
            setSortDir(d as "asc" | "desc");
          }}
          className="flex-1 text-xs rounded-xl border border-billia-border bg-white px-3 py-2 text-billia-text"
        >
          <option value="date_desc">日付（新しい順）</option>
          <option value="date_asc">日付（古い順）</option>
          <option value="amount_desc">金額（高い順）</option>
          <option value="amount_asc">金額（低い順）</option>
          <option value="category_asc">カテゴリ順</option>
          <option value="title_asc">件名順</option>
        </select>
      </div>

      <div className="space-y-4">
        {groupByMonth ? (
          months.map((monthKey) => {
            const items = displayExpenses.filter((e) => getMonthKey(e.date) === monthKey);
            const monthTotal = items.reduce((s, e) => s + e.amount, 0);
            return (
              <div key={monthKey} className="billia-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] bg-billia-bg">
                  <p className="text-sm font-semibold text-billia-text">{getMonthLabel(monthKey)}</p>
                  <p className="text-sm font-semibold text-billia-text">{fmt(monthTotal)}</p>
                </div>

                {/* Mobile */}
                <div className="divide-y divide-black/[0.06] md:hidden">
                  {items.map((expense) => (
                    <div key={expense.id}>
                      <div className="p-3 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-billia-text truncate">{expense.title}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium ${categoryColor[expense.category] ?? "bg-gray-100 text-gray-600"}`}>
                              {expense.category}
                            </span>
                            {expense.folder && (
                              <span className={`text-[11px] px-1.5 py-0.5 rounded-full border ${folderColor(expense.folder)}`}>{expense.folder}</span>
                            )}
                            <span className="text-[11px] text-billia-text-muted">{fmtDate(expense.date)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <p className="text-sm font-semibold text-billia-text mr-1">{fmt(expense.amount)}</p>
                          <button onClick={() => { setActiveFolderCardId(activeFolderCardId === expense.id ? null : expense.id); setMobileFolderInput(""); }} className="p-1.5 rounded-lg text-billia-text-muted hover:bg-billia-bg hover:text-billia-blue transition-colors" aria-label="フォルダを設定">
                            <FolderOpen className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleEdit(expense)} className="p-1.5 rounded-lg text-billia-text-muted hover:bg-billia-bg hover:text-billia-blue transition-colors" aria-label="編集">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(expense)} disabled={isPending} className="p-1.5 rounded-lg text-billia-text-muted hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40" aria-label="削除">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {activeFolderCardId === expense.id && (
                        <div className="border-t border-billia-border-subtle px-3 py-2.5 space-y-2">
                          <p className="text-xs font-medium text-billia-text-muted">フォルダを選択</p>
                          <div className="flex flex-wrap gap-1.5">
                            {folders.map((f) => (
                              <button key={f} type="button" onClick={() => assignFolderSingle(expense.id, f)} disabled={isPending}
                                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${expense.folder === f ? "bg-billia-sidebar text-white border-billia-sidebar" : `${folderColor(f)} hover:opacity-80`}`}>
                                {f}
                              </button>
                            ))}
                            {expense.folder && (
                              <button type="button" onClick={() => assignFolderSingle(expense.id, null)} disabled={isPending}
                                className="text-xs px-2.5 py-1 rounded-full border border-red-200 bg-red-50 text-red-600 hover:opacity-80">
                                解除
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={mobileFolderInput}
                              onChange={(e) => setMobileFolderInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter" && mobileFolderInput.trim()) assignFolderSingle(expense.id, mobileFolderInput.trim()); }}
                              placeholder="新しいフォルダ名"
                              list="folder-suggestions-expense-mobile"
                              className="flex-1 text-xs rounded-lg border border-billia-border bg-white px-2.5 py-1.5 text-billia-text"
                            />
                            <datalist id="folder-suggestions-expense-mobile">
                              {folders.map((f) => <option key={f} value={f} />)}
                            </datalist>
                            <button type="button" onClick={() => { if (mobileFolderInput.trim()) assignFolderSingle(expense.id, mobileFolderInput.trim()); }} disabled={isPending || !mobileFolderInput.trim()}
                              className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-40">
                              設定
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="text-billia-text-muted text-xs border-b border-black/[0.06]">
                        <th className="px-4 py-2.5 w-8"></th>
                        <th className="px-4 py-2.5 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort("title")}>件名 <SortIcon k="title" /></th>
                        <th className="px-4 py-2.5 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort("category")}>カテゴリ <SortIcon k="category" /></th>
                        <th className="px-4 py-2.5 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort("date")}>日付 <SortIcon k="date" /></th>
                        <th className="px-4 py-2.5">フォルダ</th>
                        <th className="px-4 py-2.5 text-right cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort("amount")}>金額 <SortIcon k="amount" /></th>
                        <th className="px-4 py-2.5 w-20"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04]">
                      {items.map((expense) => <ExpenseRow key={expense.id} expense={expense} />)}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        ) : (
          // 月別グループ解除（金額・カテゴリ・件名でソートした場合）
          <div className="billia-card overflow-hidden">
            {/* Mobile */}
            <div className="divide-y divide-black/[0.06] md:hidden">
              {displayExpenses.map((expense) => (
                <div key={expense.id} className="p-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-billia-text truncate">{expense.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium ${categoryColor[expense.category] ?? "bg-gray-100 text-gray-600"}`}>
                        {expense.category}
                      </span>
                      {expense.folder && (
                        <span className={`text-[11px] px-1.5 py-0.5 rounded-full border ${folderColor(expense.folder)}`}>{expense.folder}</span>
                      )}
                      <span className="text-[11px] text-billia-text-muted">{fmtDate(expense.date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-sm font-semibold text-billia-text">{fmt(expense.amount)}</p>
                    <button onClick={() => handleEdit(expense)} className="p-1.5 rounded-lg text-billia-text-muted hover:bg-billia-bg hover:text-billia-blue transition-colors" aria-label="編集">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(expense)} disabled={isPending} className="p-1.5 rounded-lg text-billia-text-muted hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40" aria-label="削除">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-billia-text-muted text-xs border-b border-black/[0.06]">
                    <th className="px-4 py-2.5 w-8"></th>
                    <th className="px-4 py-2.5 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort("title")}>件名 <SortIcon k="title" /></th>
                    <th className="px-4 py-2.5 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort("category")}>カテゴリ <SortIcon k="category" /></th>
                    <th className="px-4 py-2.5 cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort("date")}>日付 <SortIcon k="date" /></th>
                    <th className="px-4 py-2.5">フォルダ</th>
                    <th className="px-4 py-2.5 text-right cursor-pointer select-none hover:bg-black/5" onClick={() => handleSort("amount")}>金額 <SortIcon k="amount" /></th>
                    <th className="px-4 py-2.5 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {displayExpenses.map((expense) => <ExpenseRow key={expense.id} expense={expense} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <NewExpenseDialog open={editOpen} onOpenChange={setEditOpen} initialValues={editValues} expenseId={editId} />
    </>
  );
}
