import { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Modal,
    IconButton,
    Button,
    Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";

import api from "../../api/axios.js";

const StatusChip = ({ ready, readyLabel, notReadyLabel }) => (
    <Chip
        size="small"
        label={ready ? readyLabel : notReadyLabel}
        sx={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.6rem",
            letterSpacing: "0.05em",
            color: ready ? "#00e0ff" : "#ffb400",
            background: ready
                ? "rgba(0, 224, 255, 0.06)"
                : "rgba(255, 180, 0, 0.06)",
            border: ready
                ? "1px solid rgba(0, 224, 255, 0.2)"
                : "1px solid rgba(255, 180, 0, 0.2)",
        }}
    />
);

const MetaItem = ({ label, value }) => (
    <Box>
        <Typography sx={styles.metaLabel}>{label}</Typography>
        <Typography sx={styles.metaValue}>{value}</Typography>
    </Box>
);

export default function BookDetailModal({
    book,
    open,
    onClose,
    onAdd,
    onDelete,
    onAlert,
}) {
    const [imgError, setImgError] = useState(false);
    const [firstUploadedByEmail, setFirstUploadedByEmail] = useState("");
    const [inMyBooks, setInMyBooks] = useState(false);

    useEffect(() => {
        if (!book || !open) return;

        if (!book) return;
        const uid = book.first_uploaded_by;
        if (!uid) return;

        const getEmailByUid = async () => {
            try {
                const res = await api.get(`/user/getEmail/${uid}`);
                setFirstUploadedByEmail(res.data.email);
            } catch (err) {
                console.error("Failed to fetch email:", err.message);
            }
        };

        const isBookInMyBooks = async () => {
            try {
                const res = await api.get(`/library/${book._id}`);
                if (res) setInMyBooks(true);
            } catch (err) {
                // This is okay for now
                // TODO: Fix this?
                console.error("Book not in library", err.message);
            }
        };

        getEmailByUid();
        isBookInMyBooks();
    }, [book, open]);

    if (!book) return null;

    const handleLibraryToggle = async () => {
        try {
            if (!inMyBooks) {
                await onAdd(book);
                setInMyBooks(true);
                onAlert?.({
                    message: `"${book.title}" added to My Books`,
                    severity: "success",
                });
            } else {
                await api.delete(`/library/${book._id}`);
                setInMyBooks(false);
                onAlert?.({
                    message: `"${book.title}" removed from My Books`,
                    severity: "success",
                });
            }
        } catch (err) {
            onAlert?.({
                message: err.response?.data?.msg || "Failed to update library",
                severity: "error",
            });
        }
    };

    const hasCover = book.cover_asset_key && !imgError;
    const googleBooks = book.google_books;

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={styles.modal}>
                <Box sx={styles.glowTop} />

                <IconButton onClick={onClose} sx={styles.closeBtn}>
                    <CloseIcon sx={{ fontSize: 20 }} />
                </IconButton>

                <Box sx={styles.content}>
                    <Box sx={styles.coverWrap}>
                        {hasCover ? (
                            <img
                                src={book.cover_asset_key}
                                alt={book.title}
                                style={styles.coverImg}
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <Box sx={styles.defaultCover}>
                                <AutoStoriesIcon
                                    sx={{
                                        color: "rgba(0,224,255,0.3)",
                                        fontSize: 48,
                                    }}
                                />
                            </Box>
                        )}
                    </Box>

                    <Box sx={styles.details}>
                        <Typography sx={styles.title}>{book.title}</Typography>

                        {googleBooks?.subtitle && (
                            <Typography sx={styles.subtitle}>
                                {googleBooks.subtitle}
                            </Typography>
                        )}

                        <Typography sx={styles.author}>
                            {book.author}
                        </Typography>

                        <Box sx={styles.metaGrid}>
                            {googleBooks?.published_date && (
                                <MetaItem
                                    label="Published"
                                    value={googleBooks.published_date}
                                />
                            )}
                            {googleBooks?.page_count && (
                                <MetaItem
                                    label="Pages"
                                    value={googleBooks.page_count}
                                />
                            )}
                            {googleBooks?.isbn && (
                                <MetaItem
                                    label="ISBN"
                                    value={googleBooks.isbn}
                                />
                            )}
                            {googleBooks?.language && (
                                <MetaItem
                                    label="Language"
                                    value={googleBooks.language.toUpperCase()}
                                />
                            )}
                        </Box>

                        {googleBooks?.categories?.length > 0 && (
                            <Box sx={styles.categories}>
                                {googleBooks.categories.map((cat) => (
                                    <Chip
                                        key={cat}
                                        label={cat}
                                        size="small"
                                        sx={styles.categoryChip}
                                    />
                                ))}
                            </Box>
                        )}

                        <Box sx={styles.statusRow}>
                            <StatusChip
                                ready={book.embedding_ready}
                                readyLabel="AI Ready"
                                notReadyLabel="Indexing..."
                            />
                            <StatusChip
                                ready={book.tts_ready}
                                readyLabel="TTS Ready"
                                notReadyLabel="No TTS"
                            />
                        </Box>

                        {book.description && (
                            <Typography sx={styles.description}>
                                {book.description}
                            </Typography>
                        )}

                        <Typography sx={styles.uploadedBy}>
                            Uploaded by{" "}
                            <span style={{ color: "#52525b" }}>
                                {firstUploadedByEmail || book.first_uploaded_by}
                            </span>
                        </Typography>

                        <Box sx={styles.actions}>
                            <Button
                                startIcon={<AddIcon />}
                                onClick={handleLibraryToggle}
                                sx={!inMyBooks ? styles.addBtn : styles.rmvBtn}
                            >
                                {!inMyBooks
                                    ? "Add to My Books"
                                    : "Remove from My Books"}
                            </Button>
                            <Button
                                startIcon={<DeleteOutlineIcon />}
                                onClick={() => onDelete(book)}
                                sx={styles.deleteBtn}
                            >
                                Delete
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
}

const styles = {
    modal: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "100%",
        maxWidth: 900,
        maxHeight: "90vh",
        overflowY: "auto",
        background: "rgba(5, 5, 8, 0.95)",
        border: "1px solid rgba(0, 224, 255, 0.08)",
        borderRadius: "16px",
        backdropFilter: "blur(20px)",
        p: 4,
        outline: "none",
    },
    glowTop: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "1px",
        background:
            "linear-gradient(90deg, transparent 10%, #00e0ff 50%, transparent 90%)",
        opacity: 0.6,
    },
    closeBtn: {
        position: "absolute",
        top: 12,
        right: 12,
        color: "#52525b",
        "&:hover": { color: "#d4d4d8" },
    },
    content: {
        display: "flex",
        gap: 4,
    },
    coverWrap: {
        flexShrink: 0,
        width: 180,
    },
    coverImg: {
        width: "100%",
        borderRadius: 8,
        display: "block",
    },
    defaultCover: {
        width: "100%",
        aspectRatio: "2/3",
        borderRadius: "8px",
        background: "linear-gradient(145deg, #0c1a2e 0%, #07101f 100%)",
        border: "1px solid rgba(0, 224, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    details: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
    },
    title: {
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: "1.3rem",
        color: "#fff",
        lineHeight: 1.3,
    },
    subtitle: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.85rem",
        color: "#52525b",
        fontStyle: "italic",
    },
    author: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.9rem",
        color: "#d4d4d8",
    },
    metaGrid: {
        display: "flex",
        gap: 3,
        flexWrap: "wrap",
    },
    metaLabel: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.55rem",
        color: "#52525b",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
    },
    metaValue: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.8rem",
        color: "#d4d4d8",
    },
    categories: {
        display: "flex",
        gap: 1,
        flexWrap: "wrap",
    },
    categoryChip: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.65rem",
        color: "#a78bfa",
        background: "rgba(123, 47, 255, 0.06)",
        border: "1px solid rgba(123, 47, 255, 0.15)",
    },
    statusRow: {
        display: "flex",
        gap: 1,
    },
    description: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.8rem",
        color: "#52525b",
        lineHeight: 1.6,
        maxHeight: "12.8em",
        overflowY: "auto",
    },
    uploadedBy: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.6rem",
        color: "#3f3f46",
        letterSpacing: "0.03em",
    },
    actions: {
        display: "flex",
        gap: 2,
        mt: "auto",
        pt: 1,
    },
    addBtn: {
        fontFamily: "'Syne', sans-serif",
        fontWeight: 600,
        fontSize: "0.75rem",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "#fff",
        background: "linear-gradient(135deg, #00e0ff, #7b2fff)",
        borderRadius: "8px",
        px: 3,
        "&:hover": {
            boxShadow:
                "0 0 30px rgba(0,224,255,0.2), 0 0 60px rgba(123,47,255,0.1)",
        },
    },
    rmvBtn: {
        fontFamily: "'Syne', sans-serif",
        fontWeight: 600,
        fontSize: "0.75rem",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "#dfc1c1",
        background: "linear-gradient(135deg, #e26e4b, #f20f07)",
        border: "1px solid rgba(255, 50, 50, 0.2)",
        borderRadius: "8px",
        px: 3,
        "&:hover": {
            boxShadow:
                "0 0 30px rgba(194, 50, 50, 0.2), 0 0 60px rgba(205, 28, 28, 0.1)",
        },
    },
    deleteBtn: {
        fontFamily: "'Syne', sans-serif",
        fontWeight: 600,
        fontSize: "0.75rem",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "#ff6b6b",
        border: "1px solid rgba(255, 50, 50, 0.2)",
        borderRadius: "8px",
        px: 3,
        "&:hover": {
            background: "rgba(255, 50, 50, 0.06)",
            borderColor: "rgba(255, 50, 50, 0.4)",
        },
    },
};
