import { parseEpub } from "./epubParser.js";
import { chunkChapters } from "./chunker.js";
import { embedBatch } from "./embedder.js";
import {
    ensureCollection,
    upsertBookChunks,
    deleteBookVectors,
} from "./qdrantClient.js";

/**
 * Full ingestion pipeline for a single EPUB file.
 * TO BE CALLED FROM THE UPLOAD ROUTE...
 *
 * @param {string} epubFilePath absolute path to the .epub on disk
 * @param {string} bookId the MongoDB ObjectId string for the book
 * @param {object} opts
 * @returns {{ chunkCount: number, metadata: object }}
 */
export async function ingestBook(epubFilePath, bookId, opts = {}) {
    const { chunkSize = 1000, chunkOverlap = 200, batchSize = 16 } = opts;

    console.log(`[ingest] Starting ingestion for book ${bookId}`);
    console.log(`[ingest] Parsing EPUB: ${epubFilePath}`);

    const { metadata, chapters } = await parseEpub(epubFilePath);
    console.log(
        `[ingest] Parsed ${chapters.length} chapters from "${metadata.title}"`,
    );

    if (chapters.length === 0) {
        console.warn("[ingest] No chapters found skipping.");
        return { chunkCount: 0, metadata };
    }

    const chunks = chunkChapters(chapters, { chunkSize, chunkOverlap });
    console.log(`[ingest] Created ${chunks.length} chunks`);

    const texts = chunks.map((c) => c.text);
    const vectors = await embedBatch(texts, batchSize);

    await ensureCollection();
    await deleteBookVectors(bookId);
    await upsertBookChunks(bookId, chunks, vectors);

    console.log(
        `[ingest] Done ${chunks.length} chunks indexed for "${metadata.title}"`,
    );

    return { chunkCount: chunks.length, metadata };
}
