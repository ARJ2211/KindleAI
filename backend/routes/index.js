import userRoutes from "./userRoutes.js";
import bookRoutes from "./booksRoutes.js";
import libraryRoutes from "./userLibraryRoutes.js";
import ttsRoutes from "./ttsRoutes.js";
import annotationRoutes from "./annotationRoutes.js";

const constructorMethod = (app) => {
    app.use("/user", userRoutes);
    app.use("/book", bookRoutes);
    app.use("/annotation", annotationRoutes);
    app.use("/library", libraryRoutes);
    app.use("/tts", ttsRoutes);
    app.use("/*splat", (req, res, next) => {
        if (req.originalUrl.startsWith("/socket.io")) return next();
        return res.status(404).json({ error: "ERROR: route not found" });
    });
};

export default constructorMethod;
