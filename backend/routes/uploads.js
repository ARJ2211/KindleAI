import { Router } from "express";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";

import { verifyToken } from "../middleware/auth.js";
import * as redis from "../config/redisClient.js";
import * as helper from "../helper.js";
import * as uploadService from "../services/uploadService.js";

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/books");
    },
    filename: (req, file, cb) => {
        const uniqueName = `${randomUUID()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
    },
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() !== ".epub") {
            return cb(new Error("Only EPUB files are allowed"), false);
        }
        cb(null, true);
    },
});

/** ===============================
 * PROTECTED: firebase token needed
 * ============================== */

// Upload a new EPUB file and start processing
router.post("/", verifyToken, upload.single("file"), async (req, res) => {
    try {
        const userId = req.user.uid;
        const bookId = helper.isValidString(req.body?.bookId);

        if (!req.file) {
            return res.status(400).json({
                msg: "No file uploaded",
            });
        }

        const uploadRecord = await uploadService.handleBookUpload(
            userId,
            bookId,
            req.file,
        );

        return res.status(201).json({
            msg: "Upload started successfully",
            upload: {
                id: uploadRecord._id,
                status: uploadRecord.status,
                fileName: uploadRecord.file_name,
                uploadedAt: uploadRecord.uploaded_at,
            },
        });
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

// Get upload status by ID (for polling)
router.get("/:uploadId", verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const uploadId = helper.isValidString(req.params?.uploadId);

        // Try cache first
        const cacheKey = `upload:${uploadId}`;
        const cached = await redis.getCache(cacheKey);
        if (cached) {
            // Verify ownership
            if (cached.user_id !== userId) {
                return res.status(403).json({
                    msg: "Access denied",
                });
            }
            return res.status(200).json(cached);
        }

        const uploadRecord = await uploadService.getUploadStatus(uploadId);

        // Verify ownership
        if (uploadRecord.user_id !== userId) {
            return res.status(403).json({
                msg: "Access denied",
            });
        }

        // Cache the result
        await redis.setCache(cacheKey, uploadRecord);

        return res.status(200).json({
            upload: {
                id: uploadRecord._id,
                status: uploadRecord.status,
                fileName: uploadRecord.file_name,
                uploadedAt: uploadRecord.uploaded_at,
                processedAt: uploadRecord.processed_at,
                error: uploadRecord.error,
            },
        });
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

// Get all uploads for current user
router.get("/user/me", verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;

        // Try cache first
        const cacheKey = `user:${userId}:uploads`;
        const cached = await redis.getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        const uploads = await uploadService.getUserUploads(userId);

        const formattedUploads = uploads.map((u) => ({
            id: u._id,
            bookId: u.book_id,
            fileName: u.file_name,
            status: u.status,
            uploadedAt: u.uploaded_at,
            processedAt: u.processed_at,
            error: u.error,
        }));

        // Cache for 30 seconds (uploads change frequently)
        await redis.setCache(cacheKey, formattedUploads, 30);

        return res.status(200).json(formattedUploads);
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

// Retry a failed upload
router.post("/:uploadId/retry", verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const uploadId = helper.isValidString(req.params?.uploadId);
        const filePath = helper.isValidString(req.body?.filePath);

        const uploadRecord = await uploadService.getUploadStatus(uploadId);

        // Verify ownership
        if (uploadRecord.user_id !== userId) {
            return res.status(403).json({
                msg: "Access denied",
            });
        }

        const retried = await uploadService.retryUpload(uploadId, filePath);

        // Invalidate cache
        await redis.deleteCache(`upload:${uploadId}`);
        await redis.deleteCache(`user:${userId}:uploads`);

        return res.status(200).json({
            msg: "Upload retry started",
            upload: {
                id: retried._id,
                status: retried.status,
            },
        });
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

// Delete an upload record
router.delete("/:uploadId", verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const uploadId = helper.isValidString(req.params?.uploadId);

        const uploadRecord = await uploadService.getUploadStatus(uploadId);

        // Verify ownership
        if (uploadRecord.user_id !== userId) {
            return res.status(403).json({
                msg: "Access denied",
            });
        }

        await uploadService.deleteUpload(uploadId);

        // Invalidate cache
        await redis.deleteCache(`upload:${uploadId}`);
        await redis.deleteCache(`user:${userId}:uploads`);

        return res.status(200).json({
            msg: "Upload deleted successfully",
        });
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

// EXPORT THE CREATED ROUTER
export default router;