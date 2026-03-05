import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { ReceiptTemplate } from "@/components/receipt-template";
import DocumentActionBar from "@/components/document-action-bar";

// 領収書番号を生成: REC-YYYYMM-NNN
async function generateReceiptNumber(scope: { userId: string } | { orgId: string }, issueDate: Date): Promise<string> {
  const ym = `${issueDate.getFullYear()}${String(issueDate.getMonth() + 1).padStart(2, "0")}`;
  const count = await prisma.invoice.count({
    where: {
      ...scope,
      receiptIssuedAt: { not: null },
    },
  });
  return `REC-${ym}-${String(count + 1).padStart(3, "0")}`;
}

export default async function InvoiceReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/");
  const scope = orgId ? { orgId } : { userId };

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, ...scope },
    include: {
      client: true,
      items: true,
      user: true,
    },
  });

  if (!invoice) notFound();

  // 初回発行時のみ日時・番号を記録（一度発行したら変わらない = 改ざん防止）
  let receiptIssuedAt = invoice.receiptIssuedAt;
  let receiptNumber = invoice.receiptNumber;

  if (!receiptIssuedAt || !receiptNumber) {
    receiptNumber = await generateReceiptNumber(scope, invoice.issueDate);
    receiptIssuedAt = new Date();
    await prisma.invoice.update({
      where: { id },
      data: { receiptIssuedAt, receiptNumber },
    });
  }

  // 但し書き: 明細から自動生成
  const tadashi = invoice.items.length > 0
    ? `${invoice.items[0].name}${invoice.items.length > 1 ? "他" : ""}代として`
    : "上記正に領収いたしました";

  const data = {
    receiptNumber,
    issueDate: invoice.issueDate,
    receiptIssuedAt,
    totalAmount: invoice.totalAmount,
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    tadashi,
    client: {
      name: invoice.client.name,
      address: invoice.client.address,
    },
    user: {
      companyName: invoice.user.companyName,
      representativeName: invoice.user.representativeName,
      address: invoice.user.address,
      phoneNumber: invoice.user.phoneNumber,
      invoiceRegNumber: invoice.user.invoiceRegNumber,
      email: invoice.user.email,
      stampUrl: invoice.user.stampUrl,
    },
    items: invoice.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
    })),
  };

  return (
    <div className="flex flex-col">
      <DocumentActionBar
        backUrl={`/dashboard/invoices/${id}`}
        editUrl={`/dashboard/invoices/${id}/edit`}
        receiptUrl={null}
        deliveryUrl={`/dashboard/invoices/${id}/delivery`}
      />
      <div className="print-content">
        <ReceiptTemplate data={data} />
      </div>
    </div>
  );
}
