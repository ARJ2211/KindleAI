export const mongoConfig = {
    serverUrl: process.env.MONGO_URL || "mongodb://localhost:27017/",
    database: process.env.MONGO_DB || "KindleAI",
};
