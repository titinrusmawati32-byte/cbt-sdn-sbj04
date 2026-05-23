import React, { useState, useEffect, useRef } from "react";
import { Clock, AlertTriangle, ChevronLeft, ChevronRight, CheckSquare, HelpCircle, ShieldAlert, CheckCircle } from "lucide-react";
import { Ujian, Soal } from "../types";

interface CbtExamEngineProps {
  nisn: string;
  studentName: string;
  studentClass: string;
  exam: Ujian;
  questions: Soal[];
  initialAnswers: Record<string, string>;
  initialRagu: Record<string, boolean>;
  mulaiAt: string;
  initialPelanggaran: number;
  onFinish: () => void;
  onForceExit: () => void;
}

export default function CbtExamEngine({
  nisn,
  studentName,
  studentClass,
  exam,
  questions,
  initialAnswers,
  initialRagu,
  mulaiAt,
  initialPelanggaran,
  onFinish,
  onForceExit
}: CbtExamEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [raguRagu, setRaguRagu] = useState<Record<string, boolean>>(initialRagu);
  const [pelanggaran, setPelanggaran] = useState(initialPelanggaran);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Calculate Target time based on starting ISO date + duration in minutes
  const targetEndTime = new Date(mulaiAt).getTime() + exam.durasi * 60 * 1000;
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = Math.max(0, Math.floor((targetEndTime - Date.now()) / 1000));
    return diff;
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state with server periodically as back-up
  const saveStateToServer = async (isFinished: boolean = false) => {
    try {
      await fetch("/api/ujian/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: exam.id,
          nisn,
          answers,
          raguRagu,
          selesai: isFinished,
          pelanggaranCount: pelanggaran,
          mulaiAt
        })
      });
    } catch (err) {
      console.warn("Failed to sync state to server:", err);
    }
  };

  // Timer Effect
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((targetEndTime - Date.now()) / 1000));
      setTimeLeft(remaining);

      // Auto submit when time runs out!
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        handleAutoSubmit();
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Save intermediate state to server every 20 seconds
  useEffect(() => {
    const backupInterval = setInterval(() => {
      saveStateToServer(false);
    }, 20000);
    return () => clearInterval(backupInterval);
  }, [answers, raguRagu, pelanggaran]);

  // Anti-Cheat: Event listener to catch tab-switching / screen minimization
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerCheatViolation();
      }
    };

    const handleWindowBlur = () => {
      triggerCheatViolation();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [pelanggaran, answers, raguRagu]);

  const triggerCheatViolation = () => {
    const newCount = pelanggaran + 1;
    setPelanggaran(newCount);
    setShowWarningModal(true);

    // Auto-save violation details to server
    fetch("/api/ujian/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        examId: exam.id,
        nisn,
        answers,
        raguRagu,
        selesai: false,
        pelanggaranCount: newCount,
        mulaiAt
      })
    });

    // If violations exceed 3, auto-submit the exam immediately!
    if (newCount >= 4) {
      handleAutoSubmit(true);
    }
  };

  const handleAutoSubmit = async (cheated: boolean = false) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/ujian/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: exam.id,
          nisn,
          answers,
          raguRagu,
          selesai: true,
          pelanggaranCount: cheated ? pelanggaran + 1 : pelanggaran,
          mulaiAt
        })
      });

      if (response.ok) {
        if (timerRef.current) clearInterval(timerRef.current);
        onFinish();
      }
    } catch (err) {
      alert("Koneksi gagal. Silakan segera hubungi pengawas!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/ujian/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: exam.id,
          nisn,
          answers,
          raguRagu,
          selesai: true,
          pelanggaranCount: pelanggaran,
          mulaiAt
        })
      });

      if (response.ok) {
        setShowConfirmSubmit(false);
        if (timerRef.current) clearInterval(timerRef.current);
        onFinish();
      }
    } catch (err) {
      alert("Koneksi gagal. Silakan coba klik Kirim lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    const doubleDigit = (n: number) => String(n).padStart(2, "0");
    return `${h > 0 ? doubleDigit(h) + ":" : ""}${doubleDigit(m)}:${doubleDigit(s)}`;
  };

  const qActive: Soal = questions[currentIndex];

  if (!qActive) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Menunggu Soal...</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">Mohon maaf, belum ada pertanyaan yang ditambahkan ke ujian ini. Hubungi Admin atau Guru Anda.</p>
        <button onClick={onForceExit} className="mt-5 px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-slate-700 text-xs font-semibold cursor-pointer">
          Kembali
        </button>
      </div>
    );
  }

  // Answer status for grid helper
  const getQuestionStatus = (index: number) => {
    const qId = questions[index].id;
    const answered = answers[qId] !== undefined && answers[qId] !== "";
    const doubtful = raguRagu[qId] === true;

    if (doubtful) return "kuning"; // doubtful takes precedence
    if (answered) return "hijau";
    return "putih";
  };

  const currentAnswer = answers[qActive.id] || "";

  return (
    <div id="cbt-exam-engine-root" className="min-h-screen bg-transparent flex flex-col font-sans select-none text-slate-50 relative pb-16" onContextMenu={(e) => e.preventDefault()}>
      {/* Header bar with subject and countdown timer */}
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10 h-20 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 text-slate-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20 text-white shrink-0">
            C
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-50 leading-tight">{exam.mapel}</h1>
            <p className="text-[10px] text-slate-400 font-medium">
              Siswa: {studentName} ({studentClass}) • NISN: {nisn}
            </p>
          </div>
        </div>

        {/* Real-time elegant Countdown Timer */}
        <div className="flex items-center gap-6">
          <div className={`border px-4 py-2 rounded-full flex items-center gap-3 ${
            timeLeft < 180 
              ? "bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse" 
              : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
          }`}>
            <span className="text-xs uppercase font-bold tracking-widest text-slate-400">Sisa Waktu</span>
            <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start relative z-10">
        
        {/* Left Side: Active Question Panel */}
        <section className="lg:col-span-3 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl min-h-[420px] flex flex-col justify-between">
            <div>
              {/* Question Index details & doubtful switcher */}
              <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-8">
                <span className="bg-indigo-500 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white">
                  Soal Nomor {currentIndex + 1}
                </span>

                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400 font-normal">Pilihan Ganda • Bobot: 1 Poin</span>
                </div>
              </div>

              {/* Text content */}
              <div className="text-slate-100 leading-relaxed font-sans text-base md:text-lg mb-8 space-y-6">
                <p className="whitespace-pre-line font-normal text-slate-100 leading-relaxed">{qActive.teks}</p>
                
                {/* Image if provided */}
                {qActive.gambarUrl && (
                  <div className="max-w-md bg-white/5 border border-white/10 p-2 rounded-2xl overflow-hidden mt-4">
                    <img
                      src={qActive.gambarUrl}
                      alt="Pendukung Soal"
                      referrerPolicy="no-referrer"
                      className="max-h-64 object-contain rounded-xl"
                    />
                  </div>
                )}
              </div>

              {/* Multiple Choice Options (A, B, C, D, E) */}
              <div className="grid grid-cols-1 gap-3.5 mb-10">
                {(Object.keys(qActive.opsi) as Array<"A" | "B" | "C" | "D" | "E">).map((key) => {
                  const label = qActive.opsi[key];
                  const isSelected = currentAnswer === key;
                  
                  return (
                    <button
                      id={`option-${key}-btn`}
                      key={key}
                      onClick={() => {
                        setAnswers({
                          ...answers,
                          [qActive.id]: key
                        });
                      }}
                      className={`group w-full flex items-center p-4 rounded-2xl transition-all text-left outline-none cursor-pointer ${
                        isSelected 
                          ? "bg-indigo-500/30 border border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10" 
                          : "bg-white/5 border border-white/10 hover:bg-indigo-500/20 hover:border-indigo-500/50"
                      }`}
                    >
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold mr-4 shrink-0 transition-all ${
                        isSelected
                          ? "bg-indigo-500 text-white"
                          : "bg-white/10 text-slate-200 group-hover:bg-indigo-500"
                      }`}>
                        {key}
                      </span>
                      <span className="text-sm font-medium text-slate-100 leading-normal">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pagination & doubt flags */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-white/10 mt-6">
              <button
                id="prev-question-btn"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(currentIndex - 1)}
                className="w-full sm:w-auto px-6 py-3 bg-white/10 border border-white/10 text-slate-100 hover:bg-white/20 text-xs font-semibold rounded-2xl transition-all disabled:opacity-30 disabled:hover:bg-white/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                Sebelumnya
              </button>

              <button
                id="flag-ragu-btn"
                onClick={() => {
                  setRaguRagu({
                    ...raguRagu,
                    [qActive.id]: !raguRagu[qActive.id]
                  });
                }}
                className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-semibold border text-xs gap-2 flex items-center justify-center cursor-pointer select-none transition-all ${
                  !!raguRagu[qActive.id]
                    ? "bg-amber-500/30 border-amber-500/50 text-amber-400"
                    : "bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25"
                }`}
              >
                <HelpCircle className="h-4 w-4" />
                Ragu-Ragu
              </button>

              {currentIndex === questions.length - 1 ? (
                <button
                  id="final-kumpul-btn"
                  onClick={() => setShowConfirmSubmit(true)}
                  className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Selesaikan Ujian
                  <CheckSquare className="h-4 w-4" />
                </button>
              ) : (
                <button
                  id="next-question-btn"
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="w-full sm:w-auto px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Selanjutnya
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Right Side: Number Grid Navigation */}
        <section className="space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col h-full shadow-2xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center justify-between border-b border-white/10 pb-3">
              Navigasi Soal
              <span className="text-[10px] normal-case font-normal text-slate-400">
                Terjawab: {Object.values(answers).filter(v => v !== "").length} / {questions.length}
              </span>
            </h3>
            
            {/* Nav Grid */}
            <div className="grid grid-cols-5 gap-3 mb-8 overflow-y-auto pr-1 max-h-[300px] custom-scrollbar">
              {questions.map((q, idx) => {
                const status = getQuestionStatus(idx);
                const isActive = idx === currentIndex;
                
                let bgStyle = "bg-white/10 border border-white/20 text-slate-300"; // default: belum dijawab
                
                if (status === "kuning") {
                  bgStyle = "bg-amber-500 text-white shadow-lg shadow-amber-500/20";
                } else if (status === "hijau") {
                  bgStyle = "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20";
                }

                // Highlight/Active layout
                const outlineStyle = isActive 
                  ? "ring-4 ring-indigo-500/40 bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105 font-bold" 
                  : "font-semibold";

                return (
                  <button
                    id={`nav-num-${idx + 1}`}
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`aspect-square rounded-xl text-xs flex items-center justify-center outline-none transition-all cursor-pointer ${bgStyle} ${outlineStyle}`}
                  >
                    {idx < 9 ? `0${idx + 1}` : idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Status explanation */}
            <div className="bg-black/20 rounded-2xl p-4 mb-4 border border-white/5 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Terjawab</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Ragu-Ragu</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-white/20 border border-white/20"></div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Belum Dijawab</span>
              </div>
            </div>

            <button
              id="submit-test-direct-btn"
              onClick={() => setShowConfirmSubmit(true)}
              className="w-full py-4 rounded-2xl bg-emerald-600 font-bold tracking-widest uppercase text-xs shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all text-white cursor-pointer"
            >
              Selesaikan Ujian
            </button>
          </div>
        </section>
      </main>

      {/* WARNING MODAL: Anti Cheat Screen Lost Warnings */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl animate-fade-in text-slate-100">
            <div className="mx-auto h-16 w-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mb-4 border border-rose-500/20">
              <ShieldAlert className="h-8 w-8 animate-bounce" />
            </div>
            
            <h3 className="text-base font-extrabold tracking-tight font-display text-slate-100">
              DETEKSI PELANGGARAN SISTEM (ANTI-CHEAT)
            </h3>
            
            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed font-normal">
              Sistem mencatat Anda keluar dari area ujian atau mengganti tab browser. Tindakan ini dilarang keras demi kejujuran akademik.
            </p>

            <div className="my-5 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
              <span className="text-[10px] text-rose-400 uppercase font-black block tracking-wider">Pelanggaran Tercatat</span>
              <span className="font-mono text-3xl font-black text-rose-400">{pelanggaran} / 3</span>
              <p className="text-[10px] text-rose-500/70 mt-1 leading-normal">Apabila mencapai 4 pelanggaran, ujian Anda akan dikirimkan dan dihentikan secara otomatis.</p>
            </div>

            <button
              id="ack-violation-btn"
              onClick={() => setShowWarningModal(false)}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-red-600/10"
            >
              SAYA MENGERTI & LANJUT UJIAN
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMATION SUBMIT FORM */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl text-slate-100">
            <div className="mx-auto h-14 w-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/20">
              <CheckSquare className="h-7 w-7" />
            </div>

            <h3 className="text-base font-extrabold tracking-tight font-display text-slate-100">
              KUMPULKAN UJIAN SEKARANG?
            </h3>
            
            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed font-normal">
              Apakah Anda yakin ingin menyelesaikan ujian? Silakan periksa kembali seluruh jawaban Anda. Setelah dikirim, jawaban tidak dapat diubah kembali.
            </p>

            <div className="my-5 grid grid-cols-3 gap-2 p-3.5 bg-black/20 border border-white/5 rounded-2xl text-xs font-semibold">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Terjawab</span>
                <span className="text-base font-bold text-emerald-400">
                  {Object.values(answers).filter(v => v !== "").length}
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Ragu-ragu</span>
                <span className="text-base font-bold text-amber-400">
                  {Object.keys(raguRagu).filter(key => raguRagu[key] === true).length}
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Sisa Soal</span>
                <span className="text-base font-bold text-slate-300">
                  {questions.length - Object.values(answers).filter(v => v !== "").length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                id="cancel-submit-btn"
                onClick={() => setShowConfirmSubmit(false)}
                className="py-3 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer border border-white/5"
              >
                Kembali Periksa
              </button>
              <button
                id="confirm-submit-btn"
                disabled={submitting}
                onClick={handleManualSubmit}
                className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-white/10 disabled:text-slate-500"
              >
                {submitting ? "Mengirim..." : "Ya, Kumpulkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Anti-cheat status ticker in absolute corner */}
      <div className="absolute bottom-4 left-6 z-20 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-indigo-500/10 backdrop-blur-md border border-indigo-500/20 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
          <span className="text-[10px] font-semibold text-indigo-300">Anti-Cheat Active</span>
        </div>
        <span className="text-[10px] text-slate-500 font-medium">v4.2.0-secure • Server: JKT-01</span>
      </div>
    </div>
  );
}
