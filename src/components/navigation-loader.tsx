"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import LoadingSpinner from "./loading-spinner";

const MAX_LOADING_SEC = 20; // 遷移が完了しない場合でもこの秒数でスピナーを消す

export default function NavigationLoader() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const prevPathnameRef = useRef(pathname);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxLoadingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // パス名が変更された場合（ページ遷移完了）
    if (pathname !== prevPathnameRef.current) {
      setIsLoading(false);
      prevPathnameRef.current = pathname;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      if (maxLoadingRef.current) {
        clearTimeout(maxLoadingRef.current);
        maxLoadingRef.current = null;
      }
    }
  }, [pathname]);

  // ページ遷移の開始を検知（リンククリック時）
  // 速い遷移ではスピナーを出さず、遅いときだけ表示（体感ローディング短縮）
  const SHOW_SPINNER_DELAY_MS = 500;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link && link.href && !link.href.startsWith("#") && !link.hasAttribute("download")) {
        try {
          const url = new URL(link.href);
          const currentUrl = new URL(window.location.href);

          if (
            url.origin === currentUrl.origin &&
            url.pathname !== currentUrl.pathname &&
            url.pathname !== pathname
          ) {
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current);
            }
            // 500ms 経ってからスピナー表示（その前に遷移完了すれば何も出ない）
            loadingTimeoutRef.current = setTimeout(() => {
              if (url.pathname !== pathname) {
                setIsLoading(true);
              }
              loadingTimeoutRef.current = null;
            }, SHOW_SPINNER_DELAY_MS);

            if (maxLoadingRef.current) {
              clearTimeout(maxLoadingRef.current);
            }
            maxLoadingRef.current = setTimeout(() => {
              setIsLoading(false);
              maxLoadingRef.current = null;
            }, MAX_LOADING_SEC * 1000);
          }
        } catch {
          // URL解析エラーは無視
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (maxLoadingRef.current) {
        clearTimeout(maxLoadingRef.current);
      }
    };
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center md:bg-black/20 md:backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" text="読み込み中..." />
        <button
          type="button"
          onClick={() => {
            setIsLoading(false);
            if (maxLoadingRef.current) {
              clearTimeout(maxLoadingRef.current);
              maxLoadingRef.current = null;
            }
          }}
          className="text-sm text-slate-500 hover:text-slate-700 underline"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
