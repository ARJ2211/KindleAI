import * as E from "epub2";

/**
 * Parse an EPUB file and return an array of { id, title, text } per chapter.
 */
export async function parseEpub(filePath) {
    const epub = await E.EPub.createAsync(filePath);
    const chapters = [];

    for (const ch of epub.flow) {
        try {
            const raw = await epub.getChapterRawAsync(ch.id);
            const text = raw
                .replace(/<[^>]*>/g, " ")
                .replace(/&nbsp;/g, " ")
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&#?\w+;/g, " ")
                .replace(/\s+/g, " ")
                .trim();

            if (text.length < 50) continue;

            chapters.push({
                id: ch.id,
                title: ch.title || ch.id,
                text,
            });
        } catch {
            continue;
        }
    }

    return {
        metadata: {
            title: epub.metadata?.title || "Unknown",
            author: epub.metadata?.creator || "Unknown",
            description: epub.metadata?.description || "",
        },
        chapters,
    };
}
