import { Router } from "express";

import { fireBaseApp } from "../app.js";
import { verifyToken } from "../middleware/auth.js";
import * as redis from "../config/redisClient.js";
import * as helper from "../helper.js";
import * as userData from "../data/userData.js";
import * as bookData from "../data/bookData.js";
import { verify } from "node:crypto";

const router = Router();

/** ===============================
 * PUBLIC: no firebase token needed
 * ============================== */

// Sign up API call (uses firebase auth)
router.post("/signup", async (req, res) => {
    try {
        const email = helper.isValidEmail(req.body?.email);
        const password = helper.isValidPassword(req.body?.password);
        const displayName = await helper.isValidDisplayName(
            req.body?.displayName,
        );

        const userResponse = await fireBaseApp.auth().createUser({
            email: email,
            password: password,
            emailVerified: false,
            disabled: false,
        });

        const createdUser = await userData.createUser(
            userResponse.uid,
            userResponse.email,
            displayName,
        );

        // Set redis cache for user
        await redis.setCache(`user:${createdUser._id}`, createdUser);

        return res.status(200).json(createdUser);
    } catch (e) {
        if (e?.code === "auth/email-already-exists") {
            return res.status(400).json({
                msg: e.message,
            });
        }
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

/** ===============================
 * PROTECTED: firebase token needed
 * ============================== */

// Get the email ID of a verified firebase user
router.get("/getEmail/:id", verifyToken, async (req, res) => {
    try {
        const id = helper.isValidString(req.params.id);
        const data = await userData.getUserById(id);

        return res.json({ email: data.email });
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

// Get current user profile
router.get("/me", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;

        // Try cache first
        const cached = await redis.getCache(`user:${uid}`);
        if (cached) return res.status(200).json(cached);

        const user = await userData.getUserById(uid);

        // Refresh cache
        await redis.setCache(`user:${uid}`, user);

        return res.status(200).json(user);
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

// Update reader preferences
router.patch("/preferences", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const updated = await userData.updatePreferences(uid, req.body);

        // Refresh cache
        await redis.setCache(`user:${uid}`, updated);

        return res.status(200).json(updated);
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

// Add for user's my book
router.post("/my-books/:bookId", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const bookId = helper.isValidString(req.params.bookId);

        // User book must be in global library
        await bookData.getBookById(bookId);

        const updated = await userData.addToMyBooks(uid, bookId);

        // Invalidate user cache
        await redis.delCache(`user:${uid}`).catch(() => {});

        return res.status(200).json({ my_books: updated.my_books || [] });
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

// Get all books at user's mybook
router.get("/my-books", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;

        const bookIds = await userData.getMyBookIds(uid);

        if (bookIds.length === 0) return res.status(200).json([]);

        // Fetch full book documents for each id
        const bookPromises = bookIds.map((id) =>
            bookData.getBookById(id).catch(() => null),
        );
        const books = (await Promise.all(bookPromises)).filter(Boolean);

        return res.status(200).json(books);
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

// Remove a book from user's personal library
router.delete("/my-books/:bookId", verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const bookId = helper.isValidString(req.params.bookId);

        const updated = await userData.removeFromMyBooks(uid, bookId);

        // Invalidate user cache
        await redis.delCache(`user:${uid}`).catch(() => {});

        return res.status(200).json({ my_books: updated.my_books || [] });
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

// EXPORT THE CREATED ROUTER
export default router;