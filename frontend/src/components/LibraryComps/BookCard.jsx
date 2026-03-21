import { useState } from "react";
import {
    Box,
    Typography,
    IconButton,
    Tooltip,
    LinearProgress,
} from "@mui/material";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";

import BookDetailModal from "./BookDetailModal";
import { useSocket } from "../../context/SocketContext.jsx";

const DefaultCover = ({ title }) => (
    <Box
        sx={{
            width: "100%",
            aspectRatio: "2/3",
            borderRadius: "6px",
            background: "linear-gradient(145deg, #0c1a2e 0%, #07101f 100%)",
            border: "1px solid rgba(0, 224, 255, 0.1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            px: 2,
        }}
    >
        <AutoStoriesIcon
            sx={{ color: "rgba(0, 224, 255, 0.3)", fontSize: 36 }}
        />
        <Typography
            sx={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "0.7rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.35)",
                textAlign: "center",
                lineHeight: 1.3,
            }}
        >
            {title}
        </Typography>
    </Box>
);

const StatusChip = ({ ready, label }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
        <Box
            sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: ready ? "#00e0ff" : "#ffb400",
                boxShadow: ready
                    ? "0 0 8px rgba(0,224,255,0.5)"
                    : "0 0 8px rgba(255,180,0,0.5)",
            }}
        />
        <Typography
            sx={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.55rem",
                color: "#52525b",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
            }}
        >
            {label}
        </Typography>
    </Box>
);

const STAGE_LABELS = {
    parsing: "Parsing...",
    chunking: "Chunking...",
    embedding: "Embedding",
    upserting: "Storing...",
    complete: "AI Ready!",
    error: "Failed",
};

export default function BookCard({ book, onDelete, onAdd }) {
    const [imgError, setImgError] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const hasCover = book.cover_asset_key && !imgError;

    const { ingestProgress } = useSocket();

    // Only show progress if it's for THIS book and not done yet
    const isThisBook = ingestProgress?.bookId === book._id;
    const isActive =
        isThisBook &&
        ingestProgress.stage !== "complete" &&
        ingestProgress.stage !== "error";
    const justFinished = isThisBook && ingestProgress.stage === "complete";
    const failed = isThisBook && ingestProgress.stage === "error";

    return (
        <>
            <Box sx={styles.card} onClick={() => setModalOpen(true)}>
                <Box sx={styles.glowTrack} className="glow-track" />

                <Box sx={styles.actions} className="card-actions">
                    <Tooltip title="Add to My Books">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAdd(book);
                            }}
                            sx={styles.addBtn}
                        >
                            <AddIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete from library">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(book);
                            }}
                            sx={styles.deleteBtn}
                        >
                            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                </Box>

                {hasCover ? (
                    <img
                        src={book.cover_asset_key}
                        alt={book.title}
                        style={styles.coverImg}
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <DefaultCover title={book.title} />
                )}

                <Box sx={styles.info}>
                    <Typography sx={styles.title}>{book.title}</Typography>
                    <Typography sx={styles.author}>{book.author}</Typography>

                    {/* ── Ingest progress bar ── */}
                    {isActive && (
                        <Box sx={styles.progressContainer}>
                            <Box sx={styles.progressHeader}>
                                <Typography sx={styles.progressLabel}>
                                    {STAGE_LABELS[ingestProgress.stage]}
                                </Typography>
                                <Typography sx={styles.progressPercent}>
                                    {ingestProgress.percent}%
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant={
                                    ingestProgress.stage === "parsing"
                                        ? "indeterminate"
                                        : "determinate"
                                }
                                value={ingestProgress.percent}
                                sx={styles.progressBar}
                            />
                        </Box>
                    )}

                    {/* ── Normal status chips (when not actively ingesting) ── */}
                    {!isActive && (
                        <Box sx={styles.statusRow}>
                            <StatusChip
                                ready={book.embedding_ready || justFinished}
                                label={
                                    failed
                                        ? "Index Failed"
                                        : book.embedding_ready || justFinished
                                          ? "AI Ready"
                                          : "Indexing..."
                                }
                            />
                            <StatusChip
                                ready={book.tts_ready}
                                label={book.tts_ready ? "TTS Ready" : "No TTS"}
                            />
                        </Box>
                    )}
                </Box>
            </Box>
            <BookDetailModal
                book={book}
                open={modalOpen}
                onClose={() => {
                    console.log("TRYING TO CLOSE MODAL");
                    setModalOpen(false);
                }}
                onAdd={onAdd}
                onDelete={(b) => {
                    onDelete(b);
                    setModalOpen(false);
                }}
            />
        </>
    );
}

const styles = {
    card: {
        position: "relative",
        overflow: "hidden",
        p: 2,
        borderRadius: "12px",
        background: "rgba(255,255,255,0.015)",
        border: "1px solid rgba(0, 224, 255, 0.06)",
        cursor: "pointer",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
            border: "1px solid rgba(0, 224, 255, 0.15)",
            transform: "translateY(-4px)",
            boxShadow:
                "0 12px 40px rgba(0,0,0,0.4), 0 0 30px rgba(0,224,255,0.04)",
        },
        "&:hover .glow-track": {
            opacity: 1,
        },
        "&:hover .card-actions": {
            opacity: 1,
        },
    },
    glowTrack: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "1px",
        background:
            "linear-gradient(90deg, transparent 10%, #00e0ff 50%, transparent 90%)",
        opacity: 0,
        transition: "opacity 0.4s",
    },
    actions: {
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 2,
        display: "flex",
        gap: 0.5,
        opacity: 0,
        transition: "opacity 0.3s",
    },
    addBtn: {
        background: "rgba(0, 224, 255, 0.15)",
        backdropFilter: "blur(8px)",
        color: "#00e0ff",
        border: "1px solid rgba(0, 224, 255, 0.2)",
        "&:hover": {
            background: "rgba(0, 224, 255, 0.25)",
        },
    },
    deleteBtn: {
        background: "rgba(255, 50, 50, 0.15)",
        backdropFilter: "blur(8px)",
        color: "#ff6b6b",
        border: "1px solid rgba(255, 50, 50, 0.2)",
        "&:hover": {
            background: "rgba(255, 50, 50, 0.25)",
        },
    },
    coverImg: {
        width: "100%",
        aspectRatio: "2/3",
        objectFit: "cover",
        borderRadius: 6,
        display: "block",
    },
    info: {
        mt: 1.5,
        display: "flex",
        flexDirection: "column",
        flex: 1,
    },
    title: {
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: "0.85rem",
        color: "#fff",
        lineHeight: 1.3,
        height: "2.6em",
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
    },
    author: {
        mt: 0.5,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.75rem",
        color: "#52525b",
    },
    statusRow: {
        mt: "auto",
        pt: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 2,
    },
    progressContainer: {
        mt: "auto",
        pt: 1.5,
    },
    progressHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 0.5,
    },
    progressLabel: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.55rem",
        color: "#00e0ff",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
    },
    progressPercent: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.55rem",
        color: "#00e0ff",
        letterSpacing: "0.05em",
    },
    progressBar: {
        height: 3,
        borderRadius: 2,
        background: "rgba(255,255,255,0.04)",
        "& .MuiLinearProgress-bar": {
            background: "linear-gradient(90deg, #00e0ff, #7b2fff)",
            borderRadius: 2,
        },
    },
};
