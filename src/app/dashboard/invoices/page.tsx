import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import InvoicesTableWithBulkStatus from "./invoices-table-with-bulk-status";

const PAGE_SIZE = 20;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { userId, orgId } = await auth();
  if (!userId) {
    redirect("/");
  }
  const scope = orgId ? { orgId } : { userId };

  return (
    <div className="flex flex-col gap-5 py-5 md:gap-8 md:py-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="billia-label">請求書</p>
          <h1 className="text-xl font-semibold tracking-tight text-billia-text md:text-2xl">
            請求書一覧
          </h1>
          <p className="text-xs text-billia-text-muted mt-1 hidden md:block">
            登録済みの請求書を一覧で管理できます。
          </p>
        </div>
        <a
          href="/api/export/invoices"
          className="shrink-0 text-xs text-slate-400 hover:text-slate-600 transition"
        >
          CSV出力
        </a>
      </header>

      <div className="billia-card overflow-hidden p-4 md:p-6">
        <Suspense fallback={<TableSkeleton />}>
          <InvoicesDataFetcher searchParams={searchParams} scope={scope} />
        </Suspense>
      </div>
    </div>
  );
}

async function InvoicesDataFetcher({
  searchParams,
  scope,
}: {
  searchParams: Promise<{ page?: string }>;
  scope: any;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where: { ...scope },
      orderBy: { issueDate: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        client: {
          select: { name: true },
        },
      },
    }),
    prisma.invoice.count({ where: { ...scope } }),
  ]);

  const invoicesForClient = invoices.map((inv) => ({
    id: inv.id,
    issueDate: inv.issueDate.toISOString(),
    totalAmount: inv.totalAmount,
    status: inv.status,
    folder: inv.folder ?? null,
    client: inv.client,
  }));

  return (
    <InvoicesTableWithBulkStatus
      invoices={invoicesForClient}
      total={total}
      page={page}
      pageSize={PAGE_SIZE}
    />
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-4 py-2">
      <div className="h-10 bg-slate-100 rounded-lg w-full"></div>
      <div className="h-12 bg-slate-50 border border-slate-100 rounded-lg w-full"></div>
      <div className="h-12 bg-slate-50 border border-slate-100 rounded-lg w-full"></div>
      <div className="h-12 bg-slate-50 border border-slate-100 rounded-lg w-full"></div>
      <div className="h-12 bg-slate-50 border border-slate-100 rounded-lg w-full"></div>
      <div className="h-12 bg-slate-50 border border-slate-100 rounded-lg w-full"></div>
    </div>
  );
}
