import { Router } from "express";

import { verifyToken } from "../middleware/auth.js";
import { finalizeUpload, getUpload } from "../utils/diskStorage.js";
import * as bookData from "../data/bookData.js";

const upload = await getUpload();
const router = Router();

/** ===============================
 * PRIVATE: firebase token needed
 * ============================== */

// API call for uploading books to persistent file storage
router.post(
    "/upload_book",
    // verifyToken,
    upload.single("epub"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ msg: "No EPUB file provided" });
            }

            const { hash, finalPath } = await finalizeUpload(req.file.path);

            return res.status(200).json({
                msg: "File uploaded",
                hash,
                path: finalPath,
            });
        } catch (e) {
            return res.status(e.status || 500).json({
                msg: e.message || e.msg || "Upload failed",
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
