export const mongoConfig = {
    serverUrl: process.env.MONGO_URL || "mongodb://localhost:27017/",
    database: process.env.MONGO_DB || "KindleAI",
};

/** Limits for persisted chat rows (used by chatData.appendChatMessage). */
export const chatMessageLimits = {
    maxUserChars: Number(process.env.CHAT_MAX_MESSAGE_CHARS) || 4000,
    maxAssistantChars: 200_000,
};

/** Ollama HTTP API (used by services/ollamaStream.js and book chat handler). */
export const ollamaConfig = {
    baseUrl: (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(
        /\/$/,
        "",
    ),
    model: process.env.OLLAMA_MODEL || "llama3.2:3b",
    timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS) || 120_000,
};
