import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, IconButton, CircularProgress } from "@mui/material";
import { ReactReader } from "react-reader";
import api from "../api/axios.js";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useEffect, useState, useRef, useCallback } from "react";

import PageNavButtons from "../components/ReaderComps/PageNavButtons.jsx";
import TtsControls from "../components/ReaderComps/TtsControls.jsx";
import ChapterList from "../components/ReaderComps/ChapterList.jsx";
import LlmChat from "../components/ReaderComps/LlmChat.jsx";

const readerStyles = {
    container: { overflow: "hidden", height: "100%" },
    readerArea: { backgroundColor: "#0a0a0f", transition: "none" },
    reader: { position: "absolute", top: 10, left: 50, bottom: 10, right: 50 },
    titleArea: { display: "none" },
    tocArea: { display: "none" },
    tocButton: { display: "none" },
    tocButtonExpanded: { display: "none" },
    prev: { display: "none" },
    next: { display: "none" },
};

const DARK_THEME = {
    body: {
        background: "#0a0a0f !important",
        color: "#c8c8d0 !important",
        "font-family": "'Georgia', 'Times New Roman', serif !important",
        "line-height": "1.8 !important",
        padding: "0 8px !important",
    },
    "p, div, span, li, td, th, dd, dt": { color: "#c8c8d0 !important" },
    "h1, h2, h3, h4, h5, h6": { color: "#e4e4e8 !important" },
    a: { color: "#00c8e0 !important" },
    img: { "max-width": "100% !important", filter: "brightness(0.85)" },
};

export default function ReaderPage() {
    const { bookId } = useParams();
    const navigate = useNavigate();

    const [epubUrl, setEpubUrl] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentCfi, setCurrentCfi] = useState(null);
    const [bookInfo, setBookInfo] = useState(null);
    const [toc, setToc] = useState([]);

    const renditionRef = useRef(null);

    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);
                const bookRes = await api.get(`/book/${bookId}`);
                const book = bookRes.data;
                setBookInfo(book);
                const epubFile = book.epub_asset_key.split("/").at(-1);
                setEpubUrl(`http://localhost:3000/epub/${epubFile}`);
            } catch {
                setError("Failed to load book");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [bookId]);

    const handleRendition = useCallback((rendition) => {
        renditionRef.current = rendition;
        rendition.themes.register("dark", DARK_THEME);
        rendition.themes.select("dark");
        rendition.themes.fontSize("105%");

        rendition.hooks.content.register((contents) => {
            const doc = contents.document;
            if (doc?.body) {
                doc.body.style.background = "#0a0a0f";
                doc.body.style.color = "#c8c8d0";
            }
        });
    }, []);

    const handleLocationChanged = useCallback((epubcifi) => {
        setCurrentCfi(epubcifi);
        // TODO: save reading progress to backend
        console.log("[reader] page changed:", epubcifi);
    }, []);

    const handleTocChanged = useCallback((newToc) => {
        setToc(newToc);
    }, []);

    const goToChapter = useCallback((href) => {
        if (renditionRef.current) {
            renditionRef.current.display(href);
        }
    }, []);

    if (loading) {
        return (
            <Box sx={sx.centered}>
                <CircularProgress
                    size={32}
                    sx={{ color: "rgba(0, 224, 255, 0.6)" }}
                />
                <Typography sx={sx.subText}>Loading book…</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={sx.centered}>
                <Typography sx={{ ...sx.subText, color: "#ff6b6b" }}>
                    {error}
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={sx.page}>
            <Box sx={sx.topBar}>
                <IconButton
                    onClick={() => navigate("/home?tab=My+Books")}
                    sx={sx.backBtn}
                >
                    <ArrowBackIcon fontSize="small" />
                </IconButton>
                {bookInfo && (
                    <Box sx={sx.bookMeta}>
                        <Typography sx={sx.bookTitle} noWrap>
                            {bookInfo.title}
                        </Typography>
                        <Typography sx={sx.bookAuthor} noWrap>
                            {bookInfo.author}
                        </Typography>
                    </Box>
                )}
            </Box>

            <Box sx={sx.contentArea}>
                <ChapterList toc={toc} onSelect={goToChapter} />
                <Box sx={sx.readerWrapper}>
                    <PageNavButtons renditionRef={renditionRef} />
                    {epubUrl && (
                        <ReactReader
                            url={epubUrl}
                            location={currentCfi || undefined}
                            locationChanged={handleLocationChanged}
                            tocChanged={handleTocChanged}
                            getRendition={handleRendition}
                            readerStyles={readerStyles}
                            epubOptions={{
                                allowPopups: true,
                                allowScriptedContent: true,
                                openAs: "epub",
                            }}
                        />
                    )}
                </Box>
                <Box sx={sx.rightPanel}>
                    <TtsControls renditionRef={renditionRef} />
                    <LlmChat />
                </Box>
            </Box>
        </Box>
    );
}

const sx = {
    page: {
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#050508",
        overflow: "hidden",
    },
    centered: {
        height: "100vh",
        background: "#050508",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
    },
    subText: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.85rem",
        color: "#52525b",
    },
    topBar: { p: 1.5, zIndex: 10 },
    backBtn: {
        color: "#d4d4d8",
        border: "1px solid rgba(0, 224, 255, 0.1)",
        borderRadius: "8px",
        width: 36,
        height: 36,
        "&:hover": {
            background: "rgba(0, 224, 255, 0.05)",
            borderColor: "rgba(0, 224, 255, 0.3)",
        },
    },
    contentArea: {
        flex: 1,
        display: "flex",
        overflow: "hidden",
    },
    readerWrapper: {
        flex: 1,
        position: "relative",
        height: "100%",
        overflow: "hidden",
    },
    navBtn: {
        position: "absolute",
        left: 12,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 5,
        color: "#00e0ff",
        fontSize: "1.6rem",
        width: 44,
        height: 44,
        fontFamily: "serif",
        background: "rgba(0, 224, 255, 0.06)",
        border: "1px solid rgba(0, 224, 255, 0.12)",
        borderRadius: "12px",
        backdropFilter: "blur(8px)",
        transition: "all 0.25s ease",
        "&:hover": {
            color: "#fff",
            background: "rgba(0, 224, 255, 0.15)",
            borderColor: "rgba(0, 224, 255, 0.35)",
            boxShadow: "0 0 20px rgba(0, 224, 255, 0.15)",
            transform: "translateY(-50%) scale(1.08)",
        },
    },
    rightPanel: {
        width: 360,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "#0a0a12",
        borderLeft: "1px solid rgba(0, 224, 255, 0.08)",
    },
    topBar: {
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 2,
        py: 1,
        borderBottom: "1px solid rgba(0, 224, 255, 0.06)",
        zIndex: 10,
    },
    bookMeta: {
        minWidth: 0,
    },
    bookTitle: {
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: "0.9rem",
        color: "#e4e4e8",
        lineHeight: 1.2,
    },
    bookAuthor: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.7rem",
        color: "#52525b",
        mt: 0.25,
    },
};
