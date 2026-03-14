import { Router } from "express";

import { verifyToken } from "../middleware/auth.js";
import { finalizeUpload, getUpload } from "../utils/diskStorage.js";

import * as bookData from "../data/bookData.js";

const upload = await getUpload();
const router = Router();

// API for user to upload their book and begin the ingestion pipeline
router.post(
    "/upload_book",
    // verifyToken,
    upload.single("epub"),
    async (req, res) => {
        console.log(req.file);
        await finalizeUpload(req.file.path);
        return res.status(200).send("LAWDE HO TUM");
    },
);

// EXPORT THE ROUTER
export default router;
