import express from "express";
import admin from "firebase-admin";
import cors from "cors";
import configRoutes from "./routes/index.js";

const app = express();
const PORT = 3000;

export const fireBaseApp = admin.initializeApp({
    credential: admin.credential.cert("./serviceAccountKey.json"),
});

// ================ EXPRESS ================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

configRoutes(app);

app.listen(PORT, () => {
    console.log(`\n\nServer listening on port: ${PORT}`);
});
