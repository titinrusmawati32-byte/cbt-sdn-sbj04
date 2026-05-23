import * as XLSX from "xlsx";

export interface ParsedStudent {
  nisn: string;
  nama: string;
  kelas: string;
  password?: string;
}

/**
 * Parses a student excel sheet (.xlsx, .xls) returning a list of ParsedStudent
 */
export function parseStudentExcel(arrayBuffer: ArrayBuffer): ParsedStudent[] {
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const worksheet = workbook.Sheets[sheetName];
  // Get raw JSON rows
  const rawRows = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
  if (rawRows.length === 0) return [];

  // Find header row or assume row 0 is header
  const headerIdx = 0;
  const headers = rawRows[headerIdx].map((h: any) => String(h || "").trim().toLowerCase());

  // Detect column mapping indices
  let nisnColIdx = headers.findIndex((h) => h.includes("nisn") || h.includes("nomor induk") || h.includes("id") || h.includes("username"));
  let namaColIdx = headers.findIndex((h) => h.includes("nama") || h.includes("lengkap") || h.includes("name"));
  let kelasColIdx = headers.findIndex((h) => h.includes("kelas") || h.includes("class") || h.includes("tingkat"));
  let passColIdx = headers.findIndex((h) => h.includes("sandi") || h.includes("password") || h.includes("pin") || h.includes("pass"));

  // If we couldn't match headers, default to indices 0, 1, 2, 3
  if (nisnColIdx === -1) nisnColIdx = 0;
  if (namaColIdx === -1) namaColIdx = 1;
  if (kelasColIdx === -1) kelasColIdx = 2;
  if (passColIdx === -1) passColIdx = 3;

  const results: ParsedStudent[] = [];

  // Start reading from row after header
  for (let r = 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const rawNisn = String(row[nisnColIdx] !== undefined ? row[nisnColIdx] : "").trim();
    const rawNama = String(row[namaColIdx] !== undefined ? row[namaColIdx] : "").trim();
    const rawKelas = String(row[kelasColIdx] !== undefined ? row[kelasColIdx] : "").trim();
    const rawPass = row[passColIdx] !== undefined ? String(row[passColIdx]).trim() : "123";

    if (rawNisn && rawNama && rawKelas) {
      results.push({
        nisn: rawNisn,
        nama: rawNama,
        kelas: rawKelas,
        password: rawPass || "123"
      });
    }
  }

  // Fallback: If no match was found but rows are present, maybe the first row wasn't headers
  if (results.length === 0 && rawRows.length > 0) {
    for (const row of rawRows) {
      if (!row || row.length < 3) continue;
      const rawNisn = String(row[0] || "").trim();
      const rawNama = String(row[1] || "").trim();
      const rawKelas = String(row[2] || "").trim();
      const rawPass = String(row[3] || "123").trim();

      // Ensure first column is somewhat a numeric NISN (or any numeric code)
      if (rawNisn && rawNama && rawKelas && rawNisn.toLowerCase() !== "nisn") {
        results.push({
          nisn: rawNisn,
          nama: rawNama,
          kelas: rawKelas,
          password: rawPass || "123"
        });
      }
    }
  }

  return results;
}
