import { useState, useRef, useEffect, useCallback } from "react";
import {
    Box,
    Typography,
    Select,
    MenuItem,
    Slider,
    CircularProgress,
    Tooltip,
} from "@mui/material";
import { StickyNote2Outlined as NoteIcon } from "@mui/icons-material";

const DEFAULT_VOICES = [
    { name: "en-US-EmmaMultilingualNeural", label: "Emma (US)" },
    { name: "en-US-AndrewMultilingualNeural", label: "Andrew (US)" },
    { name: "en-US-AvaMultilingualNeural", label: "Ava (US)" },
    { name: "en-US-BrianMultilingualNeural", label: "Brian (US)" },
    { name: "en-GB-SoniaNeural", label: "Sonia (UK)" },
    { name: "en-GB-RyanNeural", label: "Ryan (UK)" },
    { name: "en-AU-NatashaNeural", label: "Natasha (AU)" },
    { name: "en-IN-NeerjaNeural", label: "Neerja (IN)" },
];

const SPEED_MARKS = [
    { value: -50, label: "0.5×" },
    { value: -25, label: "0.75×" },
    { value: 0, label: "1×" },
    { value: 25, label: "1.25×" },
    { value: 50, label: "1.5×" },
    { value: 100, label: "2×" },
];

const TTS_HIGHLIGHT_CLASS = "kindleai-tts-highlight";
const TTS_HIGHLIGHT_CSS = `
    .${TTS_HIGHLIGHT_CLASS} {
        background: rgba(0, 224, 255, 0.15) !important;
        border-bottom: 2px solid rgba(0, 224, 255, 0.5) !important;
        border-radius: 2px !important;
        transition: background 0.2s ease !important;
    }
`;

// Split text into sentence chunks, grouping short ones together
function splitIntoChunks(text, minChars = 80) {
    const raw = text.match(/[^.!?]*[.!?]+[\s]?|[^.!?]+$/g) || [text];
    const chunks = [];
    let buffer = "";

    for (const s of raw) {
        buffer += s;
        if (buffer.trim().length >= minChars) {
            chunks.push(buffer.trim());
            buffer = "";
        }
    }
    if (buffer.trim().length > 0) {
        chunks.push(buffer.trim());
    }
    return chunks;
}

// Fetch audio blob for a chunk of text
async function fetchAudio(text, voice, rate, token, signal) {
    const res = await fetch("http://localhost:3000/tts/synthesize", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, voice, rate }),
        signal,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.msg || `HTTP ${res.status}`);
    }

    return await res.blob();
}

/**
 * Injects the TTS highlight CSS into the epub iframe if not already present.
 */
function injectHighlightStyle(doc) {
    if (doc.getElementById("kindleai-tts-style")) return;
    const style = doc.createElement("style");
    style.id = "kindleai-tts-style";
    style.textContent = TTS_HIGHLIGHT_CSS;
    doc.head.appendChild(style);
}

/**
 * Clears all TTS highlights from the epub iframe.
 * Unwraps the highlight spans back to plain text nodes.
 */
function clearHighlights(renditionRef) {
    try {
        const contents = renditionRef?.current?.getContents();
        if (!contents || contents.length === 0) return;
        const doc = contents[0]?.document;
        if (!doc) return;

        const marks = doc.querySelectorAll(`.${TTS_HIGHLIGHT_CLASS}`);
        marks.forEach((mark) => {
            const parent = mark.parentNode;
            while (mark.firstChild) {
                parent.insertBefore(mark.firstChild, mark);
            }
            parent.removeChild(mark);
            parent.normalize(); // merge adjacent text nodes
        });
    } catch (e) {
        console.warn("[tts] clearHighlights error:", e.message);
    }
}

/**
 * Highlights the given chunk text inside the epub iframe.
 */
function highlightChunk(renditionRef, chunkText) {
    try {
        const contents = renditionRef?.current?.getContents();
        if (!contents || contents.length === 0) return;
        const doc = contents[0]?.document;
        if (!doc?.body) return;

        injectHighlightStyle(doc);
        clearHighlights(renditionRef);

        // Collect all text nodes and build a position map
        const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        let fullText = "";

        while (walker.nextNode()) {
            const node = walker.currentNode;
            const nodeText = node.textContent;
            textNodes.push({
                node,
                start: fullText.length,
                end: fullText.length + nodeText.length,
                text: nodeText,
            });
            fullText += nodeText;
        }

        // Normalize whitespace in both the full text and chunk for matching
        // Build a mapping from normalized index back to original index
        const normMap = []; // normMap[normalizedIdx] = originalIdx
        let normalized = "";
        let lastWasSpace = true; // trim leading

        for (let i = 0; i < fullText.length; i++) {
            const ch = fullText[i];
            if (/\s/.test(ch)) {
                if (!lastWasSpace && i < fullText.length - 1) {
                    normalized += " ";
                    normMap.push(i);
                    lastWasSpace = true;
                }
            } else {
                normalized += ch;
                normMap.push(i);
                lastWasSpace = false;
            }
        }

        const normChunk = chunkText.replace(/\s+/g, " ").trim();
        const matchIdx = normalized.indexOf(normChunk);
        if (matchIdx === -1) return;

        // Map back to original string positions
        const origStart = normMap[matchIdx];
        const origEnd = normMap[matchIdx + normChunk.length - 1] + 1;

        // Find which text nodes overlap with [origStart, origEnd)
        const toWrap = [];
        for (const tn of textNodes) {
            if (tn.end <= origStart || tn.start >= origEnd) continue;

            const wrapStart = Math.max(0, origStart - tn.start);
            const wrapEnd = Math.min(tn.text.length, origEnd - tn.start);
            toWrap.push({ ...tn, wrapStart, wrapEnd });
        }

        // Wrap matched portions in highlight spans (iterate in reverse
        // so DOM mutations don't shift later nodes)
        for (let i = toWrap.length - 1; i >= 0; i--) {
            const { node, wrapStart, wrapEnd } = toWrap[i];
            const range = doc.createRange();
            range.setStart(node, wrapStart);
            range.setEnd(node, wrapEnd);

            const span = doc.createElement("span");
            span.className = TTS_HIGHLIGHT_CLASS;
            range.surroundContents(span);
        }

        // Scroll the first highlight into view
        const firstHighlight = doc.querySelector(`.${TTS_HIGHLIGHT_CLASS}`);
        if (firstHighlight) {
            firstHighlight.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    } catch (e) {
        console.warn("[tts] highlightChunk error:", e.message);
    }
}

/**
 * Extracts ONLY the visible text from the current epub page
 * using epub.js CFI range.
 */
function getVisibleText(renditionRef) {
    try {
        const rendition = renditionRef?.current;
        if (!rendition) return null;

        const location = rendition.currentLocation();
        if (!location?.start?.cfi || !location?.end?.cfi) return null;

        const contents = rendition.getContents();
        if (!contents || contents.length === 0) return null;

        const content = contents[0];
        const doc = content?.document;
        if (!doc) return null;

        let startRange, endRange;
        try {
            startRange = content.range(location.start.cfi);
            endRange = content.range(location.end.cfi);
        } catch {
            return getFallbackText(doc);
        }

        if (!startRange || !endRange) return getFallbackText(doc);

        const pageRange = doc.createRange();
        pageRange.setStart(startRange.startContainer, startRange.startOffset);
        pageRange.setEnd(endRange.startContainer, endRange.startOffset);

        const text = pageRange.toString().replace(/\s+/g, " ").trim();
        const MAX = 5000;
        const result = text.length > MAX ? text.slice(0, MAX) : text;
        return result.length > 0 ? result : getFallbackText(doc);
    } catch (e) {
        console.error("[tts] Failed to extract page text:", e.message);
        return null;
    }
}

function getFallbackText(doc) {
    try {
        const raw = doc.body?.innerText || "";
        const cleaned = raw.replace(/\s+/g, " ").trim();
        return cleaned.length > 0 ? cleaned.slice(0, 2000) : null;
    } catch {
        return null;
    }
}

export default function TtsControls({ renditionRef, currentPageHasNotes = false, onNotesClick }) {
    const [status, setStatus] = useState("idle");
    const [voice, setVoice] = useState(DEFAULT_VOICES[0].name);
    const [speed, setSpeed] = useState(0);
    const [errorMsg, setErrorMsg] = useState("");

    const audioRef = useRef(null);
    const blobUrlRef = useRef(null);
    const abortRef = useRef(null);
    const cancelledRef = useRef(false);
    const pausedResolveRef = useRef(null);

    useEffect(() => {
        return () => stopAudio();
    }, []);

    const cleanupCurrentAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.onended = null;
            audioRef.current = null;
        }
        if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
            blobUrlRef.current = null;
        }
    }, []);

    const stopAudio = useCallback(() => {
        cancelledRef.current = true;
        if (abortRef.current) abortRef.current.abort();
        if (pausedResolveRef.current) {
            pausedResolveRef.current();
            pausedResolveRef.current = null;
        }
        cleanupCurrentAudio();
        clearHighlights(renditionRef);
        setStatus("idle");
        setErrorMsg("");
    }, [cleanupCurrentAudio, renditionRef]);

    const handlePause = useCallback(() => {
        if (audioRef.current && status === "playing") {
            audioRef.current.pause();
            setStatus("paused");
        }
    }, [status]);

    const handleResume = useCallback(() => {
        if (audioRef.current && status === "paused") {
            audioRef.current.play();
            setStatus("playing");
            if (pausedResolveRef.current) {
                pausedResolveRef.current();
                pausedResolveRef.current = null;
            }
        }
    }, [status]);

    const playBlob = useCallback(
        (blob) => {
            return new Promise((resolve, reject) => {
                if (cancelledRef.current) return resolve();

                cleanupCurrentAudio();

                const url = URL.createObjectURL(blob);
                blobUrlRef.current = url;

                const audio = new Audio(url);
                audioRef.current = audio;

                audio.onended = () => resolve();
                audio.onerror = () => reject(new Error("Audio playback error"));

                audio.play().catch(reject);
            });
        },
        [cleanupCurrentAudio],
    );

    const handlePlay = useCallback(async () => {
        if (status === "paused") {
            handleResume();
            return;
        }

        if (status === "loading" || status === "playing") return;

        stopAudio();
        cancelledRef.current = false;

        const text = getVisibleText(renditionRef);
        if (!text) {
            setErrorMsg("No text on this page");
            setStatus("error");
            return;
        }

        setStatus("loading");

        try {
            const rateStr =
                speed === 0 ? undefined : `${speed >= 0 ? "+" : ""}${speed}%`;

            const { auth } = await import("../../firebase/config.js");
            const user = auth.currentUser;
            const token = user ? await user.getIdToken() : null;

            const chunks = splitIntoChunks(text);
            const controller = new AbortController();
            abortRef.current = controller;

            // Prefetch first chunk
            let nextBlobPromise = fetchAudio(
                chunks[0],
                voice,
                rateStr,
                token,
                controller.signal,
            );

            for (let i = 0; i < chunks.length; i++) {
                if (cancelledRef.current) break;

                const blob = await nextBlobPromise;
                if (cancelledRef.current) break;

                // Prefetch next chunk while this one plays
                if (i + 1 < chunks.length) {
                    nextBlobPromise = fetchAudio(
                        chunks[i + 1],
                        voice,
                        rateStr,
                        token,
                        controller.signal,
                    );
                }

                // Highlight current chunk in the reader
                highlightChunk(renditionRef, chunks[i]);

                // Play current chunk
                setStatus("playing");
                await playBlob(blob);

                if (cancelledRef.current) break;
            }

            if (!cancelledRef.current) {
                cleanupCurrentAudio();
                clearHighlights(renditionRef);
                setStatus("idle");
            }
        } catch (e) {
            if (e.name === "AbortError" || cancelledRef.current) return;
            console.error("[tts] Playback error:", e);
            setErrorMsg(e?.message || "Synthesis failed");
            setStatus("error");
        }
    }, [
        status,
        voice,
        speed,
        renditionRef,
        stopAudio,
        handleResume,
        playBlob,
        cleanupCurrentAudio,
    ]);

    const isActive =
        status === "playing" || status === "paused" || status === "loading";

    return (
        <Box sx={sx.container}>
            {/* Header row: Listen Mode label + notes dot side by side */}
            <Box sx={sx.headerRow}>
                <Typography sx={sx.heading}>Listen Mode</Typography>

                {/* Notes dot indicator */}
                <Tooltip
                    title={currentPageHasNotes ? "Notes on this page" : "No notes on this page"}
                    placement="top"
                >
                    <Box sx={sx.dotWrap} onClick={onNotesClick}>
                        <Typography sx={sx.notesLabel(currentPageHasNotes)}>Notes</Typography>
                        <Box sx={currentPageHasNotes ? sx.dotGreen : sx.dotRed} />
                        <NoteIcon sx={{ fontSize: "0.7rem", color: currentPageHasNotes ? "#4ade80" : "#ff6b6b" }} />
                    </Box>
                </Tooltip>
            </Box>

            {/* Playback controls */}
            <Box sx={sx.controls}>
                {status === "playing" ? (
                    <Box sx={sx.btn} onClick={handlePause} title="Pause">
                        ❚❚
                    </Box>
                ) : (
                    <Box
                        sx={{
                            ...sx.btn,
                            ...(status === "loading" ? sx.btnDisabled : {}),
                        }}
                        onClick={handlePlay}
                        title={
                            status === "paused" ? "Resume" : "Read this page"
                        }
                    >
                        {status === "loading" ? (
                            <CircularProgress
                                size={14}
                                sx={{ color: "#00e0ff" }}
                            />
                        ) : (
                            "▶"
                        )}
                    </Box>
                )}

                <Box
                    sx={{
                        ...sx.btn,
                        ...(!isActive ? sx.btnDisabled : {}),
                    }}
                    onClick={isActive ? stopAudio : undefined}
                    title="Stop"
                >
                    ■
                </Box>
            </Box>

            {/* Voice selector */}
            <Box sx={sx.settingRow}>
                <Typography sx={sx.label}>Voice</Typography>
                <Select
                    value={voice}
                    onChange={(e) => {
                        setVoice(e.target.value);
                        if (isActive) stopAudio();
                    }}
                    size="small"
                    sx={sx.select}
                    MenuProps={{ PaperProps: { sx: sx.menuPaper } }}
                >
                    {DEFAULT_VOICES.map((v) => (
                        <MenuItem key={v.name} value={v.name} sx={sx.menuItem}>
                            {v.label}
                        </MenuItem>
                    ))}
                </Select>
            </Box>

            {/* Speed slider */}
            <Box sx={sx.settingRow}>
                <Typography sx={sx.label}>Speed</Typography>
                <Slider
                    value={speed}
                    onChange={(_, val) => {
                        setSpeed(val);
                        if (isActive) stopAudio();
                    }}
                    min={-50}
                    max={100}
                    step={25}
                    marks={SPEED_MARKS}
                    sx={sx.slider}
                    size="small"
                />
            </Box>

            {/* Status line */}
            <Typography sx={sx.status}>
                {status === "idle" && "Press ▶ to read this page aloud"}
                {status === "loading" && "Synthesizing audio…"}
                {status === "playing" && "♫ Playing…"}
                {status === "paused" && "Paused"}
                {status === "error" && (errorMsg || "Something went wrong")}
            </Typography>
        </Box>
    );
}

const sx = {
    container: {
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        px: 2,
        py: 1.5,
        borderBottom: "1px solid rgba(0, 224, 255, 0.06)",
    },
    headerRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    heading: {
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: "0.8rem",
        color: "#e4e4e8",
    },
    dotWrap: {
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        cursor: "pointer",
        px: 0.75,
        py: 0.4,
        borderRadius: "6px",
        border: "1px solid rgba(255,255,255,0.05)",
        transition: "all 0.2s",
        "&:hover": {
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.1)",
        },
    },
    notesLabel: (hasNotes) => ({
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.8rem",
        color: hasNotes ? "#4ade80" : "#ff6b6b",
        lineHeight: 1,
    }),
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
    controls: {
        display: "flex",
        gap: 1,
    },
    btn: {
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "10px",
        background: "rgba(0, 224, 255, 0.06)",
        border: "1px solid rgba(0, 224, 255, 0.12)",
        color: "#00e0ff",
        fontSize: "0.85rem",
        cursor: "pointer",
        transition: "all 0.2s",
        userSelect: "none",
        "&:hover": {
            background: "rgba(0, 224, 255, 0.15)",
            borderColor: "rgba(0, 224, 255, 0.35)",
            boxShadow: "0 0 12px rgba(0, 224, 255, 0.1)",
        },
    },
    btnDisabled: {
        opacity: 0.35,
        cursor: "default",
        "&:hover": {
            background: "rgba(0, 224, 255, 0.06)",
            borderColor: "rgba(0, 224, 255, 0.12)",
            boxShadow: "none",
        },
    },
    settingRow: {
        display: "flex",
        alignItems: "center",
        gap: 1.5,
    },
    label: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.7rem",
        color: "#71717a",
        minWidth: 38,
        flexShrink: 0,
    },
    select: {
        flex: 1,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.7rem",
        color: "#a1a1aa",
        height: 30,
        "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0, 224, 255, 0.1)",
            borderRadius: "8px",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0, 224, 255, 0.25)",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0, 224, 255, 0.4)",
        },
        "& .MuiSelect-icon": {
            color: "#52525b",
        },
    },
    menuPaper: {
        background: "#0f0f18",
        border: "1px solid rgba(0, 224, 255, 0.1)",
        borderRadius: "10px",
        maxHeight: 260,
    },
    menuItem: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.72rem",
        color: "#a1a1aa",
        "&:hover": {
            background: "rgba(0, 224, 255, 0.06)",
        },
        "&.Mui-selected": {
            background: "rgba(0, 224, 255, 0.1)",
            color: "#00e0ff",
        },
    },
    slider: {
        flex: 1,
        color: "#00e0ff",
        "& .MuiSlider-markLabel": {
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.55rem",
            color: "#52525b",
        },
        "& .MuiSlider-thumb": {
            width: 12,
            height: 12,
        },
        "& .MuiSlider-rail": {
            opacity: 0.15,
        },
        "& .MuiSlider-mark": {
            backgroundColor: "rgba(0, 224, 255, 0.2)",
        },
    },
    status: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.68rem",
        color: "#3f3f46",
        mt: 0.25,
    },
};