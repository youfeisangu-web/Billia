"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  total: number;
  page: number;
  pageSize: number;
};

export default function Pagination({ total, page, pageSize }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  const buildHref = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    return `${pathname}?${params.toString()}`;
  };

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 flex items-center justify-between gap-4">
      <p className="text-xs text-billia-text-muted">
        {from}–{to} / {total} 件
      </p>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={buildHref(page - 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-billia-border bg-white px-3 py-1.5 text-xs font-medium text-billia-text hover:bg-billia-bg"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            前へ
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg border border-billia-border bg-billia-bg px-3 py-1.5 text-xs font-medium text-billia-text-muted opacity-40 cursor-not-allowed">
            <ChevronLeft className="h-3.5 w-3.5" />
            前へ
          </span>
        )}

        <span className="px-3 py-1.5 text-xs text-billia-text-muted">
          {page} / {totalPages}
        </span>

        {page < totalPages ? (
          <Link
            href={buildHref(page + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-billia-border bg-white px-3 py-1.5 text-xs font-medium text-billia-text hover:bg-billia-bg"
          >
            次へ
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg border border-billia-border bg-billia-bg px-3 py-1.5 text-xs font-medium text-billia-text-muted opacity-40 cursor-not-allowed">
            次へ
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </div>
  );
}
