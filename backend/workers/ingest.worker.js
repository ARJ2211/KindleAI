import { parentPort, workerData } from "node:worker_threads";
import { ingestBook } from "../embedder/injest.js";

const { epubPath, bookId } = workerData;
console.log(`[worker:ingest]: Executing ingest worker`);

ingestBook(epubPath, bookId)
    .then((result) => {
        parentPort.postMessage({ success: true, ...result });
    })
    .catch((err) => {
        parentPort.postMessage({ success: false, error: err.message });
    });
