import { ObjectId } from "mongodb";
import { chat_messages } from "../config/mongoCollections.js";
import * as helper from "../helper.js";

let _indexesEnsured = false;

async function ensureIndexesOnce() {
    if (_indexesEnsured) return;
    const col = await chat_messages();
    await col.createIndex({ user_id: 1, book_id: 1, created_at: 1 });
    _indexesEnsured = true;
    console.log("[chatData] Indexes ensured on chat_messages collection.");
}

/**
 * List chat messages for a user + book, oldest first.
 *
 * @param {string} userId Firebase UID
 * @param {string} bookId MongoDB ObjectId string
 * @returns {Promise<{ id: string, role: string, content: string, created_at: Date }[]>}
 */
export async function getChatHistory(userId, bookId) {
    userId = helper.isValidString(userId);
    bookId = helper.isValidString(bookId);

    if (!ObjectId.isValid(bookId)) {
        helper.throwError(400, `Invalid book ID: ${bookId}`);
    }

    await ensureIndexesOnce();

    const col = await chat_messages();
    const rows = await col
        .find({
            user_id: userId,
            book_id: new ObjectId(bookId),
        })
        .sort({ created_at: 1 })
        .toArray();

    return rows.map((doc) => ({
        id: doc._id.toString(),
        role: doc.role,
        content: doc.content,
        created_at: doc.created_at,
    }));
}

/**
 * Delete all chat messages for a user + book.
 *
 * @param {string} userId Firebase UID
 * @param {string} bookId MongoDB ObjectId string
 * @returns {Promise<number>} deletedCount
 */
export async function clearChatHistory(userId, bookId) {
    userId = helper.isValidString(userId);
    bookId = helper.isValidString(bookId);

    if (!ObjectId.isValid(bookId)) {
        helper.throwError(400, `Invalid book ID: ${bookId}`);
    }

    await ensureIndexesOnce();

    const col = await chat_messages();
    const result = await col.deleteMany({
        user_id: userId,
        book_id: new ObjectId(bookId),
    });

    return result.deletedCount;
}
