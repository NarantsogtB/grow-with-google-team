"use client";

import { useState, useEffect } from "react";

interface Patient {
  id: number;
  name: string;
  age: number;
  address: string;
  distance: string;
  time: string;
  status: "urgent" | "active" | "pending";
  triageScore: number;
  preliminaryNote: string;
  coords: { x: number; y: number };
}

export default function Dashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  
  //  ШИНЭ: Үзлэг эхэлсэн эсэхийг хянах төлөв
  const [isConsulting, setIsConsulting] = useState(false);
  
  // Үзлэгийн үеэр бүртгэх амин үзүүлэлтүүд
  const [bpSys, setBpSys] = useState("");
  const [bpDia, setBpDia] = useState("");
  const [pulse, setPulse] = useState("");
  const [spo2, setSpo2] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fallbackData: Patient[] = [
      { id: 1, name: "Д. Мөнхбат", age: 67, address: "4 хороо, 32-р байр, 14", distance: "0.8 км", time: "09:20", status: "urgent", triageScore: 8, preliminaryNote: "Цусны даралт 165/100 · толгой эргэх.", coords: { x: 20, y: 40 } },
      { id: 2, name: "Ц. Оюунчимэг", age: 72, address: "4 хороо, 28-р байр, 41", distance: "1.2 км", time: "09:50", status: "active", triageScore: 4, preliminaryNote: "Зүрхний бэрхшээл байхгүй", coords: { x: 45, y: 60 } },
      { id: 3, name: "Б. Дорж", age: 45, address: "5 хороо, 12-р гудамж, 7", distance: "1.7 км", time: "10:30", status: "pending", triageScore: 2, preliminaryNote: "Хөл өвдөнө гэсэн", coords: { x: 60, y: 30 } }
    ];
    setPatients(fallbackData);
    setSelectedPatient(fallbackData[1]);
    setLoading(false);
  }, []);

  // AI-аас зөвлөмж авах хэсгийг дуурайлгах
  const handleAskAI = () => {
    setAiLoading(true);
    setTimeout(() => {
      setAiResult(`📊 Gemini AI Клиникийн зөвлөмж:\n\nӨвчтөн Ц. Оюунчимэг (${selectedPatient?.age} нас).\nАмин үзүүлэлт тогтвортой байна. Систолик даралт ${bpSys || "120"}-аас ихэссэн тул артерийн даралт бууруулах үндсэн эмийн тунг хянаж, давсны хэрэглээг хязгаарлах зөвлөгөө өгнө үү. Зүрхний цохилт хэвийн байна.`);
      setAiLoading(false);
    }, 1500);
  };

  // -------------------------------------------------------------
  //  ХЭРЭВ ҮЗЛЭГ ЭХЭЛСЭН БОЛ ЭНЭ ДЭЛГЭЦИЙГ ХАРУУЛНА
  // -------------------------------------------------------------
  if (isConsulting && selectedPatient) {
    return (
      <div className="min-h-screen bg-[#f0f5f3] p-4 lg:p-8 font-sans text-[#334155]">
        {/* Үзлэгийн Header */}
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-[32px] shadow-sm border border-[#e2e8f0]">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsConsulting(false)} 
              className="bg-slate-100 hover:bg-slate-200 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
            >
              ←
            </button>
            <div>
               <h1 className="text-xl font-black text-[#1e293b]">Идэвхтэй үзлэг</h1>
               <p className="text-xs text-[#94a3b8] font-bold uppercase tracking-wider mt-0.5">Өвчтөн: {selectedPatient.name} ({selectedPatient.age} нас)</p>
            </div>
          </div>
          <div className="bg-[#fff1f2] px-4 py-2 rounded-full border border-[#ffe4e6] text-xs font-bold text-[#ef4444]">
            Triage: {selectedPatient.triageScore}/10
          </div>
        </header>

        {/* Үзлэгийн үндсэн хэсэг */}
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Зүүн тал: Амин үзүүлэлт оруулах форм */}
          <div className="col-span-6 bg-white p-8 rounded-[40px] shadow-sm border border-[#e2e8f0] space-y-6">
            <h3 className="font-black text-lg text-[#1e293b] border-b pb-4">🩸 Амин үзүүлэлтүүд бүртгэх</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-black text-[#94a3b8] uppercase tracking-widest block mb-2">Цусны даралт (Дээд)</label>
                <input 
                  type="number" placeholder="120" value={bpSys} onChange={(e) => setBpSys(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-[#1e5d48]"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-[#94a3b8] uppercase tracking-widest block mb-2">Цусны даралт (Доод)</label>
                <input 
                  type="number" placeholder="80" value={bpDia} onChange={(e) => setBpDia(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-[#1e5d48]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-black text-[#94a3b8] uppercase tracking-widest block mb-2">Зүрхний цохилт /минут</label>
                <input 
                  type="number" placeholder="75" value={pulse} onChange={(e) => setPulse(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-[#1e5d48]"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-[#94a3b8] uppercase tracking-widest block mb-2">Хүчилтөрөгчийн хангамж (SpO2 %)</label>
                <input 
                  type="number" placeholder="98" value={spo2} onChange={(e) => setSpo2(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-[#1e5d48]"
                />
              </div>
            </div>

            <button 
              onClick={handleAskAI}
              className="w-full bg-[#1e5d48] text-white py-4 rounded-2xl font-bold hover:bg-[#164a39] transition-all flex items-center justify-center gap-2"
            >
              ✨ Gemini AI-аас зөвлөмж авах
            </button>
          </div>

          {/* Баруун тал: AI-ийн хариу болон дүгнэлт гаргах */}
          <div className="col-span-6 space-y-6">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-[#e2e8f0] min-h-[300px] flex flex-col">
              <h3 className="font-black text-lg text-[#1e293b] mb-4">🤖 Google Gemini AI-ийн шинжилгээ</h3>
              <div className="flex-1 bg-[#f8fafc] rounded-3xl p-6 border border-[#f1f5f9] whitespace-pre-line text-sm leading-relaxed font-medium text-[#475569]">
                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-[#94a3b8] animate-pulse font-bold">
                    <span>✨ Өгөгдөлд анализ хийж байна...</span>
                  </div>
                ) : aiResult ? (
                  aiResult
                ) : (
                  <span className="text-[#cbd5e1] italic">Амин үзүүлэлтүүдийг оруулаад AI товчийг дарна уу.</span>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => {
                  alert("Үзлэг амжилттай хадгалагдлаа!");
                  setIsConsulting(false);
                  setAiResult("");
                }}
                className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 shadow-md transition-all"
              >
                ✅ Үзлэгийг дуусгаж, хадгалах
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f5f3] p-4 lg:p-8 font-sans text-[#334155]">
      {/* Header хэсэг */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 px-2">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-[#1e5d48] rounded-xl flex items-center justify-center text-white text-xl font-black">D</div>
          <h1 className="text-xl font-bold tracking-tight text-[#1e293b]">DVA <span className="font-medium text-[#64748b]">· Эргэлтийн туслах</span></h1>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#64748b]">
            <span className="w-2 h-2 bg-[#22c55e] rounded-full"></span> Real-time холбогдсон
          </div>
          <div className="flex items-center gap-3 bg-white pl-4 pr-1 py-1 rounded-full shadow-sm border border-[#e2e8f0]">
             <div className="text-right">
                <p className="font-bold text-[12px] leading-tight text-[#1e293b]">Б. Энхтуяа</p>
                <p className="text-[10px] text-[#94a3b8]">ӨЭМТ #4 · Хан-Уул</p>
             </div>
             <div className="w-9 h-9 bg-[#1e5d48] rounded-full flex items-center justify-center text-white text-[11px] font-bold">БЭ</div>
          </div>
        </div>
      </header>

      {/* 🛠️ ЗАСВАР: Утас дээр дээрээсээ доошоо flex-col, компьютер дээр grid-cols-12 */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (Зүүн тал) */}
        <div className="w-full lg:col-span-8 space-y-6">
          
          {/* 🛠️ ЗАСВАР: Утас дээр хатуу өндөргүй (h-auto), компьютер дээр л h-[280px] болно */}
          <div className="bg-white p-6 sm:p-10 rounded-[40px] shadow-sm border border-[#e2e8f0] relative h-auto lg:h-[280px] flex flex-col justify-center">
            <p className="text-[#94a3b8] text-[13px] font-bold uppercase tracking-wider mb-2">2026.05.10 · БЯМБА</p>
            
            {/* 🛠️ ЗАСВАР: Утас дээр текстүүд нь доошоо урсдаг болгосон (flex-col sm:flex-row) */}
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-3 mb-6 sm:mb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-6xl sm:text-[100px] font-black leading-none tracking-tighter text-[#1e293b]">{patients.length}</span>
                <span className="text-2xl font-bold text-[#1e293b]">айл</span>
              </div>
              <p className="sm:ml-6 text-[#64748b] text-base sm:text-lg font-medium leading-relaxed">
                5 баталсан · 2 хүлээгдэж · 1 урьдчилсан яаралтай
              </p>
            </div>
            <div className="flex gap-3">
              <button className="w-full sm:w-auto justify-center bg-[#1e5d48] text-white px-8 py-4 rounded-2xl font-bold text-[15px] flex items-center gap-2 shadow-lg shadow-emerald-900/10">
                🗺 Маршрут оновчлох
              </button>
            </div>
          </div>

          {/* 🛠️ ЗАСВАР: Жагсаалт ба Газрын зураг утас дээр дээр доороо орно (grid-cols-1 lg:grid-cols-2) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto">
            
            {/* List */}
            <div className="bg-white rounded-[40px] p-6 sm:p-8 shadow-sm border border-[#e2e8f0] flex flex-col h-[450px] lg:h-[500px]">
              <h3 className="font-black uppercase text-[12px] tracking-[0.15em] text-[#64748b] mb-6">Өнөөдрийн жагсаалт</h3>
              <div className="space-y-1 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {patients.map((p) => (
                  <div 
                    key={p.id} 
                    onClick={() => setSelectedPatient(p)}
                    className={`flex justify-between items-center p-4 rounded-3xl cursor-pointer transition-all ${selectedPatient?.id === p.id ? 'bg-[#f0f9f6] ring-1 ring-[#1e5d48]/10' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex gap-4 items-start">
                      <span className="text-[12px] font-bold text-[#cbd5e1] w-4 mt-0.5">{p.id}</span>
                      <div>
                        <p className="font-bold text-[14px] text-[#1e293b] flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${p.status === 'urgent' ? 'bg-[#ef4444]' : 'bg-[#14b8a6]'}`}></span>
                          {p.name}
                        </p>
                        <p className="text-[11px] text-[#94a3b8] mt-1 break-all">{p.address} · {p.distance}</p>
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-[#94a3b8] shrink-0 ml-2">{p.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-white rounded-[40px] p-6 sm:p-8 shadow-sm border border-[#e2e8f0] flex flex-col h-[350px] lg:h-[500px] overflow-hidden">
               <div className="flex gap-6 text-[11px] font-black uppercase tracking-widest text-[#94a3b8] mb-6">
                  <span>Зам <span className="text-[#1e293b]">18.4 км</span></span>
                  <span>Цаг <span className="text-[#1e293b]">~3h 20m</span></span>
               </div>
               <div className="flex-1 bg-[#f8fafc] rounded-[32px] relative border border-[#f1f5f9] overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                  <svg className="absolute inset-0 w-full h-full p-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M 20 40 Q 40 50 45 60" fill="none" stroke="#1e5d48" strokeWidth="0.5" strokeDasharray="3 2" />
                    {patients.map((p) => (
                      <circle key={p.id} cx={p.coords.x} cy={p.coords.y} r={selectedPatient?.id === p.id ? "4" : "3"} fill={p.status === 'urgent' ? '#ef4444' : selectedPatient?.id === p.id ? '#1e5d48' : '#cbd5e1'} />
                    ))}
                  </svg>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column (Баруун тал) */}
        <div className="w-full lg:col-span-4 space-y-6">
          {/* Яаралтай карт */}
          <div className="bg-[#fff1f2] p-6 sm:p-8 rounded-[40px] border border-[#ffe4e6] shadow-sm w-full">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 bg-[#ef4444] rounded-full animate-pulse"></span>
              <span className="text-[11px] font-black text-[#ef4444] uppercase tracking-[0.2em]">• Яаралтай</span>
            </div>
            <h3 className="text-[24px] sm:text-[28px] font-black text-[#1e293b] leading-tight">Д. Мөнхбат, 67</h3>
            <p className="text-[13px] text-[#64748b] mt-3 font-medium leading-relaxed">Цусны даралт 165/100 · толгой эргэх. Triage score 8/10.</p>
            <div className="flex flex-wrap gap-3 mt-6">
              <button className="bg-[#be123c] text-white px-5 py-3 rounded-xl font-bold text-xs shadow-md shadow-rose-900/5 hover:bg-[#9f1239] transition-all flex-1 text-center">
                Эхэнд оруулах
              </button>
              <button className="bg-white border border-slate-200 text-[#1e293b] px-5 py-3 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all shadow-sm flex-1 text-center">
                Утсаар холбогдох
              </button>
            </div>
          </div>

          {/* Patient Details */}
          <div className="bg-white p-6 sm:p-8 rounded-[40px] shadow-sm border border-[#e2e8f0] flex flex-col h-auto lg:min-h-[536px] w-full">
            {selectedPatient ? (
              <>
                <div className="flex items-center gap-4 sm:gap-5 mb-8">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#1e5d48] rounded-[24px] flex items-center justify-center text-white text-xl font-black shadow-lg shrink-0">
                    {selectedPatient.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-xl sm:text-2xl text-[#1e293b] truncate">{selectedPatient.name}</h3>
                    <p className="text-[11px] sm:text-[12px] text-[#94a3b8] font-bold mt-1 uppercase tracking-wider break-words">{selectedPatient.age} нас · {selectedPatient.address}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-[#f8fafc] p-4 sm:p-6 rounded-[32px] border border-[#f1f5f9]">
                    <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-2">Triage</p>
                    <p className="text-2xl sm:text-3xl font-black text-[#14b8a6]">{selectedPatient.triageScore}<span className="text-lg text-[#cbd5e1] font-bold ml-1">/10</span></p>
                  </div>
                  <div className="bg-[#f8fafc] p-4 sm:p-6 rounded-[32px] border border-[#f1f5f9]">
                    <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-2">Очих цаг</p>
                    <p className="text-2xl sm:text-3xl font-black text-[#1e293b]">{selectedPatient.time}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8 flex-1">
                  <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest px-2">Урьдчилсан асуумж</p>
                  <div className="bg-[#f8fafc] p-5 sm:p-6 rounded-[32px] text-[14px] text-[#475569] font-bold border border-[#f1f5f9] leading-relaxed">
                    {selectedPatient.preliminaryNote}
                  </div>
                </div>

                <button 
                  onClick={() => setIsConsulting(true)}
                  className="w-full bg-[#1e5d48] text-white py-4 sm:py-5 rounded-[24px] font-bold text-lg hover:bg-[#164a39] transition-all mt-auto"
                >
                  Үзлэг эхлүүлэх
                </button>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-300 py-12">Өвчтөн сонгоно уу</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}