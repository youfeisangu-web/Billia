"use client";

import React from "react";

type ReceiptItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

export type ReceiptData = {
  receiptNumber: string;
  issueDate: Date;
  receiptIssuedAt: Date;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  tadashi: string; // 但し書き
  client: {
    name: string;
    address?: string | null;
  };
  user: {
    companyName: string | null;
    representativeName: string | null;
    address: string | null;
    phoneNumber: string | null;
    invoiceRegNumber: string | null;
    email: string;
    stampUrl?: string | null;
  };
  items: ReceiptItem[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ja-JP").format(value);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("ja-JP", { dateStyle: "long" }).format(new Date(date));

const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(date));

export const ReceiptTemplate = ({ data }: { data: ReceiptData }) => {
  const needsStamp = data.totalAmount >= 50000;

  return (
    <div className="bg-white p-[20mm] shadow-lg print:m-0 print:p-[12mm] print:shadow-none mx-auto w-[210mm] max-w-[210mm] min-h-[297mm] text-slate-800 font-sans leading-relaxed box-border print:overflow-hidden print:break-inside-avoid">

      {/* 電帳法対応バナー */}
      <div className="mb-6 rounded border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-700 flex items-center gap-2 print:bg-transparent print:border-blue-300">
        <span className="font-bold shrink-0">電子発行</span>
        <span>この領収書は電子帳簿保存法に基づき電子的に発行されました。電子データとして保存してください。</span>
      </div>

      {/* ヘッダー */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-widest text-slate-900 mb-4 border-b-2 border-slate-900 pb-1 pr-12 inline-block">
            領収書
          </h1>
          <div className="mt-6">
            <p className="text-xl font-medium border-b border-slate-400 pb-1 mb-1 min-w-[300px]">
              {data.client.name}　様
            </p>
            {data.client.address && (
              <p className="text-sm text-slate-600 ml-1">{data.client.address}</p>
            )}
          </div>
        </div>

        <div className="text-right relative">
          <p className="text-sm mb-1">領収書番号：{data.receiptNumber}</p>
          <p className="text-sm mb-1">発行日：{formatDate(data.issueDate)}</p>
          <div className="mt-4">
            <p className="text-lg font-bold text-slate-900">{data.user.companyName || "（会社名未設定）"}</p>
            {data.user.representativeName && (
              <p className="text-sm text-slate-600">{data.user.representativeName}</p>
            )}
            {data.user.address && (
              <p className="text-xs text-slate-500 mt-1">{data.user.address}</p>
            )}
            {data.user.phoneNumber && (
              <p className="text-xs text-slate-500">TEL: {data.user.phoneNumber}</p>
            )}
            {data.user.invoiceRegNumber && (
              <p className="text-xs text-slate-500 mt-1">登録番号：{data.user.invoiceRegNumber}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">{data.user.email}</p>
          </div>

          {/* 印影 */}
          {data.user.stampUrl ? (
            <div className="absolute right-0 top-10 opacity-80 pointer-events-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.user.stampUrl} alt="印鑑" className="w-16 h-16 object-contain" />
            </div>
          ) : (
            <div className="absolute right-0 top-10 opacity-60 pointer-events-none">
              <div className="w-14 h-14 border-2 border-rose-500 rounded-full flex items-center justify-center text-rose-500 font-bold rotate-12 select-none text-[10px]">
                <div className="text-center">
                  <p className="leading-none border-b border-rose-500 pb-0.5 mb-0.5">
                    {(data.user.companyName ?? "").slice(0, 4) || "Billia"}
                  </p>
                  <p className="leading-none">印</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 領収金額 */}
      <div className="bg-slate-50 border-y border-slate-200 p-6 flex items-end justify-between mb-8">
        <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">領収金額</span>
        <span className="text-4xl font-bold text-slate-900">
          ¥{formatCurrency(data.totalAmount)}-
          <span className="text-sm font-normal text-slate-500 ml-2">(税込)</span>
        </span>
      </div>

      {/* 但し書き */}
      <div className="mb-8 flex items-baseline gap-4">
        <span className="text-sm font-medium text-slate-500 shrink-0">但し書き</span>
        <span className="text-base font-medium text-slate-800 border-b border-slate-300 flex-1 pb-1">
          {data.tadashi || "上記正に領収いたしました"}
        </span>
      </div>

      {/* 明細 */}
      <table className="w-full text-left border-collapse mb-8">
        <thead>
          <tr className="border-b-2 border-slate-900 text-sm">
            <th className="py-2 font-bold">内容</th>
            <th className="py-2 text-right font-bold w-16">数量</th>
            <th className="py-2 text-right font-bold w-28">単価</th>
            <th className="py-2 text-right font-bold w-16">税率</th>
            <th className="py-2 text-right font-bold w-28">金額</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {data.items.map((item, index) => (
            <tr key={index} className="border-b border-slate-200">
              <td className="py-3">{item.name}</td>
              <td className="py-3 text-right">{item.quantity}</td>
              <td className="py-3 text-right">¥{formatCurrency(item.unitPrice)}</td>
              <td className="py-3 text-right">{item.taxRate}%</td>
              <td className="py-3 text-right font-medium">¥{formatCurrency(item.quantity * item.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 合計 */}
      <div className="flex justify-end mb-10">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between pb-1 border-b border-slate-100">
            <span className="text-slate-500">小計</span>
            <span>¥{formatCurrency(data.subtotal)}</span>
          </div>
          <div className="flex justify-between pb-1 border-b border-slate-100 text-slate-500">
            <span className="text-xs">消費税</span>
            <span>¥{formatCurrency(data.taxAmount)}</span>
          </div>
          <div className="flex justify-between pt-1 font-bold text-lg">
            <span>合計</span>
            <span>¥{formatCurrency(data.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* 収入印紙欄（5万円以上） */}
      {needsStamp && (
        <div className="mb-8 border border-slate-300 rounded p-4 flex items-center gap-6">
          <div className="w-20 h-12 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-xs text-slate-400 shrink-0">
            収入印紙
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            領収金額が5万円以上のため、印紙税法により収入印紙の貼付が必要です。
            紙で交付する場合は収入印紙を貼付し、消印を押してください。
            電子データとして交付する場合は収入印紙不要です（印紙税法基本通達第44条）。
          </p>
        </div>
      )}

      {/* 電帳法メタデータ */}
      <div className="mt-auto pt-6 border-t border-slate-200 text-xs text-slate-400 space-y-1">
        <p>【電子帳簿保存法対応情報】</p>
        <p>発行システム：Billia（billia-inc.com）</p>
        <p>電子発行日時：{formatDateTime(data.receiptIssuedAt)}（JST）</p>
        <p>文書番号：{data.receiptNumber}</p>
        <p className="text-[10px] leading-relaxed mt-2">
          本領収書は電子帳簿保存法第7条（電子取引）に基づき電子的に発行されました。
          受領者は電子データのまま保存してください（最低7年間）。
          検索要件：取引年月日・取引金額・取引先名で検索可能な形式での保存が必要です。
        </p>
      </div>
    </div>
  );
};
