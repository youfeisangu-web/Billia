import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ExpensesEntry from "./expenses-entry";
import ExpensesList from "./expenses-list";

const PAGE_SIZE = 20;

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/");
  const scope = orgId ? { orgId } : { userId };

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [expensesRaw, total] = await Promise.all([
    prisma.expense.findMany({
      where: { ...scope },
      orderBy: { date: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.expense.count({ where: { ...scope } }),
  ]);

  const expenses = expensesRaw.map((e) => ({ ...e, folder: e.folder ?? null }));

  return (
    <div className="py-5 md:py-8 space-y-5 pb-12">
      <header className="flex flex-col gap-1">
        <p className="billia-label">経費</p>
        <h1 className="text-xl font-semibold tracking-tight text-billia-text md:text-2xl">
          経費管理
        </h1>
        <p className="text-xs text-billia-text-muted hidden md:block">
          領収書スキャン・メモ入力・手動で経費を記録できます。
        </p>
      </header>

      {/* 登録セクション */}
      <section>
        <p className="billia-label mb-2">経費を追加</p>
        <ExpensesEntry />
      </section>

      {/* 一覧セクション */}
      <section>
        <p className="billia-label mb-2">経費一覧</p>
        <ExpensesList
          initialExpenses={expenses}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
        />
      </section>
    </div>
  );
}
