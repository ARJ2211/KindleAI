import userRoutes from "./userRoutes.js";
import bookRoutes from "./booksRoutes.js";

const constructorMethod = (app) => {
    app.use("/user", userRoutes);
    app.use("/book", bookRoutes);
    app.use("/*splat", (_, res) => {
        return res.status(404).json({ error: "ERROR: route not found" });
    });
};

export default constructorMethod;
