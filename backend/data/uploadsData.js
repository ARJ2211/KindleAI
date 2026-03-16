import { uploads } from "../config/mongoCollections.js";
import * as helper from "../helper.js";
import { ObjectId } from "mongodb";

/**
 * Create a new upload document.
 *
 * @param {string} userId - Firebase UID
 * @param {string} bookId
 * @param {string} fileName
 * @param {number} [fileSize]
 * @param {string} [fileType]
 * @returns {Object}
 */
export async function createUpload(userId, bookId, fileName, fileSize, fileType) {
    userId = helper.isValidString(userId);
    bookId = helper.isValidString(bookId);
    fileName = helper.isValidString(fileName);

    const uploadsCol = await uploads();

    const newUpload = {
        user_id: userId,
        book_id: bookId,
        file_name: fileName,
        file_size: fileSize || 0,
        file_type: fileType || "application/epub+zip",
        status: "pending", // pending, processing, completed, failed
        uploaded_at: new Date(),
        processed_at: null,
        error: null,
    };

    const result = await uploadsCol.insertOne(newUpload);
    if (!result.acknowledged) {
        throw { status: 500, msg: "Failed to create upload" };
    }

    newUpload._id = result.insertedId;
    return newUpload;
}

/**
 * Get an upload by its ID.
 *
 * @param {string} uploadId
 * @returns {Object}
 */
export async function getUploadById(uploadId) {
    if (!uploadId) {
        throw { status: 400, msg: "uploadId is required" };
    }

    if (!ObjectId.isValid(uploadId)) {
        throw { status: 400, msg: "Invalid upload ID format" };
    }

    const uploadsCol = await uploads();
    const upload = await uploadsCol.findOne({ _id: new ObjectId(uploadId) });

    if (!upload) {
        throw { status: 404, msg: "upload not found" };
    }

    return upload;
}

/**
 * Get all uploads for a specific user.
 *
 * @param {string} userId - Firebase UID
 * @returns {Array}
 */
export async function getUploadsByUserId(userId) {
    userId = helper.isValidString(userId);

    const uploadsCol = await uploads();
    const userUploads = await uploadsCol
        .find({ user_id: userId })
        .sort({ uploaded_at: -1 })
        .toArray();

    return userUploads;
}

/**
 * Get all uploads for a specific book.
 *
 * @param {string} bookId
 * @returns {Array}
 */
export async function getUploadsByBookId(bookId) {
    bookId = helper.isValidString(bookId);

    const uploadsCol = await uploads();
    const bookUploads = await uploadsCol
        .find({ book_id: bookId })
        .sort({ uploaded_at: -1 })
        .toArray();

    return bookUploads;
}

/**
 * Get uploads filtered by status.
 *
 * @param {string} status - One of: pending, processing, completed, failed
 * @returns {Array}
 */
export async function getUploadsByStatus(status) {
    const validStatuses = ["pending", "processing", "completed", "failed"];

    if (!validStatuses.includes(status)) {
        throw {
            status: 400,
            msg: `Status must be one of: ${validStatuses.join(", ")}`,
        };
    }

    const uploadsCol = await uploads();
    const statusUploads = await uploadsCol
        .find({ status: status })
        .sort({ uploaded_at: -1 })
        .toArray();

    return statusUploads;
}

/**
 * Get all uploads with optional pagination.
 *
 * @param {number} [skip=0]
 * @param {number} [limit=50]
 * @returns {Array}
 */
export async function getAllUploads(skip = 0, limit = 50) {
    const uploadsCol = await uploads();
    const allUploads = await uploadsCol
        .find({})
        .sort({ uploaded_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

    return allUploads;
}

/**
 * Update the status of an upload.
 *
 * @param {string} uploadId
 * @param {string} status - One of: pending, processing, completed, failed
 * @param {string} [errorMsg] - Error message if status is "failed"
 * @returns {Object}
 */
export async function updateUploadStatus(uploadId, status, errorMsg) {
    if (!uploadId) {
        throw { status: 400, msg: "uploadId is required" };
    }

    if (!ObjectId.isValid(uploadId)) {
        throw { status: 400, msg: "Invalid upload ID format" };
    }

    const validStatuses = ["pending", "processing", "completed", "failed"];

    if (!validStatuses.includes(status)) {
        throw {
            status: 400,
            msg: `Status must be one of: ${validStatuses.join(", ")}`,
        };
    }

    const uploadsCol = await uploads();

    const updateFields = {
        status: status,
    };

    if (status === "completed") {
        updateFields.processed_at = new Date();
    }

    if (errorMsg) {
        updateFields.error = errorMsg;
    }

    const result = await uploadsCol.findOneAndUpdate(
        { _id: new ObjectId(uploadId) },
        { $set: updateFields },
        { returnDocument: "after" },
    );

    if (!result) {
        throw { status: 404, msg: "upload not found" };
    }

    return result;
}

/**
 * Update upload fields (general update).
 *
 * @param {string} uploadId
 * @param {Object} updateData
 * @returns {Object}
 */
export async function updateUpload(uploadId, updateData) {
    if (!uploadId) {
        throw { status: 400, msg: "uploadId is required" };
    }

    if (!ObjectId.isValid(uploadId)) {
        throw { status: 400, msg: "Invalid upload ID format" };
    }

    // Don't allow updating certain fields
    const { _id, user_id, uploaded_at, ...allowedUpdates } = updateData;

    if (Object.keys(allowedUpdates).length === 0) {
        throw { status: 400, msg: "No valid fields to update" };
    }

    const uploadsCol = await uploads();

    const result = await uploadsCol.findOneAndUpdate(
        { _id: new ObjectId(uploadId) },
        { $set: allowedUpdates },
        { returnDocument: "after" },
    );

    if (!result) {
        throw { status: 404, msg: "upload not found" };
    }

    return result;
}

/**
 * Delete an upload by ID.
 *
 * @param {string} uploadId
 * @returns {boolean} true if deleted
 */
export async function deleteUpload(uploadId) {
    if (!uploadId) {
        throw { status: 400, msg: "uploadId is required" };
    }

    if (!ObjectId.isValid(uploadId)) {
        throw { status: 400, msg: "Invalid upload ID format" };
    }

    const uploadsCol = await uploads();
    const result = await uploadsCol.deleteOne({
        _id: new ObjectId(uploadId),
    });

    if (result.deletedCount === 0) {
        throw { status: 404, msg: "upload not found" };
    }

    return true;
}

/**
 * Delete all uploads for a specific user.
 *
 * @param {string} userId - Firebase UID
 * @returns {Object} { deleted: true, count: number }
 */
export async function deleteUploadsByUserId(userId) {
    userId = helper.isValidString(userId);

    const uploadsCol = await uploads();
    const result = await uploadsCol.deleteMany({ user_id: userId });

    return {
        deleted: true,
        count: result.deletedCount,
    };
}

/**
 * Delete all uploads for a specific book.
 *
 * @param {string} bookId
 * @returns {Object} { deleted: true, count: number }
 */
export async function deleteUploadsByBookId(bookId) {
    bookId = helper.isValidString(bookId);

    const uploadsCol = await uploads();
    const result = await uploadsCol.deleteMany({ book_id: bookId });

    return {
        deleted: true,
        count: result.deletedCount,
    };
}