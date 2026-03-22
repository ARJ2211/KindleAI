import { Worker } from "node:worker_threads";
import { fork } from "node:child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * This is a helper wrapper function that will allow
 * us to spawn a worker thread for the given worker files
 *
 * Worker files:
 *    1. ingest worker - Ingest books, embedd them and store then in Qdrant
 *    2. tts worker    - Create the required WAV files for TTS (optionsal)
 *
 * @param {string} workerFile one of the workers in workers/*.worker.js
 * @param {object} data data required for the worker
 * @param {function} onComplete simple callback
 * @param {function} [onProgress] optional callback for intermediate progress
 */
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
    spawnWorker(
        "ingest.worker.js",
        { epubPath, bookId },
        onComplete,
        onProgress,
    );
};
