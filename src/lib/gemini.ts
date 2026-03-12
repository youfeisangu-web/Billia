import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const defaultModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

/** Gemini API クライアント（APIキー未設定時はnull） */
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    if (!apiKey) {
      throw new Error("Gemini APIキーが設定されていません（GEMINI_API_KEY または GOOGLE_GENERATIVE_AI_API_KEY）");
    }
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

/** APIエラーをユーザー向けメッセージに変換（生JSONを出さない） */
function normalizeGeminiErrorMessage(raw: string): string {
  const s = raw || "";
  if (s.includes("API key expired") || (s.includes("APIキー") && s.includes("期限"))) {
    return "Gemini APIキーの有効期限が切れています。.env の GEMINI_API_KEY を Google AI Studio（https://aistudio.google.com/apikey）で再発行したキーに更新してください。";
  }
  if (s.includes("INVALID_ARGUMENT") || s.includes("API key not valid")) {
    return "Gemini APIキーが無効です。Google AI Studio で正しいキーを発行し、.env の GEMINI_API_KEY を更新してください。";
  }
  if (s.includes("429") || s.includes("RESOURCE_EXHAUSTED")) {
    return "AIの利用制限に達しました。しばらく時間をおいて再度お試しください。";
  }
  if (s.includes("403") || s.includes("PERMISSION_DENIED")) {
    return "Gemini API の利用権限がありません。APIキーと課金設定を確認してください。";
  }
  if (s.length > 200 || s.includes("type.googleapis.com") || s.startsWith("{")) {
    return "AIの解析でエラーが発生しました。しばらくして再度お試しください。問題が続く場合は管理者にご連絡ください。";
  }
  return s;
}

/** リトライ付きAPI呼び出し */
async function retryApiCall<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      // エラーを安全に処理
      let errorMessage = "API呼び出しに失敗しました";
      let errorStatus: number | undefined;
      let errorCode: number | undefined;
      
      try {
        if (error?.message) {
          errorMessage = String(error.message);
        } else if (typeof error === "string") {
          errorMessage = error;
        } else if (error?.toString && typeof error.toString === "function") {
          const errorString = error.toString();
          if (errorString !== "[object Object]") {
            errorMessage = errorString;
          }
        }
        
        errorStatus = error?.status;
        errorCode = error?.code;
      } catch (e) {
        // エラー情報の取得に失敗した場合
        console.error("Failed to extract error info:", e);
      }

      errorMessage = normalizeGeminiErrorMessage(errorMessage);
      
      // 新しいエラーオブジェクトを作成（シリアライズ可能な形式）
      const processedError = new Error(errorMessage);
      if (errorStatus !== undefined) {
        (processedError as any).status = errorStatus;
      }
      if (errorCode !== undefined) {
        (processedError as any).code = errorCode;
      }
      
      lastError = processedError;
      
      // 429エラー（レート制限）の場合はリトライ
      if (errorStatus === 429 || errorCode === 429 || errorMessage.includes("429")) {
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt); // 指数バックオフ
          console.warn(`API rate limit reached. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // 429以外のエラーまたはリトライ上限に達した場合はそのままエラーを投げる
      throw processedError;
    }
  }
  
  throw lastError || new Error("API呼び出しに失敗しました");
}

/** テキストのみで生成（漢字→カナ変換・列検出など） */
export async function generateText(prompt: string, options?: { maxTokens?: number }): Promise<string> {
  return retryApiCall(async () => {
    const gemini = getGeminiClient();
    const response = await gemini.models.generateContent({
      model: defaultModel,
      contents: prompt,
      config: {
        maxOutputTokens: options?.maxTokens ?? 500,
      },
    });
    return response.text ?? "";
  });
}

/** 画像 + テキストで生成（通帳OCRなど） */
export async function generateContentWithImage(
  prompt: string,
  imageBase64: string,
  mimeType: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  return retryApiCall(async () => {
    try {
      const gemini = getGeminiClient();
      const response = await gemini.models.generateContent({
        model: defaultModel,
        contents: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: prompt },
        ],
        config: {
          maxOutputTokens: options?.maxTokens ?? 500,
          temperature: options?.temperature ?? 0.1,
        },
      });

      if (!response || !response.text) {
        throw new Error("Gemini APIからの応答が空です");
      }

      return response.text;
    } catch (error: any) {
      let errorMessage = "Gemini APIの呼び出しに失敗しました";
      if (error?.message) {
        errorMessage = String(error.message);
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.toString && typeof error.toString === "function") {
        const errorString = error.toString();
        if (errorString !== "[object Object]") {
          errorMessage = errorString;
        }
      }
      errorMessage = normalizeGeminiErrorMessage(errorMessage);

      const newError = new Error(errorMessage);
      if (error?.status) {
        (newError as any).status = error.status;
      }
      if (error?.code) {
        (newError as any).code = error.code;
      }

      throw newError;
    }
  });
}
