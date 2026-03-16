import * as uploadsData from "../data/uploadsData.js";
import { ingestBook } from "../embedder/injest.js";
import * as helper from "../helper.js";

/**
 * Handle the complete book upload workflow:
 * 1. Create upload record
 * 2. Trigger background processing (parse, chunk, embed, store)
 * 3. Update status accordingly
 *
 * @param {string} userId - Firebase UID
 * @param {string} bookId - MongoDB ObjectId string for the book
 * @param {Object} file - Multer file object
 * @param {string} file.originalname
 * @param {number} file.size
 * @param {string} file.mimetype
 * @param {string} file.path - Absolute path to uploaded file on disk
 * @returns {Object} upload record
 */
export async function handleBookUpload(userId, bookId, file) {
    userId = helper.isValidString(userId);
    bookId = helper.isValidString(bookId);

    if (!file || !file.path) {
        helper.throwError(400, "File is required");
    }

    if (!file.originalname.toLowerCase().endsWith(".epub")) {
        helper.throwError(400, "Only EPUB files are supported");
    }

    // 1. Create upload record in database
    const upload = await uploadsData.createUpload(
        userId,
        bookId,
        file.originalname,
        file.size,
        file.mimetype || "application/epub+zip",
    );

    // 2. Start processing in background (don't block the response)
    processInBackground(upload._id.toString(), bookId, file.path);

    // 3. Return upload record immediately (status: "pending")
    return upload;
}

/**
 * Background processing for the uploaded EPUB.
 * This runs asynchronously after the upload record is created.
 *
 * @param {string} uploadId
 * @param {string} bookId
 * @param {string} filePath - Absolute path to the EPUB file
 */
async function processInBackground(uploadId, bookId, filePath) {
    try {
        console.log(`[uploadService] Starting background processing for upload ${uploadId}`);

        // Update status to "processing"
        await uploadsData.updateUploadStatus(uploadId, "processing");

        // Run the full ingestion pipeline:
        // - Parse EPUB
        // - Chunk chapters
        // - Create embeddings
        // - Store in Qdrant
        const result = await ingestBook(filePath, bookId, {
            chunkSize: 1000,
            chunkOverlap: 200,
            batchSize: 16,
        });

        console.log(
            `[uploadService] Successfully processed ${result.chunkCount} chunks for book "${result.metadata.title}"`,
        );

        // Update status to "completed"
        await uploadsData.updateUploadStatus(uploadId, "completed");

        console.log(`[uploadService] Upload ${uploadId} marked as completed`);
    } catch (error) {
        console.error(`[uploadService] Processing failed for upload ${uploadId}:`, error);

        // Update status to "failed" with error message
        await uploadsData.updateUploadStatus(
            uploadId,
            "failed",
            error.message || "Unknown error during processing",
        );
    }
}

/**
 * Get upload status (useful for polling from frontend).
 *
 * @param {string} uploadId
 * @returns {Object} upload record with current status
 */
export async function getUploadStatus(uploadId) {
    return await uploadsData.getUploadById(uploadId);
}

/**
 * Get all uploads for a user.
 *
 * @param {string} userId - Firebase UID
 * @returns {Array} user's uploads
 */
export async function getUserUploads(userId) {
    userId = helper.isValidString(userId);
    return await uploadsData.getUploadsByUserId(userId);
}

/**
 * Retry processing for a failed upload.
 *
 * @param {string} uploadId
 * @param {string} filePath - Absolute path to the EPUB file
 * @returns {Object} updated upload record
 */
export async function retryUpload(uploadId, filePath) {
    const upload = await uploadsData.getUploadById(uploadId);

    if (upload.status !== "failed") {
        helper.throwError(400, "Only failed uploads can be retried");
    }

    // Reset error and start processing again
    await uploadsData.updateUpload(uploadId, {
        error: null,
        status: "pending",
    });

    processInBackground(uploadId, upload.book_id, filePath);

    return await uploadsData.getUploadById(uploadId);
}

/**
 * Delete an upload record (does NOT delete the book or its vectors).
 *
 * @param {string} uploadId
 * @returns {boolean} true if deleted
 */
export async function deleteUpload(uploadId) {
    return await uploadsData.deleteUpload(uploadId);
}

/**
 * Reprocess an existing book (useful if embeddings need updating).
 * Deletes old vectors and re-indexes the book.
 *
 * @param {string} bookId
 * @param {string} filePath - Absolute path to the EPUB file
 * @returns {Object} result from ingestBook
 */
export async function reprocessBook(bookId, filePath) {
    bookId = helper.isValidString(bookId);

    if (!filePath) {
        helper.throwError(400, "File path is required");
    }

    console.log(`[uploadService] Reprocessing book ${bookId}`);

    // This will automatically delete old vectors before upserting new ones
    const result = await ingestBook(filePath, bookId, {
        chunkSize: 1000,
        chunkOverlap: 200,
        batchSize: 16,
    });

    console.log(`[uploadService] Reprocessing complete for book ${bookId}`);

    return result;
}