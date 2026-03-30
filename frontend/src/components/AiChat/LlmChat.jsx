import { useEffect, useState, useRef, useCallback } from "react";
import {
    Box,
    Typography,
    TextField,
    IconButton,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import api from "../../api/axios.js";
import { connectSocket } from "../../socket.js";

const MAX_MESSAGE_CHARS = 4000;

/** EPUB spine ids (item12) and similar — not useful in the Sources line. */
function isGenericChapterLabel(title) {
    const t = (title || "").trim();
    return (
        !t ||
        /^item\d+$/i.test(t) ||
        /^html\d+$/i.test(t) ||
        /^xhtml\d+$/i.test(t)
    );
}

/** Prefer a real title; otherwise a short excerpt preview from stored sources. */
function formatSourceLabel(s) {
    if (!isGenericChapterLabel(s?.chapterTitle)) {
        const t = s.chapterTitle.trim();
        return t.length > 72 ? `${t.slice(0, 69)}…` : t;
    }
    const ex = (s.excerpt || "").replace(/\s+/g, " ").trim();
    if (ex) return ex.length > 72 ? `${ex.slice(0, 69)}…` : ex;
    return "Book passage";
}

/**
 * Book-grounded assistant: loads history, streams replies over Socket.IO.
 *
 * @param {{ bookId: string, embeddingReady: boolean }} props
 */
export default function LlmChat({ bookId, embeddingReady }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [banner, setBanner] = useState(null);
    const [clearDialogOpen, setClearDialogOpen] = useState(false);
    const [clearing, setClearing] = useState(false);
    const requestIdRef = useRef(null);
    const listEndRef = useRef(null);

    const loadHistory = useCallback(async () => {
        if (!bookId) return;
        try {
            setLoadingHistory(true);
            const res = await api.get(`/library/${bookId}/chat`);
            setMessages(
                (res.data || []).map((m) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    created_at: m.created_at,
                    sources: m.sources,
                    streaming: false,
                })),
            );
            setBanner(null);
        } catch (e) {
            setBanner(e.response?.data?.msg || "Could not load chat history");
        } finally {
            setLoadingHistory(false);
        }
    }, [bookId]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    useEffect(() => {
        listEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, busy]);

    useEffect(() => {
        let socket = null;
        let cancelled = false;

        const onChunk = (data) => {
            if (!data?.requestId || data.requestId !== requestIdRef.current)
                return;
            const piece = data.text || "";
            setMessages((prev) =>
                prev.map((m) =>
                    m.requestId === data.requestId && m.streaming
                        ? { ...m, content: m.content + piece }
                        : m,
                ),
            );
        };

        const onDone = async (data) => {
            if (!data?.requestId || data.requestId !== requestIdRef.current)
                return;
            requestIdRef.current = null;
            setBusy(false);
            await loadHistory();
        };

        const onError = async (data) => {
            const rid = data?.requestId;
            if (rid != null && rid !== requestIdRef.current) return;
            requestIdRef.current = null;
            setBusy(false);
            setBanner(data?.msg || "Chat failed");
            await loadHistory();
        };

        connectSocket().then((s) => {
            if (cancelled || !s) return;
            socket = s;
            s.on("book:chat:chunk", onChunk);
            s.on("book:chat:done", onDone);
            s.on("book:chat:error", onError);
        });

        return () => {
            cancelled = true;
            if (socket) {
                socket.off("book:chat:chunk", onChunk);
                socket.off("book:chat:done", onDone);
                socket.off("book:chat:error", onError);
            }
        };
    }, [loadHistory]);

    const handleSend = () => {
        const text = input.trim();
        if (!text || busy || !bookId || !embeddingReady) return;

        const requestId = crypto.randomUUID();
        requestIdRef.current = requestId;
        setInput("");
        setBanner(null);
        setBusy(true);

        setMessages((prev) => [
            ...prev,
            {
                id: `local-user-${requestId}`,
                role: "user",
                content: text,
                streaming: false,
            },
            {
                id: `local-asst-${requestId}`,
                role: "assistant",
                content: "",
                streaming: true,
                requestId,
            },
        ]);

        connectSocket().then((s) => {
            if (!s) {
                setBanner("Sign in required to chat");
                setBusy(false);
                requestIdRef.current = null;
                loadHistory();
                return;
            }
            const emitAsk = () => {
                s.emit("book:chat:ask", {
                    bookId,
                    message: text,
                    requestId,
                });
            };
            if (s.connected) {
                emitAsk();
            } else {
                s.once("connect", emitAsk);
                s.once("connect_error", () => {
                    setBanner("Could not connect to server");
                    setBusy(false);
                    requestIdRef.current = null;
                    loadHistory();
                });
            }
        });
    };

    const openClearDialog = () => {
        if (!bookId || busy || loadingHistory) return;
        setClearDialogOpen(true);
    };

    const handleConfirmClear = async () => {
        if (!bookId) return;
        setClearing(true);
        setBanner(null);
        try {
            await api.delete(`/library/${bookId}/chat`);
            await loadHistory();
            setClearDialogOpen(false);
        } catch (e) {
            setBanner(e.response?.data?.msg || "Could not clear chat");
        } finally {
            setClearing(false);
        }
    };

    if (!embeddingReady) {
        return (
            <Box sx={styles.centered}>
                <Typography sx={styles.muted}>
                    The assistant unlocks after this book finishes indexing for
                    search.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={styles.root}>
            <Box sx={styles.header}>
                <Typography sx={styles.title}>Book assistant</Typography>
                <IconButton
                    size="small"
                    onClick={openClearDialog}
                    disabled={busy || loadingHistory}
                    title="Clear chat"
                    sx={styles.clearBtn}
                >
                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </Box>

            <Dialog
                open={clearDialogOpen}
                onClose={() => {
                    if (!clearing) setClearDialogOpen(false);
                }}
                slotProps={{
                    backdrop: {
                        sx: {
                            backgroundColor: "rgba(0, 0, 0, 0.65)",
                            backdropFilter: "blur(4px)",
                        },
                    },
                    paper: {
                        sx: styles.clearDialogPaper,
                    },
                }}
            >
                <DialogTitle sx={styles.clearDialogTitle}>
                    Clear chat history?
                </DialogTitle>
                <DialogContent sx={styles.clearDialogContent}>
                    <Typography sx={styles.clearDialogBody}>
                        This removes every message for this book from your
                        account. You cannot undo it.
                    </Typography>
                </DialogContent>
                <DialogActions sx={styles.clearDialogActions}>
                    <Button
                        onClick={() => setClearDialogOpen(false)}
                        disabled={clearing}
                        sx={styles.clearDialogCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmClear}
                        disabled={clearing}
                        variant="contained"
                        disableElevation
                        sx={styles.clearDialogConfirm}
                    >
                        {clearing ? (
                            <CircularProgress size={18} sx={{ color: "#fff" }} />
                        ) : (
                            "Clear all"
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            {banner && (
                <Typography sx={styles.banner} variant="caption">
                    {banner}
                </Typography>
            )}

            <Box sx={styles.messages}>
                {loadingHistory ? (
                    <Box sx={styles.centered}>
                        <CircularProgress size={22} sx={{ color: "#00e0ff" }} />
                    </Box>
                ) : (
                    <>
                        {messages.map((m) => (
                            <Box key={m.id}>
                                <Box
                                    sx={{
                                        ...styles.bubble,
                                        ...(m.role === "user"
                                            ? styles.bubbleUser
                                            : styles.bubbleAsst),
                                    }}
                                >
                                    <Typography sx={styles.bubbleLabel}>
                                        {m.role === "user" ? "You" : "Assistant"}
                                    </Typography>
                                    <Typography sx={styles.bubbleText}>
                                        {m.content}
                                        {m.streaming ? "…" : ""}
                                    </Typography>
                                </Box>
                                {m.role === "assistant" &&
                                    m.sources?.length > 0 &&
                                    !m.streaming && (
                                        <Typography sx={styles.sourcesHint}>
                                            Sources:{" "}
                                            {m.sources
                                                .map(formatSourceLabel)
                                                .filter(Boolean)
                                                .slice(0, 4)
                                                .join(" · ")}
                                        </Typography>
                                    )}
                            </Box>
                        ))}
                        <div ref={listEndRef} />
                    </>
                )}
            </Box>

            <Box sx={styles.inputRow}>
                <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    size="small"
                    placeholder="Ask about this book…"
                    value={input}
                    disabled={busy}
                    onChange={(e) =>
                        setInput(
                            e.target.value.slice(0, MAX_MESSAGE_CHARS),
                        )
                    }
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    inputProps={{ maxLength: MAX_MESSAGE_CHARS }}
                    sx={styles.field}
                />
                <IconButton
                    color="primary"
                    onClick={handleSend}
                    disabled={busy || !input.trim()}
                    sx={styles.sendBtn}
                >
                    {busy ? (
                        <CircularProgress size={22} sx={{ color: "#00e0ff" }} />
                    ) : (
                        <SendIcon fontSize="small" />
                    )}
                </IconButton>
            </Box>
            <Typography sx={styles.counter} variant="caption">
                {input.length}/{MAX_MESSAGE_CHARS}
            </Typography>
        </Box>
    );
}

const styles = {
    root: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        p: 1.5,
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 1,
    },
    title: {
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: "0.8rem",
        color: "#e4e4e8",
    },
    clearBtn: {
        color: "#52525b",
        "&:hover": { color: "#ff6b6b" },
    },
    banner: {
        color: "#ff6b6b",
        mb: 1,
        display: "block",
    },
    messages: {
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        mb: 1,
        pr: 0.5,
    },
    centered: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
    },
    muted: {
        color: "#52525b",
        fontSize: "0.75rem",
        textAlign: "center",
        px: 2,
        fontFamily: "'DM Sans', sans-serif",
    },
    bubble: {
        borderRadius: "10px",
        p: 1,
        maxWidth: "100%",
    },
    bubbleUser: {
        alignSelf: "flex-end",
        background: "rgba(0, 224, 255, 0.08)",
        border: "1px solid rgba(0, 224, 255, 0.12)",
    },
    bubbleAsst: {
        alignSelf: "flex-start",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
    },
    bubbleLabel: {
        fontSize: "0.6rem",
        color: "#52525b",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        mb: 0.25,
        fontFamily: "'JetBrains Mono', monospace",
    },
    bubbleText: {
        fontSize: "0.8rem",
        color: "#d4d4d8",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        fontFamily: "'DM Sans', sans-serif",
        lineHeight: 1.45,
    },
    sourcesHint: {
        fontSize: "0.65rem",
        color: "#52525b",
        mt: 0.25,
        mb: 0.5,
        pl: 0.5,
        fontFamily: "'DM Sans', sans-serif",
    },
    inputRow: {
        display: "flex",
        gap: 0.5,
        alignItems: "flex-end",
    },
    field: {
        "& .MuiOutlinedInput-root": {
            fontSize: "0.8rem",
            color: "#e4e4e8",
            background: "rgba(255,255,255,0.02)",
        },
    },
    sendBtn: { flexShrink: 0 },
    counter: { color: "#3f3f46", mt: 0.5, display: "block" },
    clearDialogPaper: {
        background: "linear-gradient(145deg, #101018 0%, #0a0a12 100%)",
        border: "1px solid rgba(0, 224, 255, 0.14)",
        borderRadius: "14px",
        boxShadow: "0 24px 48px rgba(0, 0, 0, 0.55)",
        minWidth: { xs: "calc(100vw - 48px)", sm: 360 },
        maxWidth: 400,
    },
    clearDialogTitle: {
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: "1rem",
        color: "#e4e4e8",
        pt: 2.5,
        px: 2.5,
        pb: 0.5,
    },
    clearDialogContent: {
        px: 2.5,
        pt: 1,
        pb: 0,
    },
    clearDialogBody: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.85rem",
        color: "#a1a1aa",
        lineHeight: 1.5,
    },
    clearDialogActions: {
        px: 2.5,
        pb: 2,
        pt: 2,
        gap: 1,
    },
    clearDialogCancel: {
        fontFamily: "'DM Sans', sans-serif",
        textTransform: "none",
        color: "#a1a1aa",
        "&:hover": {
            background: "rgba(255,255,255,0.04)",
        },
    },
    clearDialogConfirm: {
        fontFamily: "'DM Sans', sans-serif",
        textTransform: "none",
        minWidth: 104,
        background: "rgba(255, 107, 107, 0.18)",
        color: "#ff8a8a",
        border: "1px solid rgba(255, 107, 107, 0.35)",
        "&:hover": {
            background: "rgba(255, 107, 107, 0.28)",
            borderColor: "rgba(255, 107, 107, 0.5)",
        },
        "&.Mui-disabled": {
            background: "rgba(255, 107, 107, 0.08)",
            color: "rgba(255,255,255,0.35)",
        },
    },
};
