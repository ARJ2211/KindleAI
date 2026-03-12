import { fireBaseApp } from "../app.js";

/**
 * Express middleware that verifies a Firebase ID token from the
 * Authorization header
 */
export async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ msg: "Missing bearer token" });
    }

    const idToken = authHeader.split("Bearer ")[1];

    try {
        const decoded = await fireBaseApp.auth().verifyIdToken(idToken);
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ msg: "Invalid or expired token" });
    }
}
