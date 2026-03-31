import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import * as helper from "../helper.js";
import * as annotationData from "../data/annotationData.js";

const router = Router();

// All annotation routes are protected
router.use(verifyToken);

/** -----------------------------------------------
 * POST /annotation/:bookId
 * ----------------------------------------------- */
router.post("/:bookId", async (req, res) => {
    try {
        const userId = req.user.uid;
        const bookId = helper.isValidString(req.params.bookId);
        const { type, chapter, selected_text, note_text } = req.body;

        if (!type || !chapter) {
            return res.status(400).json({ msg: "type and chapter are required" });
        }

        const annotation = await annotationData.createAnnotation(
            userId,
            bookId,
            type,
            chapter,
            selected_text,
            note_text
        );

        return res.status(201).json(annotation);
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

/** -----------------------------------------------
 * GET /annotation/single/:annotationId
 * ----------------------------------------------- */
router.get("/single/:annotationId", async (req, res) => {
    try {
        const userId = req.user.uid;
        const annotationId = helper.isValidString(req.params.annotationId);

        const annotation = await annotationData.getAnnotationById(annotationId, userId);

        return res.status(200).json(annotation);
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

/** -----------------------------------------------
 * GET /annotation/:bookId/chapter/:chapter
 * ----------------------------------------------- */
router.get("/:bookId/chapter/:chapter", async (req, res) => {
    try {
        const userId = req.user.uid;
        const bookId = helper.isValidString(req.params.bookId);
        const chapter = helper.isValidString(req.params.chapter);

        const result = await annotationData.getAnnotationsByChapter(
            userId,
            bookId,
            chapter
        );

        return res.status(200).json(result);
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

/** -----------------------------------------------
 * Get all annotations for a user + book 
 * ----------------------------------------------- */
router.get("/:bookId", async (req, res) => {
    try {
        const userId = req.user.uid;
        const bookId = helper.isValidString(req.params.bookId);
        const { type } = req.query;

        let result;

        if (type) {
            result = await annotationData.getAnnotationsByType(userId, bookId, type);
        } else {
            result = await annotationData.getAnnotationsByUserAndBook(userId, bookId);
        }

        return res.status(200).json(result);
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

/** -----------------------------------------------
 * PATCH /annotation/single/:annotationId
 * ----------------------------------------------- */
router.patch("/single/:annotationId", async (req, res) => {
    try {
        const userId = req.user.uid;
        const annotationId = helper.isValidString(req.params.annotationId);
        const { note_text, selected_text } = req.body;

        const updated = await annotationData.updateAnnotation(
            annotationId,
            userId,
            { note_text, selected_text }
        );

        return res.status(200).json(updated);
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

/** -----------------------------------------------
 * DELETE /annotation/single/:annotationId

 * ----------------------------------------------- */
router.delete("/single/:annotationId", async (req, res) => {
    try {
        const userId = req.user.uid;
        const annotationId = helper.isValidString(req.params.annotationId);

        await annotationData.deleteAnnotation(annotationId, userId);

        return res.status(200).json({ msg: "Annotation deleted successfully" });
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

/** -----------------------------------------------
 * DELETE /annotation/:bookId/all
 * ----------------------------------------------- */
router.delete("/:bookId/all", async (req, res) => {
    try {
        const userId = req.user.uid;
        const bookId = helper.isValidString(req.params.bookId);

        const deletedCount = await annotationData.deleteAllAnnotationsForBook(userId, bookId);

        return res.status(200).json({
            msg: `Deleted ${deletedCount} annotation(s)`,
            deletedCount,
        });
    } catch (e) {
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

export default router;