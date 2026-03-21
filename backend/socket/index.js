import { Server } from "socket.io";

let io = null;

/**
 * This function will give us a socket connection
 * to whomever requires it.
 * @returns
 */
export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized. Call initSocket() first.");
    }
    return io;
};

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        const uid = socket.uid;
        console.log(`[socket] User connected: ${uid} (${socket.id})`);
        socket.join(uid);

        socket.on("disconnect", (reason) => {
            console.log(`[socket] User disconnected: ${uid} (${reason})`);
        });
    });

    console.log("[socket] Socket.io server initialized");
    return io;
};
