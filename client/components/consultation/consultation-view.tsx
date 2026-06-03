"use client";

import { useState } from "react";
import { Patient } from "@/hooks/use-patients";

interface ConsultationViewProps {
  selectedPatient: Patient;
  onClose: () => void;
}

export function ConsultationView({ selectedPatient, onClose }: ConsultationViewProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const handleAskAI = () => {
    setAiLoading(true);
    setTimeout(() => {
      setAiResult(
        `📊 Gemini AI Клиникийн зөвлөмж:\n\nӨвчтөн ${selectedPatient.name} (${selectedPatient.age} нас).\nАмин үзүүлэлт тогтвортой байна. Систолик даралт хэвийн хэмжээнээс ихэссэн тул анхаарна уу.`
      );
      setAiLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#eaf2ee] p-4 lg:p-8 font-sans text-[#334155] antialiased flex flex-col gap-6">

      {/* Дээд талын Навигэйшн / Буцах хэсэг */}
      <div className="w-full flex justify-between items-center bg-white/40 backdrop-blur-md px-6 py-4 rounded-2xl border-2 border-white/30 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-sm font-bold text-[#1e5d48] hover:text-[#164737] flex items-center gap-1 transition-all"
          >
            ← Буцах
          </button>
          <span className="text-[#cbd5e1]">|</span>
          <h1 className="font-bold text-[15px] text-[#1e293b]">
            Идэвхтэй үзлэг: <span className="text-[#1e5d48] font-black">{selectedPatient.name}</span>
          </h1>
        </div>
      </div>

      {/* Үндсэн агуулга: Зүүн ба Баруун тал */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">

        {/* 🌟 ЗҮҮН ТАЛ: Өвчтөний мэдээлэл ба Үзлэгийн тэмдэглэл бичих хэсэг */}
        <div className="lg:col-span-7 bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-[32px] border-2 border-white/50 shadow-sm flex flex-col justify-between min-h-[500px]">
          <div>
            <h2 className="font-black text-xl text-[#1e293b] mb-4">Эмчийн үзлэгийн тэмдэглэл</h2>
            <div className="bg-slate-50/60 border-2 border-white/40 p-4 rounded-2xl mb-6 text-sm">
              <p className="font-bold text-[#475569]">Урьдчилсан асуумж:</p>
              <p className="text-[#64748b] mt-1">{selectedPatient.preliminaryNote}</p>
            </div>

            <label className="block text-[11px] font-black text-[#94a3b8] uppercase tracking-wider mb-2">Үзлэгийн явц / Онош / Зөвлөмж</label>
            <textarea
              rows={8}
              placeholder="Өвчтөний зовуурь, бодит үзлэгийн өөрчлөлт болон бичиж өгсөн эмийг энд тэмдэглэнэ үү..."
              className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#1e5d48]/20 focus:border-[#1e5d48] text-sm font-medium transition-all"
            />
          </div>

          <button className="w-full bg-[#1e5d48] hover:bg-[#164737] text-white py-4 rounded-2xl font-black text-[15px] shadow-md transition-all mt-6">
            Үзлэгийг хадгалж, дуусгах
          </button>
        </div>

        {/* 🌟 БАРУУН ТАЛ: Gemini AI Туслахын хэсэг */}
        <div className="lg:col-span-5 bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-[32px] border-2 border-white/50 shadow-sm flex flex-col justify-between min-h-[500px]">
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></span>
                <h2 className="font-black text-xl text-[#1e293b]">Gemini AI Эмнэлгийн туслах</h2>
              </div>

              <p className="text-xs text-[#64748b] leading-relaxed mb-6 font-medium">
                Энэхүү туслах нь өвчтөний урьдчилсан асуумж болон түүх дээр үндэслэн танд клиникийн зөвлөмж өгөх зориулалттай бөгөөд эцсийн шийдвэрийг эмч та гаргана.
              </p>

              {/* AI-ийн хариу гарч ирэх хэсэг */}
              {aiResult && (
                <div className="bg-cyan-50/50 border-2 border-cyan-100/50 p-5 rounded-2xl text-sm font-medium text-[#0e7490] whitespace-pre-line leading-relaxed shadow-inner animate-fadeIn">
                  {aiResult}
                </div>
              )}
            </div>

            {/* AI-аас асуух товчлуур */}
            <button
              onClick={handleAskAI}
              disabled={aiLoading}
              className={`w-full py-4 rounded-2xl font-black text-[15px] shadow-md transition-all mt-6 flex items-center justify-center gap-2 ${
                aiLoading
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#1e5d48] to-[#0d523b] hover:opacity-95 text-white'
              }`}
            >
              {aiLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
                  Уншиж байна...
                </>
              ) : (
                "✨ Gemini AI-аас зөвлөмж авах"
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
