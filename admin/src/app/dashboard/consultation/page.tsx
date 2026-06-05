"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Copy,
  MapPin,
  Mic,
  MicOff,
  Phone,
  RefreshCw,
  Stethoscope,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import type { PatientResponse, PaginatedResponse, SOAPNote, ConsultationCreate } from "@/types";

// ── Audio recorder hook (replaces browser STT — uses Gemini for much better Mongolian accuracy) ──

function useAudioRecorder() {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const isSupported =
    typeof window !== "undefined" && "MediaRecorder" in window;

  const startListening = useCallback(async () => {
    if (!isSupported) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setIsTranscribing(true);
        try {
          const form = new FormData();
          form.append("audio", blob, "recording.webm");
          const res = await api.postForm<{ transcription: string }>("/api/v1/agent/transcribe", form);
          if (res.transcription) {
            setTranscript((prev) => prev + (prev ? " " : "") + res.transcription);
          }
        } catch {
          toast.error("Дуу таних үед алдаа гарлаа");
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsListening(true);
    } catch {
      toast.error("Микрофон нэвтрэх боломжгүй байна");
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return {
    transcript,
    setTranscript,
    interimText: isTranscribing ? "Дуу таниж байна…" : "",
    isListening,
    isTranscribing,
    startListening,
    stopListening,
    isSupported,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepBar({ step }: { step: 1 | 2 | 3 }) {
  const STEPS = ["Өвчтөн", "Бичлэг", "SOAP"];
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, idx) => {
        const n = (idx + 1) as 1 | 2 | 3;
        const active = step === n;
        const done = step > n;
        return (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-all ${
                active
                  ? "bg-blue-600 text-white"
                  : done
                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {done ? <Check className="w-3 h-3" /> : <span>{n}</span>}
              {label}
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-6 h-px ${step > n ? "bg-blue-300" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main flow ─────────────────────────────────────────────────────────────────

function ConsultationFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [soapNote, setSoapNote] = useState<SOAPNote | null>(null);
  const [soapEdits, setSoapEdits] = useState<SOAPNote>({ S: null, O: null, A: null, P: null });
  const [soapLoading, setSoapLoading] = useState(false);

  // Timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Patient search (step 1)
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<PatientResponse[]>([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const patientDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    transcript,
    setTranscript,
    interimText,
    isListening,
    isTranscribing,
    startListening,
    stopListening,
    isSupported,
  } = useAudioRecorder();

  // Auto-load patient from URL
  useEffect(() => {
    const patientId = searchParams.get("patientId");
    if (!patientId) return;
    api
      .get<PatientResponse>(`/api/v1/patients/${patientId}`)
      .then((p) => {
        setSelectedPatient(p);
        setStep(2);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync soapEdits when note arrives
  useEffect(() => {
    if (soapNote) setSoapEdits(soapNote);
  }, [soapNote]);

  // Timer start/stop
  useEffect(() => {
    if (isListening) {
      timerRef.current = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isListening]);

  // ── Patient search ────────────────────────────────────────────────────────

  const handlePatientSearch = (value: string) => {
    setPatientQuery(value);
    if (patientDebounceRef.current) clearTimeout(patientDebounceRef.current);
    if (!value.trim()) {
      setPatientResults([]);
      return;
    }
    patientDebounceRef.current = setTimeout(async () => {
      setPatientLoading(true);
      try {
        const d = await api.get<PaginatedResponse<PatientResponse>>(
          `/api/v1/patients/?q=${encodeURIComponent(value)}&size=10`
        );
        setPatientResults(d.items);
      } catch {
        setPatientResults([]);
      } finally {
        setPatientLoading(false);
      }
    }, 300);
  };

  const selectPatient = (p: PatientResponse) => {
    setSelectedPatient(p);
    setStep(2);
  };

  // ── SOAP generation ───────────────────────────────────────────────────────

  const handleGenerateSOAP = async () => {
    setSoapLoading(true);
    stopListening();
    try {
      const note = await api.post<SOAPNote>("/api/v1/agent/soap", {
        transcription: transcript.trim(),
      });
      setSoapNote(note);
      setStep(3);

      // Fire-and-forget save to history — doesn't block or alert on failure
      const payload: ConsultationCreate = {
        doctor_id: localStorage.getItem("admin_doctor_id") ?? undefined,
        patient_id: selectedPatient?.id,
        patient_name: selectedPatient?.full_name,
        transcription: transcript.trim(),
        soap_s: note.S,
        soap_o: note.O,
        soap_a: note.A,
        soap_p: note.P,
      };
      api.post("/api/v1/consultations/", payload).catch(() => {});
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.detail : "SOAP боловсруулахад алдаа гарлаа"
      );
    } finally {
      setSoapLoading(false);
    }
  };

  // ── Copy helpers ──────────────────────────────────────────────────────────

  const copySection = (text: string | null, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} хуулагдлаа`));
  };

  const copyAll = () => {
    const text = [
      `S (Субъектив): ${soapEdits.S ?? ""}`,
      `O (Объектив): ${soapEdits.O ?? ""}`,
      `A (Үнэлгээ): ${soapEdits.A ?? ""}`,
      `P (Төлөвлөгөө): ${soapEdits.P ?? ""}`,
    ].join("\n\n");
    navigator.clipboard.writeText(text).then(() =>
      toast.success("Бүх хэсэг хуулагдлаа")
    );
  };

  // ── Reset ─────────────────────────────────────────────────────────────────

  const resetAll = () => {
    stopListening();
    setStep(1);
    setSelectedPatient(null);
    setTranscript("");
    setSoapNote(null);
    setSoapEdits({ S: null, O: null, A: null, P: null });
    setTimerSeconds(0);
    setPatientQuery("");
    setPatientResults([]);
    router.replace("/dashboard/consultation");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-[13px] font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Буцах
        </button>
        <StepBar step={step} />
        <div className="w-16" />
      </div>

      {/* ── STEP 1: Patient select ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Өвчтөн сонгох</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Нэр эсвэл утасны дугаараар хайна уу
            </p>
          </div>

          <div className="relative">
            <input
              type="text"
              value={patientQuery}
              onChange={(e) => handlePatientSearch(e.target.value)}
              placeholder="Нэр эсвэл утас..."
              autoFocus
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
            />
            {patientLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {patientResults.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {patientResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPatient(p)}
                  className="w-full text-left px-4 py-3.5 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[12px] font-bold shrink-0">
                    {initials(p.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-slate-800">{p.full_name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <div className="flex items-center gap-1 text-[12px] text-slate-500">
                        <Phone className="w-3 h-3" />
                        {p.phone_number}
                      </div>
                      {p.address_text && (
                        <div className="flex items-center gap-1 text-[12px] text-slate-400 min-w-0">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{p.address_text}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-slate-300 rotate-180 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {patientQuery && !patientLoading && patientResults.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 px-4 py-8 text-center text-slate-400">
              <p className="text-sm font-medium">Үр дүн олдсонгүй</p>
              <p className="text-xs mt-1">"{patientQuery}" хайлтад таарах өвчтөн байхгүй</p>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Recording ── */}
      {step === 2 && selectedPatient && (
        <div className="space-y-4">
          {/* Patient card */}
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[12px] font-bold shrink-0">
              {initials(selectedPatient.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-slate-800">{selectedPatient.full_name}</p>
              <div className="flex items-center gap-1 text-[12px] text-slate-500">
                <Phone className="w-3 h-3" />
                {selectedPatient.phone_number}
              </div>
            </div>
            <button
              onClick={() => { stopListening(); setStep(1); setTimerSeconds(0); }}
              className="text-[12px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              ← Буцах
            </button>
          </div>

          {/* Browser warning */}
          {!isSupported && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[13px] text-amber-700">
              <span className="font-semibold">Микрофон дэмжигдэхгүй байна</span> — эх бичвэрийг доор гараар оруулах боломжтой.
            </div>
          )}

          {/* Record button */}
          <div className="flex flex-col items-center gap-4 py-4">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={!isSupported || isTranscribing}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg disabled:opacity-40 ${
                isListening
                  ? "bg-red-500 hover:bg-red-600 animate-pulse"
                  : isTranscribing
                    ? "bg-amber-500 animate-pulse"
                    : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isTranscribing ? (
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : isListening ? (
                <MicOff className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>
            <div className="text-center">
              <p className="text-[13px] font-semibold text-slate-700">
                {isTranscribing ? "Дуу таниж байна..." : isListening ? "Бичлэг хийж байна..." : "Бичлэг эхлүүлэх"}
              </p>
              <p className="text-[20px] font-mono font-bold text-slate-800 mt-0.5">
                {formatTime(timerSeconds)}
              </p>
            </div>
          </div>

          {/* Transcript */}
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">
              Бичлэгийн текст
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={isListening ? "Ярьж байна..." : "Эмнэлгийн тэмдэглэл..."}
              rows={5}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-700 resize-none outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
            />
            {interimText && (
              <p className="text-[12px] text-slate-400 italic mt-1 px-1">{interimText}</p>
            )}
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerateSOAP}
            disabled={!transcript.trim() || soapLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-[14px] rounded-xl py-3 transition-colors"
          >
            {soapLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Боловсруулж байна...
              </>
            ) : (
              <>
                <Stethoscope className="w-4 h-4" />
                SOAP тэмдэглэл үүсгэх
              </>
            )}
          </button>
        </div>
      )}

      {/* ── STEP 3: SOAP Note ── */}
      {step === 3 && selectedPatient && (
        <div className="space-y-4">
          {/* Patient header */}
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold shrink-0">
              {initials(selectedPatient.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-slate-800">{selectedPatient.full_name}</p>
              <p className="text-[12px] text-slate-500">{selectedPatient.phone_number}</p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="text-[12px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              ← Засах
            </button>
          </div>

          {/* Error state */}
          {soapNote?.error && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[13px] text-amber-700">
              AI боловсруулахад алдаа гарлаа. Гараар засварлана уу.
            </div>
          )}

          {/* SOAP sections */}
          {(
            [
              { key: "S" as const, tag: "S", label: "Субъектив тайлбар" },
              { key: "O" as const, tag: "O", label: "Объектив өгөгдөл" },
              { key: "A" as const, tag: "A", label: "Үнэлгээ / Оношилгоо" },
              { key: "P" as const, tag: "P", label: "Эмчилгээний төлөвлөгөө" },
            ] as const
          ).map(({ key, tag, label }) => (
            <div key={key} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-600 text-white text-[11px] font-bold rounded-md flex items-center justify-center">
                    {tag}
                  </span>
                  <span className="text-[12px] font-semibold text-slate-700">{label}</span>
                </div>
                <button
                  onClick={() => copySection(soapEdits[key], tag)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                  title="Хуулах"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={soapEdits[key] ?? ""}
                onChange={(e) =>
                  setSoapEdits((prev) => ({ ...prev, [key]: e.target.value }))
                }
                rows={3}
                placeholder={`${label}...`}
                className="w-full resize-none text-[13px] text-slate-700 outline-none placeholder:text-slate-300 min-h-[72px]"
              />
            </div>
          ))}

          {/* Actions */}
          <div className="flex gap-3 pb-2">
            <button
              onClick={copyAll}
              className="flex-1 flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-[13px] font-medium rounded-xl py-3 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Бүгдийг хуулах
            </button>
            <button
              onClick={resetAll}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium rounded-xl py-3 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Шинэ үзлэг
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConsultationPage() {
  return (
    <Suspense fallback={null}>
      <ConsultationFlow />
    </Suspense>
  );
}
