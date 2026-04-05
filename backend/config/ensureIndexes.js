import { annotations } from "./mongoCollections.js";

export const ensureAnnotationIndexes = async () => {
    const col = await annotations();
    await col.createIndex({ user_id: 1, book_id: 1 });
    await col.createIndex({ user_id: 1, book_id: 1, type: 1 });
    await col.createIndex({ user_id: 1, book_id: 1, chapter: 1 });
    console.log("[db] Annotation indexes ensured");
};