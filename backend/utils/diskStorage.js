import multer from "multer";
import fs from "fs";

import { fileURLToPath } from "url";
import { dirname, join } from "path";

import { throwError } from "../helper.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const createStorageDriver = async () => {
    const destinationPath = join(__dirname, "..", "uploads/");
    try {
        await fs.mkdir(destinationPath);
    } catch (e) {
        if (e.code !== "EEXIST") {
            console.log(`[disk storage]: `, e);
            throwError(500, "Book Upload Failed");
        }
    }

    const storageDriver = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, destinationPath);
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        },
    });

    return storageDriver;
};

let upload_ = undefined;
export const createUpload = async () => {
    if (!upload_) {
        const driver = await createStorageDriver();
        upload_ = multer({ driver });

        return upload_;
    }

    return upload_;
};
