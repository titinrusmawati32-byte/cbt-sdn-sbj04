import React, { useState, useEffect } from "react";
import { 
  LogOut, LayoutDashboard, Database, ClipboardList, Users, FileSpreadsheet, 
  Plus, Edit2, Trash2, Check, AlertTriangle, Key, ChevronLeft, ChevronRight,
  ShieldAlert, RefreshCw, Eye, HelpCircle, Save, X, ToggleLeft, ToggleRight,
  Upload, FileText
} from "lucide-react";
import { Siswa, Soal, Ujian, HasilUjian } from "../types";
import { parseWordText, extractTextFromDocx, ParsedSoal } from "../utils/wordParser";
import { parseStudentExcel, ParsedStudent } from "../utils/excelParser";

const DAFTAR_MAPEL = [
  "Pendidikan Agama dan Budi Pekerti",
  "Pendidikan Pancasila",
  "Bahasa Indonesia",
  "Matematika",
  "Ilmu Pengetahuan Alam dan Sosial (IPAS) (Diajarkan mulai kelas 4, 5, dan 6)",
  "Bahasa Inggris (Merupakan mata pelajaran pilihan)",
  "Seni dan Budaya (Meliputi: Seni Musik, Seni Rupa, Seni Teater, dan Seni Tari)",
  "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)"
];

interface AdminPortalProps {
  onLogout: () => void;
}

export default function AdminPortal({ onLogout }: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "soal" | "ujian" | "siswa" | "laporan">("dashboard");
  
  // Data State
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [soal, setSoal] = useState<Soal[]>([]);
  const [ujian, setUjian] = useState<Ujian[]>([]);
  const [hasil, setHasil] = useState<HasilUjian[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Word Upload States
  const [showWordModal, setShowWordModal] = useState(false);
  const [wordPastedText, setWordPastedText] = useState("");
  const [wordParsedQuestions, setWordParsedQuestions] = useState<ParsedSoal[]>([]);
  const [wordFileLoading, setWordFileLoading] = useState(false);
  const [selectedMapelForWord, setSelectedMapelForWord] = useState<string>("Pendidikan Agama dan Budi Pekerti");
  const [selectedMapelFilter, setSelectedMapelFilter] = useState<string>("Semua");

  // Excel Student Upload States
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelParsedStudents, setExcelParsedStudents] = useState<ParsedStudent[]>([]);
  const [excelFileLoading, setExcelFileLoading] = useState(false);

  // Form Modals / Expandable structures
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [showSiswaForm, setShowSiswaForm] = useState(false);

  const [selectedSoal, setSelectedSoal] = useState<Soal | null>(null);
  const [showSoalForm, setShowSoalForm] = useState(false);

  const [selectedUjian, setSelectedUjian] = useState<Ujian | null>(null);
  const [showUjianForm, setShowUjianForm] = useState(false);

  // Form fields states
  const [siswaField, setSiswaField] = useState({ nisn: "", nama: "", kelas: "", password: "123" });
  const [soalField, setSoalField] = useState({
    id: "",
    teks: "",
    gambarUrl: "",
    opsi: { A: "", B: "", C: "", D: "", E: "" },
    kunci: "A" as "A" | "B" | "C" | "D" | "E",
    mapel: "Pendidikan Agama dan Budi Pekerti"
  });
  const [ujianField, setUjianField] = useState({
    id: "",
    mapel: "",
    tanggal: new Date().toISOString().split("T")[0],
    durasi: 60,
    token: "",
    aktif: true,
    soalIds: [] as string[]
  });

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [siswaRes, soalRes, ujianRes, hasilRes] = await Promise.all([
        fetch("/api/siswa"),
        fetch("/api/soal"),
        fetch("/api/ujian"),
        fetch("/api/hasil")
      ]);

      const [siswaData, soalData, ujianData, hasilData] = await Promise.all([
        siswaRes.json(),
        soalRes.json(),
        ujianRes.json(),
        hasilRes.json()
      ]);

      setSiswa(siswaData);
      setSoal(soalData);
      setUjian(ujianData);
      setHasil(hasilData);
    } catch (err) {
      triggerNotification("error", "Gagal memuat data dari server CBT.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerNotification = (type: "success" | "error", text: string) => {
    setNotif({ type, text });
    setTimeout(() => setNotif(null), 4000);
  };

  // ---------------- STUDENTS ----------------
  const handleOpenSiswaForm = (student?: Siswa) => {
    if (student) {
      setSelectedSiswa(student);
      setSiswaField({ nisn: student.nisn, nama: student.nama, kelas: student.kelas, password: student.password || "123" });
    } else {
      setSelectedSiswa(null);
      setSiswaField({ nisn: "", nama: "", kelas: "", password: "123" });
    }
    setShowSiswaForm(true);
  };

  const handleSaveSiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/siswa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(siswaField)
      });
      if (response.ok) {
        triggerNotification("success", "Siswa berhasil disimpan!");
        setShowSiswaForm(false);
        fetchData();
      } else {
        const d = await response.json();
        triggerNotification("error", d.error || "Gagal menyimpan siswa.");
      }
    } catch (err) {
      triggerNotification("error", "Eror jaringan server.");
    }
  };

  const handleDeleteSiswa = async (nisn: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data siswa ini?")) return;
    try {
      const response = await fetch(`/api/siswa/${nisn}`, { method: "DELETE" });
      if (response.ok) {
        triggerNotification("success", "Siswa berhasil dihapus!");
        fetchData();
      } else {
        triggerNotification("error", "Gagal menghapus siswa dari database server.");
      }
    } catch (err) {
      triggerNotification("error", "Koneksi server gagal.");
    }
  };

  // ---------------- EXCEL STUDENT IMPORT HANDLERS ----------------
  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFileLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const students = parseStudentExcel(arrayBuffer);
          setExcelParsedStudents(students);
          if (students.length > 0) {
            triggerNotification("success", `Sukses membaca file! Menguraikan ${students.length} peserta siswa dari file Excel.`);
          } else {
            triggerNotification("error", "Format tabel Excel tidak dikenal. Pastikan ada kolom: NISN, Nama, Kelas.");
          }
        } catch (err: any) {
          triggerNotification("error", "Gagal membaca struktur file Excel.");
        } finally {
          setExcelFileLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      triggerNotification("error", "Eror memproses file upload.");
      setExcelFileLoading(false);
    }
  };

  const handleDeleteParsedStudent = (nisn: string) => {
    setExcelParsedStudents(prev => prev.filter(s => s.nisn !== nisn));
    triggerNotification("success", "Siswa dihapus dari daftar tinjau.");
  };

  const handleSaveImportedStudents = async () => {
    if (excelParsedStudents.length === 0) {
      triggerNotification("error", "Tidak ada data siswa untuk disimpan!");
      return;
    }

    setLoading(true);
    let successCount = 0;
    try {
      for (const s of excelParsedStudents) {
        const response = await fetch("/api/siswa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(s)
        });

        if (response.ok) {
          successCount++;
        }
      }

      triggerNotification("success", `Sukses mengimpor & mendaftarkan ${successCount} siswa baru ke Database CBT!`);
      setShowExcelModal(false);
      setExcelParsedStudents([]);
      fetchData();
    } catch (err) {
      triggerNotification("error", "Terjadi kegagalan jaringan saat mengirim beberapa data siswa.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- QUESTIONS ----------------
  const handleOpenSoalForm = (question?: Soal, defaultMapel?: string) => {
    if (question) {
      setSelectedSoal(question);
      setSoalField({
        id: question.id,
        teks: question.teks,
        gambarUrl: question.gambarUrl || "",
        opsi: { ...question.opsi },
        kunci: question.kunci,
        mapel: question.mapel || defaultMapel || DAFTAR_MAPEL[0]
      });
    } else {
      setSelectedSoal(null);
      setSoalField({
        id: "",
        teks: "",
        gambarUrl: "",
        opsi: { A: "", B: "", C: "", D: "", E: "" },
        kunci: "A",
        mapel: defaultMapel 
          ? defaultMapel 
          : (selectedMapelFilter !== "Semua" && selectedMapelFilter !== "Belum Dikategorikan") 
            ? selectedMapelFilter 
            : DAFTAR_MAPEL[0]
      });
    }
    setShowSoalForm(true);
  };

  const handleSaveSoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(soalField)
      });
      if (response.ok) {
        triggerNotification("success", "Pertanyaan baru disimpan!");
        setShowSoalForm(false);
        fetchData();
      } else {
        const d = await response.json();
        triggerNotification("error", d.error || "Gagal menyimpan.");
      }
    } catch (err) {
      triggerNotification("error", "Gagal menghubungi server.");
    }
  };

  const handleDeleteSoal = async (id: string) => {
    if (!confirm("Hapus pertanyaan ini dari database & seluruh sesi ujian Terkait?")) return;
    try {
      const response = await fetch(`/api/soal/${id}`, { method: "DELETE" });
      if (response.ok) {
        triggerNotification("success", "Pertanyaan terhapus!");
        fetchData();
      }
    } catch (err) {
      triggerNotification("error", "Simulasi gagal.");
    }
  };

  // ---------------- WORD DOCUMENT UPLOADING / PARSING ----------------
  const handleParseWordText = (rawText: string) => {
    const questions = parseWordText(rawText);
    setWordParsedQuestions(questions);
    if (questions.length > 0) {
      triggerNotification("success", `Ditemukan ${questions.length} soal dalam teks! Silakan tinjau dan simpan.`);
    } else {
      triggerNotification("error", "Format tidak terdeteksi atau teks kosong. Lihat template panduan di bawah.");
    }
  };

  const handleWordFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setWordFileLoading(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (extension === "docx") {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            const extractedText = await extractTextFromDocx(arrayBuffer);
            setWordPastedText(extractedText);
            const questions = parseWordText(extractedText);
            setWordParsedQuestions(questions);
            if (questions.length > 0) {
              triggerNotification("success", `Sukses mengimpor dari ${file.name}! Terdeteksi ${questions.length} soal.`);
            } else {
              triggerNotification("error", "Sukses mengekstrak file Word, namun format pertanyaan tidak dikenali.");
            }
          } catch (err: any) {
            triggerNotification("error", err.message || "Gagal mengurai file Word (.docx).");
          } finally {
            setWordFileLoading(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (extension === "txt") {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const rawText = event.target?.result as string;
            setWordPastedText(rawText);
            const questions = parseWordText(rawText);
            setWordParsedQuestions(questions);
            if (questions.length > 0) {
              triggerNotification("success", `Sukses membaca file TXT! Terdeteksi ${questions.length} soal.`);
            } else {
              triggerNotification("error", "Format pertanyaan di file TXT tidak dikenali.");
            }
          } catch (err) {
            triggerNotification("error", "Gagal membaca teks.");
          } finally {
            setWordFileLoading(false);
          }
        };
        reader.readAsText(file);
      } else {
        triggerNotification("error", "Ekstensi file tidak didukung! Harus berupa file .docx atau .txt.");
        setWordFileLoading(false);
      }
    } catch (error) {
      triggerNotification("error", "Eror memproses file upload.");
      setWordFileLoading(false);
    }
  };

  const handleDeleteParsedQuestion = (tempId: string) => {
    setWordParsedQuestions(prev => prev.filter(q => q.tempId !== tempId));
    triggerNotification("success", "Soal terhapus dari daftar tinjau!");
  };

  const handleSaveImportedQuestions = async () => {
    if (wordParsedQuestions.length === 0) {
      triggerNotification("error", "Tidak ada soal hasil parse untuk disimpan!");
      return;
    }

    setLoading(true);
    let successCount = 0;
    try {
      for (const q of wordParsedQuestions) {
        const bodySoal = {
          id: "", // auto-generated S00X on server-side 
          teks: q.teks,
          gambarUrl: "",
          opsi: q.opsi,
          kunci: q.kunci,
          mapel: selectedMapelForWord
        };

        const response = await fetch("/api/soal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodySoal)
        });

        if (response.ok) {
          successCount++;
        }
      }

      triggerNotification("success", `Sukses menyimpan ${successCount} soal baru ke Database Bank Soal!`);
      setShowWordModal(false);
      setWordPastedText("");
      setWordParsedQuestions([]);
      fetchData();
    } catch (err) {
      triggerNotification("error", "Terjadi kegagalan jaringan saat mengirim beberapa soal.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- EXAMS ----------------
  const handleOpenUjianForm = (ex?: Ujian) => {
    if (ex) {
      setSelectedUjian(ex);
      setUjianField({
        id: ex.id,
        mapel: ex.mapel,
        tanggal: ex.tanggal,
        durasi: ex.durasi,
        token: ex.token,
        aktif: ex.aktif,
        soalIds: ex.soalIds || []
      });
    } else {
      setSelectedUjian(null);
      // Generate a random 6-character token
      const randomToken = "CBT" + Math.floor(100 + Math.random() * 900);
      setUjianField({
        id: "",
        mapel: "",
        tanggal: new Date().toISOString().split("T")[0],
        durasi: 60,
        token: randomToken,
        aktif: true,
        soalIds: []
      });
    }
    setShowUjianForm(true);
  };

  const handleSaveUjian = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/ujian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ujianField)
      });
      if (response.ok) {
        triggerNotification("success", "Sesi ujian disimpan secara aman!");
        setShowUjianForm(false);
        fetchData();
      }
    } catch (err) {
      triggerNotification("error", "Gagal menyimpan sesi.");
    }
  };

  const handleDeleteUjian = async (id: string) => {
    if (!confirm("Hapus sesi ujian ini beserta seluruh riwayat hasil di dalamnya?")) return;
    try {
      await fetch(`/api/ujian/${id}`, { method: "DELETE" });
      triggerNotification("success", "Sesi Ujian terhapus.");
      fetchData();
    } catch (err) {
      triggerNotification("error", "Gagal menghapus.");
    }
  };

  const handleToggleExamStatus = async (ex: Ujian) => {
    const updated = { ...ex, aktif: !ex.aktif };
    try {
      const response = await fetch("/api/ujian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (response.ok) {
        triggerNotification("success", `Status ujian diubah jadi ${updated.aktif ? "AKTIF" : "NONAKTIF"}!`);
        fetchData();
      }
    } catch (err) {
      triggerNotification("error", "Gagal merubah status.");
    }
  };

  const handleDeleteHasil = async (id: string) => {
    if (!confirm("Reset pengerjaan ini? Siswa bersangkutan dapat mengulang ujian kembali.")) return;
    try {
      await fetch(`/api/hasil/${id}`, { method: "DELETE" });
      triggerNotification("success", "Pengerjaan ujian siswa di-reset!");
      fetchData();
    } catch (err) {
      triggerNotification("error", "Gagal melakukan reset.");
    }
  };

  // Toggle question selection in exam scheduled
  const handleToggleQuestionInExam = (id: string) => {
    const currentList = [...ujianField.soalIds];
    if (currentList.includes(id)) {
      setUjianField({
        ...ujianField,
        soalIds: currentList.filter(sId => sId !== id)
      });
    } else {
      setUjianField({
        ...ujianField,
        soalIds: [...currentList, id]
      });
    }
  };

  // CLIENT SIDE CSV EXPORTER FOR GRADES EXCEL LOADS
  const handleExportCSV = () => {
    if (hasil.length === 0) {
      triggerNotification("error", "Belum ada nilai hasil ujian untuk diekspor!");
      return;
    }

    // Construct headers and rows
    const headers = ["ID", "Ujian", "NISN", "Nama Siswa", "Kelas", "Benar", "Salah", "Nilai Akhir", "Selesai", "Pelanggaran Switched Tab"];
    const rows = hasil.map(h => [
      h.id,
      `"${h.mapel.replace(/"/g, '""')}"`,
      h.nisn,
      `"${h.siswaNama.replace(/"/g, '""')}"`,
      h.siswaKelas,
      h.benar,
      h.salah,
      h.nilai,
      h.selesai ? "SELESAI" : "BELUM KIRIM",
      h.pelanggaranCount
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    // File download mechanism
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Nilai_CBT_${new Date().toLocaleDateString("id-ID")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification("success", "Laporan CSV sukses terunduh!");
  };

  const stats = {
    totalSiswa: siswa.length,
    totalSoal: soal.length,
    totalUjian: ujian.length,
    selesaiUjian: hasil.filter(h => h.selesai).length,
    belumSubmit: hasil.filter(h => !h.selesai).length
  };

  return (
    <div id="admin-portal-root" className="min-h-screen bg-transparent flex flex-col md:flex-row font-sans text-slate-100 relative">
      
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 text-slate-150 flex flex-col justify-between shrink-0 z-20">
        <div>
          {/* Brand */}
          <div className="p-6 border-b border-white/10 flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold font-display shadow-lg shadow-indigo-500/20">
              CT
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight font-display text-slate-100">CBT PORTAL</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider">PANEL GURU • v2.0</p>
            </div>
          </div>

          {/* Nav list */}
          <nav className="p-4 space-y-1.5 font-medium text-xs">
            {/* Dashboard tab */}
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-left ${
                activeTab === "dashboard"
                  ? "bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <LayoutDashboard className="h-4.5 w-4.5 text-indigo-400" />
              Dasbor Ringkasan
            </button>

            {/* Bank Soal tab */}
            <button
              id="admin-soal-tab"
              onClick={() => setActiveTab("soal")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-left ${
                activeTab === "soal"
                  ? "bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <Database className="h-4.5 w-4.5 text-indigo-400" />
              Manajemen Bank Soal
            </button>

            {/* Sesi Ujian tab */}
            <button
              id="admin-ujian-tab"
              onClick={() => setActiveTab("ujian")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-left ${
                activeTab === "ujian"
                  ? "bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <ClipboardList className="h-4.5 w-4.5 text-indigo-400" />
              Jadwal Sesi Ujian
            </button>

            {/* Data Siswa tab */}
            <button
              id="admin-siswa-tab"
              onClick={() => setActiveTab("siswa")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-left ${
                activeTab === "siswa"
                  ? "bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <Users className="h-4.5 w-4.5 text-indigo-400" />
              Data Manajemen Siswa
            </button>

            {/* Laporan & Penilaian tab */}
            <button
              id="admin-laporan-tab"
              onClick={() => setActiveTab("laporan")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-left ${
                activeTab === "laporan"
                  ? "bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <FileSpreadsheet className="h-4.5 w-4.5 text-indigo-400" />
              Laporan & Penilaian
            </button>
          </nav>
        </div>

        {/* Logout widget */}
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 p-3 rounded-xl border border-white/10 mb-3 text-center">
            <span className="text-[10px] text-indigo-400 uppercase block tracking-wider font-extrabold">Akun Aktif</span>
            <span className="text-xs font-bold text-slate-200">Pengawas / Guru Utama</span>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Keluar Dashboard
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-x-hidden min-h-screen relative z-10">
        
        {/* Header toolbar */}
        <header className="bg-white/5 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-30 text-slate-50">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-100 font-display capitalize">
              {activeTab === "soal" ? "Manajemen Bank Soal Ujian" : activeTab === "ujian" ? "Jadwal & Sesi Ujian" : activeTab === "siswa" ? "Database Peserta Ujian" : activeTab === "laporan" ? "Hasil Analisis & Rekap Nilai" : "Dasbor Dashboard Utama"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 border border-white/10 text-slate-400 hover:text-slate-100 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
              title="Refresh Sync Data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <div className="text-xs text-slate-400 font-medium">Server Date: <span className="font-mono text-slate-300">2026-05-23</span></div>
          </div>
        </header>

        {/* Work Panel Area */}
        <div className="p-6 md:p-8 flex-1 space-y-6">
          
          {/* Notification Toast bar */}
          {notif && (
            <div className={`p-4 rounded-xl border flex items-center gap-2.5 transition-all animate-fade-in ${
              notif.type === "success" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/20 text-rose-300"
            }`}>
              <Check className="h-4.5 w-4.5 shrink-0" />
              <span className="text-xs font-semibold">{notif.text}</span>
            </div>
          )}

          {/* 1. DASHBOARD PANEL */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Stats card Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                
                {/* Total Siswa */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl relative overflow-hidden">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">Total Peserta Siswa</span>
                  <span className="text-3xl font-extrabold font-display text-slate-100 mt-2 block">{stats.totalSiswa}</span>
                  <span className="text-[10px] text-slate-400 font-medium mt-1.5 block">Siswa Terdaftar CBT</span>
                </div>

                {/* Total Bank Soal */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl relative overflow-hidden">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">Pertanyaan Bank Soal</span>
                  <span className="text-3xl font-extrabold font-display text-slate-100 mt-2 block">{stats.totalSoal}</span>
                  <span className="text-[10px] text-slate-400 font-medium mt-1.5 block">Soal Aktif di Database</span>
                </div>

                {/* Sesi Ujian */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl relative overflow-hidden">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">Total Sesi Ujian</span>
                  <span className="text-3xl font-extrabold font-display text-slate-100 mt-2 block">{stats.totalUjian}</span>
                  <span className="text-[10px] text-slate-400 font-medium mt-1.5 block">Ujian Terjadwal</span>
                </div>

                {/* Selesai Pengerjaan */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl relative overflow-hidden bg-emerald-500/5">
                  <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold block">Hasil Submit Siswa</span>
                  <span className="text-3xl font-extrabold font-display text-emerald-300 mt-2 block">{stats.selesaiUjian}</span>
                  <span className="text-[10px] text-emerald-400 font-medium mt-1.5 block">Selesai Dinilai</span>
                </div>
              </div>

              {/* Informative Guidance */}
              <div className="p-6 bg-white/5 backdrop-blur-xl text-slate-100 rounded-3xl relative overflow-hidden border border-white/10 shadow-lg">
                <div className="absolute right-0 bottom-0 h-48 w-48 bg-indigo-500/10 rounded-full translate-x-12 translate-y-12 blur-2xl"></div>
                <h3 className="text-base font-extrabold font-display">Selamat Datang di Pengaturan CBT</h3>
                <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
                  Gunakan menu sidebar di sebelah kiri untuk mengonfigurasi dan memantau ujian secara real-time. Anda dapat mengisi bank soal materi ujian, mendaftarkan siswa baru berdasarkan nomor NISN unik mereka, membuat jadwal tes berdurasi, dan memantau pergerakan kecurangan siswa selama pengerjaan berlangsung.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button onClick={() => setActiveTab("soal")} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/20">
                    Kelola Materi Soal
                  </button>
                  <button onClick={() => setActiveTab("ujian")} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold rounded-xl transition-all cursor-pointer">
                    Atur Sesi Ujian
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. BANK SOAL PANEL */}
          {activeTab === "soal" && (() => {
            const uncategorizedCount = soal.filter(s => !s.mapel).length;
            const displayedSoal = soal.filter(s => {
              if (selectedMapelFilter === "Semua") return true;
              if (selectedMapelFilter === "Belum Dikategorikan") return !s.mapel;
              return s.mapel === selectedMapelFilter;
            });

            return (
              <>
                <div className="space-y-6 animate-fade-in">
                {/* Upper summary bar */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl gap-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-100 font-display">Dashboard Bank Soal CBT</h4>
                    <p className="text-xs text-slate-400 font-medium font-mono mt-0.5">Total Pertanyaan: {soal.length} | Saringan Aktif: {selectedMapelFilter}</p>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {uncategorizedCount > 0 && (
                      <button
                        onClick={() => setSelectedMapelFilter("Belum Dikategorikan")}
                        className={`px-3 py-1.5 border rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          selectedMapelFilter === "Belum Dikategorikan"
                            ? "bg-amber-500/20 border-amber-500 text-amber-300 font-black shadow-lg shadow-amber-500/10"
                            : "bg-white/5 border-white/10 hover:border-white/20 text-amber-400"
                        }`}
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {uncategorizedCount} Belum Dikategorikan
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedMapelFilter("Semua")}
                      className={`px-3 py-1.5 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedMapelFilter === "Semua"
                          ? "bg-indigo-650 border-indigo-505 text-white font-black shadow-lg shadow-indigo-500/20"
                          : "bg-white/5 border-white/10 hover:border-white/20 text-slate-300"
                      }`}
                    >
                      Tampilkan Semua ({soal.length})
                    </button>
                  </div>
                </div>

                {/* 8 MATA PELAJARAN SECTIONS WITH DIRECT WORD UPLOADER & CARDS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-indigo-400" />
                    <h4 className="text-[11px] font-black uppercase font-mono tracking-wider text-indigo-300">Daftar Mata Pelajaran & Unggah Soal Instan</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {DAFTAR_MAPEL.map((mapelName) => {
                      const isSelected = selectedMapelFilter === mapelName;
                      const count = soal.filter(s => s.mapel === mapelName).length;

                      return (
                        <div key={mapelName} className={`p-4 rounded-2xl border transition-all flex flex-col justify-between bg-[#111827]/40 relative ${
                          isSelected 
                            ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-500/5 shadow-xl" 
                            : "border-white/10 hover:border-white/20 hover:bg-white/5"
                        }`}>
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                                isSelected 
                                  ? "bg-indigo-500 text-white" 
                                  : "bg-white/10 text-slate-400"
                              }`}>
                                MAPEL
                              </span>
                              <span className="text-[10px] font-mono font-black text-emerald-400">
                                {count} Soal
                              </span>
                            </div>
                            <h5 className="font-extrabold text-xs text-slate-100 leading-snug line-clamp-3 h-12" title={mapelName}>
                              {mapelName}
                            </h5>
                          </div>

                          <div className="space-y-2 pt-3 border-t border-white/5 mt-4">
                            {/* Direct Word Upload menu button on each Mapel */}
                            <button
                              onClick={() => {
                                setSelectedMapelForWord(mapelName);
                                setWordParsedQuestions([]);
                                setWordPastedText("");
                                setShowWordModal(true);
                              }}
                              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shadow-lg shadow-emerald-600/10"
                            >
                              <Upload className="h-3.5 w-3.5" />
                              Upload dari Word
                            </button>

                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                onClick={() => handleOpenSoalForm(undefined, mapelName)}
                                className="py-1.5 px-2 bg-indigo-600/90 hover:bg-indigo-555 text-white text-[9px] font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                                title="Tambah soal manual"
                              >
                                <Plus className="h-3 w-3" />
                                Manual
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedMapelFilter(isSelected ? "Semua" : mapelName);
                                }}
                                className={`py-1.5 px-2 text-[9px] font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                                  isSelected 
                                    ? "bg-slate-100 text-indigo-950 border-white hover:bg-slate-200" 
                                    : "bg-white/10 hover:bg-white/20 text-slate-200 border-white/10"
                                }`}
                              >
                                <Eye className="h-3 w-3" />
                                {isSelected ? "Batal" : "Saring"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Filter Status & Soal List */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-indigo-400" />
                      <h4 className="text-[11px] font-black uppercase font-mono tracking-wider text-indigo-300">
                        {selectedMapelFilter === "Semua" 
                          ? `Pertanyaan Terdaftar (${displayedSoal.length} Soal)` 
                          : `Saringan Aktif: ${selectedMapelFilter} (${displayedSoal.length} Soal)`
                        }
                      </h4>
                    </div>
                    {selectedMapelFilter !== "Semua" && (
                      <button
                        onClick={() => setSelectedMapelFilter("Semua")}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
                      >
                        Reset Saringan
                      </button>
                    )}
                  </div>

                  {displayedSoal.length === 0 ? (
                    <div className="text-center p-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl space-y-3">
                      <HelpCircle className="mx-auto h-10 w-10 text-indigo-400" />
                      <p className="text-sm font-extrabold text-slate-200">Tidak ada soal untuk kategori ini</p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Mata pelajaran <span className="text-indigo-300 font-bold">"{selectedMapelFilter}"</span> belum memiliki soal ujian terdaftar.
                      </p>
                      <div className="flex justify-center gap-3 pt-2">
                        <button
                          onClick={() => {
                            setSelectedMapelForWord(selectedMapelFilter === "Belum Dikategorikan" ? DAFTAR_MAPEL[0] : selectedMapelFilter);
                            setWordParsedQuestions([]);
                            setWordPastedText("");
                            setShowWordModal(true);
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                        >
                          <Upload className="h-4 w-4" /> Import Excel / Word
                        </button>
                        <button
                          onClick={() => handleOpenSoalForm(undefined, selectedMapelFilter === "Belum Dikategorikan" ? DAFTAR_MAPEL[0] : selectedMapelFilter)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/20"
                        >
                          <Plus className="h-4 w-4" /> Tambah Soal Manual
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {displayedSoal.map((q, index) => (
                        <div id={`soal-card-${q.id}`} key={q.id} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:border-white/20 transition-all text-xs relative">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-3 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2.5 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg font-black text-[10px]">SOAL {q.id}</span>
                                <span className="font-mono text-slate-400">Idx: {index+1}</span>
                                {q.mapel ? (
                                  <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg font-bold text-[9px]">
                                    {q.mapel}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg font-bold text-[9px]">
                                    Belum Dikategorikan
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-sm text-slate-100 leading-relaxed font-semibold whitespace-pre-wrap">{q.teks}</p>
                              
                              {q.gambarUrl && (
                                <div className="p-2 border border-white/10 bg-white/5 rounded-xl inline-block">
                                  <img src={q.gambarUrl} alt="Lampiran" referrerPolicy="no-referrer" className="max-h-32 object-contain rounded-lg" />
                                </div>
                              )}

                              {/* Options Grid */}
                              <div className="grid sm:grid-cols-5 gap-3 pt-2 font-sans font-medium">
                                {(["A", "B", "C", "D", "E"] as const).map(opt => (
                                  <div key={opt} className={`p-2.5 rounded-xl border text-xs ${
                                    q.kunci === opt 
                                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold" 
                                      : "bg-white/5 border-white/10 text-slate-300"
                                  }`}>
                                    <span className={`inline-block mr-1.5 font-bold font-mono text-[10px] px-1 rounded ${
                                      q.kunci === opt ? "bg-emerald-600 text-white" : "bg-white/20 text-slate-300"
                                    }`}>{opt}</span>
                                    {q.opsi[opt]}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-1.5 shrink-0">
                              <button
                                id={`edit-soal-${q.id}-btn`}
                                onClick={() => handleOpenSoalForm(q)}
                                className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-white/5 rounded-lg border border-white/10 transition-all cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                id={`delete-soal-${q.id}-btn`}
                                onClick={() => handleDeleteSoal(q.id)}
                                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-white/5 rounded-lg border border-white/10 transition-all cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Modal */}
              {showSoalForm && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
                  <div className="bg-[#0f172a]/95 backdrop-blur-2xl w-full max-w-2xl border border-white/10 rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] text-slate-100">
                     <div className="flex justify-between items-center mb-6">
                      <h3 className="text-base font-extrabold text-slate-100 font-display">
                        {selectedSoal ? "Edit Soal Pilihan Ganda" : "Formulir Tambah Soal Baru"}
                      </h3>
                      <button onClick={() => setShowSoalForm(false)} className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveSoal} className="space-y-4 text-xs font-semibold">
                      <div>
                        <label className="block text-slate-300 mb-1">Kode / ID Soal (Biarkan kosong jika auto-generate)</label>
                        <input
                          id="form-soal-id"
                          type="text"
                          value={soalField.id}
                          disabled={!!selectedSoal}
                          onChange={(e) => setSoalField({ ...soalField, id: e.target.value.toUpperCase() })}
                          placeholder="Contoh: S006"
                          className="w-full px-3 py-2 border border-white/10 rounded-lg outline-none focus:border-indigo-500 bg-white/5 text-slate-100 disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">Pertanyaan Ujian *</label>
                        <textarea
                          id="form-soal-teks"
                          required
                          rows={3}
                          value={soalField.teks}
                          onChange={(e) => setSoalField({ ...soalField, teks: e.target.value })}
                          placeholder="Masukkan rincian pertanyaan di sini..."
                          className="w-full px-3 py-2 border border-white/10 rounded-lg outline-none focus:border-indigo-500 bg-white/5 text-slate-100 font-sans leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">Lampiran Link URL Gambar (Opsional, isi dengan url langsung gambar)</label>
                        <input
                          id="form-soal-gambar"
                          type="url"
                          value={soalField.gambarUrl}
                          onChange={(e) => setSoalField({ ...soalField, gambarUrl: e.target.value })}
                          placeholder="https://example.com/ilustrasi.png"
                          className="w-full px-3 py-2 border border-white/10 rounded-lg outline-none focus:border-indigo-500 bg-white/5 text-slate-100"
                        />
                      </div>

                      {/* Options Grid */}
                      <fieldset className="border border-white/10 p-4 rounded-2xl bg-white/5 space-y-3">
                        <legend className="px-2 text-[10px] uppercase font-black text-indigo-400 tracking-wider font-mono">Opsi Pilihan Jawaban</legend>
                        
                        {(["A", "B", "C", "D", "E"] as const).map(opt => (
                          <div key={opt} className="flex gap-2.5 items-center">
                            <span className="font-bold font-mono text-slate-300 px-2 py-1.5 bg-white/10 rounded-md border border-white/10">{opt}</span>
                            <input
                              id={`form-soal-opsi-${opt}`}
                              type="text"
                              required
                              value={soalField.opsi[opt]}
                              onChange={(e) => setSoalField({
                                ...soalField,
                                opsi: { ...soalField.opsi, [opt]: e.target.value }
                              })}
                              placeholder={`Masukkan jawaban pilihan ${opt}`}
                              className="flex-1 px-3 py-2 border border-white/10 rounded-lg outline-none focus:border-indigo-500 bg-white/5 text-slate-100"
                            />
                          </div>
                        ))}
                      </fieldset>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-300 mb-1">Kunci Jawaban Benar *</label>
                          <select
                            id="form-soal-kunci"
                            value={soalField.kunci}
                            onChange={(e) => setSoalField({ ...soalField, kunci: e.target.value as any })}
                            className="w-full px-3 py-2 border border-white/10 rounded-lg outline-none focus:border-indigo-500 bg-[#0f172a] text-slate-100 font-bold"
                          >
                            <option value="A">Opsi A</option>
                            <option value="B">Opsi B</option>
                            <option value="C">Opsi C</option>
                            <option value="D">Opsi D</option>
                            <option value="E">Opsi E</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-300 mb-1">Mata Pelajaran *</label>
                          <select
                            id="form-soal-mapel"
                            value={soalField.mapel}
                            onChange={(e) => setSoalField({ ...soalField, mapel: e.target.value })}
                            className="w-full px-3 py-2 border border-white/10 rounded-lg outline-none focus:border-indigo-500 bg-[#0f172a] text-slate-100 font-bold"
                          >
                            {DAFTAR_MAPEL.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-white/10">
                        <button type="button" onClick={() => setShowSoalForm(false)} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 font-bold rounded-lg transition-all cursor-pointer text-center">Batal</button>
                        <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1">
                          <Save className="h-4 w-4" /> Simpan Soal
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Word Upload / Import Modal */}
              {showWordModal && (
                <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
                  <div className="bg-[#0f172a]/95 backdrop-blur-2xl w-full max-w-4xl border border-white/10 rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[92vh] text-slate-100 flex flex-col">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10 shrink-0">
                      <div className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-emerald-400" />
                        <h3 className="text-base font-extrabold text-slate-100 font-display">
                          Upload & Parse Soal dari Word (.docx / .txt)
                        </h3>
                      </div>
                      <button onClick={() => setShowWordModal(false)} className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid md:grid-cols-12 gap-5 flex-1 overflow-y-auto min-h-0">
                      {/* Left side: Guide and Uploaders */}
                      <div className="md:col-span-5 space-y-4">
                        {/* Subject Selector */}
                        <div className="bg-gradient-to-r from-emerald-555/5 to-indigo-555/5 border border-white/10 p-4 rounded-2xl">
                          <label className="block text-slate-200 font-bold mb-1.5 text-xs">Tujuan Mata Pelajaran *</label>
                          <select
                            id="import-word-mapel"
                            value={selectedMapelForWord}
                            onChange={(e) => setSelectedMapelForWord(e.target.value)}
                            className="w-full px-3 py-2 border border-white/10 rounded-lg outline-none focus:border-indigo-500 bg-[#0f172a] text-slate-100 font-bold text-xs"
                          >
                            {DAFTAR_MAPEL.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                          <p className="text-[10px] text-emerald-400 mt-1.5 font-bold">Seluruh soal dari file Word ini akan langsung dikaitkan ke Mata Pelajaran ini.</p>
                        </div>

                        {/* File Selector */}
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                          <label className="block text-slate-300 font-bold mb-2 text-xs">Pilih File Microsoft Word / Text</label>
                          <div className="border-2 border-dashed border-white/15 hover:border-emerald-500/50 rounded-xl p-6 text-center transition-all relative">
                            <input
                              type="file"
                              accept=".docx,.txt"
                              onChange={handleWordFileChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="space-y-2">
                              <FileText className="mx-auto h-8 w-8 text-slate-400" />
                              <div className="text-xs font-semibold text-slate-300">
                                {wordFileLoading ? (
                                  <span className="text-emerald-400 flex items-center justify-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Sedang Mengekstrak...</span>
                                ) : (
                                  <span>Drag & Drop atau Klik untuk pilih file <span className="text-emerald-400 font-bold">.docx / .txt</span></span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400">File MS Word (.docx) akan dibaca, diekstrak isinya, dan langsung di-parse secara instan.</p>
                            </div>
                          </div>
                        </div>

                        {/* Text Copy-Paste Area */}
                        <div className="space-y-2">
                          <label className="block text-slate-300 font-bold text-xs">Atau Tempel (Paste) Teks dari Word</label>
                          <textarea
                            rows={8}
                            value={wordPastedText}
                            onChange={(e) => setWordPastedText(e.target.value)}
                            placeholder="Salin/copy seluruh soal dari Microsoft Word lalu tempelkan di sini..."
                            className="w-full text-xs font-mono p-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => handleParseWordText(wordPastedText)}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-555 text-white font-bold rounded-xl transition-all cursor-pointer text-xs"
                          >
                            Uraikan / Parse Teks Sekarang
                          </button>
                        </div>

                        {/* Template Instructions */}
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-[11px] text-slate-300 space-y-2 leading-relaxed">
                          <div className="font-bold text-emerald-400 uppercase tracking-widest text-[9px] font-mono">Panduan Format Penulisan:</div>
                          <p>Soal di Word harus ditulis dengan format terstruktur agar terbaca otomatis seperti berikut:</p>
                          <pre className="p-2 bg-slate-950/60 rounded-lg text-[10px] font-mono text-emerald-300 overflow-x-auto leading-snug">
{`1. Ibu kota Provinsi Jawa Tengah adalah...
A. Bandung
B. Surabaya
C. Semarang
D. Jakarta
E. Yogyakarta
Kunci: C`}
                          </pre>
                        </div>
                      </div>

                      {/* Right side: Scanned Questions List & Action */}
                      <div className="md:col-span-7 flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-center bg-white/5 p-3 border border-white/10 rounded-xl mb-3 shrink-0">
                          <span className="text-xs font-extrabold text-slate-100 font-display font-medium">Tinjau Hasil Penguraian ({wordParsedQuestions.length} Soal Terdeteksi)</span>
                          {wordParsedQuestions.length > 0 && (
                            <button
                              onClick={() => {
                                if (confirm("Apakah Anda yakin ingin menghapus seluruh soal dalam daftar tinjau ini?")) {
                                  setWordParsedQuestions([]);
                                }
                              }}
                              className="text-[10px] text-rose-450 hover:text-rose-400 font-bold"
                            >
                              Kosongkan Daftar
                            </button>
                          )}
                        </div>

                        {/* Scalable List */}
                        <div className="flex-1 overflow-y-auto max-h-[450px] p-2 space-y-3 border border-white/5 bg-slate-950/40 rounded-2xl custom-scrollbar mb-4">
                          {wordParsedQuestions.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-10 text-center text-slate-400">
                              <FileText className="h-10 w-10 text-slate-500 mb-2" />
                              <p className="text-xs font-bold text-slate-300">Belum Ada Soal Terbaca</p>
                              <p className="text-[10px] text-slate-500 max-w-xs mt-1">Gunakan dropzone file Word di sebelah kiri atau tempelkan teks soal langsung.</p>
                            </div>
                          ) : (
                            wordParsedQuestions.map((q, idx) => (
                              <div key={q.tempId} className="bg-white/5 p-4 rounded-xl border border-white/10 relative text-xs text-left group">
                                <div className="flex justify-between items-start gap-2 mb-2">
                                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono font-bold rounded text-[9px]">Hasil Parse Soal #{idx + 1}</span>
                                  {/* DELETE INDIVIDUAL QUESTION BUTTON (fungsikan menu hapus di dalamnya) */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteParsedQuestion(q.tempId)}
                                    className="p-1 hover:bg-rose-500/20 border border-white/5 hover:border-rose-550/20 text-rose-400 rounded transition-all cursor-pointer"
                                    title="Hapus soal ini dari antrean"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>

                                <p className="font-semibold text-slate-100 leading-relaxed mb-3">{q.teks}</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                  {(["A", "B", "C", "D", "E"] as const).map(ch => (
                                    <div key={ch} className={`p-2 rounded-lg text-[10px] flex items-center gap-1.5 border ${
                                      q.kunci === ch 
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" 
                                        : "bg-white/5 border-white/5 text-slate-300"
                                    }`}>
                                      <span className={`font-mono font-bold px-1 rounded ${q.kunci === ch ? "bg-emerald-600 text-white" : "bg-white/10"}`}>{ch}</span>
                                      <span className="truncate">{q.opsi[ch]}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Save Trigger bottom */}
                        <div className="shrink-0 pt-3 border-t border-white/10 flex gap-3">
                          <button
                            type="button"
                            onClick={() => setShowWordModal(false)}
                            className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold rounded-xl transition-all"
                          >
                            Tutup
                          </button>
                          <button
                            type="button"
                            disabled={wordParsedQuestions.length === 0}
                            onClick={handleSaveImportedQuestions}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Save className="h-4 w-4" />
                            Simpan {wordParsedQuestions.length} Soal ke Database
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          );
        })()}

          {/* 3. JADWAL SESI UJIAN PANEL */}
          {activeTab === "ujian" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                <p className="text-xs text-slate-300 font-medium font-mono">Daftar Sesi Ujian: {ujian.length} Sesi Terjadwal</p>
                <button
                  id="add-new-ujian-btn"
                  onClick={() => handleOpenUjianForm()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/20"
                >
                  <Plus className="h-4 w-4" />
                  Buat Sesi Ujian Baru
                </button>
              </div>

              {ujian.length === 0 ? (
                <div className="text-center p-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl">
                  <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
                  <p className="text-sm font-bold text-slate-200">Belum Ada Sesi Ujian</p>
                  <p className="text-xs text-slate-400 mt-1">Buat sesi baru agar siswa dapat menginput token.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {ujian.map(ex => (
                    <div id={`exam-card-${ex.id}`} key={ex.id} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:border-white/20 transition-all text-xs flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-4 pb-3 border-b border-white/10 mb-4 animate-fade-in">
                          <div>
                            <span className="px-2 py-0.5 bg-white/10 text-slate-300 border border-white/10 rounded-lg text-[10px] font-black">{ex.id}</span>
                            <h4 className="text-sm font-extrabold text-slate-100 mt-1 leading-snug">{ex.mapel}</h4>
                          </div>
                          
                          {/* Active / Inactive Status toggle */}
                          <button
                            id={`toggle-exam-${ex.id}-btn`}
                            onClick={() => handleToggleExamStatus(ex)}
                            className="transition-all rounded-lg outline-none cursor-pointer"
                            title="Klik untuk ubah aktifasi"
                          >
                            {ex.aktif ? (
                              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg flex items-center gap-1 font-bold">● AKTIF</span>
                            ) : (
                              <span className="px-3 py-1 bg-white/10 text-slate-400 border border-white/10 rounded-lg flex items-center gap-1 font-bold">○ NONAKTIF</span>
                            )}
                          </button>
                        </div>

                        {/* Exam specs */}
                        <div className="space-y-2 font-medium text-slate-300">
                          <div className="flex justify-between">
                            <span>Sesi Tanggal:</span>
                            <span className="font-bold text-slate-100">{ex.tanggal}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Durasi Ujian:</span>
                            <span className="font-bold text-slate-100">{ex.durasi} Menit</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Bobot Soal Terpasang:</span>
                            <span className="font-bold text-indigo-400">{ex.soalIds ? ex.soalIds.length : 0} Pertanyaan</span>
                          </div>
                          <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-xl border border-white/5 mt-3">
                            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider font-mono">Akses Token Ujian</span>
                            <span className="font-mono text-sm font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded tracking-widest">{ex.token}</span>
                          </div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex gap-2 pt-5 border-t border-white/10 mt-5">
                        <button
                          id={`edit-ujian-${ex.id}-btn`}
                          onClick={() => handleOpenUjianForm(ex)}
                          className="flex-1 py-1.5 border border-white/10 hover:bg-white/10 text-slate-200 rounded-xl font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" /> Atur Sesi
                        </button>
                        <button
                          id={`delete-ujian-${ex.id}-btn`}
                          onClick={() => handleDeleteUjian(ex.id)}
                          className="px-3 py-1.5 border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Form Modal */}
              {showUjianForm && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
                  <div className="bg-[#0f172a]/95 backdrop-blur-2xl w-full max-w-xl border border-white/10 rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] text-slate-100">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-base font-extrabold text-slate-100 font-display">
                        {selectedUjian ? "Pengaturan Sesi Ujian" : "Manajemen Sesi Ujian Baru"}
                      </h3>
                      <button onClick={() => setShowUjianForm(false)} className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveUjian} className="space-y-4 text-xs font-semibold">
                      <div>
                        <label className="block text-slate-300 mb-1.5">Mata Pelajaran *</label>
                        <select
                          id="form-ujian-mapel-select"
                          value={
                            DAFTAR_MAPEL.includes(ujianField.mapel) 
                              ? ujianField.mapel 
                              : ujianField.mapel === "" 
                                ? "" 
                                : "CUSTOM"
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "CUSTOM") {
                              setUjianField({ ...ujianField, mapel: "Mata Pelajaran Kustom" });
                            } else {
                              setUjianField({ ...ujianField, mapel: val });
                            }
                          }}
                          className="w-full px-3 py-2 border border-white/10 rounded-lg outline-none focus:border-indigo-500 bg-[#0f172a] text-slate-100 font-bold mb-2 text-xs"
                        >
                          <option value="">-- Pilih Mata Pelajaran --</option>
                          {DAFTAR_MAPEL.map((mapel, index) => (
                            <option key={index} value={mapel}>
                              {mapel}
                            </option>
                          ))}
                          <option value="CUSTOM">✍️ Tulis Kustom / Mata Pelajaran Lain</option>
                        </select>

                        {(!DAFTAR_MAPEL.includes(ujianField.mapel) || ujianField.mapel === "Mata Pelajaran Kustom") && (
                          <div className="mt-2 animate-fade-in">
                            <label className="block text-slate-400 text-[10px] uppercase font-mono mb-1">Nama Mata Pelajaran Kustom:</label>
                            <input
                              id="form-ujian-mapel"
                              type="text"
                              required
                              value={ujianField.mapel === "Mata Pelajaran Kustom" ? "" : ujianField.mapel}
                              onChange={(e) => setUjianField({ ...ujianField, mapel: e.target.value })}
                              placeholder="Ketik mata pelajaran kustom di sini..."
                              className="w-full px-3 py-2 border border-white/10 rounded-lg outline-none focus:border-indigo-500 bg-white/5 text-slate-100 placeholder:text-slate-500"
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-300 mb-1">Tanggal Ujian *</label>
                          <input
                            id="form-ujian-tanggal"
                            type="date"
                            required
                            value={ujianField.tanggal}
                            onChange={(e) => setUjianField({ ...ujianField, tanggal: e.target.value })}
                            className="w-full px-3 py-2 border border-white/10 rounded-lg outline-none focus:border-indigo-500 bg-white/5 text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 mb-1">Durasi (Menit) *</label>
                          <input
                            id="form-ujian-durasi"
                            type="number"
                            required
                            min={1}
                            value={ujianField.durasi}
                            onChange={(e) => setUjianField({ ...ujianField, durasi: parseInt(e.target.value) || 60 })}
                            className="w-full px-3 py-2 border border-white/10 rounded-lg outline-none focus:border-indigo-500 bg-white/5 text-slate-100"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-300 mb-1">Token Ujian *</label>
                          <div className="flex gap-2">
                            <input
                              id="form-ujian-token"
                              type="text"
                              required
                              value={ujianField.token}
                              onChange={(e) => setUjianField({ ...ujianField, token: e.target.value.toUpperCase() })}
                              placeholder="CBTABC"
                              className="w-full px-3 py-2 border border-white/10 rounded-lg outline-none focus:border-indigo-500 bg-white/5 text-rose-400 font-mono tracking-wider font-extrabold uppercase"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const tok = "CBT" + Math.floor(100 + Math.random() * 900);
                                setUjianField({ ...ujianField, token: tok });
                              }}
                              className="px-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 cursor-pointer text-[10px]"
                              title="Acak Token"
                            >
                              Acak
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-300 mb-1">Status Sesi</label>
                          <select
                            id="form-ujian-aktif"
                            value={String(ujianField.aktif)}
                            onChange={(e) => setUjianField({ ...ujianField, aktif: e.target.value === "true" })}
                            className="w-full px-3 py-2 border border-white/10 rounded-lg outline-none focus:border-indigo-500 bg-[#0f172a] text-slate-100 font-bold"
                          >
                            <option value="true">Aktif (Siswa Bisa Masuk)</option>
                            <option value="false">Nonaktif (Dikunci)</option>
                          </select>
                        </div>
                      </div>

                      {/* Attach bank questions checklist */}
                      <div>
                        <label className="block text-slate-300 mb-2 font-mono uppercase tracking-wider text-[10px]">Pilih Pertanyaan Ujian Dari Bank Soal ({ujianField.soalIds.length} terpilih):</label>
                        {soal.length === 0 ? (
                          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs text-center font-bold">
                            Belum ada soal terintegrasi. Buat bank soal terlebih dahulu!
                          </div>
                        ) : (
                          <div className="border border-white/10 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-white/5 p-2 space-y-2 custom-scrollbar">
                            {soal.map(q => {
                              const isAttached = ujianField.soalIds.includes(q.id);
                              return (
                                <button
                                  type="button"
                                  key={q.id}
                                  onClick={() => handleToggleQuestionInExam(q.id)}
                                  className={`w-full flex items-start gap-3 p-2.5 rounded-lg border text-left transition-all ${
                                    isAttached 
                                      ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-bold" 
                                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isAttached}
                                    onChange={() => {}} // focus taken by outer container button
                                    className="rounded mt-0.5 h-3.5 w-3.5 text-indigo-500 cursor-pointer"
                                  />
                                  <div className="leading-snug">
                                    <span className="font-mono text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded mr-1.5 font-bold">{q.id}</span>
                                    <span>{q.teks.substring(0, 75)}...</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-white/10">
                        <button type="button" onClick={() => setShowUjianForm(false)} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 font-bold rounded-lg transition-all cursor-pointer text-center">Batal</button>
                        <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1">
                          <Save className="h-4 w-4" /> Simpan Konfigurasi
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. DATA SISWA PANEL */}
          {activeTab === "siswa" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl gap-3">
                <p className="text-xs text-slate-300 font-medium font-mono">Daftar Siswa Aktif: {siswa.length} Terdaftar</p>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    id="upload-excel-siswa-btn"
                    onClick={() => setShowExcelModal(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all font-sans"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Siswa (Excel)
                  </button>
                  <button
                    id="add-new-siswa-btn"
                    onClick={() => handleOpenSiswaForm()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/20"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Peserta Siswa
                  </button>
                </div>
              </div>

              {/* Siswa Table */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden text-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans font-medium">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                        <th className="p-4">NISN Siswa</th>
                        <th className="p-4">Nama Lengkap</th>
                        <th className="p-4">Kelas</th>
                        <th className="p-4">Kata Sandi (PIN)</th>
                        <th className="p-4 text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-200 font-semibold">
                      {siswa.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 bg-transparent">Belum ada data siswa terdaftar. Tambahkan data dari panel di atas.</td>
                        </tr>
                      ) : (
                        siswa.map(s => (
                          <tr id={`siswa-row-${s.nisn}`} key={s.nisn} className="hover:bg-white/5 transition-all">
                            <td className="p-4 font-mono font-bold text-indigo-300">{s.nisn}</td>
                            <td className="p-4 text-slate-100">{s.nama}</td>
                            <td className="p-4">
                              <span className="px-2 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg text-[10px] font-bold">{s.kelas}</span>
                            </td>
                            <td className="p-4 font-mono text-slate-400">{s.password || "123"}</td>
                            <td className="p-4">
                              <div className="flex justify-center gap-1.5">
                                <button
                                  id={`edit-siswa-${s.nisn}-btn`}
                                  onClick={() => handleOpenSiswaForm(s)}
                                  className="p-1 px-2 border border-white/10 hover:bg-white/10 text-indigo-300 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer text-[10px]"
                                >
                                  <Edit2 className="h-3 w-3" /> Edit
                                </button>
                                <button
                                  id={`delete-siswa-${s.nisn}-btn`}
                                  onClick={() => handleDeleteSiswa(s.nisn)}
                                  className="p-1 border border-white/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all cursor-pointer"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Modal */}
              {showSiswaForm && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
                  <div className="bg-[#0f172a]/95 backdrop-blur-2xl w-full max-w-md border border-white/10 rounded-3xl shadow-2xl p-6 text-slate-100">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-base font-extrabold text-slate-100 font-display">
                        {selectedSiswa ? "Perbarui Profil Siswa" : "Tambah Peserta Ujian Baru"}
                      </h3>
                      <button onClick={() => setShowSiswaForm(false)} className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveSiswa} className="space-y-4 text-xs font-semibold">
                      <div>
                        <label className="block text-slate-300 mb-1">NISN (Nomor Induk Siswa Nasional) *</label>
                        <input
                          id="form-siswa-nisn"
                          type="text"
                          required
                          value={siswaField.nisn}
                          disabled={!!selectedSiswa}
                          onChange={(e) => setSiswaField({ ...siswaField, nisn: e.target.value })}
                          placeholder="Nomor Kode unik (contoh: 12345678)"
                          className="w-full px-3 py-2.5 border border-white/10 rounded-lg outline-none focus:border-indigo-500 bg-white/5 text-slate-100 font-mono disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">Nama Lengkap Siswa *</label>
                        <input
                          id="form-siswa-nama"
                          type="text"
                          required
                          value={siswaField.nama}
                          onChange={(e) => setSiswaField({ ...siswaField, nama: e.target.value })}
                          placeholder="Nama lengkap sesuai ijazah"
                          className="w-full px-3 py-2.5 border border-white/10 rounded-lg outline-none focus:border-indigo-500 bg-white/5 text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">Tingkatan / Kelas *</label>
                        <input
                          id="form-siswa-kelas"
                          type="text"
                          required
                          value={siswaField.kelas}
                          onChange={(e) => setSiswaField({ ...siswaField, kelas: e.target.value })}
                          placeholder="Contoh: XII MIPA 2"
                          className="w-full px-3 py-2.5 border border-white/10 rounded-lg outline-none focus:border-indigo-500 bg-white/5 text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">Kata Sandi Login / PIN (Default: 123) *</label>
                        <input
                          id="form-siswa-password"
                          type="text"
                          required
                          value={siswaField.password}
                          onChange={(e) => setSiswaField({ ...siswaField, password: e.target.value })}
                          className="w-full px-3 py-2.5 border border-white/10 rounded-lg outline-none focus:border-indigo-500 bg-white/5 text-slate-100 font-mono"
                        />
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-white/10">
                        <button type="button" onClick={() => setShowSiswaForm(false)} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 font-bold rounded-lg transition-all cursor-pointer text-center">Batal</button>
                        <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-550 text-white font-bold rounded-lg transition-all cursor-pointer">Simpan Data</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Excel Student Upload Modal */}
              {showExcelModal && (
                <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
                  <div className="bg-[#0f172a]/95 backdrop-blur-2xl w-full max-w-4xl border border-white/10 rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[92vh] text-slate-100 flex flex-col">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10 shrink-0">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                        <h3 className="text-base font-extrabold text-slate-100 font-display">
                          Upload & Import Peserta dari Excel (.xlsx / .xls)
                        </h3>
                      </div>
                      <button onClick={() => setShowExcelModal(false)} className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid md:grid-cols-12 gap-5 flex-1 overflow-y-auto min-h-0">
                      {/* Left: Guide & Drag/Dropzone */}
                      <div className="md:col-span-5 space-y-4 text-xs font-semibold">
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                          <label className="block text-slate-300 font-bold mb-2">Pilih Spreadsheet Excel</label>
                          <div className="border-2 border-dashed border-white/15 hover:border-emerald-500/50 rounded-xl p-6 text-center transition-all relative">
                            <input
                              type="file"
                              accept=".xlsx,.xls"
                              onChange={handleExcelFileChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="space-y-2">
                              <FileSpreadsheet className="mx-auto h-8 w-8 text-emerald-400" />
                              <div className="text-xs font-bold text-slate-300">
                                {excelFileLoading ? (
                                  <span className="text-emerald-400 flex items-center justify-center gap-2">
                                    <RefreshCw className="h-4 w-4 animate-spin" /> Membaca spreadsheet...
                                  </span>
                                ) : (
                                  <span>Drag & Drop atau Klik untuk pilih File Excel</span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400">Pastikan format file merupakan .xlsx atau .xls</p>
                            </div>
                          </div>
                        </div>

                        {/* Format Instructions template */}
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-2 leading-relaxed">
                          <div className="font-extrabold text-emerald-400 uppercase tracking-widest text-[9px] font-mono">Panduan Struktur Kolom Excel:</div>
                          <p className="text-[10px] text-slate-300 leading-normal">
                            Pastikan baris pertama/header tabel spreadsheet berisi kolom berikut (urutan boleh bebas):
                          </p>
                          <div className="bg-slate-950/60 p-2.5 rounded-lg font-mono text-[9px] text-emerald-300 overflow-x-auto leading-snug">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="border-b border-white/10 text-slate-400">
                                  <th className="pr-2 text-left">NISN</th>
                                  <th className="pr-2 text-left">Nama</th>
                                  <th className="pr-2 text-left">Kelas</th>
                                  <th className="text-left font-normal italic">Password *</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="pr-2">12345678</td>
                                  <td className="pr-2">Budi Satria</td>
                                  <td className="pr-2">XII MIPA 1</td>
                                  <td>123</td>
                                </tr>
                                <tr>
                                  <td className="pr-2">87654321</td>
                                  <td className="pr-2">Siti Rahma</td>
                                  <td className="pr-2">XII MIPA 2</td>
                                  <td>123</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <p className="text-[9px] text-slate-400 mt-1 italic">
                            * Kolom password opsional. Jika tidak ada kolom password, sistem otomatis menetapkan password default "123".
                          </p>
                        </div>
                      </div>

                      {/* Right: Scanned students preview & import trigger */}
                      <div className="md:col-span-7 flex flex-col min-h-[380px]">
                        <div className="flex justify-between items-center bg-white/5 p-3 border border-white/10 rounded-xl mb-3 shrink-0">
                          <span className="text-xs font-extrabold text-slate-100 font-display">Tinjau Hasil Penguraian ({excelParsedStudents.length} Siswa Terdeteksi)</span>
                          {excelParsedStudents.length > 0 && (
                            <button
                              onClick={() => {
                                if (confirm("Apakah Anda yakin ingin mengosongkan daftar tinjau?")) {
                                  setExcelParsedStudents([]);
                                }
                              }}
                              className="text-[10px] text-rose-400 hover:text-rose-350 font-bold"
                            >
                              Kosongkan Daftar
                            </button>
                          )}
                        </div>

                        {/* List preview block */}
                        <div className="flex-1 overflow-y-auto max-h-[350px] p-2 space-y-2 border border-white/5 bg-slate-950/40 rounded-2xl custom-scrollbar mb-4 text-xs">
                          {excelParsedStudents.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-10 text-center text-slate-400">
                              <FileSpreadsheet className="h-10 w-10 text-slate-500 mb-2" />
                              <p className="text-xs font-bold text-slate-300">Belum Ada Siswa Terbaca</p>
                              <p className="text-[10px] text-slate-500 max-w-xs mt-1">Pilih file spreadsheet Excel Anda di panel kiri untuk memulai impor otomatis.</p>
                            </div>
                          ) : (
                            excelParsedStudents.map((s, idx) => (
                              <div key={s.nisn + idx} className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between text-xs hover:border-white/20 transition-all font-sans">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-indigo-300 font-mono font-black">{s.nisn}</span>
                                    <span className="px-1.5 py-0.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 rounded text-[9px] font-bold">{s.kelas}</span>
                                  </div>
                                  <p className="text-slate-100 mt-1 font-bold">{s.nama}</p>
                                  <p className="text-[9px] text-slate-400 font-medium">PIN Kata Sandi: {s.password}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteParsedStudent(s.nisn)}
                                  className="p-1.5 hover:bg-rose-500/25 border border-white/5 hover:border-rose-550/25 text-rose-400 rounded-lg transition-all cursor-pointer"
                                  title="Hapus dari antrean"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Action triggers */}
                        <div className="shrink-0 pt-3 border-t border-white/10 flex gap-3 text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => setShowExcelModal(false)}
                            className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl transition-all"
                          >
                            Tutup
                          </button>
                          <button
                            type="button"
                            disabled={excelParsedStudents.length === 0}
                            onClick={handleSaveImportedStudents}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-555 text-white rounded-xl shadow-lg shadow-emerald-650/20 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Save className="h-4 w-4" />
                            Simpan {excelParsedStudents.length} Siswa ke Database
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. LAPORAN & REKAP NILAI PANEL */}
          {activeTab === "laporan" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl gap-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-100">Skor Peserta CBT Selesai</h3>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Rekapitulasi otomatis pengerjaan ujian siswa real-time dari database.</p>
                </div>
                <button
                  id="export-nilai-btn"
                  onClick={handleExportCSV}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-505 text-white text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg transition-all shadow-indigo-600/20"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Ekspor Nilai (CSV Excel)
                </button>
              </div>

              {/* Leaderboard/Attempts scores */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden text-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans font-medium text-slate-200">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                        <th className="p-4">Peserta Siswa</th>
                        <th className="p-4">Mata Sesi Ujian</th>
                        <th className="p-4 text-center">Analisis Bobot</th>
                        <th className="p-4 text-center">Penyimpangan Tab</th>
                        <th className="p-4 text-center">Nilai Ujian</th>
                        <th className="p-4 text-center">Status Sesi</th>
                        <th className="p-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-200 font-semibold">
                      {hasil.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-400 font-bold bg-transparent">Belum ada riwayat hasil ujian masuk.</td>
                        </tr>
                      ) : (
                        hasil.map(h => (
                          <tr id={`hasil-row-${h.id}`} key={h.id} className="hover:bg-white/5 transition-all">
                            <td className="p-4">
                              <p className="font-extrabold text-slate-100">{h.siswaNama}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">NISN: {h.nisn} | Kelas {h.siswaKelas}</p>
                            </td>
                            <td className="p-4 font-bold text-slate-300">{h.mapel}</td>
                            <td className="p-4 text-center">
                              <div className="inline-flex gap-2">
                                <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded font-mono font-extrabold">Benar: {h.benar}</span>
                                <span className="px-2 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded font-mono font-extrabold">Salah: {h.salah}</span>
                              </div>
                            </td>
                            <td className="p-4 text-center font-bold">
                              {h.pelanggaranCount > 0 ? (
                                <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg font-bold flex items-center justify-center gap-1 max-w-[120px] mx-auto uppercase text-[10px]">
                                  <ShieldAlert className="h-3.5 w-3.5" />
                                  {h.pelanggaranCount} Warning
                                </span>
                              ) : (
                                <span className="text-emerald-400 font-bold">0 Tutup Tab (Aman)</span>
                              )}
                            </td>
                            <td className="p-4 text-center text-sm">
                              <span className={`px-2.5 py-1.5 rounded-lg font-mono text-xs font-extrabold ${
                                h.nilai >= 75 
                                  ? "bg-emerald-600 text-white" 
                                  : h.nilai >= 50 
                                  ? "bg-indigo-650 text-white"
                                  : "bg-rose-600 text-white"
                              }`}>
                                {h.nilai}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {h.selesai ? (
                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded text-[10px] font-bold">SELESAI</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded text-[10px] font-bold">BELUM KIRIM</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                id={`reset-hasil-${h.id}-btn`}
                                onClick={() => handleDeleteHasil(h.id)}
                                className="px-2 py-1 text-xs border border-rose-500/25 text-rose-400 hover:bg-rose-500/10 hover:border-rose-400 rounded-lg transition-all cursor-pointer font-bold text-[10px]"
                              >
                                Reset Ujian
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
