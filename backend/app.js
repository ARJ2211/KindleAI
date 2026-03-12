import express from "express";
import admin from "firebase-admin";

const app = express();
const PORT = 3000;

admin.initializeApp({
    credential: admin.credential.cert("./serviceAccountKey.json"),
});

// ================ EXPRESS ================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => {
    console.log(`Server started @ port: ${PORT}`);
});
