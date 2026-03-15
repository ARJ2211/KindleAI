import { randomUUID } from "crypto";
import { QdrantClient } from "@qdrant/js-client-rest";
import { VECTOR_DIM } from "./embedder.js";
import { throwError } from "../helper.js";

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const COLLECTION = "book_chunks";

/**
 * Resort to a new client (Prev method caused Qdrant to close connections)
 * @returns {QdrantClient}
 */
function getClient() {
    return new QdrantClient({ url: QDRANT_URL, timeout: 30000 });
}

/**
 * Ensure the book_chunks collection exists in Qdrant.
 * Safe to call multiple times, skips if already created.
 */
export async function ensureCollection() {
    const client = getClient();

    const { collections } = await client.getCollections();
    const exists = collections.some((c) => c.name === COLLECTION);

    if (!exists) {
        await client.createCollection(COLLECTION, {
            vectors: {
                size: VECTOR_DIM,
                distance: "Cosine",
            },
        });
        // Index on bookId so we can filter searches per book
        await client.createPayloadIndex(COLLECTION, {
            field_name: "bookId",
            field_schema: "keyword",
        });
        console.log(`[qdrant] Created collection "${COLLECTION}"`);
    }

    return COLLECTION;
}

/**
 * Upsert chunk vectors for a specific book.
 *
 * @param {string} bookId MongoDB ObjectId string for the book
 * @param {{ text: string, chapterId: string, chapterTitle: string, chunkIndex: number }[]} chunks
 * @param {number[][]} vectors matching array of embedding vectors
 */
export async function upsertBookChunks(bookId, chunks, vectors) {
    const client = getClient();
    await ensureCollection();

    const points = chunks.map((chunk, i) => ({
        id: randomUUID(),
        vector: vectors[i],
        payload: {
            bookId,
            chapterId: chunk.chapterId,
            chapterTitle: chunk.chapterTitle,
            chunkIndex: chunk.chunkIndex,
            text: chunk.text,
        },
    }));

    const BATCH = 100;
    for (let i = 0; i < points.length; i += BATCH) {
        await client.upsert(COLLECTION, {
            wait: true,
            points: points.slice(i, i + BATCH),
        });
        // Small pause between batches to avoid connection exhaustion
        if (i + BATCH < points.length) {
            await new Promise((r) => setTimeout(r, 100));
        }
    }

    console.log(`[qdrant] Upserted ${points.length} chunks for book ${bookId}`);
}

/**
 * Search for the most relevant chunks for a query, scoped to a single book.
 *
 * @param {number[]} queryVector embedding of the user's question
 * @param {string} bookId limit results to this book
 * @param {number} topK how many chunks to return (default 5)
 * @returns {{ text: string, chapterTitle: string, chapterId: string, score: number }[]}
 */
export async function searchBook(queryVector, bookId, topK = 5) {
    const client = getClient();

    const results = await client.search(COLLECTION, {
        vector: queryVector,
        limit: topK,
        filter: {
            must: [{ key: "bookId", match: { value: bookId } }],
        },
        with_payload: true,
    });

    return results.map((r) => ({
        text: r.payload.text,
        chapterTitle: r.payload.chapterTitle,
        chapterId: r.payload.chapterId,
        score: r.score,
    }));
}

/**
 * Delete all vectors for a book (useful for reindexing).
 */
export async function deleteBookVectors(bookId) {
    const client = getClient();

    try {
        await client.delete(COLLECTION, {
            wait: true,
            filter: {
                must: [{ key: "bookId", match: { value: bookId } }],
            },
        });

        console.log(`[qdrant] Deleted all chunks for book ${bookId}`);
        return true;
    } catch (e) {
        console.log(`[qdrant] Failed to delete book ${bookId}`);
        throwError(500, "Failed to delete book vector");
    }

    return false;
}
