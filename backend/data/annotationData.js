import { annotations, books } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import * as helper from "../helper.js";

const VALID_TYPES = ["highlight", "bookmark", "note"];

/**
 * Create a new annotation (highlight, bookmark, or note).
 *
 * @param {string} userId  
 * @param {string} bookId   
 * @param {string} type     
 * @param {string} chapter  
 * @param {string} [selectedText]
 * @param {string} [noteText]    
 * @returns {object} 
 */
export const createAnnotation = async (
    userId,
    bookId,
    type,
    chapter,
    selectedText = "",
    noteText = ""
) => {
    userId = helper.isValidString(userId);
    bookId = helper.isValidString(bookId);
    type = helper.isValidString(type);
    chapter = helper.isValidString(chapter);

    if (!ObjectId.isValid(bookId)) {
        helper.throwError(400, `Invalid book ID: ${bookId}`);
    }

    if (!VALID_TYPES.includes(type)) {
        helper.throwError(
            400,
            `Invalid annotation type. Must be one of: ${VALID_TYPES.join(", ")}`
        );
    }

    if (type === "highlight" && !selectedText?.trim()) {
        helper.throwError(400, "selectedText is required for highlight annotations");
    }

    if (type === "note" && !noteText?.trim()) {
        helper.throwError(400, "noteText is required for note annotations");
    }

    // Validate book exists before creating annotation
    const booksCol = await books();
    const bookExists = await booksCol.findOne({ _id: new ObjectId(bookId) });
    if (!bookExists) {
        helper.throwError(404, `Book ${bookId} not found`);
    }

    const col = await annotations();

    const newAnnotation = {
        user_id: userId,
        book_id: new ObjectId(bookId),
        type,
        chapter,
        selected_text: selectedText?.trim() || "",
        note_text: noteText?.trim() || "",
        created_at: new Date(),
    };

    const result = await col.insertOne(newAnnotation);

    if (!result.acknowledged) {
        helper.throwError(500, "Failed to create annotation");
    }

    return { ...newAnnotation, _id: result.insertedId };
};

/**
 * Get all annotations for a specific user and book.
 * Sorted by created at ascending like readuing order.
 *
 * @param {string} userId
 * @param {string} bookId
 * @returns {object[]}
 */
export const getAnnotationsByUserAndBook = async (userId, bookId) => {
    userId = helper.isValidString(userId);
    bookId = helper.isValidString(bookId);

    if (!ObjectId.isValid(bookId)) {
        helper.throwError(400, `Invalid book ID: ${bookId}`);
    }

    const col = await annotations();

    return col
        .find({ user_id: userId, book_id: new ObjectId(bookId) })
        .sort({ created_at: 1 })
        .toArray();
};

/**
 * Get annotations filtered by type for a user and book.
 *
 * @param {string} userId
 * @param {string} bookId
 * @param {string} type  
 * @returns {object[]}
 */
export const getAnnotationsByType = async (userId, bookId, type) => {
    userId = helper.isValidString(userId);
    bookId = helper.isValidString(bookId);
    type = helper.isValidString(type);

    if (!ObjectId.isValid(bookId)) {
        helper.throwError(400, `Invalid book ID: ${bookId}`);
    }

    if (!VALID_TYPES.includes(type)) {
        helper.throwError(
            400,
            `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}`
        );
    }

    const col = await annotations();

    return col
        .find({ user_id: userId, book_id: new ObjectId(bookId), type })
        .sort({ created_at: 1 })
        .toArray();
};

/**
 * Get all annotations for a user + book filtered by chapter.
 * Used by the reader UI to load annotations when a chapter opens.
 *
 * @param {string} userId
 * @param {string} bookId
 * @param {string} chapter  
 * @returns {object[]}
 */
export const getAnnotationsByChapter = async (userId, bookId, chapter) => {
    userId = helper.isValidString(userId);
    bookId = helper.isValidString(bookId);
    chapter = helper.isValidString(chapter);

    if (!ObjectId.isValid(bookId)) {
        helper.throwError(400, `Invalid book ID: ${bookId}`);
    }

    const col = await annotations();

    return col
        .find({
            user_id: userId,
            book_id: new ObjectId(bookId),
            chapter: chapter,
        })
        .sort({ created_at: 1 })
        .toArray();
};

/**
 * Get a single annotation by its ID.
 *verifing the annotation belongs to the perticular  user.
 *
 * @param {string} annotationId
 * @param {string} userId
 * @returns {object}
 */
export const getAnnotationById = async (annotationId, userId) => {
    annotationId = helper.isValidString(annotationId);
    userId = helper.isValidString(userId);

    if (!ObjectId.isValid(annotationId)) {
        helper.throwError(400, `Invalid annotation ID: ${annotationId}`);
    }

    const col = await annotations();
    const annotation = await col.findOne({ _id: new ObjectId(annotationId) });

    if (!annotation) {
        helper.throwError(404, "Annotation not found");
    }

    if (annotation.user_id !== userId) {
        helper.throwError(403, "You do not have permission to access this annotation");
    }

    return annotation;
};

/**
 * Update for an note_text or selected_text .
 * owner can update.
 *
 * @param {string} annotationId
 * @param {string} userId
 * @param {object} updates
 * @param {string} [updates.note_text]
 * @param {string} [updates.selected_text]
 * @returns {object} 
 */
export const updateAnnotation = async (annotationId, userId, updates) => {
    annotationId = helper.isValidString(annotationId);
    userId = helper.isValidString(userId);

    if (!ObjectId.isValid(annotationId)) {
        helper.throwError(400, `Invalid annotation ID: ${annotationId}`);
    }

    // Verify ownership first
    await getAnnotationById(annotationId, userId);

    const setFields = {};

    if (updates.note_text !== undefined) {
        if (typeof updates.note_text !== "string") {
            helper.throwError(400, "note_text must be a string");
        }
        setFields.note_text = updates.note_text.trim();
    }

    if (updates.selected_text !== undefined) {
        if (typeof updates.selected_text !== "string") {
            helper.throwError(400, "selected_text must be a string");
        }
        setFields.selected_text = updates.selected_text.trim();
    }

    if (Object.keys(setFields).length === 0) {
        helper.throwError(400, "No valid fields provided for update");
    }

    const col = await annotations();
    const result = await col.findOneAndUpdate(
        { _id: new ObjectId(annotationId) },
        { $set: setFields },
        { returnDocument: "after" }
    );

    if (!result) {
        helper.throwError(404, "Annotation not found");
    }

    return result;
};

/**
 * Delete a single    annotation by ID.
 * owner can delete    annotation.
 *
 * @param {string} annotationId
 * @param {string} userId
 * @returns {boolean} 
 */
export const deleteAnnotation = async (annotationId, userId) => {
    annotationId = helper.isValidString(annotationId);
    userId = helper.isValidString(userId);

    if (!ObjectId.isValid(annotationId)) {
        helper.throwError(400, `Invalid annotation ID: ${annotationId}`);
    }

    // Verify ownership first
    await getAnnotationById(annotationId, userId);

    const col = await annotations();
    const result = await col.deleteOne({ _id: new ObjectId(annotationId) });

    if (result.deletedCount === 0) {
        helper.throwError(404, "Annotation not found");
    }

    return true;
};

/**
 * Delete all annotations for a user and book.
 * 
 *
 * @param {string} userId
 * @param {string} bookId
 * @returns {number} 
 */
export const deleteAllAnnotationsForBook = async (userId, bookId) => {
    userId = helper.isValidString(userId);
    bookId = helper.isValidString(bookId);

    if (!ObjectId.isValid(bookId)) {
        helper.throwError(400, `Invalid book ID: ${bookId}`);
    }

    const col = await annotations();
    const result = await col.deleteMany({
        user_id: userId,
        book_id: new ObjectId(bookId),
    });

    return result.deletedCount;
};