/**
 * Split text into overlapping chunks.
 *
 * @param {string} text source text
 * @param {object} opts
 * @returns {string[]} array of text chunks
 */
export function chunkText(text, { chunkSize = 1000, chunkOverlap = 200 } = {}) {
    if (!text || text.length === 0) return [];

    const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text];

    const chunks = [];
    let current = "";

    for (const sentence of sentences) {
        if (
            current.length + sentence.length > chunkSize &&
            current.length > 0
        ) {
            chunks.push(current.trim());

            if (chunkOverlap > 0) {
                current = current.slice(-chunkOverlap) + sentence;
            } else {
                current = sentence;
            }
        } else {
            current += sentence;
        }
    }

    if (current.trim().length > 0) {
        chunks.push(current.trim());
    }

    return chunks;
}

/**
 * Chunk all chapters and return flat array of chunk objects ready for embedding.
 *
 * @param {{ id: string, title: string, text: string }[]} chapters
 * @param {object} opts passed to chunkText
 * @returns {{ chapterId: string, chapterTitle: string, chunkIndex: number, text: string }[]}
 */
export function chunkChapters(chapters, opts) {
    const allChunks = [];

    for (const ch of chapters) {
        const textChunks = chunkText(ch.text, opts);

        for (let i = 0; i < textChunks.length; i++) {
            allChunks.push({
                chapterId: ch.id,
                chapterTitle: ch.title,
                chunkIndex: i,
                text: textChunks[i],
            });
        }
    }

    return allChunks;
}
