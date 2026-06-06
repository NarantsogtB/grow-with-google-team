"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Send, Sparkles, User as UserIcon } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import type { PaginatedResponse, PatientResponse } from "@/types";

interface ChatResponse {
  response: string;
  intent: string;
  tool_result: Record<string, unknown> | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  intent?: string;
}

const INTENT_LABELS: Record<string, string> = {
  schedule_update: "Хуваарь өөрчлөх",
  route_optimize: "Маршрут оновчлох",
  soap_note: "SOAP бичих",
  general: "Ерөнхий хариу",
};

const FALLBACK_PATIENT = "Өвчтөн";

const buildSuggestions = (samplePatientName: string) => [
  "Өнөөдрийн оптимал маршрутыг харуул",
  "Маргааш ирэх өвчтнүүдийн жагсаалт",
  "BP 160/100, толгой өвдөнө, Enalapril бичье",
  `${samplePatientName} маргааш ирж чадахгүй гэлээ`,
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [samplePatient, setSamplePatient] = useState<string>(FALLBACK_PATIENT);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => buildSuggestions(samplePatient), [samplePatient]);

  // Pull a real patient name from the doctor's sector so the placeholder
  // example matches data that actually exists in the DB.
  useEffect(() => {
    const raw = localStorage.getItem("admin_doctor");
    let sector: string | undefined;
    if (raw) {
      try {
        sector = JSON.parse(raw)?.assigned_sector;
      } catch {
        // ignore malformed
      }
    }
    const path = sector
      ? `/api/v1/patients/?sector=${encodeURIComponent(sector)}&size=1`
      : `/api/v1/patients/?size=1`;
    api
      .get<PaginatedResponse<PatientResponse>>(path)
      .then((res) => {
        if (res.items[0]?.full_name) {
          setSamplePatient(res.items[0].full_name);
        }
      })
      .catch(() => {
        // keep fallback — 401 will already be handled by the api client
      });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const send = async (message: string) => {
    const text = message.trim();
    if (!text || loading) return;

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const data = await api.post<ChatResponse>("/api/v1/agent/chat", {
        message: text,
      });
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.response, intent: data.intent },
      ]);
    } catch (err) {
      const detail =
        err instanceof ApiError ? err.detail : "AI assistant холбогдсонгүй";
      setMessages((m) => [...m, { role: "assistant", text: `⚠️ ${detail}` }]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="flex flex-col h-full -m-4 md:-m-6 -mb-20 md:-mb-6 bg-[#f8fafc]">
      {/* Header */}
      <div className="px-5 sm:px-8 py-4 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-[16px] font-semibold text-slate-900 leading-none">
              AI Туслах
            </h1>
            <p className="text-[12px] text-slate-500 mt-1">
              LangGraph + Gemini · Маршрут, хуваарь, SOAP, ерөнхий асуулт
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="max-w-xl mx-auto text-center py-12">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-[15px] font-semibold text-slate-900 mb-1">
              Сайн байна уу!
            </h2>
            <p className="text-[13px] text-slate-500 mb-6">
              Намайг өөрийн өдрийн хуваарь, маршрут эсвэл өвчтөний асуудлаар асуугаарай.
            </p>
            <div className="grid sm:grid-cols-2 gap-2 text-left">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[12px] text-slate-700 bg-white hover:bg-blue-50 hover:border-blue-200 border border-slate-200 rounded-lg px-3 py-2 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <Bubble key={i} msg={m} />
        ))}

        {loading && (
          <div className="flex items-start gap-3 max-w-3xl mx-auto">
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-4 py-2.5 text-[13px] text-slate-500">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={onSubmit}
        className="border-t border-slate-100 bg-white px-5 sm:px-8 py-3"
      >
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Жишээ нь: 'Өнөөдрийн оптимал маршрут'"
            rows={1}
            className="flex-1 resize-none border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all max-h-32"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="shrink-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors"
            aria-label="Илгээх"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div
      className={`flex items-start gap-3 max-w-3xl mx-auto ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-slate-200" : "bg-blue-50"
        }`}
      >
        {isUser ? (
          <UserIcon className="w-4 h-4 text-slate-600" />
        ) : (
          <Bot className="w-4 h-4 text-blue-600" />
        )}
      </div>
      <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        {!isUser && msg.intent && (
          <span className="text-[10px] uppercase tracking-wider text-blue-600 font-semibold">
            {INTENT_LABELS[msg.intent] ?? msg.intent}
          </span>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-[13px] whitespace-pre-wrap leading-relaxed ${
            isUser
              ? "bg-blue-600 text-white rounded-tr-md"
              : "bg-white border border-slate-200 text-slate-800 rounded-tl-md"
          }`}
        >
          {msg.text}
        </div>
      </div>
    </div>
  );
}
