import { pipeline } from "@xenova/transformers";

const MODEL_NAME = "Xenova/bge-large-en-v1.5";
export const VECTOR_DIM = 1024;

const QUERY_PREFIX =
    "Represent this sentence for searching relevant passages: ";

let _embedder = null;

/**
 * Lazily load the embedding model
 */
async function getEmbedder() {
    if (!_embedder) {
        console.log(`[embedder] Loading model ${MODEL_NAME} ...`);
        _embedder = await pipeline("feature-extraction", MODEL_NAME);
        console.log("[embedder] Model ready.");
    }
    return _embedder;
}

/**
 * Embed a single query string (adds the BGE query prefix).
 * We can use this for user questions in the chat.
 */
export async function embedText(text) {
    const model = await getEmbedder();
    const output = await model(QUERY_PREFIX + text, {
        pooling: "cls",
        normalize: true,
    });
    return Array.from(output.data);
}

/**
 * Embed an array of document strings in batches (no prefix — these are passages).
 * Use this for book chunks during ingestion.
 *
 * @param {string[]} texts
 * @param {number} batchSize default 8
 * @returns {number[][]} vector embedding
 */
export async function embedBatch(texts, batchSize = 8) {
    const model = await getEmbedder();
    const vectors = [];

    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const output = await model(batch, { pooling: "cls", normalize: true });

        for (let j = 0; j < batch.length; j++) {
            const start = j * VECTOR_DIM;
            const vec = Array.from(
                output.data.slice(start, start + VECTOR_DIM),
            );
            vectors.push(vec);
        }

        if (texts.length > batchSize) {
            console.log(
                `[embedder] Embedded ${Math.min(i + batchSize, texts.length)}/${texts.length} chunks`,
            );
        }
    }

    return vectors;
}
