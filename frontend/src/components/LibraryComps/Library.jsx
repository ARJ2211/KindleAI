import { useState, useEffect } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import LibraryBar from "./LibraryBar.jsx";
import api from "../../api/axios.js";

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

const BookCard = ({ book }) => {
    const [imgError, setImgError] = useState(false);
    const hasCover = book.cover_asset_key && !imgError;

    return (
        <Box sx={styles.card}>
            <Box sx={styles.glowTrack} className="glow-track" />

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
                <Box sx={styles.statusRow}>
                    <StatusChip
                        ready={book.embedding_ready}
                        label={
                            book.embedding_ready ? "AI Ready" : "Indexing..."
                        }
                    />
                    <StatusChip
                        ready={book.tts_ready}
                        label={book.tts_ready ? "TTS Ready" : "No TTS"}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default function Library({ onUpload, uploading }) {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: "",
        aiReady: false,
        ttsReady: false,
    });

    const fetchLibrary = async () => {
        try {
            const res = await api.get("/book/library");
            setBooks(res.data);
        } catch (err) {
            setError(err.response?.data?.msg || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLibrary();
    }, []);

    const filteredBooks = books.filter((book) => {
        const query = filters.search.toLowerCase();

        if (query) {
            const matchesTitle = book.title.toLowerCase().includes(query);
            const matchesAuthor = book.author.toLowerCase().includes(query);
            if (!matchesTitle && !matchesAuthor) return false;
        }

        if (filters.aiReady && !book.embedding_ready) return false;
        if (filters.ttsReady && !book.tts_ready) return false;

        return true;
    });

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress size={28} sx={{ color: "#00e0ff" }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Typography
                sx={{ color: "#ff6b6b", fontFamily: "'DM Sans', sans-serif" }}
            >
                {error}
            </Typography>
        );
    }

    return (
        <Box>
            <LibraryBar
                onUpload={onUpload}
                uploading={uploading}
                filters={filters}
                onFilterChange={setFilters}
            />

            {books.length === 0 ? (
                <Box sx={styles.empty}>
                    <AutoStoriesIcon
                        sx={{ fontSize: 48, color: "rgba(0,224,255,0.15)" }}
                    />
                    <Typography sx={styles.emptyText}>
                        No books yet. Upload an EPUB to get started.
                    </Typography>
                </Box>
            ) : filteredBooks.length === 0 ? (
                <Box sx={styles.empty}>
                    <Typography sx={styles.emptyText}>
                        No books match your search.
                    </Typography>
                </Box>
            ) : (
                <Box sx={styles.grid}>
                    {filteredBooks.map((book) => (
                        // TODO: We need to actually handle the clicks here later
                        <Box
                            component="div"
                            onClick={() => {
                                console.log(book);
                            }}
                        >
                            <BookCard
                                key={book._id}
                                book={book}
                                onClick={() => {
                                    console.log(book);
                                }}
                            />
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}

const styles = {
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: 3,
    },
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
    empty: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        py: 10,
    },
    emptyText: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.9rem",
        color: "#52525b",
    },
};
