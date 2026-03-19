// frontend/src/components/LibraryComps/MyBooks/MyBooks.jsx

import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    CircularProgress,
    TextField,
    Chip,
    InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import BookShelfIcon from "@mui/icons-material/CollectionsBookmark";
import MyBookCard from "./MyBookCard.jsx";
import api from "../../../api/axios.js";

export default function MyBooks({ onAlert }) {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: "",
        aiReady: false,
        ttsReady: false,
    });

    const fetchMyBooks = async () => {
        try {
            setLoading(true);
            const res = await api.get("/user/my-books");
            setBooks(res.data);
        } catch (err) {
            setError(err.response?.data?.msg || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyBooks();
    }, []);

    const handleRemove = async (book) => {
        try {
            await api.delete(`/user/my-books/${book._id}`);
            setBooks((prev) => prev.filter((b) => b._id !== book._id));
            onAlert?.({
                message: `"${book.title}" removed from My Books`,
                severity: "info",
            });
        } catch (err) {
            onAlert?.({
                message: err.response?.data?.msg || "Failed to remove book",
                severity: "error",
            });
        }
    };

    const toggleFilter = (key) => {
        setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const filteredBooks = books.filter((book) => {
        const query = filters.search.toLowerCase();
        if (query) {
            const matchesTitle = book.title?.toLowerCase().includes(query);
            const matchesAuthor = book.author?.toLowerCase().includes(query);
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
            <Typography sx={{ color: "#ff6b6b", fontFamily: "'DM Sans', sans-serif" }}>
                {error}
            </Typography>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={styles.header}>
                <BookShelfIcon sx={{ color: "#00e0ff", fontSize: 20 }} />
                <Typography sx={styles.heading}>My Books</Typography>
                <Typography sx={styles.count}>
                    {books.length} {books.length === 1 ? "book" : "books"}
                </Typography>
            </Box>

            {/* Search + Filter Bar */}
            <Box sx={styles.bar}>
                <TextField
                    placeholder="Search by title or author..."
                    size="small"
                    value={filters.search}
                    onChange={(e) =>
                        setFilters((prev) => ({ ...prev, search: e.target.value }))
                    }
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: "#52525b", fontSize: 20 }} />
                            </InputAdornment>
                        ),
                    }}
                    autoComplete="off"
                    sx={styles.search}
                />
                <Box sx={styles.chips}>
                    <Chip
                        label="AI Ready"
                        size="small"
                        onClick={() => toggleFilter("aiReady")}
                        sx={filters.aiReady ? styles.chipActive : styles.chip}
                    />
                    <Chip
                        label="TTS Ready"
                        size="small"
                        onClick={() => toggleFilter("ttsReady")}
                        sx={filters.ttsReady ? styles.chipActive : styles.chip}
                    />
                </Box>
            </Box>

            {/* Book Grid */}
            {books.length === 0 ? (
                <Box sx={styles.empty}>
                    <BookShelfIcon sx={{ fontSize: 48, color: "rgba(0,224,255,0.1)" }} />
                    <Typography sx={styles.emptyTitle}>Your shelf is empty</Typography>
                    <Typography sx={styles.emptySubtitle}>
                        Head to the Global Library and hit{" "}
                        <span style={{ color: "#00e0ff" }}>+</span> on any book to add it here.
                    </Typography>
                </Box>
            ) : filteredBooks.length === 0 ? (
                <Box sx={styles.empty}>
                    <Typography sx={styles.emptyTitle}>No books match your search.</Typography>
                </Box>
            ) : (
                <Box sx={styles.grid}>
                    {filteredBooks.map((book) => (
                        <MyBookCard
                            key={book._id}
                            book={book}
                            onRemove={handleRemove}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
}

const styles = {
    header: {
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        mb: 3,
        pb: 2,
        borderBottom: "1px solid rgba(0,224,255,0.08)",
    },
    heading: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.85rem",
        color: "#e4e4e7",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        flex: 1,
    },
    count: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.65rem",
        color: "#52525b",
        letterSpacing: "0.05em",
    },
    bar: {
        display: "flex",
        alignItems: "center",
        gap: 2,
        mb: 4,
        flexWrap: "wrap",
    },
    search: {
        flex: 1,
        minWidth: 220,
        "& .MuiOutlinedInput-root": {
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.85rem",
            color: "#d4d4d8",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "8px",
            "& fieldset": { borderColor: "rgba(0, 224, 255, 0.08)" },
            "&:hover fieldset": { borderColor: "rgba(0, 224, 255, 0.2)" },
            "&.Mui-focused fieldset": {
                borderColor: "#00e0ff",
                borderWidth: "1px",
            },
        },
    },
    chips: {
        display: "flex",
        gap: 1,
    },
    chip: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.65rem",
        letterSpacing: "0.04em",
        color: "#52525b",
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.06)",
        cursor: "pointer",
        "&:hover": {
            borderColor: "rgba(0, 224, 255, 0.2)",
            background: "rgba(0, 224, 255, 0.03)",
        },
    },
    chipActive: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.65rem",
        letterSpacing: "0.04em",
        color: "#00e0ff",
        background: "rgba(0, 224, 255, 0.06)",
        border: "1px solid rgba(0, 224, 255, 0.2)",
        cursor: "pointer",
        "&:hover": { background: "rgba(0, 224, 255, 0.1)" },
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: 3,
    },
    empty: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        py: 12,
    },
    emptyTitle: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "1rem",
        color: "#3f3f46",
        fontWeight: 500,
    },
    emptySubtitle: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.8rem",
        color: "#3f3f46",
        textAlign: "center",
        maxWidth: 300,
    },
};