import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(date);

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  // 管理者権限チェック
  const admin = await isAdmin();
  if (!admin) {
    redirect("/");
  }

  // 全ユーザーを取得
  const users = await prisma.userProfile.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      companyName: true,
      representativeName: true,
      createdAt: true,
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            管理画面
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">ユーザー管理</h1>
        </div>
        <p className="text-sm text-slate-600">
          登録されている全ユーザーの一覧を表示しています。
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">全ユーザー一覧</h2>
            <p className="mt-1 text-sm text-slate-600">
              合計 {users.length} 件のユーザーが登録されています
            </p>
          </div>
        </div>

        <div className="mt-6">
          {/* モバイル: カードレイアウト */}
          <div className="space-y-3 md:hidden">
            {users.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                登録されているユーザーがありません。
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {user.companyName ?? "会社名未設定"}
                      </p>
                      <p className="text-sm text-slate-600 truncate mt-0.5">
                        {user.representativeName ?? "代表者未設定"}
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                      フリー
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="flex justify-between">
                      <span>ID:</span>
                      <span className="font-mono text-slate-600">{user.id.slice(0, 8)}...</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Email:</span>
                      <span className="text-slate-600 truncate max-w-[150px]">{user.email}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>登録日:</span>
                      <span className="text-slate-600">{formatDate(user.createdAt)}</span>
                    </p>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      className="w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 text-center"
                    >
                      詳細を見る
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* デスクトップ用テーブル */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">ユーザーID</th>
                  <th className="px-4 py-3">メールアドレス</th>
                  <th className="px-4 py-3">会社名 / 屋号</th>
                  <th className="px-4 py-3">代表者名</th>
                  <th className="px-4 py-3">登録日</th>
                  <th className="px-4 py-3">プラン</th>
                  <th className="px-4 py-3">アクション</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      登録されているユーザーがありません。
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="text-slate-700">
                      <td className="px-4 py-4 font-mono text-xs text-slate-500">
                        {user.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-900">
                        {user.email}
                      </td>
                      <td className="px-4 py-4">
                        {user.companyName ?? "-"}
                      </td>
                      <td className="px-4 py-4">
                        {user.representativeName ?? "-"}
                      </td>
                      <td className="px-4 py-4">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          フリー
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          詳細を見る
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
