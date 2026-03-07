"use client";

import React from "react";

type DocumentItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

type DocumentData = {
  id: string;
  type: "請求書" | "見積書" | "領収書" | "納品書";
  number: string;
  issueDate: Date;
  dueDate?: Date;
  validUntil?: Date;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  subject?: string;
  remarks?: string;
  client: {
    name: string;
    address?: string | null;
  };
  user: {
    companyName: string | null;
    invoiceRegNumber: string | null;
    email: string;
    address?: string | null;
    phoneNumber?: string | null;
  };
  bankAccount?: {
    bankName: string;
    branchName: string;
    accountType: string;
    accountNumber: string;
    accountHolder: string;
  } | null;
  items: DocumentItem[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ja-JP").format(value);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("ja-JP", { dateStyle: "long" }).format(date);

// ─── Classic (既存デザイン) ───────────────────────────────────────────────
const ClassicTemplate = ({ data }: { data: DocumentData }) => {
  return (
    <div className="bg-white p-[20mm] shadow-lg print:m-0 print:p-[12mm] print:shadow-none mx-auto w-[210mm] max-w-[210mm] min-h-[297mm] text-slate-800 font-sans leading-relaxed box-border print:overflow-hidden print:break-inside-avoid">
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-widest text-slate-900 mb-4 border-b-2 border-slate-900 pb-1 pr-12 inline-block">
            {data.type}
          </h1>
          <div className="mt-8">
            <p className="text-xl font-medium border-b border-slate-400 pb-1 mb-1 min-w-[300px]">
              {data.client.name}　御中
            </p>
            {data.client.address && (
              <p className="text-sm text-slate-600 ml-1">{data.client.address}</p>
            )}
          </div>
        </div>

        <div className="text-right relative">
          <p className="text-sm mb-1">{data.type}番号：{data.number}</p>
          <p className="text-sm mb-6">発行日：{formatDate(data.issueDate)}</p>

          <div className="mt-4">
            <p className="text-lg font-bold text-slate-900">{data.user.companyName || "Billia"}</p>
            {data.user.invoiceRegNumber && (
              <p className="text-xs text-slate-500 mt-1">登録番号：{data.user.invoiceRegNumber}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">{data.user.email}</p>
          </div>

          <div className="absolute right-0 top-10 opacity-60 pointer-events-none">
            <div className="w-14 h-14 border-2 border-rose-500 rounded-full flex items-center justify-center text-rose-500 font-bold rotate-12 select-none text-[10px]">
              <div className="text-center">
                <p className="leading-none border-b border-rose-500 pb-0.5 mb-0.5">Billia</p>
                <p className="leading-none">印</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-10">
        {data.subject && (
          <p className="text-lg font-medium mb-8 border-b border-slate-200 pb-2">
            件名：{data.subject}
          </p>
        )}

        <p className="mb-4">下記の通りご{data.type === "見積書" ? "見積" : data.type === "領収書" ? "領収" : data.type === "納品書" ? "納品" : "請求"}申し上げます。</p>

        <div className="bg-slate-50 border-y border-slate-200 p-6 flex items-end justify-between mb-10">
          <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">
            {data.type === "請求書" ? "請求金額" : data.type === "見積書" ? "見積金額" : data.type === "納品書" ? "納品金額" : "合計金額"}
          </span>
          <span className="text-3xl font-bold text-slate-900">
            ¥{formatCurrency(data.totalAmount)}-
            <span className="text-sm font-normal text-slate-500 ml-2 tracking-normal">(税込)</span>
          </span>
        </div>

        <table className="w-full text-left border-collapse mb-10">
          <thead>
            <tr className="border-b-2 border-slate-900 text-sm">
              <th className="py-2 font-bold">内容</th>
              <th className="py-2 text-right font-bold w-20">数量</th>
              <th className="py-2 text-right font-bold w-32">単価</th>
              <th className="py-2 text-right font-bold w-32">金額</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {data.items.map((item, index) => (
              <tr key={index} className="border-b border-slate-200">
                <td className="py-3">{item.name}</td>
                <td className="py-3 text-right">{item.quantity}</td>
                <td className="py-3 text-right">¥{formatCurrency(item.unitPrice)}</td>
                <td className="py-3 text-right font-medium">¥{formatCurrency(item.quantity * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-12">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between pb-1 border-b border-slate-100">
              <span className="text-slate-500">小計</span>
              <span>¥{formatCurrency(data.subtotal)}</span>
            </div>
            <div className="flex justify-between pb-1 border-b border-slate-100 text-slate-500">
              <span className="text-xs">消費税 (10%)</span>
              <span>¥{formatCurrency(data.taxAmount)}</span>
            </div>
            <div className="flex justify-between pt-1 font-bold text-lg">
              <span>合計</span>
              <span>¥{formatCurrency(data.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm">
          {data.bankAccount && (
            <div className="space-y-1">
              <p className="font-bold border-b border-slate-300 pb-1 mb-2">【お振込先】</p>
              <p>{data.bankAccount.bankName} {data.bankAccount.branchName}</p>
              <p>{data.bankAccount.accountType} {data.bankAccount.accountNumber}</p>
              <p>口座名義：{data.bankAccount.accountHolder}</p>
            </div>
          )}

          {(data.remarks || data.dueDate || data.validUntil) && (
            <div className="space-y-1">
              <p className="font-bold border-b border-slate-300 pb-1 mb-2">【備考】</p>
              {data.remarks && (
                <div className="whitespace-pre-wrap text-slate-600 text-xs">{data.remarks}</div>
              )}
              {data.dueDate && <p className="mt-2 font-medium text-rose-600">お支払期限：{formatDate(data.dueDate)}</p>}
              {data.validUntil && <p className="mt-2 font-medium text-rose-600">有効期限：{formatDate(data.validUntil)}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Modern (グリーン・テーブル重視) ─────────────────────────────────────
const ModernTemplate = ({ data }: { data: DocumentData }) => {
  const accentBg = "bg-[#3aaa8e]";
  const accentText = "text-[#3aaa8e]";
  const accentBorder = "border-[#3aaa8e]";

  const tax10Items = data.items.filter((i) => i.taxRate >= 10);
  const tax8Items = data.items.filter((i) => i.taxRate < 10 && i.taxRate > 0);
  const subtotal10 = tax10Items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const subtotal8 = tax8Items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax10 = Math.floor(subtotal10 * 0.1);
  const tax8 = Math.floor(subtotal8 * 0.08);

  return (
    <div className="bg-white shadow-lg print:shadow-none mx-auto w-[210mm] max-w-[210mm] min-h-[297mm] text-slate-800 font-sans text-[12px] box-border print:overflow-hidden">
      {/* Top accent bar */}
      <div className={`h-3 ${accentBg} w-full`} />

      <div className="px-10 pt-6 pb-10">
        {/* Title */}
        <h1 className={`text-[28px] font-bold tracking-[0.3em] ${accentText} text-center mb-2`}>
          {data.type}
        </h1>

        {/* Issue date top-right */}
        <p className="text-right text-[11px] text-slate-600 mb-6">
          発行日：{formatDate(data.issueDate)}
        </p>

        {/* Client + sender */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[15px] font-bold mb-1">{data.client.name}　御中</p>
            {data.client.address && (
              <p className="text-[11px] text-slate-600">{data.client.address}</p>
            )}
          </div>
          <div className="text-right text-[11px]">
            <p className="font-bold text-[13px]">{data.user.companyName || "Billia"}</p>
            {data.user.invoiceRegNumber && (
              <p className={`${accentText} font-semibold`}>登録番号：{data.user.invoiceRegNumber}</p>
            )}
            {data.user.address && <p className="text-slate-600">{data.user.address}</p>}
            <p className="text-slate-600">{data.user.email}</p>
          </div>
        </div>

        {/* Amount box */}
        <div className={`border ${accentBorder} flex mb-4`}>
          <div className={`${accentBg} text-white px-5 py-3 font-bold text-[12px] flex items-center min-w-[100px] justify-center`}>
            ご請求額
          </div>
          <div className="flex-1 px-6 py-3 flex items-center">
            <span className="text-[22px] font-bold">¥{formatCurrency(data.totalAmount)}</span>
          </div>
        </div>

        {/* Bank + due date */}
        {(data.bankAccount || data.dueDate || data.validUntil) && (
          <div className={`border ${accentBorder} mb-6`}>
            {data.bankAccount && (
              <div className="flex border-b border-[#3aaa8e]">
                <div className={`${accentBg} text-white px-4 py-2 text-[11px] flex items-center min-w-[80px] justify-center font-bold`}>
                  振込先
                </div>
                <div className="px-4 py-2 text-[11px]">
                  <p>{data.bankAccount.bankName} {data.bankAccount.branchName} {data.bankAccount.accountType} {data.bankAccount.accountNumber}</p>
                  <p>{data.bankAccount.accountHolder}</p>
                </div>
              </div>
            )}
            {(data.dueDate || data.validUntil) && (
              <div className="flex">
                <div className={`${accentBg} text-white px-4 py-2 text-[11px] flex items-center min-w-[80px] justify-center font-bold`}>
                  {data.dueDate ? "振込期日" : "有効期限"}
                </div>
                <div className="px-4 py-2 text-[11px] flex items-center">
                  {data.dueDate ? formatDate(data.dueDate) : data.validUntil ? formatDate(data.validUntil) : ""}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Items table */}
        <table className="w-full border-collapse mb-4 text-[11px]">
          <thead>
            <tr className={`${accentBg} text-white`}>
              <th className="py-2 px-2 text-left font-bold border border-[#2d9178]">日付</th>
              <th className="py-2 px-2 text-left font-bold border border-[#2d9178] w-[28%]">内容</th>
              <th className="py-2 px-2 text-center font-bold border border-[#2d9178] w-12">数量</th>
              <th className="py-2 px-2 text-center font-bold border border-[#2d9178] w-10">単位</th>
              <th className="py-2 px-2 text-right font-bold border border-[#2d9178]">単価（税抜）</th>
              <th className="py-2 px-2 text-center font-bold border border-[#2d9178] w-12">税率</th>
              <th className="py-2 px-2 text-right font-bold border border-[#2d9178]">金額（税抜）</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.max(data.items.length, 9) }).map((_, index) => {
              const item = data.items[index];
              return (
                <tr key={index} className="border-b border-[#b2ddd5]">
                  <td className="py-1.5 px-2 border border-[#b2ddd5]">&nbsp;</td>
                  <td className="py-1.5 px-2 border border-[#b2ddd5]">{item?.name || ""}</td>
                  <td className="py-1.5 px-2 text-center border border-[#b2ddd5]">{item ? item.quantity : ""}</td>
                  <td className="py-1.5 px-2 text-center border border-[#b2ddd5]"></td>
                  <td className="py-1.5 px-2 text-right border border-[#b2ddd5]">
                    {item ? `¥${formatCurrency(item.unitPrice)}` : ""}
                  </td>
                  <td className="py-1.5 px-2 text-center border border-[#b2ddd5]">
                    {item ? `${item.taxRate}%` : ""}
                  </td>
                  <td className="py-1.5 px-2 text-right border border-[#b2ddd5]">
                    {item ? `¥${formatCurrency(item.quantity * item.unitPrice)}` : "¥0"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Tax breakdown + totals */}
        <div className="flex justify-between items-start mb-6">
          <table className="text-[11px] border-collapse w-[52%]">
            <thead>
              <tr className={`${accentBg} text-white`}>
                <th className="py-1.5 px-3 text-left font-bold border border-[#2d9178]">税率区分</th>
                <th className="py-1.5 px-3 text-right font-bold border border-[#2d9178]">消費税</th>
                <th className="py-1.5 px-3 text-right font-bold border border-[#2d9178]">金額</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1.5 px-3 border border-[#b2ddd5]">10%対象</td>
                <td className="py-1.5 px-3 text-right border border-[#b2ddd5]">¥{formatCurrency(tax10)}</td>
                <td className="py-1.5 px-3 text-right border border-[#b2ddd5]">¥{formatCurrency(subtotal10)}</td>
              </tr>
              {subtotal8 > 0 && (
                <tr>
                  <td className="py-1.5 px-3 border border-[#b2ddd5]">8%対象（軽減）</td>
                  <td className="py-1.5 px-3 text-right border border-[#b2ddd5]">¥{formatCurrency(tax8)}</td>
                  <td className="py-1.5 px-3 text-right border border-[#b2ddd5]">¥{formatCurrency(subtotal8)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="w-[44%] text-[11px]">
            {[
              { label: "小計", value: data.subtotal },
              { label: "消費税", value: data.taxAmount },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between border-b border-slate-200 py-1 px-3">
                <span>{label}</span>
                <span>¥{formatCurrency(value)}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 px-3 font-bold text-[13px]">
              <span>合計</span>
              <span>¥{formatCurrency(data.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div className={`border ${accentBorder}`}>
          <div className={`${accentBg} text-white text-center text-[11px] font-bold py-1`}>備考</div>
          <div className="p-3 min-h-[60px] text-[11px] whitespace-pre-wrap">
            {data.remarks || ""}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Professional (オレンジ・斜めデコ) ─────────────────────────────────
const ProfessionalTemplate = ({ data }: { data: DocumentData }) => {
  const tax10Items = data.items.filter((i) => i.taxRate >= 10);
  const tax8Items = data.items.filter((i) => i.taxRate < 10 && i.taxRate > 0);
  const subtotal10 = tax10Items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const subtotal8 = tax8Items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax10 = Math.floor(subtotal10 * 0.1);
  const tax8 = Math.floor(subtotal8 * 0.08);

  return (
    <div className="bg-white shadow-lg print:shadow-none mx-auto w-[210mm] max-w-[210mm] min-h-[297mm] text-slate-800 font-sans text-[12px] box-border print:overflow-hidden relative">
      <div className="px-10 pt-8 pb-10">
        {/* Header: title + diagonal decoration */}
        <div className="flex justify-between items-start mb-1 relative">
          <div>
            <p className="text-[11px] text-right absolute right-0 top-0 text-slate-500">
              書類番号：{data.number}
            </p>
            <h1 className="text-[26px] font-bold text-[#c45f00] tracking-wide">
              {data.type === "請求書" ? "御請求書" : data.type}
            </h1>
            <p className="text-[11px] text-[#c45f00] font-semibold mb-4">
              発行日：{formatDate(data.issueDate)}
            </p>
          </div>

          {/* Diagonal decoration top-right */}
          <div className="relative w-[120px] h-[60px] overflow-hidden flex-shrink-0">
            <div
              className="absolute top-0 right-0 w-[80px] h-[80px] bg-[#c45f00]"
              style={{ transform: "rotate(45deg) translate(20px, -40px)" }}
            />
            <div
              className="absolute top-0 right-0 w-[60px] h-[60px] bg-[#6b3600]"
              style={{ transform: "rotate(45deg) translate(40px, -30px)" }}
            />
          </div>
        </div>

        {/* Client + sender info */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <p className="text-[16px] font-bold border-b border-[#c45f00] pb-1 mb-1 min-w-[200px]">
              {data.client.name}　御中
            </p>
            {data.client.address && (
              <p className="text-[11px] text-slate-600">{data.client.address}</p>
            )}
            <p className="text-[11px] text-slate-700 mt-3">下記の通り、御請求申し上げます。</p>
            {data.subject && <p className="text-[11px] mt-1">　件名：{data.subject}</p>}
            {data.dueDate && <p className="text-[11px]">　支払期限：{formatDate(data.dueDate)}</p>}
            {data.validUntil && <p className="text-[11px]">　有効期限：{formatDate(data.validUntil)}</p>}
            {data.bankAccount && (
              <p className="text-[11px]">
                　振込先：{data.bankAccount.bankName}{data.bankAccount.branchName} {data.bankAccount.accountType} {data.bankAccount.accountNumber}
              </p>
            )}
          </div>

          <div className="text-right text-[11px] min-w-[160px]">
            <p className="font-bold text-[13px] mb-1">{data.user.companyName || "Billia"}</p>
            {data.user.address && <p className="text-slate-600">{data.user.address}</p>}
            {data.user.invoiceRegNumber && (
              <p>登録番号：{data.user.invoiceRegNumber}</p>
            )}
            {data.user.phoneNumber && <p>TEL：{data.user.phoneNumber}</p>}
            <p>{data.user.email}</p>
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center gap-4 mb-6 border border-[#c45f00] p-3 w-fit">
          <span className="bg-[#f5e0cc] text-[#c45f00] font-bold px-4 py-1 text-[13px]">合計金額</span>
          <span className="text-[22px] font-bold">¥{formatCurrency(data.totalAmount)}</span>
          <span className="text-[11px] text-slate-500">（税込）</span>
        </div>

        {/* Items table */}
        <table className="w-full border-collapse mb-4 text-[11px]">
          <thead>
            <tr className="bg-[#f5e0cc]">
              <th className="py-2 px-2 text-center font-bold border border-[#c4956a] w-[28%]">内　容</th>
              <th className="py-2 px-2 text-center font-bold border border-[#c4956a] w-8">軽減</th>
              <th className="py-2 px-2 text-center font-bold border border-[#c4956a]">数量(単位)</th>
              <th className="py-2 px-2 text-right font-bold border border-[#c4956a]">単価(税抜)</th>
              <th className="py-2 px-2 text-center font-bold border border-[#c4956a] w-12">税率</th>
              <th className="py-2 px-2 text-right font-bold border border-[#c4956a]">金額(税抜)</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.max(data.items.length, 9) }).map((_, index) => {
              const item = data.items[index];
              return (
                <tr key={index} className="border-b border-[#e8c9a8]">
                  <td className="py-1.5 px-2 border border-[#e8c9a8]">{item?.name || ""}</td>
                  <td className="py-1.5 px-2 text-center border border-[#e8c9a8]">
                    {item && item.taxRate < 10 && item.taxRate > 0 ? "※" : ""}
                  </td>
                  <td className="py-1.5 px-2 text-right border border-[#e8c9a8]">
                    {item ? `${item.quantity}` : ""}
                  </td>
                  <td className="py-1.5 px-2 text-right border border-[#e8c9a8]">
                    {item ? `¥${formatCurrency(item.unitPrice)}` : ""}
                  </td>
                  <td className="py-1.5 px-2 text-center border border-[#e8c9a8]">
                    {item ? `${item.taxRate}%` : ""}
                  </td>
                  <td className="py-1.5 px-2 text-right border border-[#e8c9a8]">
                    {item ? `¥${formatCurrency(item.quantity * item.unitPrice)}` : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Tax breakdown + totals */}
        <div className="flex justify-between items-start mb-6">
          <div className="w-[48%] text-[11px]">
            <p className="text-slate-500 mb-1">税別内訳</p>
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-slate-600">
                  <th className="text-left pb-1 font-normal border-b border-slate-200"></th>
                  <th className="text-right pb-1 font-normal border-b border-slate-200">小計(税抜金額)</th>
                  <th className="text-right pb-1 font-normal border-b border-slate-200">小計(税のみ)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1 text-slate-700">10%対象分</td>
                  <td className="py-1 text-right">¥{formatCurrency(subtotal10)}</td>
                  <td className="py-1 text-right">¥{formatCurrency(tax10)}</td>
                </tr>
                {subtotal8 > 0 && (
                  <tr>
                    <td className="py-1 text-slate-700">8%対象分</td>
                    <td className="py-1 text-right">¥{formatCurrency(subtotal8)}</td>
                    <td className="py-1 text-right">¥{formatCurrency(tax8)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="w-[44%] text-[11px]">
            {[
              { label: "小計", value: data.subtotal, bold: false },
              { label: "消費税", value: data.taxAmount, bold: false },
              { label: "合計", value: data.totalAmount, bold: true },
            ].map(({ label, value, bold }) => (
              <div
                key={label}
                className={`flex justify-between py-1.5 px-3 border-b border-[#e8c9a8] ${bold ? "font-bold bg-[#f5e0cc] text-[13px]" : ""}`}
              >
                <span>{label}</span>
                <span>¥{formatCurrency(value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Remarks */}
        <div className="border border-slate-300">
          <div className="text-center text-[11px] font-bold py-1 bg-slate-50 border-b border-slate-300">
            備　考
          </div>
          <div className="p-3 min-h-[60px] text-[11px] whitespace-pre-wrap">
            {tax8Items.length > 0 && "「※」は軽減税率対象品目です\n"}
            {data.remarks || ""}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Elegant (ブルーグレー・ロゴエリア) ───────────────────────────────────
const ElegantTemplate = ({ data }: { data: DocumentData }) => {
  const accent = "#4d8fa8";
  const tax10Items = data.items.filter((i) => i.taxRate >= 10);
  const tax8Items = data.items.filter((i) => i.taxRate < 10 && i.taxRate > 0);
  const subtotal10 = tax10Items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const subtotal8 = tax8Items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax10 = Math.floor(subtotal10 * 0.1);
  const tax8 = Math.floor(subtotal8 * 0.08);

  return (
    <div className="bg-white shadow-lg print:shadow-none mx-auto w-[210mm] max-w-[210mm] min-h-[297mm] text-slate-800 font-sans text-[12px] box-border print:overflow-hidden relative">
      {/* Top right blue corner */}
      <div
        className="absolute top-0 right-0 w-[90px] h-[70px] overflow-hidden pointer-events-none"
      >
        <div
          style={{
            width: 0,
            height: 0,
            borderStyle: "solid",
            borderWidth: "0 90px 70px 0",
            borderColor: `transparent ${accent} transparent transparent`,
          }}
        />
      </div>

      <div className="px-10 pt-8 pb-10">
        {/* Header: logo + date/number */}
        <div className="flex justify-between items-start mb-6">
          <div>
            {/* Logo placeholder */}
            <div
              className="w-[60px] h-[60px] flex items-center justify-center border-2 mb-3 text-[10px] text-slate-400 font-bold"
              style={{ borderColor: accent, color: accent, clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }}
            >
              LOGO
            </div>
            <h1 className="text-[22px] font-bold tracking-widest text-slate-900">
              {data.type}
            </h1>
          </div>
          <div className="text-right text-[11px] mt-8 mr-8">
            <p className="mb-1">発行日：<span className="font-bold">{formatDate(data.issueDate)}</span></p>
            <p>書類番号：<span className="font-bold">{data.number}</span></p>
          </div>
        </div>

        {/* Client + sender */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <p className="text-[15px] font-bold border-b-2 pb-1 mb-1" style={{ borderColor: accent }}>
              {data.client.name}　御中
            </p>
            {data.client.address && (
              <p className="text-[11px] text-slate-600">{data.client.address}</p>
            )}
            <p className="text-[11px] text-slate-700 mt-3">下記の通り、御請求申し上げます。</p>
            {data.subject && <p className="text-[11px] mt-1">　件名：{data.subject}</p>}
            {data.dueDate && <p className="text-[11px]">　支払期限：{formatDate(data.dueDate)}</p>}
            {data.validUntil && <p className="text-[11px]">　有効期限：{formatDate(data.validUntil)}</p>}
            {data.bankAccount && (
              <p className="text-[11px]">
                　振込先：{data.bankAccount.bankName}{data.bankAccount.branchName} {data.bankAccount.accountType} {data.bankAccount.accountNumber}
              </p>
            )}
          </div>

          <div className="text-right text-[11px] min-w-[160px]">
            <p className="font-bold text-[13px] mb-1">{data.user.companyName || "Billia"}</p>
            {data.user.address && <p className="text-slate-600">{data.user.address}</p>}
            {data.user.invoiceRegNumber && (
              <p>登録番号：{data.user.invoiceRegNumber}</p>
            )}
            {data.user.phoneNumber && <p>TEL：{data.user.phoneNumber}</p>}
            <p>{data.user.email}</p>
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center gap-4 mb-6 border p-3 w-fit" style={{ borderColor: accent }}>
          <span className="font-bold px-4 py-1 text-[13px]" style={{ backgroundColor: `${accent}20`, color: accent }}>合計金額</span>
          <span className="text-[22px] font-bold">¥{formatCurrency(data.totalAmount)}</span>
          <span className="text-[11px] text-slate-500">（税込）</span>
        </div>

        {/* Items table */}
        <table className="w-full border-collapse mb-4 text-[11px]">
          <thead>
            <tr style={{ backgroundColor: accent }} className="text-white">
              <th className="py-2 px-2 text-center font-bold border w-[30%]" style={{ borderColor: "#3a7a96" }}>内　容</th>
              <th className="py-2 px-2 text-center font-bold border w-8" style={{ borderColor: "#3a7a96" }}>軽減</th>
              <th className="py-2 px-2 text-center font-bold border" style={{ borderColor: "#3a7a96" }}>数量(単位)</th>
              <th className="py-2 px-2 text-right font-bold border" style={{ borderColor: "#3a7a96" }}>単価(税抜)</th>
              <th className="py-2 px-2 text-center font-bold border w-12" style={{ borderColor: "#3a7a96" }}>税率</th>
              <th className="py-2 px-2 text-right font-bold border" style={{ borderColor: "#3a7a96" }}>金額(税抜)</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.max(data.items.length, 9) }).map((_, index) => {
              const item = data.items[index];
              return (
                <tr key={index} style={{ borderBottom: "1px solid #c5dce5" }}>
                  <td className="py-1.5 px-2 border" style={{ borderColor: "#c5dce5" }}>{item?.name || ""}</td>
                  <td className="py-1.5 px-2 text-center border" style={{ borderColor: "#c5dce5" }}>
                    {item && item.taxRate < 10 && item.taxRate > 0 ? "※" : ""}
                  </td>
                  <td className="py-1.5 px-2 text-right border" style={{ borderColor: "#c5dce5" }}>
                    {item ? `${item.quantity}` : ""}
                  </td>
                  <td className="py-1.5 px-2 text-right border" style={{ borderColor: "#c5dce5" }}>
                    {item ? `¥${formatCurrency(item.unitPrice)}` : ""}
                  </td>
                  <td className="py-1.5 px-2 text-center border" style={{ borderColor: "#c5dce5" }}>
                    {item ? `${item.taxRate}%` : ""}
                  </td>
                  <td className="py-1.5 px-2 text-right border" style={{ borderColor: "#c5dce5" }}>
                    {item ? `¥${formatCurrency(item.quantity * item.unitPrice)}` : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Tax breakdown + totals */}
        <div className="flex justify-between items-start mb-6">
          <div className="w-[48%] text-[11px]">
            <p className="text-slate-500 mb-1">税別内訳</p>
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-slate-600">
                  <th className="text-left pb-1 font-normal border-b border-slate-200"></th>
                  <th className="text-right pb-1 font-normal border-b border-slate-200">小計(税抜金額)</th>
                  <th className="text-right pb-1 font-normal border-b border-slate-200">小計(税のみ)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1 text-slate-700">10%対象分</td>
                  <td className="py-1 text-right">¥{formatCurrency(subtotal10)}</td>
                  <td className="py-1 text-right">¥{formatCurrency(tax10)}</td>
                </tr>
                {subtotal8 > 0 && (
                  <tr>
                    <td className="py-1 text-slate-700">8%対象分</td>
                    <td className="py-1 text-right">¥{formatCurrency(subtotal8)}</td>
                    <td className="py-1 text-right">¥{formatCurrency(tax8)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="w-[44%] text-[11px]">
            {[
              { label: "小計", value: data.subtotal, bold: false },
              { label: "消費税", value: data.taxAmount, bold: false },
              { label: "合計", value: data.totalAmount, bold: true },
            ].map(({ label, value, bold }) => (
              <div
                key={label}
                className={`flex justify-between py-1.5 px-3 border-b ${bold ? "font-bold text-[13px]" : ""}`}
                style={{
                  borderColor: "#c5dce5",
                  backgroundColor: bold ? `${accent}20` : undefined,
                  color: bold ? accent : undefined,
                }}
              >
                <span>{label}</span>
                <span>¥{formatCurrency(value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Remarks */}
        <div className="border border-slate-300">
          <div className="text-center text-[11px] font-bold py-1 bg-slate-50 border-b border-slate-300">
            備　考
          </div>
          <div className="p-3 min-h-[60px] text-[11px] whitespace-pre-wrap">
            {tax8Items.length > 0 && "「※」は軽減税率対象品目です\n"}
            {data.remarks || ""}
          </div>
        </div>

        {/* Bottom accent bar */}
        <div className="mt-6 h-2 w-full" style={{ backgroundColor: accent }} />
      </div>
    </div>
  );
};

// ─── Minimal (シンプル・余白重視) ────────────────────────────────────────
const MinimalTemplate = ({ data }: { data: DocumentData }) => {
  return (
    <div className="bg-white shadow-lg print:shadow-none mx-auto w-[210mm] max-w-[210mm] min-h-[297mm] text-slate-800 font-sans text-[12px] box-border print:overflow-hidden">
      <div className="px-12 pt-12 pb-12">
        {/* Title */}
        <div className="flex justify-between items-baseline mb-10">
          <h1 className="text-[28px] font-light tracking-[0.5em] text-slate-900">
            {data.type}
          </h1>
          <div className="text-right text-[11px] text-slate-500">
            <p>番号：{data.number}</p>
            <p>発行日：{formatDate(data.issueDate)}</p>
            {data.dueDate && <p>支払期限：{formatDate(data.dueDate)}</p>}
            {data.validUntil && <p>有効期限：{formatDate(data.validUntil)}</p>}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-900 mb-8" />

        {/* Client + sender */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-[15px] font-semibold mb-1">{data.client.name}　御中</p>
            {data.client.address && (
              <p className="text-[11px] text-slate-500">{data.client.address}</p>
            )}
          </div>
          <div className="text-right text-[11px] text-slate-600">
            <p className="font-semibold text-slate-900 text-[13px] mb-1">{data.user.companyName || "Billia"}</p>
            {data.user.address && <p>{data.user.address}</p>}
            {data.user.invoiceRegNumber && <p>登録番号：{data.user.invoiceRegNumber}</p>}
            {data.user.phoneNumber && <p>TEL：{data.user.phoneNumber}</p>}
            <p>{data.user.email}</p>
          </div>
        </div>

        {/* Subject */}
        {data.subject && (
          <p className="text-[12px] mb-6 text-slate-700">件名：{data.subject}</p>
        )}

        {/* Amount */}
        <div className="mb-8 py-4 border-y border-slate-200">
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] text-slate-500 tracking-widest uppercase">
              {data.type === "請求書" ? "請求金額" : "合計金額"}
            </span>
            <span className="text-[28px] font-light">
              ¥{formatCurrency(data.totalAmount)}
              <span className="text-[12px] text-slate-400 ml-2">税込</span>
            </span>
          </div>
        </div>

        {/* Items */}
        <table className="w-full text-[11px] mb-8">
          <thead>
            <tr className="border-b border-slate-300 text-slate-500">
              <th className="pb-2 text-left font-normal">内容</th>
              <th className="pb-2 text-right font-normal w-16">数量</th>
              <th className="pb-2 text-right font-normal w-28">単価</th>
              <th className="pb-2 text-right font-normal w-28">金額</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index} className="border-b border-slate-100">
                <td className="py-2">{item.name}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">¥{formatCurrency(item.unitPrice)}</td>
                <td className="py-2 text-right">¥{formatCurrency(item.quantity * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-56 text-[11px] space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>小計</span>
              <span>¥{formatCurrency(data.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>消費税</span>
              <span>¥{formatCurrency(data.taxAmount)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-slate-300 pt-2 text-[13px]">
              <span>合計</span>
              <span>¥{formatCurrency(data.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Bank */}
        {data.bankAccount && (
          <div className="mb-6 text-[11px] text-slate-600 border-t border-slate-200 pt-4">
            <p className="font-semibold text-slate-700 mb-1">お振込先</p>
            <p>{data.bankAccount.bankName} {data.bankAccount.branchName}　{data.bankAccount.accountType} {data.bankAccount.accountNumber}</p>
            <p>口座名義：{data.bankAccount.accountHolder}</p>
          </div>
        )}

        {/* Remarks */}
        {data.remarks && (
          <div className="text-[11px] text-slate-600 border-t border-slate-200 pt-4">
            <p className="font-semibold text-slate-700 mb-1">備考</p>
            <p className="whitespace-pre-wrap">{data.remarks}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Export ────────────────────────────────────────────────────────────────
export type InvoiceDesign = "classic" | "modern" | "professional" | "elegant" | "minimal";

export const InvoiceTemplate = ({
  data,
  design = "classic",
}: {
  data: DocumentData;
  design?: InvoiceDesign | string;
}) => {
  switch (design) {
    case "modern":
      return <ModernTemplate data={data} />;
    case "professional":
      return <ProfessionalTemplate data={data} />;
    case "elegant":
      return <ElegantTemplate data={data} />;
    case "minimal":
      return <MinimalTemplate data={data} />;
    default:
      return <ClassicTemplate data={data} />;
  }
};
