export const mongoConfig = {
    serverUrl: process.env.MONGO_URL || "mongodb://localhost:27017/",
    database: process.env.MONGO_DB || "KindleAI",
};

/** Limits for persisted chat rows (used by chatData.appendChatMessage). */
export const chatMessageLimits = {
    maxUserChars: Number(process.env.CHAT_MAX_MESSAGE_CHARS) || 4000,
    maxAssistantChars: 200_000,
};
