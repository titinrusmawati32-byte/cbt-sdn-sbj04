import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import AdminPortal from "./components/AdminPortal";
import StudentPortal from "./components/StudentPortal";

interface UserSession {
  role: string;
  name: string;
  nisn?: string;
  kelas?: string;
  token: string;
}

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [init, setInit] = useState(false);

  // Load session from localStorage on startup
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cbt_session");
      if (stored) {
        setSession(JSON.parse(stored));
      }
    } catch (err) {
      console.warn("Could not read session from storage:", err);
    } finally {
      setInit(true);
    }
  }, []);

  const handleLoginSuccess = (user: UserSession) => {
    setSession(user);
    try {
      localStorage.setItem("cbt_session", JSON.stringify(user));
    } catch (e) {
      console.warn("Storage write blocked");
    }
  };

  const handleLogout = () => {
    setSession(null);
    try {
      localStorage.removeItem("cbt_session");
    } catch (e) {
      console.warn("Storage remove blocked");
    }
  };

  if (!init) {
    return (
      <div id="cbt-loader" className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm mx-auto">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full shadow-lg shadow-indigo-500/20"></div>
          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">Memuat Aplikasi CBT...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Admin routing
  if (session.role === "admin") {
    return <AdminPortal onLogout={handleLogout} />;
  }

  // Student routing
  return <StudentPortal user={session} onLogout={handleLogout} />;
}
