import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, IconButton } from "@mui/material";

import { ReactReader } from "react-reader";
import api from "../api/axios.js";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import { useEffect, useState } from "react";

export default function ReaderPage() {
    const { bookId } = useParams();

    const [error, setError] = useState(null);
    const [location, setLocation] = useState("");
    const [pageChange, setPageChange] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const getBookDetails = async () => {
            try {
                const res = await api.get(`/book/${bookId}`);
                const epub_asset_key = res.data.epub_asset_key.split("/");
                setLocation(
                    `http://localhost:3000/epub/${epub_asset_key.at(-1)}`,
                );
                console.log(
                    `http://localhost:3000/epub/${epub_asset_key.at(-1)}`,
                );
            } catch (e) {
                setError("Failed to fetch book");
            }
        };

        getBookDetails();
    }, [bookId]);

    const locationChanged = (epubcifi) => {
        console.log("Location changed to:", epubcifi);
        setPageChange(epubcifi);
    };

    return (
        <Box sx={styles.page}>
            <Box sx={styles.topBar}>
                <IconButton
                    onClick={() => navigate("/home?tab=My+Books")}
                    sx={styles.backBtn}
                >
                    <ArrowBackIcon />
                </IconButton>
            </Box>

            <div style={{ position: "relative", height: "90vh" }}>
                <ReactReader
                    url={location}
                    location={pageChange}
                    locationChanged={locationChanged}
                    epubOptions={{
                        allowPopups: true,
                        allowScriptedContent: true,
                        openAs: "epub",
                    }}
                />
            </div>
        </Box>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#050508",
        display: "flex",
        flexDirection: "column",
    },
    topBar: {
        p: 2,
    },
    backBtn: {
        color: "#d4d4d8",
        border: "1px solid rgba(0, 224, 255, 0.1)",
        borderRadius: "8px",
        "&:hover": {
            background: "rgba(0, 224, 255, 0.05)",
            borderColor: "rgba(0, 224, 255, 0.3)",
        },
    },
    center: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
    },
    heading: {
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: "1.5rem",
        color: "#fff",
    },
    sub: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.9rem",
        color: "#52525b",
    },
    bookId: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.65rem",
        color: "#3f3f46",
        mt: 2,
    },
};
