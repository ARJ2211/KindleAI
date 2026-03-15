import axios from "axios";
import { isValidString } from "../helper.js";

const GOOGLE_BOOKS_API_ENDPOINT = "https://www.googleapis.com/books/v1/volumes";

/**
 * We will use Levenshtein distance on normalized string + author
 * name to perform a fuzzy search between a and b
 *
 * @param {string} a first string
 * @param {string} b second string
 *
 * @returns {Number}
 */
const levenshteinDist = (a, b) => {
    const m = a.length;
    const n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] =
                a[i - 1] === b[j - 1]
                    ? dp[i - 1][j - 1]
                    : 1 +
                      Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }

    return dp[m][n];
};

/**
 * This function will return the best match of the book
 * wrt the response of the google books API.
 * @param {*} items Google API response
 * @param {*} rawTitle  Title of the book as per epub meta
 * @param {*} rawAuthor Name of the author as per epub meta
 * @returns {Object}
 */
const pickBestMatch = (items, rawTitle, rawAuthor) => {
    const normalize = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

    const target = normalize(rawTitle);

    let bestItem = null;
    let bestScore = Infinity;

    for (const item of items) {
        const vol = item.volumeInfo;
        if (!vol) continue;

        const candidate = normalize(vol.title);
        let score = levenshteinDist(target, candidate);

        if (rawAuthor && rawAuthor !== "Unknown" && vol.authors) {
            const authorTarget = normalize(rawAuthor);
            const authorMatch = vol.authors.some(
                (a) =>
                    normalize(a).includes(authorTarget) ||
                    authorTarget.includes(normalize(a)),
            );
            if (authorMatch) score -= 5;
        }

        if (score < bestScore) {
            bestScore = score;
            bestItem = item;
        }
    }

    if (bestScore > target.length * 0.5) return null;
    return bestItem;
};

/**
 * Extract the best ISBN (International Standard Book Number)
 */
const extractISBN = (identifiers) => {
    if (!identifiers) return null;
    const isbn13 = identifiers.find((id) => id.type === "ISBN_13");
    if (isbn13) return isbn13.identifier;
    const isbn10 = identifiers.find((id) => id.type === "ISBN_10");
    if (isbn10) return isbn10.identifier;
    return null;
};

/**
 * Get the cover img for the book
 */
const extractCover = (imageLinks) => {
    if (!imageLinks) return null;

    const url =
        imageLinks.medium ||
        imageLinks.large ||
        imageLinks.thumbnail ||
        imageLinks.smallThumbnail;

    if (!url) return null;

    const cleanURL = url
        .replace("http://", "https://")
        .replace("&edge=curl", "");

    return cleanURL;
};

/**
 * This function will hit the google books API
 * and return the best matches for the books.
 * @param {*} title The title of the book
 * @param {*} author The author of the book
 * @returns
 */
export const lookupBook = async (title, author) => {
    try {
        title = isValidString(title);
        if (title === "Unknown") return null;
    } catch (e) {
        return null;
    }

    try {
        let q = `intitle:${title}`;
        if (author && author !== "Unknown" && author.trim() != "") {
            q += `+author:${author}`;
        }

        const { data } = await axios.get(GOOGLE_BOOKS_API_ENDPOINT, {
            params: {
                q,
                maxResults: 3,
                printType: "books",
                langRestring: "en",
                // I am gonna push an API key on github 😎
                // P.S Its okay because the scope is just set for this
                key: "AIzaSyCnIeK8_ic7Anh0nTRgbbnHVurDySIfdsc",
            },
            timeout: 5000,
        });

        if (!data.items || data.items.length === 0) return null;

        const best = pickBestMatch(data.items, title, author);
        if (!best) return null;

        const vol = best.volumeInfo;

        return {
            google_books_id: best.id,
            title: vol.title || title,
            subtitle: vol.subtitle || null,
            authors: vol.authors || (author ? [author] : []),
            author: (vol.authors && vol.authors[0]) || author || "Unknown",
            description: vol.description || null,
            categories: vol.categories || [],
            published_date: vol.publishedDate || null,
            page_count: vol.pageCount || null,
            isbn: extractISBN(vol.industryIdentifiers),
            cover_url: extractCover(vol.imageLinks),
            language: vol.language || null,
        };
    } catch (e) {
        return null;
    }
};
