import express from "express";
import admin from "firebase-admin";
import cors from "cors";

import { createServer } from "http";

import { verifyToken } from "./middleware/auth.js";
import configRoutes from "./routes/index.js";
import { logger } from "./middleware/logger.js";
import { initSocket } from "./socket/index.js";

const app = express();
const PORT = 3000;

export const fireBaseApp = admin.initializeApp({
    credential: admin.credential.cert("./serviceAccountKey.json"),
});

process.on("uncaughtException", (err) => {
    console.error("[uncaughtException]:", err);
});

process.on("unhandledRejection", (err) => {
    console.error("[unhandledRejection]:", err);
});

// ================ EXPRESS ================
app.use(logger);
app.use(cors());
app.use(
    "/epub",
    // verifyToken,
    express.static("uploads"),
); // Keep token verification ?
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

configRoutes(app);

// ================ SOCKET.IO ===============
const httpServer = createServer(app);
initSocket(httpServer);

// ================ RUN SERVER ==============
httpServer.listen(PORT, () => {
    console.log(`\n\n[server] Server listening on port: ${PORT}`);
});
