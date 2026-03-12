import userRoutes from "./userRoutes.js";

const constructorMethod = (app) => {
    app.use("/user", userRoutes);
};

export default constructorMethod;
