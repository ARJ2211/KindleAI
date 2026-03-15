import multer from "multer";
import { mkdir, rename } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import { throwError } from "../helper.js";
import { hashFile } from "./hashFile.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = join(__dirname, "..", "uploads");

const createStorageDriver = async () => {
    try {
        await mkdir(UPLOAD_DIR, { recursive: true });
    } catch (e) {
        if (e.code !== "EEXIST") {
            console.log("[disk storage]:", e);
            throwError(500, "Book Upload Failed");
        }
    }

    const storageDriver = multer.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
            // Temp name
            const temp = `tmp-${Date.now()}-${file.originalname}`;
            cb(null, temp);
        },
    });

    return storageDriver;
};

let _upload = undefined;

export const getUpload = async () => {
    if (!_upload) {
        const storage = await createStorageDriver();
        _upload = multer({
            storage,
            limits: { fileSize: 100 * 1024 * 1024 },
            fileFilter: (_req, file, cb) => {
                if (!file.originalname.toLowerCase().endsWith(".epub")) {
                    return cb(new Error("Only .epub files are allowed"), false);
                }
                cb(null, true);
            },
        });
    }

    return _upload;
};

/**
 * Hash the uploaded file and rename it to its hash.
 * Returns { hash, finalPath } so the route has both.
 *
 * @param {string} tempPath path multer saved the file to
 * @returns {{ hash: string, finalPath: string }}
 */
export const finalizeUpload = async (tempPath) => {
    const hash = await hashFile(tempPath);
    const finalPath = join(UPLOAD_DIR, `${hash}.epub`);

    if (tempPath !== finalPath) {
        await rename(tempPath, finalPath);
    }

    return { hash, finalPath };
};
