import { Router } from "express";

import { verifyToken } from "../middleware/auth.js";
import * as helper from "../helper.js";
import * as userLibraryData from "../data/userLibraryData.js";
import * as bookData from "../data/bookData.js";
import * as chatData from "../data/chatData.js";

const router = Router();

// Get all books in the user's personal library (with full book details)
router.get("/", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;

        const libraryEntries = await userLibraryData.getUserLibrary(uid);

        if (libraryEntries.length === 0) {
            return res.status(200).json([]);
        }

        // Combine user_library data with full book details from books collection
        const booksWithProgress = await Promise.all(
            libraryEntries.map(async (entry) => {
                try {
                    const book = await bookData.getBookById(
                        entry.book_id.toString(),
                    );
                    return {
                        ...book,
                        progress_percent: entry.progress_percent,
                        favorite: entry.favorite,
                        current_chapter: entry.current_chapter,
                        last_opened_at: entry.last_opened_at,
                        added_at: entry.added_at,
                    };
                } catch {
                    // Book may have been deleted from global library
                    return null;
                }
            }),
        );

        return res.status(200).json(booksWithProgress.filter(Boolean));
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

// Add a book to the user's personal library
router.post("/:bookId", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const bookId = helper.isValidString(req.params.bookId);

        // Verify book exists in global library (data layer doesn't check this)
        await bookData.getBookById(bookId);

        const entry = await userLibraryData.addBookToLibrary(uid, bookId);

        return res.status(201).json(entry);
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

// Remove a book from the user's personal library
router.delete("/:bookId", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const bookId = helper.isValidString(req.params.bookId);

        await userLibraryData.removeBookFromLibrary(uid, bookId);

        return res.status(200).json({ msg: "Book removed from your library" });
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

// List persisted AI chat messages for a book (My Books only)
router.get("/:bookId/chat", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const bookId = helper.isValidString(req.params.bookId);

        const entry = await userLibraryData.getUserLibraryEntry(uid, bookId);
        if (!entry) {
            return res.status(404).json({ msg: "Book not in your library" });
        }

        const messages = await chatData.getChatHistory(uid, bookId);
        return res.status(200).json(messages);
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

// Clear all AI chat messages for a book (My Books only)
router.delete("/:bookId/chat", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const bookId = helper.isValidString(req.params.bookId);

        const entry = await userLibraryData.getUserLibraryEntry(uid, bookId);
        if (!entry) {
            return res.status(404).json({ msg: "Book not in your library" });
        }

        const deletedCount = await chatData.clearChatHistory(uid, bookId);
        return res.status(200).json({
            msg: "Chat cleared",
            deletedCount,
        });
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

// Get a single library entry for a specific book (progress, favorite, etc.)
router.get("/:bookId", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const bookId = helper.isValidString(req.params.bookId);

        const entry = await userLibraryData.getUserLibraryEntry(uid, bookId);

        if (!entry) {
            return res.status(404).json({ msg: "Book not in your library" });
        }

        return res.status(200).json(entry);
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

// Update reading progress for a book
router.patch("/:bookId/progress", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const bookId = helper.isValidString(req.params.bookId);

        const updated = await userLibraryData.updateProgress(
            uid,
            bookId,
            req.body,
        );

        return res.status(200).json(updated);
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

// Toggle favorite status for a book
router.patch("/:bookId/favorite", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const bookId = helper.isValidString(req.params.bookId);

        const updated = await userLibraryData.toggleFavorite(uid, bookId);

        return res.status(200).json(updated);
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

export default router;
