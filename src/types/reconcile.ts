/**
 * 入金消込機能の型定義
 */

export type ReconcileStatus = '完了' | 'エラー' | '確認' | '未完了';

/** 複数候補がある場合に返す候補請求書 */
export type ReconcileCandidate = {
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  issueDate: string;
  amount: number;
};

export type ReconcileResult = {
  date: string;
  amount: number;
  rawName: string;
  status: ReconcileStatus;
  message: string;
  /** 請求書ベースの消し込みでマッチした請求書ID */
  invoiceId: string | null;
  /** マッチした請求書番号（表示・リンク用） */
  invoiceNumber?: string | null;
  /** マッチした取引先名（表示用） */
  clientName?: string | null;
  /** @deprecated 取引先ベースは廃止 */
  tenantId: string | null;
  /** 同一金額の請求書が複数あり選択が必要な場合に設定 */
  candidates?: ReconcileCandidate[];
};

export type ReconcileResponse = {
  success: boolean;
  data?: ReconcileResult[];
  error?: string;
};
