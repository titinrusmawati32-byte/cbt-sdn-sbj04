import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initialDbData } from "./src/data/initialData.js";
import { DatabaseSchema, Soal, Ujian, Siswa, HasilUjian } from "./src/types.js";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Parse JSON payloads
app.use(express.json());

// Load or initialize DB
function getDB(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDbData, null, 2), "utf-8");
      return initialDbData;
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content) as DatabaseSchema;
  } catch (err) {
    console.error("Error reading database file, resetting to initial data:", err);
    return initialDbData;
  }
}

function saveDB(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database file:", err);
  }
}

// Ensure database file is initialized on startup
getDB();

// API Routes

// Authenticate
app.post("/api/auth/login", (req, res) => {
  const { role, username, password, nisn } = req.body;

  if (role === "admin") {
    if (username === "admin" && password === "admin123") {
      return res.json({
        success: true,
        token: "admin-session-token",
        user: { role: "admin", name: "Administrator" }
      });
    }
    return res.status(401).json({ success: false, message: "Username atau Password Admin salah!" });
  } else if (role === "siswa") {
    const db = getDB();
    const student = db.siswa.find(s => String(s.nisn).trim() === String(nisn || "").trim());
    if (!student) {
      return res.status(404).json({ success: false, message: "NISN tidak terdaftar!" });
    }
    if (student.password === password || (!student.password && password === "123")) {
      return res.json({
        success: true,
        token: `siswa-${student.nisn}-token`,
        user: { role: "siswa", name: student.nama, nisn: student.nisn, kelas: student.kelas }
      });
    }
    return res.status(401).json({ success: false, message: "Password salah!" });
  }

  res.status(400).json({ success: false, message: "Role login tidak dikenal." });
});

// Siswa (Students) Management
app.get("/api/siswa", (req, res) => {
  const db = getDB();
  res.json(db.siswa);
});

app.post("/api/siswa", (req, res) => {
  const db = getDB();
  const studentData: Siswa = req.body;

  if (!studentData.nisn || !studentData.nama || !studentData.kelas) {
    return res.status(400).json({ error: "Lengkapi NISN, Nama, dan Kelas siswa!" });
  }

  const normalizedNisn = String(studentData.nisn).trim();

  const existingIndex = db.siswa.findIndex(s => String(s.nisn).trim() === normalizedNisn);
  if (existingIndex > -1) {
    db.siswa[existingIndex] = {
      ...db.siswa[existingIndex],
      ...studentData,
      nisn: normalizedNisn
    };
  } else {
    // Default pass is "123" if not set
    db.siswa.push({
      ...studentData,
      nisn: normalizedNisn,
      password: studentData.password || "123"
    });
  }

  saveDB(db);
  res.json({ success: true, list: db.siswa });
});

app.delete("/api/siswa/:nisn", (req, res) => {
  const db = getDB();
  const { nisn } = req.params;
  const targetNisn = String(nisn).trim();
  
  db.siswa = db.siswa.filter(s => String(s.nisn).trim() !== targetNisn);
  saveDB(db);
  res.json({ success: true, list: db.siswa });
});

// Soal (Question) Management
app.get("/api/soal", (req, res) => {
  const db = getDB();
  res.json(db.soal);
});

app.post("/api/soal", (req, res) => {
  const db = getDB();
  const soalData: Soal = req.body;

  if (!soalData.teks || !soalData.opsi || !soalData.kunci) {
    return res.status(400).json({ error: "Data soal tidak lengkap (teks, opsi, kunci wajib)!" });
  }

  const existingIndex = db.soal.findIndex(s => s.id === soalData.id);
  if (existingIndex > -1) {
    db.soal[existingIndex] = soalData;
  } else {
    soalData.id = soalData.id || `S${String(db.soal.length + 1).padStart(3, "0")}`;
    db.soal.push(soalData);
  }

  saveDB(db);
  res.json({ success: true, list: db.soal });
});

app.delete("/api/soal/:id", (req, res) => {
  const db = getDB();
  const { id } = req.params;
  db.soal = db.soal.filter(s => s.id !== id);
  // Also clean up assigned questions in exams
  db.ujian = db.ujian.map(uj => ({
    ...uj,
    soalIds: uj.soalIds.filter(sId => sId !== id)
  }));
  saveDB(db);
  res.json({ success: true, list: db.soal });
});

// Ujian (Exams) Management
app.get("/api/ujian", (req, res) => {
  const db = getDB();
  res.json(db.ujian);
});

app.post("/api/ujian", (req, res) => {
  const db = getDB();
  const examData: Ujian = req.body;

  if (!examData.mapel || !examData.tanggal || !examData.durasi || !examData.token) {
    return res.status(400).json({ error: "Data sesi ujian tidak lengkap!" });
  }

  const existingIndex = db.ujian.findIndex(u => u.id === examData.id);
  if (existingIndex > -1) {
    db.ujian[existingIndex] = examData;
  } else {
    examData.id = examData.id || `U${String(db.ujian.length + 1).padStart(3, "0")}`;
    examData.soalIds = examData.soalIds || [];
    db.ujian.push(examData);
  }

  saveDB(db);
  res.json({ success: true, list: db.ujian });
});

app.delete("/api/ujian/:id", (req, res) => {
  const db = getDB();
  const { id } = req.params;
  db.ujian = db.ujian.filter(u => u.id !== id);
  // Also delete associated student results if necessary, or keep them. Let's keep them so historical data is saved.
  saveDB(db);
  res.json({ success: true, list: db.ujian });
});

// Validate exam token for a student
app.post("/api/ujian/validate-token", (req, res) => {
  const { token, nisn } = req.body;
  if (!token) return res.status(400).json({ error: "Token tidak boleh kosong!" });

  const db = getDB();
  const exam = db.ujian.find(u => u.token.toUpperCase() === token.toUpperCase());

  if (!exam) {
    return res.status(404).json({ error: "Token Ujian tidak ditemukan atau salah!" });
  }

  if (!exam.aktif) {
    return res.status(400).json({ error: "Ujian ini belum diaktifkan oleh pengawas!" });
  }

  // Check if student has already completed this exam
  const completed = db.hasilUjian.find(h => h.ujianId === exam.id && String(h.nisn).trim() === String(nisn || "").trim() && h.selesai);
  if (completed) {
    return res.status(400).json({ error: "Anda sudah menyelesaikan ujian ini sebelumnya!" });
  }

  const alreadyStarted = db.hasilUjian.find(h => h.ujianId === exam.id && String(h.nisn).trim() === String(nisn || "").trim());

  // Return the exam config and questions!
  const examQuestions = exam.soalIds.map(sId => db.soal.find(s => s.id === sId)).filter(Boolean) as Soal[];

  res.json({
    success: true,
    exam,
    questions: examQuestions.map(q => ({
      id: q.id,
      teks: q.teks,
      gambarUrl: q.gambarUrl,
      opsi: q.opsi
      // Avoid sending correct keys directly to the client to prevent easy devtools inspection cheating!
    })),
    alreadyStarted: !!alreadyStarted,
    savedAnswers: alreadyStarted ? alreadyStarted.jawaban : {},
    savedRagu: alreadyStarted ? alreadyStarted.raguRagu : {},
    mulaiAt: alreadyStarted ? alreadyStarted.mulaiAt : new Date().toISOString(),
    pelanggaranCount: alreadyStarted ? alreadyStarted.pelanggaranCount : 0
  });
});

// Submit Exam (or intermediate save state)
app.post("/api/ujian/submit", (req, res) => {
  const { examId, nisn, answers, raguRagu, selesai, pelanggaranCount, mulaiAt } = req.body;
  const db = getDB();

  const exam = db.ujian.find(u => u.id === examId);
  const student = db.siswa.find(s => String(s.nisn).trim() === String(nisn || "").trim());

  if (!exam || !student) {
    return res.status(404).json({ error: "Ujian atau Siswa tidak ditemukan!" });
  }

  // Calculate scores if finished
  let score = 0;
  let correctSum = 0;
  let wrongSum = 0;

  const totalQuestions = exam.soalIds.length;
  if (totalQuestions > 0) {
    exam.soalIds.forEach(qId => {
      const q = db.soal.find(s => s.id === qId);
      if (q) {
        const studentAns = answers[qId] || "";
        if (studentAns === q.kunci) {
          correctSum++;
        } else if (studentAns !== "") {
          wrongSum++;
        }
      }
    });
    score = parseFloat(((correctSum / totalQuestions) * 100).toFixed(2));
  }

  const existingResultIndex = db.hasilUjian.findIndex(h => h.ujianId === examId && String(h.nisn).trim() === String(nisn || "").trim());
  
  const resultPayload: HasilUjian = {
    id: existingResultIndex > -1 ? db.hasilUjian[existingResultIndex].id : `H${Date.now()}-${nisn}`,
    ujianId: examId,
    nisn,
    siswaNama: student.nama,
    siswaKelas: student.kelas,
    mapel: exam.mapel,
    jawaban: answers,
    raguRagu: raguRagu || {},
    nilai: score,
    benar: correctSum,
    salah: wrongSum,
    selesai: !!selesai,
    mulaiAt: mulaiAt || db.hasilUjian[existingResultIndex]?.mulaiAt || new Date().toISOString(),
    selesaiAt: selesai ? new Date().toISOString() : undefined,
    pelanggaranCount: pelanggaranCount || 0
  };

  if (existingResultIndex > -1) {
    // If it was already finalized, don't overwrite with regression
    if (db.hasilUjian[existingResultIndex].selesai && !selesai) {
      return res.status(400).json({ error: "Ujian ini telah selesai dikirim secara final." });
    }
    db.hasilUjian[existingResultIndex] = resultPayload;
  } else {
    db.hasilUjian.push(resultPayload);
  }

  saveDB(db);
  res.json({
    success: true,
    score: selesai ? score : undefined,
    done: selesai,
    correctCount: correctSum,
    wrongCount: wrongSum,
    unansweredCount: totalQuestions - (correctSum + wrongSum)
  });
});

// View all results
app.get("/api/hasil", (req, res) => {
  const db = getDB();
  res.json(db.hasilUjian);
});

// Clear results (for reset tests)
app.delete("/api/hasil/:id", (req, res) => {
  const db = getDB();
  const { id } = req.params;
  db.hasilUjian = db.hasilUjian.filter(h => h.id !== id);
  saveDB(db);
  res.json({ success: true, list: db.hasilUjian });
});

// Setup Vite & static files serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Vite Dev Server Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static asset build serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server CBT berjalan di port ${PORT}`);
  });
}

startServer();
