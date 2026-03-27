import { ObjectId } from "mongodb";
import { chat_messages } from "../config/mongoCollections.js";
import { chatMessageLimits } from "../config/settings.js";
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
 * @returns {Promise<{ id: string, role: string, content: string, created_at: Date, sources?: object[] }[]>}
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
        ...(doc.sources?.length ? { sources: doc.sources } : {}),
    }));
}

/**
 * Insert one chat message. Routes/socket handlers should ensure the book is on
 * the user's shelf when required by product rules.
 *
 * @param {string} userId Firebase UID
 * @param {string} bookId MongoDB ObjectId string
 * @param {{ role: 'user'|'assistant', content: string, sources?: object[] }} data
 * @returns {Promise<{ id: string, role: string, content: string, created_at: Date, sources?: object[] }>}
 */
export async function appendChatMessage(userId, bookId, data) {
    userId = helper.isValidString(userId);
    bookId = helper.isValidString(bookId);

    if (!ObjectId.isValid(bookId)) {
        helper.throwError(400, `Invalid book ID: ${bookId}`);
    }

    const role = data?.role;
    if (role !== "user" && role !== "assistant") {
        helper.throwError(400, "role must be user or assistant");
    }

    const content =
        typeof data?.content === "string" ? data.content.trim() : "";
    if (content.length === 0) {
        helper.throwError(400, "content is required");
    }

    if (role === "user" && content.length > chatMessageLimits.maxUserChars) {
        helper.throwError(
            400,
            `Message exceeds ${chatMessageLimits.maxUserChars} characters`,
        );
    }
    if (
        role === "assistant" &&
        content.length > chatMessageLimits.maxAssistantChars
    ) {
        helper.throwError(400, "Assistant reply too large to store");
    }

    await ensureIndexesOnce();

    const doc = {
        user_id: userId,
        book_id: new ObjectId(bookId),
        role,
        content,
        created_at: new Date(),
    };

    if (
        role === "assistant" &&
        Array.isArray(data?.sources) &&
        data.sources.length > 0
    ) {
        doc.sources = data.sources;
    }

    const col = await chat_messages();
    const result = await col.insertOne(doc);
    if (!result.acknowledged) {
        helper.throwError(500, "Failed to save chat message");
    }

    doc._id = result.insertedId;
    return {
        id: doc._id.toString(),
        role: doc.role,
        content: doc.content,
        created_at: doc.created_at,
        ...(doc.sources?.length ? { sources: doc.sources } : {}),
    };
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
