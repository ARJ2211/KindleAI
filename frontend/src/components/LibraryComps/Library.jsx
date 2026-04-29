import { useState, useEffect } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import BookCard from "./BookCard.jsx";
import LibraryBar from "./LibraryBar.jsx";
import api from "../../api/axios.js";

export default function Library({ onUpload, uploading, onAlert }) {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: "",
        aiReady: false,
        ttsReady: false,
    });

    const [myBookIds, setMyBookIds] = useState(new Set());

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

    const fetchMyBooks = async () =>{
        try {
            const res = await api.get("/library");
            const ids = new Set(res.data.map((b) => b._id));
            setMyBookIds(ids)
        } catch (error) {
            setError(error.message)
        }
    }

    useEffect(() => {
        fetchLibrary();
        fetchMyBooks();
    }, []);

    const handleDelete = async (book) => {
        try {
            await api.delete(`/book/${book._id}`);
            setBooks((prev) => prev.filter((b) => b._id !== book._id));
            onAlert?.({
                message: `"${book.title}" deleted successfully`,
                severity: "success",
            });
        } catch (err) {
            onAlert?.({
                message: err.response?.data?.msg || "Failed to delete book",
                severity: "error",
            });
        }
    };

    const handleAdd = async (book) => {
        try {
            await api.post(`/library/${book._id}`);
            setMyBookIds((prev) => new Set([...prev, book._id]));
            onAlert?.({
                message: `"${book.title}" added to My Books`,
                severity: "success",
            });
        } catch (err) {
            const status = err.response?.status;
            onAlert?.({
                message:
                    status === 409
                        ? `"${book.title}" is already in My Books`
                        : err.response?.data?.msg || "Failed to add book",
                severity: status === 409 ? "warning" : "error",
            });
        }
    };

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
                        <BookCard
                            key={book._id}
                            book={book}
                            onDelete={handleDelete}
                            onAdd={handleAdd}
                            onAlert={onAlert}
                            isInMyBooks={myBookIds.has(book._id)}
                        />
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
