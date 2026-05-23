import { DatabaseSchema } from "../types";

export const initialDbData: DatabaseSchema = {
  siswa: [
    {
      nisn: "12345678",
      nama: "Budi Satria",
      kelas: "XII MIPA 1",
      password: "123"
    },
    {
      nisn: "87654321",
      nama: "Siti Rahma",
      kelas: "XII MIPA 2",
      password: "123"
    },
    {
      nisn: "11223344",
      nama: "Andi Wijaya",
      kelas: "XII IPS 1",
      password: "123"
    }
  ],
  soal: [
    {
      id: "S001",
      teks: "Manakah kalimat berikut yang menggunakan ejaan Bahasa Indonesia yang disempurnakan (EYD) secara tepat?",
      opsi: {
        A: "Kita harus ber-tanggung jawab atas semua pekerjaan ini.",
        B: "Silahkan masuk ke ruang ujian dengan tenang.",
        C: "Aktivitas belajar mengajar akan segera dimulai.",
        D: "Pertanggung-jawaban panitia ujian telah diterima.",
        E: "Seluruh peserta ujian di himbau menggunakan pakaian rapi."
      },
      kunci: "C"
    },
    {
      id: "S002",
      teks: "Hasil nilai dari 3x² - 5x + 2 = 0 untuk x = 2 adalah...",
      opsi: {
        A: "4",
        B: "6",
        C: "2",
        D: "8",
        E: "0"
      },
      kunci: "A"
    },
    {
      id: "S003",
      teks: "Sebuah mobil bergerak dengan kecepatan awal 10 m/s kemudian mengalami percepatan tetap sebesar 2 m/s² selama 5 detik. Berapakah kecepatan akhir mobil tersebut?",
      opsi: {
        A: "15 m/s",
        B: "20 m/s",
        C: "25 m/s",
        D: "30 m/s",
        E: "35 m/s"
      },
      kunci: "B"
    },
    {
      id: "S004",
      teks: "Gaya tarik-menarik antara dua muatan listrik berbanding lurus dengan hasil kali kedua muatan dan berbanding terbalik dengan kuadrat jarak kedua muatan. Hukum fisika ini dikenal sebagai...",
      opsi: {
        A: "Hukum Newton",
        B: "Hukum Faraday",
        C: "Hukum Coulomb",
        D: "Hukum Ohm",
        E: "Hukum Ampere"
      },
      kunci: "C"
    },
    {
      id: "S005",
      teks: "Ideologi Pancasila merupakan landasan filosofis bangsa Indonesia. Sila Persatuan Indonesia menduduki urutan sila ke...",
      opsi: {
        A: "Pertama",
        B: "Kedua",
        C: "Ketiga",
        D: "Keempat",
        E: "Kelima"
      },
      kunci: "C"
    }
  ],
  ujian: [
    {
      id: "U001",
      mapel: "Ujian Akhir Sekolah: Bahasa Indonesia & Eksakta",
      tanggal: "2026-05-23",
      durasi: 15, // 15 mins for fast showcase/testing
      token: "CBT2026",
      aktif: true,
      soalIds: ["S001", "S002", "S003", "S004", "S005"]
    }
  ],
  hasilUjian: []
};
