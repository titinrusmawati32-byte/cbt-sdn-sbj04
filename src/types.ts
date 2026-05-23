export interface Siswa {
  nisn: string;
  nama: string;
  kelas: string;
  password?: string;
}

export interface Soal {
  id: string;
  teks: string;
  gambarUrl?: string;
  opsi: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
  kunci: "A" | "B" | "C" | "D" | "E";
  mapel?: string;
}

export interface Ujian {
  id: string;
  mapel: string;
  tanggal: string;
  durasi: number; // in minutes
  token: string;
  aktif: boolean;
  soalIds: string[];
}

export interface JawabanSiswa {
  pilihan: string; // "A" | "B" | "C" | "D" | "E" | ""
  ragu: boolean;
}

export interface HasilUjian {
  id: string;
  ujianId: string;
  nisn: string;
  siswaNama: string;
  siswaKelas: string;
  mapel: string;
  jawaban: Record<string, string>; // questionId -> answer ("A" | "B" | "C" | "D" | "E")
  raguRagu: Record<string, boolean>; // questionId -> isDoubtful (true/false)
  nilai: number; // calculated score
  benar: number;
  salah: number;
  selesai: boolean;
  mulaiAt: string; // ISO date
  selesaiAt?: string; // ISO date
  pelanggaranCount: number; // tab level anti-cheat switch triggers
}

export interface DatabaseSchema {
  siswa: Siswa[];
  soal: Soal[];
  ujian: Ujian[];
  hasilUjian: HasilUjian[];
}
