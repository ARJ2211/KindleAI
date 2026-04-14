import { Worker } from "node:worker_threads";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const spawnWorker = (workerFile, data, onComplete, onProgress) => {
    const worker = new Worker(join(__dirname, workerFile), {
        workerData: data,
    });

    worker.on("message", (msg) => {
        if (msg.type === "progress") {
            if (onProgress) onProgress(msg);
        } else if (msg.type === "done") {
            if (msg.success) {
                onComplete(null, msg);
            } else {
                onComplete(new Error(msg.error));
            }
        } else {
            // Backwards compat: messages without type field
            if (msg.success) {
                onComplete(null, msg);
            } else {
                onComplete(new Error(msg.error));
            }
        }
    });

    worker.on("error", (err) => {
        onComplete(err);
    });
};

// Queue to cap concurrent ingest workers at 3, preventing OOM from loading the
// ~500MB embedding model across too many worker threads simultaneously.
const ingestQueue = [];
let ingestActiveCount = 0;
const INGEST_CONCURRENCY = 3;

const runNextIngest = () => {
    if (ingestActiveCount >= INGEST_CONCURRENCY || ingestQueue.length === 0) return;
    ingestActiveCount++;
    const { epubPath, bookId, onComplete, onProgress } = ingestQueue.shift();
    spawnWorker(
        "ingest.worker.js",
        { epubPath, bookId },
        (err, result) => {
            ingestActiveCount--;
            onComplete(err, result);
            runNextIngest();
        },
        onProgress,
    );
};

/**
 * This is a simple test to see if workers work
 * @param {*} onComplete
 */
export const testWorker = (onComplete) => {
    spawnWorker(
        "test.worker.js",
        { msg: "Hello from main thread" },
        onComplete,
    );
};

/**
 * This is the ingest worker that will be used to
 * ingest books and then dump into Qdrant
 *
 *
 * @param {string} epubPath Path of the epub file on disk
 * @param {string} bookId MongoDB book ID
 * @param {function} onComplete Callback function
 * @param {function} [onProgress] Optional progress callback ({ stage, done, total })
 */
export const ingestWorker = (epubPath, bookId, onComplete, onProgress) => {
    ingestQueue.push({ epubPath, bookId, onComplete, onProgress });
    runNextIngest();
};
