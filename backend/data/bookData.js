import { ObjectId } from "mongodb";
import { books, users } from "../config/mongoCollections.js";
import * as helper from "../helper.js";

/**
 * Ensure indexes exist on the books collection.
 * Safe to call multiple times
 */
export const ensureIndexes = async () => {
    const col = await books();
    await col.createIndex({ content_hash: 1 }, { unique: true });
    await col.createIndex({ search_title: 1 });
    await col.createIndex({ search_author: 1 });
    console.log("[bookData] Indexes ensured on books collection.");
};

/**
 * Find an existing book by its content hash (SHA-256 of the EPUB file).
 * This is the primary deduplication check
 *
 * @param {string} contentHash
 * @returns {object|null}
 */
export const getBookByHash = async (contentHash) => {
    contentHash = helper.isValidString(contentHash);

    const col = await books();
    return col.findOne({ content_hash: contentHash });
};

/**
 * Create a new book document in the shared inventory.
 *
 * @param {string} contentHash SHA-256 of the EPUB file
 * @param {string} title book title (from Google Books or EPUB)
 * @param {string} author primary author
 * @param {string} description short description
 * @param {string} coverAssetKey cover URL or file path
 * @param {string} epubAssetKey path to stored EPUB on disk
 * @param {string} firstUploadedBy Firebase UID of uploader
 * @param {object} googleBooks enriched metadata from Google Books
 * @returns {object} the created book document
 */
export const createBook = async (
    contentHash,
    title,
    author,
    description,
    coverAssetKey,
    epubAssetKey,
    firstUploadedBy,
    googleBooks,
) => {
    contentHash = helper.isValidString(contentHash);
    title = helper.isValidString(title);
    author = helper.isValidString(author);
    epubAssetKey = helper.isValidString(epubAssetKey);
    firstUploadedBy = helper.isValidString(firstUploadedBy);

    const usersCol = await users();
    const userExists = await usersCol.findOne({ _id: firstUploadedBy });
    if (!userExists) {
        helper.throwError(404, `User ${firstUploadedBy} not found`);
    }

    const existing = await getBookByHash(contentHash);
    if (existing) {
        helper.throwError(409, `Book with this content hash already exists`);
    }

    const col = await books();

    const newBook = {
        content_hash: contentHash,
        title,
        author,
        description: description || "",
        cover_asset_key: coverAssetKey || "",
        epub_asset_key: epubAssetKey,
        first_uploaded_by: firstUploadedBy,

        embedding_ready: false,
        tts_ready: false,

        search_title: title.toLowerCase(),
        search_author: author.toLowerCase(),

        google_books: googleBooks || null,

        created_at: new Date(),
    };

    const result = await col.insertOne(newBook);
    if (!result.acknowledged) {
        helper.throwError(500, "Failed to create book");
    }

    newBook._id = result.insertedId;
    return newBook;
};

/**
 * Get a single book by its MongoDB ObjectId.
 *
 * @param {string} bookId
 * @returns {object}
 */
export const getBookById = async (bookId) => {
    bookId = helper.isValidString(bookId);

    if (!ObjectId.isValid(bookId)) {
        helper.throwError(400, `Invalid book ID: ${bookId}`);
    }

    const col = await books();
    const book = await col.findOne({ _id: new ObjectId(bookId) });

    if (!book) {
        helper.throwError(404, `Book ${bookId} not found`);
    }

    return book;
};

/**
 * Mark a book's embeddings as ready (called after ingestion completes).
 *
 * @param {string} bookId
 * @returns {object} updated book document
 */
export const markEmbeddingReady = async (bookId) => {
    bookId = helper.isValidString(bookId);

    if (!ObjectId.isValid(bookId)) {
        helper.throwError(400, `Invalid book ID: ${bookId}`);
    }

    const col = await books();
    const result = await col.findOneAndUpdate(
        { _id: new ObjectId(bookId) },
        { $set: { embedding_ready: true } },
        { returnDocument: "after" },
    );

    if (!result) {
        helper.throwError(404, `Book ${bookId} not found`);
    }

    return result;
};

/**
 * Mark a book's TTS audio as ready.
 *
 * @param {string} bookId
 * @returns {object} updated book document
 */
export const markTtsReady = async (bookId) => {
    bookId = helper.isValidString(bookId);

    if (!ObjectId.isValid(bookId)) {
        helper.throwError(400, `Invalid book ID: ${bookId}`);
    }

    const col = await books();
    const result = await col.findOneAndUpdate(
        { _id: new ObjectId(bookId) },
        { $set: { tts_ready: true } },
        { returnDocument: "after" },
    );

    if (!result) {
        helper.throwError(404, `Book ${bookId} not found`);
    }

    return result;
};

/**
 * Search books by title or author.
 * Returns latest books if no query is provided.
 *
 * @param {string} query search term
 * @param {number} limit max results (default 20)
 * @returns {object[]}
 */
export const searchBooks = async (query, limit = 20) => {
    query = (query || "").trim().toLowerCase();

    if (typeof limit !== "number" || limit < 1) {
        limit = 20;
    }
    limit = Math.min(limit, 100);

    const col = await books();

    if (!query) {
        return col.find({}).sort({ created_at: -1 }).limit(limit).toArray();
    }

    const regex = { $regex: query, $options: "i" };

    return col
        .find({
            $or: [{ search_title: regex }, { search_author: regex }],
        })
        .sort({ created_at: -1 })
        .limit(limit)
        .toArray();
};

/**
 * Delete a book by its MongoDB ObjectId.
 *
 * @param {string} bookId
 * @returns {boolean} true if deleted
 */
export const deleteBookById = async (bookId) => {
    bookId = helper.isValidString(bookId);

    if (!ObjectId.isValid(bookId)) {
        helper.throwError(400, `Invalid book ID: ${bookId}`);
    }

    const col = await books();
    const result = await col.deleteOne({ _id: new ObjectId(bookId) });

    if (result.deletedCount === 0) {
        helper.throwError(404, `Book ${bookId} not found`);
    }

    return true;
};

/**
 * Get total count of books in the shared library.
 *
 * @returns {number}
 */
export const getBookCount = async () => {
    const col = await books();
    return col.countDocuments();
};
