import React, { useState } from "react";
import { LogOut, Key, ShieldAlert, FileText, UserCheck, AlertTriangle } from "lucide-react";
import { Ujian, Soal } from "../types";
import CbtExamEngine from "./CbtExamEngine";

interface StudentPortalProps {
  user: { name: string; nisn?: string; kelas?: string; token: string };
  onLogout: () => void;
}

export default function StudentPortal({ user, onLogout }: StudentPortalProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeExamData, setActiveExamData] = useState<{
    exam: Ujian;
    questions: Soal[];
    alreadyStarted: boolean;
    savedAnswers: Record<string, string>;
    savedRagu: Record<string, boolean>;
    mulaiAt: string;
    pelanggaranCount: number;
  } | null>(null);

  const handleValidateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setError("Token ujian wajib diisi!");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ujian/validate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenInput.trim(), nisn: user.nisn })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setActiveExamData({
          exam: data.exam,
          questions: data.questions,
          alreadyStarted: data.alreadyStarted,
          savedAnswers: data.savedAnswers || {},
          savedRagu: data.savedRagu || {},
          mulaiAt: data.mulaiAt || new Date().toISOString(),
          pelanggaranCount: data.pelanggaranCount || 0
        });
      } else {
        setError(data.error || "Gagal memverifikasi token ujian.");
      }
    } catch (err) {
      setError("Koneksi gagal. Pastikan server CBT menyala.");
    } finally {
      setLoading(false);
    }
  };

  const handleExamFinish = () => {
    setActiveExamData(null);
    setTokenInput("");
    setError("Ujian Anda telah berhasil disimpan dan dikirim!");
  };

  // If the exam is active, load the CBT engine full screen!
  if (activeExamData) {
    return (
      <CbtExamEngine
        nisn={user.nisn || ""}
        studentName={user.name}
        studentClass={user.kelas || ""}
        exam={activeExamData.exam}
        questions={activeExamData.questions}
        initialAnswers={activeExamData.savedAnswers}
        initialRagu={activeExamData.savedRagu}
        mulaiAt={activeExamData.mulaiAt}
        initialPelanggaran={activeExamData.pelanggaranCount}
        onFinish={handleExamFinish}
        onForceExit={() => setActiveExamData(null)}
      />
    );
  }

  return (
    <div id="student-portal-root" className="min-h-screen bg-transparent flex flex-col font-sans text-slate-50 relative pb-12">
      {/* Mini navbar */}
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10 h-20 px-6 flex items-center justify-between sticky top-0 z-40 text-slate-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-bold text-xl font-display shadow-lg shadow-indigo-500/20">
            C
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-slate-100">Ujian Berbasis Komputer</h2>
            <p className="text-[10px] text-slate-400 font-medium">Sistem Evaluasi Terpadu • SMAN 1 Jakarta</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-4 py-2 border border-white/10 bg-white/5 text-slate-300 hover:text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/10 rounded-xl text-xs font-semibold transition-all cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          Keluar Sesi
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 grid md:grid-cols-5 gap-6 z-10">
        
        {/* Student Profile Card */}
        <section className="md:col-span-2 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            {/* Visual accent */}
            <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/5 rounded-full translate-x-8 -translate-y-8"></div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/25">
                <UserCheck className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-200">Informasi Siswa</h3>
                <p className="text-xs text-slate-400">Peserta Ujian Resmi</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-white/10 pt-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nama Lengkap</span>
                <p className="text-sm font-semibold text-slate-100">{user.name}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">NISN Siswa</span>
                <p className="text-sm font-mono font-semibold text-slate-100">{user.nisn}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Kelas / Jurusan</span>
                <p className="text-sm font-semibold text-slate-100">{user.kelas}</p>
              </div>
            </div>
          </div>

          {/* Secure Protocols */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              Peraturan Penting Ujian
            </h4>
            <ul className="space-y-3 text-xs text-slate-300 leading-relaxed font-normal">
              <li className="flex gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5 animate-pulse"></span>
                <span>Dilarang berpindah tab browser, meminimalkan jendela, atau membuka aplikasi lainnya selama ujian berlangsung.</span>
              </li>
              <li className="flex gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5 animate-pulse"></span>
                <span>Setiap pelanggaran tab-switching atau perpindahan fokus akan dicatat oleh sistem keamanan (Anti-Cheat). Terlalu banyak pelanggaran dapat membatalkan ujian Anda secara otomatis.</span>
              </li>
              <li className="flex gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5 animate-pulse"></span>
                <span>Ujian akan terkirim otomatis secara otomatis jika waktu hitung mundur habis.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Token Gate Card */}
        <section className="md:col-span-3">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-200">Masuk Sesi Ujian</h3>
                  <p className="text-xs text-slate-400">Verifikasi kode token sebelum memulai soal</p>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-500/10 border-l-4 border-rose-500 rounded-r-xl text-rose-300 text-xs flex gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <div>{error}</div>
                </div>
              )}

              <form onSubmit={handleValidateToken} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Token Ujian *</label>
                  <input
                    id="student-token-input"
                    type="text"
                    required
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Masukkan Token dari Pengawas (Contoh: CBT2026)"
                    className="block w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold tracking-wider text-white outline-none placeholder:text-slate-500 transition-all"
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5 font-medium leading-relaxed">Hubungi pengawas ruang atau guru mata pelajaran apabila Anda tidak mengetahui Token.</p>
                </div>

                <button
                  id="start-exam-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all text-sm disabled:bg-white/10 disabled:text-slate-500 disabled:shadow-none cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses Validasi...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Mulai Mengerjakan Ujian
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="border-t border-white/10 pt-6 mt-8">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
                <span>Koneksi Server Stabil - Sinkronisasi Real-Time Aktif</span>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
