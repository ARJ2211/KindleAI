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
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import MyBookCard from "./MyBookCard.jsx";
import api from "../../api/axios.js";

export default function MyBooks({ onAlert }) {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [favOnly, setFavOnly] = useState(false);

    const fetchMyBooks = async () => {
        try {
            const res = await api.get("/library");
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

    const handleFavorite = async (book) => {
        try {
            const res = await api.patch(`/library/${book._id}/favorite`);
            setBooks((prev) =>
                prev.map((b) =>
                    b._id === book._id
                        ? { ...b, favorite: res.data.favorite }
                        : b,
                ),
            );
        } catch (err) {
            onAlert?.({
                message: err.response?.data?.msg || "Failed to update favorite",
                severity: "error",
            });
        }
    };

    const handleRemove = async (book) => {
        try {
            await api.delete(`/library/${book._id}`);
            setBooks((prev) => prev.filter((b) => b._id !== book._id));
            onAlert?.({
                message: `"${book.title}" removed from My Books`,
                severity: "success",
            });
        } catch (err) {
            onAlert?.({
                message: err.response?.data?.msg || "Failed to remove book",
                severity: "error",
            });
        }
    };

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

    const filteredBooks = books.filter((book) => {
        if (favOnly && !book.favorite) return false;
        if (search) {
            const q = search.toLowerCase();
            const matchesTitle = book.title?.toLowerCase().includes(q);
            const matchesAuthor = book.author?.toLowerCase().includes(q);
            if (!matchesTitle && !matchesAuthor) return false;
        }
        return true;
    });

    if (books.length === 0) {
        return (
            <Box sx={styles.empty}>
                <AutoStoriesIcon
                    sx={{ fontSize: 48, color: "rgba(0,224,255,0.15)" }}
                />
                <Typography sx={styles.emptyText}>
                    No books in your library yet. Add books from the Global
                    Library.
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={styles.bar}>
                <TextField
                    placeholder="Search by title or author..."
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon
                                    sx={{ color: "#52525b", fontSize: 20 }}
                                />
                            </InputAdornment>
                        ),
                    }}
                    autoComplete="off"
                    sx={styles.search}
                />
                <Chip
                    label="Favorites"
                    size="small"
                    onClick={() => setFavOnly((prev) => !prev)}
                    sx={favOnly ? styles.chipActive : styles.chip}
                />
            </Box>

            {filteredBooks.length === 0 ? (
                <Box sx={styles.empty}>
                    <Typography sx={styles.emptyText}>
                        No books match your search.
                    </Typography>
                </Box>
            ) : (
                <Box sx={styles.grid}>
                    {filteredBooks.map((book) => (
                        <MyBookCard
                            key={book._id}
                            book={book}
                            onFavorite={handleFavorite}
                            onRemove={handleRemove}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
}

const styles = {
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
            "& fieldset": {
                borderColor: "rgba(0, 224, 255, 0.08)",
            },
            "&:hover fieldset": {
                borderColor: "rgba(0, 224, 255, 0.2)",
            },
            "&.Mui-focused fieldset": {
                borderColor: "#00e0ff",
                borderWidth: "1px",
            },
        },
    },
    chip: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.65rem",
        letterSpacing: "0.04em",
        color: "#52525b",
        borderColor: "rgba(255,255,255,0.06)",
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
        "&:hover": {
            background: "rgba(0, 224, 255, 0.1)",
        },
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
        py: 10,
    },
    emptyText: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.9rem",
        color: "#52525b",
    },
};
