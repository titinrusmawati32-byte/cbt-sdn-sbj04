import * as mammoth from "mammoth";

export interface ParsedSoal {
  tempId: string;
  teks: string;
  opsi: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
  kunci: "A" | "B" | "C" | "D" | "E";
}

/**
 * Parses raw text imported/copied from MS Word questions.
 */
export function parseWordText(text: string): ParsedSoal[] {
  if (!text) return [];

  // Normalize lines: split, trim, filter blank
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  
  const parsedQuestions: ParsedSoal[] = [];
  let currentTeksLines: string[] = [];
  let currentOpsi: Record<string, string> = { A: "", B: "", C: "", D: "", E: "" };
  let currentKunci: "A" | "B" | "C" | "D" | "E" = "A";
  let hasOpsi = false;

  const commitQuestion = () => {
    // Determine the question text
    if (currentTeksLines.length > 0) {
      let rawTeks = currentTeksLines.join("\n").trim();
      
      // Clean up common question prefixes like "1.", "Soal No. 1", "No 1. "
      const cleanedTeks = rawTeks
        .replace(/^\d+[\.\)]\s*/, "") // Matches "1. " or "1) "
        .replace(/^[sS]oal\s+(?:No\.?\s*)?\d+[\.\)\:]?\s*/i, "") // Matches "Soal No 1. " or "Soal 1:"
        .replace(/^[nN]o\s*(?:\.\s*)?\d+[\.\)\:]?\s*/i, "") // Matches "No. 1: " or "No 1) "
        .trim();

      if (cleanedTeks) {
        parsedQuestions.push({
          tempId: `TEMP_SOAL_${Math.random().toString(36).substr(2, 9)}`,
          teks: cleanedTeks,
          opsi: {
            A: currentOpsi.A || "Opsi A belum diisi",
            B: currentOpsi.B || "Opsi B belum diisi",
            C: currentOpsi.C || "Opsi C belum diisi",
            D: currentOpsi.D || "Opsi D belum diisi",
            E: currentOpsi.E || "Opsi E belum diisi",
          },
          kunci: currentKunci,
        });
      }
    }

    // Reset loop placeholders
    currentTeksLines = [];
    currentOpsi = { A: "", B: "", C: "", D: "", E: "" };
    currentKunci = "A";
    hasOpsi = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Detect Option Line: "A. Opsi text" or "A) Opsi text"
    const optMatch = line.match(/^\s*([A-Ea-e])\s*[\.\)]\s*(.*)$/);
    
    // 2. Detect Answer Key Line: "Kunci: A" or "Kunci Jawaban: B" or "Kunci: A"
    const keyMatch = line.match(/^\s*(?:Kunci|Kunci\s*Jawaban|Jawaban|Jawab|Keys?|Answer)\s*[:\s\-]*\s*([A-Ea-e])\s*$/i);

    // 3. Detect New Question: Starts with "1." or "No. 1" or "Soal Nomor 1" OR a double break is inferred
    const isNewQuestionHeader = line.match(/^\s*(?:[sS]oal|[nN]o\.?|[nN]omor)?\s*(\d+)[\.\)]\s*(.*)$/i);

    if (keyMatch) {
      currentKunci = keyMatch[1].toUpperCase() as "A" | "B" | "C" | "D" | "E";
    } else if (optMatch) {
      const char = optMatch[1].toUpperCase();
      const text = optMatch[2].trim();
      currentOpsi[char] = text;
      hasOpsi = true;
    } else if (isNewQuestionHeader) {
      // If we already started building a question and see another numbered start, commit current
      if (currentTeksLines.length > 0 && (hasOpsi || line.includes("?"))) {
        commitQuestion();
      }
      currentTeksLines.push(line);
    } else {
      // Normal sentence. If options have already been filled, maybe it's some explanation or text after options.
      // Usually, it's a part of the question text.
      if (hasOpsi) {
        // Appended to the last non-empty option or ignored if final.
        // For general safety, append to question details or the current option
        const lastOptFilled = ["E", "D", "C", "B", "A"].find(o => currentOpsi[o] !== "");
        if (lastOptFilled) {
          currentOpsi[lastOptFilled] += "\n" + line;
        } else {
          currentTeksLines.push(line);
        }
      } else {
        currentTeksLines.push(line);
      }
    }
  }

  // Commit the final question
  commitQuestion();

  // If fallback is needed (case: no numbers were parsed (e.g. users just listed paragraphs))
  if (parsedQuestions.length === 0 && lines.length > 0) {
    // Attempt double newline / paragraphs chunks parsing
    const chunks = text.split(/\n\s*\n/).filter(c => c.trim().length > 0);
    for (const chunk of chunks) {
      const chunkLines = chunk.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (chunkLines.length > 0) {
        let textLines: string[] = [];
        let chunkOpsi: Record<string, string> = { A: "", B: "", C: "", D: "", E: "" };
        let chunkKunci: "A" | "B" | "C" | "D" | "E" = "A";

        for (const cl of chunkLines) {
          const optM = cl.match(/^\s*([A-Ea-e])\s*[\.\)]\s*(.*)$/);
          const keyM = cl.match(/^\s*(?:Kunci|Kunci\s*Jawaban|Jawaban|Jawab|Keys?|Answer)\s*[:\s\-]*\s*([A-Ea-e])\s*$/i);
          if (keyM) {
            chunkKunci = keyM[1].toUpperCase() as "A" | "B" | "C" | "D" | "E";
          } else if (optM) {
            chunkOpsi[optM[1].toUpperCase()] = optM[2].trim();
          } else {
            textLines.push(cl);
          }
        }

        const rawT = textLines.join("\n").replace(/^\d+[\.\)]\s*/, "").trim();
        if (rawT) {
          parsedQuestions.push({
            tempId: `TEMP_SOAL_${Math.random().toString(36).substr(2, 9)}`,
            teks: rawT,
            opsi: {
              A: chunkOpsi.A || "Opsi A belum diisi",
              B: chunkOpsi.B || "Opsi B belum diisi",
              C: chunkOpsi.C || "Opsi C belum diisi",
              D: chunkOpsi.D || "Opsi D belum diisi",
              E: chunkOpsi.E || "Opsi E belum diisi"
            },
            kunci: chunkKunci
          });
        }
      }
    }
  }

  return parsedQuestions;
}

/**
 * Extracts raw MS Word text from arrayBuffer using mammoth
 */
export async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || "";
  } catch (error) {
    console.error("Mammoth docx text extraction failed:", error);
    throw new Error("Gagal membaca struktur file Word (.docx). Pastikan file tidak terenkripsi/rusak.");
  }
}
