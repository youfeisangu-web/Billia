"use client";

import { useRef, useState } from "react";

interface OverlayProps {
  transcript: string;
  onStop: () => void;
}

function VoiceOverlay({ transcript, onStop }: OverlayProps) {
  return (
    <>
      <style>{`
        @keyframes voice-blob1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(28px, -24px) scale(1.12); }
          66% { transform: translate(-18px, 18px) scale(0.9); }
        }
        @keyframes voice-blob2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-36px, 16px) scale(1.18); }
          66% { transform: translate(22px, -28px) scale(0.85); }
        }
        @keyframes voice-blob3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(18px, 36px) scale(0.88); }
          66% { transform: translate(-28px, -8px) scale(1.1); }
        }
        @keyframes voice-fadein {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes voice-mic-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.15); }
          50% { box-shadow: 0 0 0 16px rgba(255,255,255,0); }
        }
      `}</style>
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{
          background: "rgba(5, 5, 15, 0.88)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          animation: "voice-fadein 0.25s ease",
        }}
        onClick={onStop}
      >
        {/* Blob area */}
        <div
          className="relative flex items-center justify-center mb-10"
          style={{ width: 220, height: 220 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              position: "absolute",
              width: 180,
              height: 180,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 40% 40%, rgba(99,102,241,0.7), rgba(59,130,246,0.3))",
              filter: "blur(28px)",
              animation: "voice-blob1 4.2s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 150,
              height: 150,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 60% 30%, rgba(168,85,247,0.7), rgba(236,72,153,0.3))",
              filter: "blur(22px)",
              animation: "voice-blob2 5.1s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 120,
              height: 120,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 50% 70%, rgba(52,211,153,0.6), rgba(99,102,241,0.3))",
              filter: "blur(18px)",
              animation: "voice-blob3 3.7s ease-in-out infinite",
            }}
          />
          {/* Mic button */}
          <button
            type="button"
            onClick={onStop}
            style={{
              position: "relative",
              zIndex: 1,
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              border: "1.5px solid rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              animation: "voice-mic-pulse 1.8s ease-in-out infinite",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        </div>

        {/* Text */}
        <p className="text-white text-base font-medium mb-2">聞いています...</p>
        {transcript ? (
          <p className="text-white/70 text-sm max-w-xs text-center px-6 mb-8 leading-relaxed">
            {transcript}
          </p>
        ) : (
          <p className="text-white/40 text-sm mb-8">話してください</p>
        )}

        <button
          type="button"
          onClick={onStop}
          className="px-8 py-2.5 rounded-full text-white/80 text-sm border border-white/15 bg-white/8 hover:bg-white/15 transition"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          完了
        </button>
      </div>
    </>
  );
}

export default function VoiceInputButton({
  onTranscript,
  lang = "ja-JP",
  className,
}: {
  onTranscript: (text: string) => void;
  lang?: string;
  className?: string;
}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");

  const handleStart = () => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert(
        "このブラウザは音声入力に対応していません（Chrome / Safariをお使いください）"
      );
      return;
    }

    transcriptRef.current = "";
    setTranscript("");

    const recognition = new SR();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (e: any) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      transcriptRef.current = text;
      setTranscript(text);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (transcriptRef.current) {
        onTranscript(transcriptRef.current);
      }
    };

    recognition.onerror = (e: any) => {
      console.error("音声認識エラー:", e.error);
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const handleStop = () => {
    recognitionRef.current?.stop();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleStart}
        className={
          className ??
          "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
        }
        title="音声入力"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
        音声入力
      </button>
      {isListening && (
        <VoiceOverlay transcript={transcript} onStop={handleStop} />
      )}
    </>
  );
}
