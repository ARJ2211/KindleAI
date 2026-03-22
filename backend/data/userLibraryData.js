import { ObjectId } from "mongodb";
import { user_library } from "../config/mongoCollections.js";
import * as helper from "../helper.js";

/**
 * Create a compound unique index so one user
 * can never add the same book twice.
 */
export const ensureIndexes = async () => {
    const col = await user_library();
    await col.createIndex({ user_id: 1, book_id: 1 }, { unique: true });
    console.log("[userLibraryData] Indexes ensured on user_library collection.");
};

/**
 * Add a book to the user's personal library.
 * The route layer should verify that the book exists in the global
 * library (via bookData) before calling this function.
 *
 * @param {string} userId Firebase UID
 * @param {string} bookId MongoDB ObjectId string
 * @returns {object} the created user_library document
 */
export const addBookToLibrary = async (userId, bookId) => {
    userId = helper.isValidString(userId);
    bookId = helper.isValidString(bookId);

    if (!ObjectId.isValid(bookId)) {
        helper.throwError(400, `Invalid book ID: ${bookId}`);
    }

    // Check if already in user's library (the unique index catches this too,
    // but a manual check gives a friendlier error message)
    const col = await user_library();
    const existing = await col.findOne({
        user_id: userId,
        book_id: new ObjectId(bookId),
    });
    if (existing) {
        helper.throwError(409, "Book is already in your library");
    }

    const newEntry = {
        user_id: userId,
        book_id: new ObjectId(bookId),
        saved: true,
        favorite: false,
        progress_percent: 0,
        current_chapter: null,
        last_opened_at: null,
        added_at: new Date(),
    };

    const result = await col.insertOne(newEntry);
    if (!result.acknowledged) {
        helper.throwError(500, "Failed to add book to library");
    }

    newEntry._id = result.insertedId;
    return newEntry;
};

/**
 * Remove a book from the user's personal library.
 * Does NOT delete the book from the global library.
 *
 * @param {string} userId Firebase UID
 * @param {string} bookId MongoDB ObjectId string
 * @returns {boolean} true if removed
 */
export const removeBookFromLibrary = async (userId, bookId) => {
    userId = helper.isValidString(userId);
    bookId = helper.isValidString(bookId);

    if (!ObjectId.isValid(bookId)) {
        helper.throwError(400, `Invalid book ID: ${bookId}`);
    }

    const col = await user_library();
    const result = await col.deleteOne({
        user_id: userId,
        book_id: new ObjectId(bookId),
    });

    if (result.deletedCount === 0) {
        helper.throwError(404, "Book not found in your library");
    }

    return true;
};

/**
 * Get all user_library entries for a user.
 * Returns raw entries (book_id + progress data).
 * The route layer handles fetching full book details.
 *
 * @param {string} userId Firebase UID
 * @returns {object[]} array of user_library documents
 */
export const getUserLibrary = async (userId) => {
    userId = helper.isValidString(userId);

    const col = await user_library();
    return col
        .find({ user_id: userId, saved: true })
        .sort({ last_opened_at: -1, added_at: -1 })
        .toArray();
};

/**
 * Get a single user_library entry for a specific user-book pair.
 * Useful when opening a book to check reading progress.
 *
 * @param {string} userId Firebase UID
 * @param {string} bookId MongoDB ObjectId string
 * @returns {object|null} the user_library document or null
 */
export const getUserLibraryEntry = async (userId, bookId) => {
    userId = helper.isValidString(userId);
    bookId = helper.isValidString(bookId);

    if (!ObjectId.isValid(bookId)) {
        helper.throwError(400, `Invalid book ID: ${bookId}`);
    }

    const col = await user_library();
    return col.findOne({
        user_id: userId,
        book_id: new ObjectId(bookId),
    });
};

/**
 * Update reading progress for a specific book.
 * Called when the user reads and we need to save their position.
 *
 * @param {string} userId Firebase UID
 * @param {string} bookId MongoDB ObjectId string
 * @param {object} data
 * @param {number} data.progress_percent 0 to 100
 * @param {string} data.current_chapter chapter file name
 * @returns {object} updated user_library document
 */
export const updateProgress = async (userId, bookId, data) => {
    userId = helper.isValidString(userId);
    bookId = helper.isValidString(bookId);

    if (!ObjectId.isValid(bookId)) {
        helper.throwError(400, `Invalid book ID: ${bookId}`);
    }

    const setFields = { last_opened_at: new Date() };

    if (data.progress_percent !== undefined) {
        if (
            typeof data.progress_percent !== "number" ||
            data.progress_percent < 0 ||
            data.progress_percent > 100
        ) {
            helper.throwError(400, "progress_percent must be a number between 0 and 100");
        }
        setFields.progress_percent = data.progress_percent;
    }

    if (data.current_chapter !== undefined) {
        setFields.current_chapter = helper.isValidString(data.current_chapter);
    }

    const col = await user_library();
    const result = await col.findOneAndUpdate(
        { user_id: userId, book_id: new ObjectId(bookId) },
        { $set: setFields },
        { returnDocument: "after" },
    );

    if (!result) {
        helper.throwError(404, "Book not found in your library");
    }

    return result;
};

/**
 * Toggle the favorite status of a book in the user's library.
 * Reads the current value and flips it.
 *
 * @param {string} userId Firebase UID
 * @param {string} bookId MongoDB ObjectId string
 * @returns {object} updated user_library document
 */
export const toggleFavorite = async (userId, bookId) => {
    userId = helper.isValidString(userId);
    bookId = helper.isValidString(bookId);

    if (!ObjectId.isValid(bookId)) {
        helper.throwError(400, `Invalid book ID: ${bookId}`);
    }

    const col = await user_library();

    // Flip favorite in a single atomic operation.
    // The array syntax triggers an aggregation pipeline update
    // where $not reads the current value and inverts it.
    const result = await col.findOneAndUpdate(
        { user_id: userId, book_id: new ObjectId(bookId) },
        [{ $set: { favorite: { $not: "$favorite" } } }],
        { returnDocument: "after" },
    );

    if (!result) {
        helper.throwError(404, "Book not found in your library");
    }

    return result;
};
