import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from "react";
import { useAuth } from "./AuthContext.jsx";
import { connectSocket, disconnectSocket, getSocket } from "../socket.js";

// creating the docket context here.
const SocketContext = createContext(null);

/**
 * This is a custom component so that every component
 * under this will have access to the socket io
 * @param {*} param0
 */
export function SocketProvider({ children }) {
    const { user } = useAuth();
    const [connected, setConnected] = useState(false);

    // THESE ARE THE GLOBAL REQUIREMENTS (EVERY USER SHOULD GET THIS)
    const [ingestProgress, setIngestProgress] = useState(null);
    // ==============================================================
    // Connect / disconnect with auth state
    useEffect(() => {
        if (!user) {
            disconnectSocket();
            setConnected(false);
            setIngestProgress(null);
            return;
        }

        let cancelled = false;

        connectSocket().then((s) => {
            if (cancelled || !s) return;

            // Check if already connected (event already fired)
            if (s.connected) {
                console.log("[socket] Already connected:", s.id);
                setConnected(true);
            }

            s.on("connect", () => {
                console.log("[socket] Connected:", s.id);
                setConnected(true);
            });

            s.on("disconnect", () => {
                console.log("[socket] Disconnected");
                setConnected(false);
            });

            // Listen for ingest progress globally
            s.on("ingest:progress", (data) => {
                const total = data.total || 0;
                const done = data.done || 0;
                const percent =
                    total > 0 ? Math.round((done / total) * 100) : 0;

                setIngestProgress({
                    bookId: data.bookId,
                    stage: data.stage,
                    done,
                    total,
                    percent,
                    message: data.message || null,
                    error: data.error || null,
                });
            });
        });

        return () => {
            cancelled = true;
            disconnectSocket();
            setConnected(false);
        };
    }, [user]);

    const isIngesting =
        ingestProgress !== null &&
        ingestProgress.stage !== "complete" &&
        ingestProgress.stage !== "error";

    const resetIngestProgress = useCallback(() => setIngestProgress(null), []);

    return (
        <SocketContext.Provider
            value={{
                connected,
                ingestProgress,
                isIngesting,
                resetIngestProgress,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
}
