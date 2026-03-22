import { getIO } from "./index.js";

export function emitIngestProgress(bookId, uid, data) {
    try {
        const io = getIO();
        io.emit("ingest:progress", { bookId, uid, ...data });
    } catch (err) {
        console.error("[socket:ingest] Failed to emit progress:", err.message);
    }
}
