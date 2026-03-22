import { io } from "socket.io-client";
import { auth } from "./firebase/config";

const URL = "http://localhost:3000";
let socket = null;

export const getSocket = () => {
    if (socket) {
        return socket;
    }

    const user = auth.currentUser;
    if (!user) {
        return null;
    }

    socket = io(URL, {
        auth: {
            token: null,
        },
        autoConnect: false,
    });

    socket.on("connect_error", async (err) => {
        if (err.message.includes("Authentication")) {
            try {
                const token = await user.getIdToken(true);
                socket.auth.token = token;
                socket.connect();
            } catch (e) {
                console.error("[socket] Failed to refresh token:", e.message);
            }
        }
    });

    return socket;
};

export async function connectSocket() {
    const user = auth.currentUser;
    if (!user) return null;

    const s = getSocket();
    if (!s) return null;

    const token = await user.getIdToken();
    s.auth.token = token;
    s.connect();

    return s;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
