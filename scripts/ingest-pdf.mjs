#!/usr/bin/env node
// Turns a research PDF into small text passages ("chunks") we can safely feed
// to the AI as grounding data. Run with:
//
//   node scripts/ingest-pdf.mjs <path-to-pdf> \
//     --id jiskoot2022 \
//     --title "Cognitive behavioural therapy for depression in women with PCOS: systematic review and meta-analysis" \
//     --authorsYear "Jiskoot et al., 2022" \
//     --journal "Reproductive BioMedicine Online" \
//     --url "https://doi.org/10.1016/j.rbmo.2022.05.001" \
//     --summary "Short one-sentence summary of the paper for the citation list."
//
// Output: pdf-sources/processed/<id>.json — read by src/lib/pdf-sources.ts.
// See HOW_IT_WORKS_v1.md for the full walkthrough.

import { PDFParse } from "pdf-parse";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const MAX_CHUNK_CHARS = 800;
const REFERENCE_DENSITY_THRESHOLD = 0.012; // "et al."/"XXXX;" density above this = bibliography page, skip

function parseArgs(argv) {
  const [pdfPath, ...rest] = argv;
  const args = { pdfPath };
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i].replace(/^--/, "");
    args[key] = rest[i + 1];
  }
  return args;
}

function looksLikeBibliography(pageText) {
  const refMarkers = (pageText.match(/et al\.,|\b(19|20)\d{2}[;)]/g) || []).length;
  return refMarkers / Math.max(pageText.length, 1) > REFERENCE_DENSITY_THRESHOLD;
}

function splitIntoChunks(pageText, page, id) {
  const normalized = pageText.replace(/\s+/g, " ").trim();
  const sentences = normalized.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + " " + sentence).length > MAX_CHUNK_CHARS && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks
    .filter((c) => c.length > 60) // drop scraps (headers, page numbers, etc.)
    .map((text, i) => ({
      chunkId: `${id}-p${page}-${i + 1}`,
      page,
      text,
    }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.pdfPath || !args.id) {
    console.error(
      "Usage: node scripts/ingest-pdf.mjs <path-to-pdf> --id <citationId> --title \"...\" --authorsYear \"...\" --journal \"...\" --url \"...\" --summary \"...\""
    );
    process.exit(1);
  }

  const buffer = await readFile(args.pdfPath);
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();

  let skippedPages = 0;
  const chunks = [];
  for (const page of result.pages) {
    if (looksLikeBibliography(page.text)) {
      skippedPages++;
      continue;
    }
    chunks.push(...splitIntoChunks(page.text, page.num, args.id));
  }

  const output = {
    id: args.id,
    title: args.title ?? "(add a title with --title)",
    authorsYear: args.authorsYear ?? "(add with --authorsYear)",
    journal: args.journal ?? "(add with --journal)",
    url: args.url ?? "(add with --url)",
    summary: args.summary ?? "(add a short summary with --summary)",
    sourceFile: path.basename(args.pdfPath),
    totalPages: result.total,
    chunkCount: chunks.length,
    chunks,
  };

  const outDir = path.join(process.cwd(), "pdf-sources", "processed");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `${args.id}.json`);
  await writeFile(outPath, JSON.stringify(output, null, 2));

  console.log(`✓ Extracted ${chunks.length} chunks from ${result.total} pages (skipped ${skippedPages} bibliography-like pages)`);
  console.log(`✓ Wrote ${outPath}`);
  console.log(`\nNext: check the citation fields above look right, then add "${args.id}" to PDF_DOC_IDS in src/lib/pdf-sources.ts.`);
}

main().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
