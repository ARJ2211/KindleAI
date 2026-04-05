import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, IconButton, CircularProgress, Tooltip } from "@mui/material";
import { ReactReader } from "react-reader";
import api from "../api/axios.js";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { StickyNote2Outlined as NoteIcon } from "@mui/icons-material";
import { useEffect, useState, useRef, useCallback } from "react";

import PageNavButtons from "../components/ReaderComps/PageNavButtons.jsx";
import ReaderLoader from "../components/ReaderComps/ReaderLoader.jsx";
import TtsControls from "../components/ReaderComps/TtsControls.jsx";
import ChapterList from "../components/ReaderComps/ChapterList.jsx";
import LlmChat from "../components/AiChat/LlmChat.jsx";
import NotesModal from "../components/ReaderComps/NotesModal.jsx";

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
    const [savedCfi, setSavedCfi] = useState(null);
    const [readerReady, setReaderReady] = useState(false);
    const [settled, setSettled] = useState(false);
    const [noteCount, setNoteCount] = useState(0);
    const [notesList, setNotesList] = useState([]);
    const [notesOpen, setNotesOpen] = useState(false);

    const handleCountChange = useCallback((count, list) => {
        setNoteCount(count);
        setNotesList(list);
    }, []);

    const saveTimerRef = useRef(null);
    const renditionRef = useRef(null);
    const locationsReadyRef = useRef(false);
    const finishedBookRef = useRef(false);
    const settledRef = useRef(false);
    // Queued CFI to save once locations are ready
    const pendingSaveRef = useRef(null);

    // Fetch notes whenever currentCfi changes so the dot indicator is always correct
    useEffect(() => {
        if (!bookId || !currentCfi) return;
        api.get(`/annotation/${bookId}?type=note&_=${Date.now()}`)
            .then((res) => {
                const list = res.data || [];
                setNotesList(list);
                setNoteCount(list.length);
            })
            .catch(() => { });
    }, [bookId, currentCfi]);

    // Fetch notes once after epub is fully settled (handles resume case where
    // handleLocationChanged never fires after locations are generated)
    useEffect(() => {
        if (!bookId || !settled) return;
        api.get(`/annotation/${bookId}?type=note&_=${Date.now()}`)
            .then((res) => {
                const list = res.data || [];
                setNotesList(list);
                setNoteCount(list.length);
            })
            .catch(() => { });
    }, [bookId, settled]);

    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);
                const bookRes = await api.get(`/book/${bookId}`);
                const book = bookRes.data;
                setBookInfo(book);
                const epubFile = book.epub_asset_key.split("/").at(-1);
                setEpubUrl(`http://localhost:3000/epub/${epubFile}`);

                // Fetch saved reading position
                try {
                    const libRes = await api.get(`/library/${bookId}`);
                    if (libRes.data?.progress_percent === 100) {
                        finishedBookRef.current = true;
                        if (libRes.data?.current_chapter) {
                            setSavedCfi(libRes.data.current_chapter);
                        }
                        console.log(
                            "[reader] Book was finished, resuming at last position",
                        );
                    } else if (libRes.data?.current_chapter) {
                        setSavedCfi(libRes.data.current_chapter);
                        console.log(
                            "[reader] Resuming from:",
                            libRes.data.current_chapter,
                        );
                    }
                } catch {
                    console.log(
                        "[reader] Book not in user library, starting from beginning",
                    );
                }

                setReaderReady(true);
            } catch {
                setError("Failed to load book");
            } finally {
                setLoading(false);
            }
        };
        init();
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [bookId]);

    // Calculates percentage and saves progress to backend
    const saveProgressFromCurrentLocation = useCallback(() => {
        if (!locationsReadyRef.current || !renditionRef.current) return;
        if (!settledRef.current) return; // Don't save during initial load

        const loc = renditionRef.current.currentLocation();
        const atEnd = loc?.atEnd === true;
        const cfi = atEnd ? loc?.end?.cfi || loc?.start?.cfi : loc?.start?.cfi;

        if (!cfi) return;

        const pct = renditionRef.current.book.locations.percentageFromCfi(cfi);
        const percent = atEnd
            ? 100
            : pct != null && !isNaN(pct)
                ? Math.round(pct * 10000) / 100
                : 0;

        console.log("[reader] Page changed:", cfi, `(${percent}%)`);

        api.patch(`/library/${bookId}/progress`, {
            current_chapter: cfi,
            progress_percent: percent,
        })
            .then(() => console.log("[reader] Progress saved:", percent + "%"))
            .catch((err) => console.warn("[reader] Save failed:", err.message));
    }, [bookId]);

    const handleRendition = useCallback(
        (rendition) => {
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

            rendition.book.ready
                .then(() => rendition.book.locations.generate(1600))
                .then(() => {
                    locationsReadyRef.current = true;
                    console.log("[reader] Locations generated");

                    // Wait for any resume navigation to settle before allowing saves
                    setTimeout(() => {
                        if (saveTimerRef.current)
                            clearTimeout(saveTimerRef.current);
                        setSettled(true);
                        settledRef.current = true;
                        console.log("[reader] Settled, saves enabled");


                    }, 800);
                });
        },
        [saveProgressFromCurrentLocation],
    );

    const handleLocationChanged = useCallback(
        (epubcifi) => {
            setCurrentCfi(epubcifi);

            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(() => {
                if (!locationsReadyRef.current) {
                    console.log(
                        "[reader] Page changed:",
                        epubcifi,
                        "(queued, locations not ready)",
                    );
                    pendingSaveRef.current = epubcifi;
                    return;
                }

                saveProgressFromCurrentLocation();
            }, 500);
        },
        [saveProgressFromCurrentLocation],
    );

    const handleTocChanged = useCallback((newToc) => {
        setToc(newToc);
    }, []);

    const goToChapter = useCallback((href) => {
        if (renditionRef.current) {
            renditionRef.current.display(href);
        }
    }, []);

    if (loading) {
        return <ReaderLoader message="Fetching book details…" />;
    }

    if (error) {
        return <ReaderLoader message={error} />;
    }

    const currentPageHasNotes = notesList.some((n) => n.chapter === (currentCfi || savedCfi));

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

                {/* Spacer to push notes dot to the right */}
                <Box sx={{ flex: 1 }} />

                {/* Notes dot — right side of topBar */}
                <Tooltip
                    title={currentPageHasNotes ? "Notes on this page" : "No notes on this page"}
                    placement="bottom"
                >
                    <Box sx={sx.notesDot} onClick={() => setNotesOpen((p) => !p)}>
                        <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", color: currentPageHasNotes ? "#4ade80" : "#ff6b6b", lineHeight: 1 }}>
                            Notes
                        </Typography>
                        <Box sx={currentPageHasNotes ? sx.dotGreen : sx.dotRed} />
                        <NoteIcon sx={{ fontSize: "0.7rem", color: currentPageHasNotes ? "#4ade80" : "#ff6b6b" }} />
                    </Box>
                </Tooltip>
            </Box>

            <Box sx={sx.contentArea}>
                <ChapterList toc={toc} onSelect={goToChapter} />
                <Box sx={sx.readerWrapper}>
                    <PageNavButtons renditionRef={renditionRef} />
                    {epubUrl && readerReady && (
                        <ReactReader
                            url={epubUrl}
                            location={currentCfi || savedCfi || undefined}
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
                    {!settled && (
                        <Box sx={sx.readerOverlay}>
                            <CircularProgress
                                size={24}
                                sx={{ color: "#00e0ff" }}
                            />
                            <Typography sx={sx.overlayText}>
                                Loading pages…
                            </Typography>
                        </Box>
                    )}
                </Box>
                <Box sx={sx.rightPanel}>
                    <TtsControls renditionRef={renditionRef} />
                    <LlmChat
                        bookId={bookId}
                        embeddingReady={!!bookInfo?.embedding_ready}
                    />
                </Box>
            </Box>
            <NotesModal
                bookId={bookId}
                currentCfi={currentCfi}
                open={notesOpen}
                onClose={() => setNotesOpen(false)}
                onCountChange={handleCountChange}
            />
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
    readerOverlay: {
        position: "absolute",
        inset: 0,
        zIndex: 10,
        background: "#0a0a0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
    },
    overlayText: {
        color: "#52525b",
        fontSize: "0.8rem",
        fontFamily: "'DM Sans', sans-serif",
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
    notesDot: {
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        cursor: "pointer",
        px: 0.75,
        py: 0.4,
        borderRadius: "6px",
        border: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(10, 10, 15, 0.7)",
        transition: "all 0.2s",
        flexShrink: 0,
        "&:hover": {
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.1)",
        },
    },
    dotGreen: {
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: "#4ade80",
        boxShadow: "0 0 6px rgba(74, 222, 128, 0.6)",
        flexShrink: 0,
    },
    dotRed: {
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: "#ff6b6b",
        boxShadow: "0 0 6px rgba(255, 107, 107, 0.5)",
        flexShrink: 0,
    },
};