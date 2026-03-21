import admin from "firebase-admin";

/**
 * This middleware checks and verifies
 * the token that we get
 */
export function socketAuth(socket, next) {
    const token = socket.handshake.auth?.token;

    if (!token) {
        return next(new Error("Authentication error: no token provided"));
    }

    admin
        .auth()
        .verifyIdToken(token)
        .then((decoded) => {
            socket.uid = decoded.uid;
            next();
        })
        .catch((err) => {
            console.error(err.message);
            next(new Error("Authentication error: invalid token"));
        });
}
