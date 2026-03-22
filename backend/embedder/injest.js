import { parseEpub } from "../utils/epubParser.js";
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
export async function ingestBook(epubFilePath, bookId, opts = {}, onProgress) {
    const { chunkSize = 1000, chunkOverlap = 200, batchSize = 16 } = opts;

    // I am adding this as a safety net just in case onProgress is null
    const report = onProgress ? onProgress : () => {};

    console.log(`[ingest] Starting ingestion for book ${bookId}`);

    // 1. Start ingestion
    report({ stage: "parsing", message: "Parsing EPUB file" });
    console.log(`[ingest] Parsing EPUB: ${epubFilePath}`);

    const { metadata, chapters } = await parseEpub(epubFilePath);
    console.log(
        `[ingest] Parsed ${chapters.length} chapters from "${metadata.title}"`,
    );

    if (chapters.length === 0) {
        console.warn("[ingest] No chapters found skipping.");
        return { chunkCount: 0, metadata };
    }

    // 2. Start chunking process
    report({
        stage: "chunking",
        message: `Chunking ${chapters.length} chapters`,
    });
    const chunks = chunkChapters(chapters, { chunkSize, chunkOverlap });
    const totalChunks = chunks.length;

    console.log(`[ingest] Created ${chunks.length} chunks`);
    report({
        stage: "chunking",
        done: totalChunks,
        total: totalChunks,
        message: `Created ${totalChunks} chunks`,
    });

    // 3. Start batch embedding
    report({
        stage: "embedding",
        done: 0,
        total: totalChunks,
        message: "Starting embedding",
    });

    const texts = chunks.map((c) => c.text);
    const vectors = await embedBatch(texts, batchSize, (done) => {
        report({ stage: "embedding", done, total: totalChunks });
    });

    // 4. Upsert into Qdrant
    report({
        stage: "upserting",
        done: 0,
        total: totalChunks,
        message: "Storing vectors in Qdrant",
    });

    await ensureCollection();
    await deleteBookVectors(bookId);
    await upsertBookChunks(bookId, chunks, vectors);

    // 5. DONE :)
    report({ stage: "complete", done: totalChunks, total: totalChunks });
    console.log(
        `[ingest] Done ${chunks.length} chunks indexed for "${metadata.title}"`,
    );

    return { chunkCount: chunks.length, metadata };
}
