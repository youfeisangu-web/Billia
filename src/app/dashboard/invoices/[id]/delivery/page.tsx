import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { InvoiceTemplate } from "@/components/invoice-template";
import DocumentActionBar from "@/components/document-action-bar";
import DocumentScaleWrapper from "@/components/document-scale-wrapper";

export default async function InvoiceDeliveryPage({
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

  const invoiceDesign = invoice.user.invoiceDesign ?? "classic";

  const data = {
    id: invoice.id,
    type: "納品書" as const,
    number: invoice.id,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    totalAmount: invoice.totalAmount,
    client: {
      name: invoice.client.name,
      address: invoice.client.address,
    },
    user: {
      companyName: invoice.user.companyName,
      invoiceRegNumber: invoice.user.invoiceRegNumber,
      email: invoice.user.email,
      address: invoice.user.address,
      phoneNumber: invoice.user.phoneNumber,
    },
    bankAccount: null,
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
        receiptUrl={`/dashboard/invoices/${id}/receipt`}
        deliveryUrl={null}
      />
      <DocumentScaleWrapper>
        <InvoiceTemplate data={data} design={invoiceDesign} />
      </DocumentScaleWrapper>
    </div>
  );
}
