// Loads research PDFs that have been run through scripts/ingest-pdf.mjs (see
// pdf-sources/processed/*.json) and makes their text passages available as
// AI grounding data, the same way research-data.ts's hand-curated CITATIONS are.
//
// To add a new PDF: run the ingestion script, then add its id below.
import jiskoot2022 from "../../pdf-sources/processed/jiskoot2022.json";
import barber2021 from "../../pdf-sources/processed/barber2021.json";
import han2024 from "../../pdf-sources/processed/han2024.json";
import moinijazani2019 from "../../pdf-sources/processed/moinijazani2019.json";
import nhs2026medicines from "../../pdf-sources/processed/nhs2026medicines.json";
import nice2026 from "../../pdf-sources/processed/nice2026.json";
import { CITATIONS, Citation, EvidenceLevel, EVIDENCE_RANK } from "./research-data";

// Editorial evidence grade per ingested PDF (see research-data.ts EvidenceLevel):
// guidelines/meta-analyses = strong, narrative reviews = moderate, herbal/patient
// info = limited. Keep in sync when adding a PDF above.
const PDF_EVIDENCE_LEVELS: Record<string, EvidenceLevel> = {
  jiskoot2022: "strong", // systematic review + meta-analysis
  barber2021: "moderate", // narrative review
  han2024: "moderate", // mini-review
  moinijazani2019: "limited", // review of small herbal trials
  nhs2026medicines: "limited", // patient-information page, not graded evidence
  nice2026: "strong", // national clinical guideline
};

export interface PdfChunk {
  chunkId: string;
  page: number;
  text: string;
}

export interface PdfDoc {
  id: string;
  title: string;
  authorsYear: string;
  journal: string;
  url: string;
  summary: string;
  sourceFile: string;
  totalPages: number;
  chunkCount: number;
  chunks: PdfChunk[];
}

// Add newly-ingested PDFs to this list (import the JSON above, then list it here).
const PDF_DOCS: PdfDoc[] = [
  jiskoot2022 as PdfDoc,
  barber2021 as PdfDoc,
  han2024 as PdfDoc,
  moinijazani2019 as PdfDoc,
  nhs2026medicines as PdfDoc,
  nice2026 as PdfDoc,
];

export const PDF_CITATIONS: Record<string, Citation> = Object.fromEntries(
  PDF_DOCS.map((doc) => [
    doc.id,
    {
      id: doc.id,
      title: doc.title,
      authorsYear: doc.authorsYear,
      journal: doc.journal,
      url: doc.url,
      summary: doc.summary,
      evidenceLevel: PDF_EVIDENCE_LEVELS[doc.id],
    },
  ])
);

// Single merged lookup for rendering citation links, regardless of whether the
// source was hand-curated (research-data.ts) or ingested from a PDF.
export const ALL_CITATIONS: Record<string, Citation> = { ...CITATIONS, ...PDF_CITATIONS };

// The strongest evidence grade among a set of citation ids — used to badge and
// sort a "what science says" item. Returns undefined if none of the cited
// sources carry a grade (so the UI can simply omit the badge).
export function bestEvidenceLevel(citationIds: string[]): EvidenceLevel | undefined {
  let best: EvidenceLevel | undefined;
  let bestRank = 0;
  for (const id of citationIds) {
    const level = ALL_CITATIONS[id]?.evidenceLevel;
    if (level && EVIDENCE_RANK[level] > bestRank) {
      best = level;
      bestRank = EVIDENCE_RANK[level];
    }
  }
  return best;
}

/**
 * Very small "search": scores each chunk by how many keywords it contains and
 * returns the top matches. No embeddings/vector DB — fine for a handful of
 * PDFs. If we ingest many more documents, swap this for embedding similarity.
 */
export function findRelevantChunks(
  keywords: string[],
  maxChunks = 4
): { docId: string; docTitle: string; docAuthorsYear: string; chunk: PdfChunk }[] {
  const lowerKeywords = [...new Set(keywords.map((k) => k.toLowerCase().trim()).filter((k) => k.length > 2))];
  if (lowerKeywords.length === 0) return [];

  const scored: { doc: PdfDoc; chunk: PdfChunk; score: number }[] = [];
  for (const doc of PDF_DOCS) {
    for (const chunk of doc.chunks) {
      const text = chunk.text.toLowerCase();
      const score = lowerKeywords.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0);
      if (score > 0) scored.push({ doc, chunk, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxChunks).map(({ doc, chunk }) => ({
    docId: doc.id,
    docTitle: doc.title,
    docAuthorsYear: doc.authorsYear,
    chunk,
  }));
}
