import { useState } from "react";
import { Box, Button, Alert, CircularProgress } from "@mui/material";
import Navbar from "../components/Navbar.jsx";
import api from "../api/axios.js";

import "../css/LandingPage.css";

export default function HomePage() {
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setMessage(null);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("epub", file);

            const res = await api.post("/book/upload_book", formData);

            setMessage(
                res.data.deduplicated
                    ? `"${res.data.book.title}" already in library`
                    : `"${res.data.book.title}" uploaded — indexing in background`,
            );
        } catch (err) {
            setError(err.response?.data?.msg || err.message);
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", background: "#050508", pt: "80px" }}>
            <Navbar />

            <Box p={4}>
                <Button
                    variant="contained"
                    component="label"
                    disabled={uploading}
                >
                    {uploading ? (
                        <CircularProgress size={18} sx={{ mr: 1 }} />
                    ) : null}
                    {uploading ? "Uploading..." : "Upload EPUB"}
                    <input
                        type="file"
                        accept=".epub"
                        hidden
                        onChange={handleUpload}
                    />
                </Button>

                {message && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        {message}
                    </Alert>
                )}
                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}
            </Box>
        </Box>
    );
}
