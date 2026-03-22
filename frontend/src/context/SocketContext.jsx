import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from "react";
import { useAuth } from "./AuthContext.jsx";
import { connectSocket, disconnectSocket } from "../socket.js";

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

    // I need to create a map of bookID with prog obj
    const [ingestMap, setIngestMap] = useState({});
    // ==============================================================

    // Connect / disconnect with auth state
    useEffect(() => {
        if (!user) {
            disconnectSocket();
            setConnected(false);
            setIngestMap({});
            return;
        }

        let cancelled = false;

        connectSocket().then((s) => {
            if (cancelled || !s) return;

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

            s.on("ingest:progress", (data) => {
                const total = data.total || 0;
                const done = data.done || 0;
                const percent =
                    total > 0 ? Math.round((done / total) * 100) : 0;

                setIngestMap((prev) => ({
                    ...prev,
                    [data.bookId]: {
                        bookId: data.bookId,
                        stage: data.stage,
                        done,
                        total,
                        percent,
                        message: data.message || null,
                        error: data.error || null,
                    },
                }));
            });
        });

        return () => {
            cancelled = true;
            disconnectSocket();
            setConnected(false);
        };
    }, [user]);

    const resetIngestProgress = (bookId) => {
        setIngestMap((prev) => {
            const next = { ...prev };
            delete next[bookId];
            return next;
        });
    };

    return (
        <SocketContext.Provider
            value={{
                connected,
                ingestMap,
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
