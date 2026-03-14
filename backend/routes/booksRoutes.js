import { unlink } from "fs/promises";
import { Router } from "express";

import { finalizeUpload, getUpload } from "../utils/diskStorage.js";
import { verifyToken } from "../middleware/auth.js";
import { parseEpub } from "../utils/epubParser.js";
import { lookupBook } from "../utils/googleBooks.js";
import { ingestBook } from "../embedder/injest.js";

import * as bookData from "../data/bookData.js";
import * as redis from "../config/redisClient.js";

const upload = await getUpload();
const router = Router();

/** ===============================
 * PRIVATE: firebase token needed
 * ============================== */

// API call for uploading books to persistent file storage
// TODO: Need to use the verify token here. Currently hardcoded
router.post(
    "/upload_book",
    // verifyToken,
    upload.single("epub"),
    async (req, res) => {
        let finalPath = null;

        try {
            if (!req.file) {
                return res.status(400).json({ msg: "No EPUB file provided" });
            }

            // 1. Hash and rename
            const result = await finalizeUpload(req.file.path);
            finalPath = result.finalPath;
            const hash = result.hash;

            // 2. Dedup check — if this hash exists, just return the existing book
            const existing = await bookData.getBookByHash(hash);
            if (existing) {
                return res.status(200).json({
                    msg: "Book already exists in the shared library",
                    book: existing,
                    deduplicated: true,
                });
            }

            const { metadata } = await parseEpub(finalPath);
            const googleMeta = await lookupBook(
                metadata.title,
                metadata.author,
            );

            const finalTitle = googleMeta?.title || metadata.title;
            const finalAuthor = googleMeta?.author || metadata.author;
            const finalDescription =
                googleMeta?.description || metadata.description || "";
            const finalCover = googleMeta?.cover_url || "";

            // TODO: replace hardcoded uid
            const uid = "ZBkHEebb5sQ3hMY8zeQgkN2aoom2";
            // const uid = req.user.uid;
            const book = await bookData.createBook(
                hash,
                finalTitle,
                finalAuthor,
                finalDescription,
                finalCover,
                finalPath,
                uid,
                googleMeta,
            );

            const bookId = book._id.toString();

            // BACKGROUND INGESTION. DO NOT AWAIT HERE!
            ingestBook(finalPath, bookId)
                .then(async () => {
                    await bookData.markEmbeddingReady(bookId);
                    await redis.delCache(`book:${bookId}`).catch(() => {});
                    console.log(
                        `[upload] Ingestion complete for "${finalTitle}" (${bookId})`,
                    );
                })
                .catch((err) => {
                    console.error(
                        `[upload] Ingestion failed for "${finalTitle}" (${bookId}):`,
                        err.message,
                    );
                });

            return res.status(201).json({
                msg: "Book uploaded successfully",
                book,
                deduplicated: false,
            });
        } catch (e) {
            // Cleanup if any errors
            if (finalPath) {
                await unlink(finalPath).catch(() => {});
            } else if (req.file?.path) {
                await unlink(req.file.path).catch(() => {});
            }

            return res.status(e.status || 500).json({
                msg: e.msg || e.message || "Upload failed",
            });
        }
    },
);

// Catches multer errors (wrong file type, too large, ...)
router.use((err, _req, res, _next) => {
    return res.status(400).json({
        msg: err.message || "Upload failed",
    });
});

// EXPORT THE ROUTER
export default router;
