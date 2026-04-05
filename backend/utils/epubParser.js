import * as E from "epub2";

/**
 * Prefer spine/nav title; avoid raw flow ids like "item12".
 * Fall back to a heading-like line from the chapter text, then a stable label.
 *
 * @param {{ id: string, title?: string }} ch
 * @param {string} plainText stripped chapter body
 * @param {number} sectionIndex 0-based index among kept chapters (for fallback label)
 */
function resolveChapterTitle(ch, plainText, sectionIndex) {
    const id = String(ch.id || "");
    const rawTitle = (ch.title || "").trim();

    if (
        rawTitle &&
        !/^item\d+$/i.test(rawTitle) &&
        rawTitle.toLowerCase() !== id.toLowerCase()
    ) {
        return rawTitle.length > 200
            ? `${rawTitle.slice(0, 197)}…`
            : rawTitle;
    }

    const text = plainText.replace(/\s+/g, " ").trim();

    const chapterHeading = text.match(
        /\bCHAPTER\s+(?:[IVXLCDM]+|\d+)[^.!?\n]*/i,
    );
    if (chapterHeading) {
        const h = chapterHeading[0].trim();
        return h.length > 120 ? `${h.slice(0, 117)}…` : h;
    }

    const subMatch = text.match(/\b(?:Section|Part)\s+\d+[^.!?\n]*/i);
    if (subMatch) {
        const h = subMatch[0].trim();
        return h.length > 120 ? `${h.slice(0, 117)}…` : h;
    }

    const first = text.slice(0, 200).split(/(?<=[.!?])\s+/)[0]?.trim();
    if (first && first.length >= 8 && first.length <= 100) return first;

    return `Section ${sectionIndex + 1}`;
}

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
                title: resolveChapterTitle(ch, text, chapters.length),
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
