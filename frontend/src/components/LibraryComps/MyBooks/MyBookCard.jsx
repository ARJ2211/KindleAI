// frontend/src/components/LibraryComps/MyBooks/MyBookCard.jsx

import { useState } from "react";
import { Box, Typography, Tooltip, IconButton } from "@mui/material";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import MyBookDetailModal from "./MyBookDetailModal.jsx";

function DefaultCover({ title }) {
    const initials =
        title
            ?.split(" ")
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase())
            .join("") || "?";

    return (
        <Box sx={styles.defaultCover}>
            <Typography sx={styles.initials}>{initials}</Typography>
        </Box>
    );
}

export default function MyBookCard({ book, onRemove }) {
    const [imgError, setImgError] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const hasCover = book.cover_asset_key && !imgError;

    const handleRead = (b) => {
        // TODO: hook up reader navigation
        console.log("Open reader for", b._id);
    };

    const handleRemove = (b) => {
        onRemove(b);
        setModalOpen(false);
    };

    return (
        <>
            <Box sx={styles.card} onClick={() => setModalOpen(true)}>
                <Box sx={styles.glowTrack} className="glow-track" />

                {/* Actions */}
                <Box sx={styles.actions} className="card-actions">
                    <Tooltip title="Read book">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRead(book);
                            }}
                            sx={styles.readBtn}
                        >
                            <MenuBookIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove from My Books">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove(book);
                            }}
                            sx={styles.removeBtn}
                        >
                            <RemoveCircleOutlineIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Cover */}
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

                {/* Info */}
                <Box sx={styles.info}>
                    <Typography sx={styles.title}>{book.title}</Typography>
                    <Typography sx={styles.author}>{book.author}</Typography>

                    {book.embedding_ready && (
                        <Box sx={styles.aiBadge}>
                            <Box sx={styles.aiBadgeDot} />
                            <Typography sx={styles.aiBadgeText}>AI Ready</Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            <MyBookDetailModal
                book={book}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onRead={handleRead}
                onRemove={handleRemove}
            />
        </>
    );
}

const styles = {
    card: {
        position: "relative",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: "10px",
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.2s, transform 0.2s",
        "&:hover": {
            borderColor: "rgba(0,224,255,0.2)",
            transform: "translateY(-2px)",
        },
        "&:hover .card-actions": { opacity: 1 },
        "&:hover .glow-track": { opacity: 1 },
    },
    glowTrack: {
        position: "absolute",
        inset: 0,
        background:
            "radial-gradient(ellipse at 50% 0%, rgba(0,224,255,0.06) 0%, transparent 70%)",
        opacity: 0,
        transition: "opacity 0.3s",
        pointerEvents: "none",
    },
    actions: {
        position: "absolute",
        top: 8,
        right: 8,
        display: "flex",
        gap: 0.5,
        opacity: 0,
        transition: "opacity 0.2s",
        zIndex: 2,
    },
    readBtn: {
        background: "rgba(0,224,255,0.12)",
        color: "#00e0ff",
        "&:hover": { background: "rgba(0,224,255,0.22)" },
        width: 28,
        height: 28,
    },
    removeBtn: {
        background: "rgba(255,80,80,0.1)",
        color: "#ff6b6b",
        "&:hover": { background: "rgba(255,80,80,0.2)" },
        width: 28,
        height: 28,
    },
    // Fixed: aspectRatio instead of fixed height — matches global lib
    coverImg: {
        width: "100%",
        aspectRatio: "2/3",
        objectFit: "cover",
        borderRadius: 6,
        display: "block",
    },
    defaultCover: {
        width: "100%",
        aspectRatio: "2/3",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
            "linear-gradient(135deg, rgba(0,224,255,0.06) 0%, rgba(123,47,255,0.08) 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
    },
    initials: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "2rem",
        fontWeight: 700,
        color: "rgba(0,224,255,0.3)",
        letterSpacing: "0.05em",
    },
    info: {
        p: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 0.4,
    },
    title: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.8rem",
        fontWeight: 600,
        color: "#e4e4e7",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    author: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.68rem",
        color: "#52525b",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    aiBadge: {
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        mt: 0.5,
    },
    aiBadgeDot: {
        width: 5,
        height: 5,
        borderRadius: "50%",
        background: "#00e0ff",
        boxShadow: "0 0 6px rgba(0,224,255,0.6)",
    },
    aiBadgeText: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.5rem",
        color: "#00e0ff",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
    },
};