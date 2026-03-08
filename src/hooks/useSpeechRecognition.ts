"use client";

import { useState, useRef, useEffect } from "react";

type UseSpeechRecognitionReturn = {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
  resetTranscript: () => void;
};

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isNative, setIsNative] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Capacitorのネイティブ判定（SSR対応）
  useEffect(() => {
    if (typeof window === "undefined") return;
    import("@capacitor/core")
      .then(({ Capacitor }) => {
        setIsNative(Capacitor.isNativePlatform());
      })
      .catch(() => {
        setIsNative(false);
      });
  }, []);

  const isSupported =
    typeof window !== "undefined" &&
    !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );

  const start = async () => {
    setError(null);

    if (isNative) {
      // ネイティブ（iOS/Android）: Capacitorプラグインを使用
      try {
        const { SpeechRecognition } = await import(
          "@capacitor-community/speech-recognition"
        );

        const { available } = await SpeechRecognition.available();
        if (!available) {
          setError("この端末では音声認識が利用できません");
          return;
        }

        await SpeechRecognition.requestPermissions();
        setIsListening(true);

        await SpeechRecognition.start({
          language: "ja-JP",
          maxResults: 1,
          prompt: "話しかけてください",
          partialResults: true,
          popup: false,
        });

        SpeechRecognition.addListener("partialResults", (data: any) => {
          if (data.matches?.[0]) {
            setTranscript(data.matches[0]);
          }
        });
      } catch (e: any) {
        setError(e?.message || "音声認識エラーが発生しました");
        setIsListening(false);
      }
      return;
    }

    // Web: Web Speech API
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setError("このブラウザは音声入力に対応していません（Chrome/Safari推奨）");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "ja-JP";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const text = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setTranscript(text);
    };

    recognition.onerror = (event: any) => {
      setError(`音声認識エラー: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const stop = async () => {
    if (isNative) {
      try {
        const { SpeechRecognition } = await import(
          "@capacitor-community/speech-recognition"
        );
        await SpeechRecognition.stop();
      } catch {
        // ignore
      }
    } else {
      recognitionRef.current?.stop();
    }
    setIsListening(false);
  };

  const resetTranscript = () => setTranscript("");

  return { isListening, transcript, isSupported, error, start, stop, resetTranscript };
}
