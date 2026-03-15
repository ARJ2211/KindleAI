import { readFile } from "fs/promises";
import { createHash } from "crypto";

/**
 * Compute SHA-256 hash of a file.
 * This will be used to prevent duplications
 *
 * @param {string} filePath absolute path to the file
 * @returns {Function}
 */
export const hashFile = async (filePath) => {
    const buffer = await readFile(filePath);
    return createHash("sha256").update(buffer).digest("hex");
};
