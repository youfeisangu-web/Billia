import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SalesClientView from "./sales-client-view";

export default async function SalesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const [categories, currentEntries, lastMonthEntries, monthlySummary, invoices] =
    await Promise.all([
      prisma.salesCategory.findMany({
        where: { userId },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        include: { _count: { select: { entries: true } } },
      }),
      prisma.categorySalesEntry.findMany({
        where: { userId, month: currentMonth },
        include: { category: true },
      }),
      prisma.categorySalesEntry.findMany({
        where: { userId, month: lastMonth },
        include: { category: true },
      }),
      prisma.categorySalesEntry.findMany({
        where: { userId },
        orderBy: { month: "asc" },
      }),
      prisma.invoice.findMany({
        where: { userId },
        orderBy: { issueDate: "desc" },
        take: 30,
        include: { client: { select: { name: true } } },
      }),
    ]);

  // 月次サマリー集計
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const byMonth: Record<string, number> = {};
  months.forEach((m) => (byMonth[m] = 0));
  monthlySummary.forEach((e) => {
    if (byMonth[e.month] !== undefined) byMonth[e.month] += e.amount;
  });
  const initialMonthlySummary = months.map((month) => ({ month, total: byMonth[month] ?? 0 }));

  // KPI
  const currentTotal = currentEntries.reduce((s, e) => s + e.amount, 0);
  const lastTotal = lastMonthEntries.reduce((s, e) => s + e.amount, 0);
  const growthRate = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0;

  return (
    <div className="flex flex-col gap-5 py-5 md:gap-8 md:py-8">
      <header>
        <p className="billia-label">売上管理</p>
        <h1 className="text-xl font-semibold tracking-tight text-billia-text md:text-2xl">
          売上分析
        </h1>
        <p className="text-xs text-billia-text-muted mt-1 hidden md:block">
          カテゴリ別の売上を記録・分析できます。
        </p>
      </header>

      <SalesClientView
        initialCategories={categories}
        initialEntries={currentEntries}
        initialMonthlySummary={initialMonthlySummary}
        initialLastMonthEntries={lastMonthEntries}
        recentInvoices={invoices.map((inv) => ({
          id: inv.id,
          issueDate: inv.issueDate.toISOString(),
          totalAmount: inv.totalAmount,
          clientName: inv.client?.name ?? "不明",
        }))}
        currentMonth={currentMonth}
        kpi={{
          sales: currentTotal,
          customers: invoices.length,
          growthRate,
        }}
      />
    </div>
  );
}
