import React, { useState } from "react";
import { BookOpen, User, Lock, Key, Eye, EyeOff, GraduationCap } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (user: { role: string; name: string; nisn?: string; kelas?: string; token: string }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [activeTab, setActiveTab] = useState<"siswa" | "admin">("siswa");
  
  // Student form
  const [nisn, setNisn] = useState("");
  const [studentPass, setStudentPass] = useState("");

  // Admin form
  const [username, setUsername] = useState("");
  const [adminPass, setAdminPass] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = activeTab === "admin"
      ? { role: "admin", username, password: adminPass }
      : { role: "siswa", nisn, password: studentPass };

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok && data.success) {
        onLoginSuccess({
          role: activeTab,
          name: data.user.name,
          nisn: data.user.nisn,
          kelas: data.user.kelas,
          token: data.token
        });
      } else {
        setError(data.message || "Gagal melakukan autentikasi");
      }
    } catch (err) {
      setError("Gagal terhubung dengan server CBT. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen flex items-center justify-center bg-transparent px-4 py-12 relative overflow-hidden text-slate-50">
      {/* Visual Ambient Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-80 pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/30 mb-4 transform hover:scale-105 transition-transform">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-50 tracking-tight">CBT UJIAN SDN SUMBEREJO 04</h1>
          <p className="text-sm font-sans text-slate-400 mt-1.5">Computer Based Test - Portal Evaluasi Akademik Sekolah</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          {/* Tab Selection */}
          <div className="flex border-b border-white/10">
            <button
              id="tab-siswa-btn"
              type="button"
              onClick={() => {
                setActiveTab("siswa");
                setError(null);
              }}
              className={`flex-1 py-4 text-center text-sm font-semibold transition-all ${
                activeTab === "siswa"
                  ? "text-white bg-white/5 border-b-2 border-indigo-500"
                  : "text-slate-400 bg-transparent hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <User className="h-4 w-4" />
                Portal Siswa
              </span>
            </button>
            <button
              id="tab-admin-btn"
              type="button"
              onClick={() => {
                setActiveTab("admin");
                setError(null);
              }}
              className={`flex-1 py-4 text-center text-sm font-semibold transition-all ${
                activeTab === "admin"
                  ? "text-white bg-white/5 border-b-2 border-indigo-500"
                  : "text-slate-400 bg-transparent hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Lock className="h-4 w-4" />
                Portal Guru / Admin
              </span>
            </button>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-rose-500/10 border-l-4 border-rose-500 rounded-r-xl text-rose-300 text-xs flex items-start gap-2 animate-fade-in">
                <span className="font-semibold block shrink-0 mt-[1px]">Peringatan:</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {activeTab === "siswa" ? (
                <>
                  {/* NISN Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">NISN (Nomor Induk Siswa Nasional)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <input
                        id="login-nisn"
                        type="text"
                        required
                        value={nisn}
                        onChange={(e) => setNisn(e.target.value)}
                        placeholder="Contoh: 12345678"
                        className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm placeholder:text-slate-500 text-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Student Password */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Kata Sandi / PIN</label>
                      <span className="text-[10px] text-slate-400 font-medium">(Default: 123)</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Key className="h-4 w-4" />
                      </div>
                      <input
                        id="login-student-pass"
                        type={showPass ? "text" : "password"}
                        required
                        value={studentPass}
                        placeholder="Masukkan Kata Sandi"
                        onChange={(e) => setStudentPass(e.target.value)}
                        className="block w-full pl-10 pr-10 py-3 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm placeholder:text-slate-500 text-white outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Admin Username */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Username Admin / Guru</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        id="login-username"
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Contoh: admin"
                        className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm placeholder:text-slate-500 text-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Admin Password */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Password Admin</label>
                      <span className="text-[10px] text-slate-400 font-medium">(Default: admin123)</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        id="login-admin-pass"
                        type={showPass ? "text" : "password"}
                        required
                        value={adminPass}
                        onChange={(e) => setAdminPass(e.target.value)}
                        placeholder="Masukkan Kata Sandi Admin"
                        className="block w-full pl-10 pr-10 py-3 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm placeholder:text-slate-500 text-white outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all text-sm disabled:bg-white/10 disabled:text-slate-500 disabled:shadow-none cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mengecek Kredensial...
                  </>
                ) : (
                  "Masuk Sistem CBT"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer info/credits */}
        <div className="text-center mt-8 text-xs text-slate-500 font-medium tracking-wide">
          Dibuat secara aman untuk Ujian Akhir Sekolah &copy; 2026
        </div>
      </div>
    </div>
  );
}
