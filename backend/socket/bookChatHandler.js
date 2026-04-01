import * as userLibraryData from "../data/userLibraryData.js";
import * as bookData from "../data/bookData.js";
import * as chatData from "../data/chatData.js";
import * as helper from "../helper.js";
import { embedText } from "../embedder/embedder.js";
import { searchBook } from "../embedder/qdrantClient.js";
import { chatMessageLimits, ragConfig } from "../config/settings.js";
import { streamOllamaChat } from "../services/ollamaStream.js";

const SYSTEM_PROMPT = `You are a reading assistant for a single book. Answer using ONLY the CONTEXT passages below. If the answer is not supported by the context, say you cannot find it in the book. Be concise. When relevant, mention the chapter title.`;

function buildContextBlock(chunks, maxChars) {
    let used = 0;
    const parts = [];
    for (const c of chunks) {
        const title = c.chapterTitle || "Unknown chapter";
        const block = `[Chapter: ${title}]\n${c.text}`;
        if (used + block.length > maxChars && parts.length > 0) break;
        parts.push(block);
        used += block.length + 4;
        if (used >= maxChars) break;
    }
    return parts.join("\n\n---\n\n");
}

function toSourceRecords(chunks) {
    return chunks.map((c) => ({
        chapterTitle: c.chapterTitle || "",
        chapterId: c.chapterId || "",
        score: c.score,
        excerpt: (c.text || "").slice(0, 320),
    }));
}

/**
 * @param {import("socket.io").Socket} socket
 */
export function registerBookChatHandlers(socket) {
    socket.on("book:chat:ask", async (payload) => {
        const uid = socket.uid;
        const requestId = payload?.requestId;
        const bookId = payload?.bookId;
        const message = payload?.message;

        const fail = (msg) => {
            socket.emit("book:chat:error", { requestId, msg });
        };

        if (!requestId || typeof requestId !== "string") {
            socket.emit("book:chat:error", {
                requestId: null,
                msg: "Missing requestId",
            });
            return;
        }

        let userMessage;
        try {
            userMessage = helper.isValidString(message);
        } catch {
            return fail("Invalid message");
        }

        if (userMessage.length > chatMessageLimits.maxUserChars) {
            return fail(
                `Message exceeds ${chatMessageLimits.maxUserChars} characters`,
            );
        }

        let bookIdStr;
        try {
            bookIdStr = helper.isValidString(bookId);
        } catch {
            return fail("Invalid bookId");
        }

        try {
            const entry = await userLibraryData.getUserLibraryEntry(
                uid,
                bookIdStr,
            );
            if (!entry) {
                return fail("Book not in your library");
            }

            const book = await bookData.getBookById(bookIdStr);
            if (!book.embedding_ready) {
                return fail("AI indexing is not ready for this book yet");
            }

            await chatData.appendChatMessage(uid, bookIdStr, {
                role: "user",
                content: userMessage,
            });

            const queryVector = await embedText(userMessage);
            const chunks = await searchBook(
                queryVector,
                bookIdStr,
                ragConfig.topK,
            );

            const contextBlock = buildContextBlock(
                chunks,
                ragConfig.contextMaxChars,
            );
            const userContent = contextBlock
                ? `CONTEXT:\n${contextBlock}\n\nQUESTION:\n${userMessage}`
                : `No relevant passages were retrieved from the book.\n\nQUESTION:\n${userMessage}`;

            const messages = [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userContent },
            ];

            const streamAbort = new AbortController();
            const onDisconnect = () => streamAbort.abort();
            socket.on("disconnect", onDisconnect);

            let fullReply = "";
            try {
                await streamOllamaChat(
                    messages,
                    (piece) => {
                        fullReply += piece;
                        if (socket.connected) {
                            socket.emit("book:chat:chunk", {
                                requestId,
                                text: piece,
                            });
                        }
                    },
                    streamAbort.signal,
                );

                const sources = toSourceRecords(chunks);
                await chatData.appendChatMessage(uid, bookIdStr, {
                    role: "assistant",
                    content: fullReply || "(no response)",
                    sources,
                });

                socket.emit("book:chat:done", { requestId, sources });
            } catch (streamErr) {
                // Only swallow aborts we triggered on socket disconnect.
                // Ollama timeout/other AbortError must propagate to fail() below.
                if (streamAbort.signal.aborted) {
                    console.log(
                        "[book:chat:ask] Stream aborted (client disconnected)",
                    );
                    return;
                }
                throw streamErr;
            } finally {
                socket.off("disconnect", onDisconnect);
            }
        } catch (e) {
            console.error("[book:chat:ask]", e.message || e);
            fail(e.msg || e.message || "Chat failed");
        }
    });
}
