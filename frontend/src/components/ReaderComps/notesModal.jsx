import {
    Box,
    Typography,
    IconButton,
    TextField,
    CircularProgress,
    Collapse,
    Tooltip,
    Slider,
} from "@mui/material";
import {
    Add as AddIcon,
    Close as CloseIcon,
    Check as CheckIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    StickyNote2Outlined as NoteIcon,
    DragIndicator as DragIcon,
    OpacityOutlined as OpacityIcon,
} from "@mui/icons-material";
import { useEffect, useState, useCallback, useRef } from "react";
import api from "../../api/axios.js";

/**
 * notesModal
 *
 * Props:
 *  - bookId         {string}
 *  - currentCfi     {string}
 *  - open           {boolean}   controlled by parent (dot click in TtsControls)
 *  - onClose        {function}
 *  - onCountChange  {function}  (count, notesArray) => void
 */
export default function NotesModal({ bookId, currentCfi, open, onClose, onCountChange }) {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [composing, setComposing] = useState(false);
    const [draftTitle, setDraftTitle] = useState("");
    const [draftBody, setDraftBody] = useState("");
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editBody, setEditBody] = useState("");
    const [editTitle, setEditTitle] = useState("");
    const [opacity, setOpacity] = useState(0.96);
    const [showOpacity, setShowOpacity] = useState(false);

    // Drag state
    const [pos, setPos] = useState({ x: 80, y: 80 });
    const dragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const modalRef = useRef(null);

    // ── Sync count to parent ───────────────────────────────────────────────
    useEffect(() => {
        onCountChange?.(notes.length, notes);
    }, [notes, onCountChange]);

    // ── Fetch ──────────────────────────────────────────────────────────────
    const fetchNotes = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/annotation/${bookId}?type=note`);
            setNotes(res.data);
        } catch (err) {
            console.warn("[notes] Failed to load:", err.message);
        } finally {
            setLoading(false);
        }
    }, [bookId]);

    useEffect(() => {
        if (bookId && open) fetchNotes();
    }, [bookId, open, fetchNotes]);

    // ── Create ─────────────────────────────────────────────────────────────
    const handleCreate = async () => {
        if (!draftBody.trim()) return;
        setSaving(true);
        try {
            await api.post(`/annotation/${bookId}`, {
                type: "note",
                chapter: currentCfi || "unknown",
                note_text: draftTitle.trim()
                    ? `[${draftTitle.trim()}]\n${draftBody.trim()}`
                    : draftBody.trim(),
                selected_text: "",
            });
            setDraftTitle("");
            setDraftBody("");
            setComposing(false);
            await fetchNotes();
        } catch (err) {
            console.warn("[notes] Create failed:", err.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Edit ───────────────────────────────────────────────────────────────
    const startEdit = (note) => {
        setEditingId(note._id);
        const match = note.note_text?.match(/^\[(.+?)\]\n([\s\S]*)$/);
        if (match) {
            setEditTitle(match[1]);
            setEditBody(match[2]);
        } else {
            setEditTitle("");
            setEditBody(note.note_text || "");
        }
    };

    const handleSaveEdit = async (id) => {
        if (!editBody.trim()) return;
        try {
            await api.patch(`/annotation/single/${id}`, {
                note_text: editTitle.trim()
                    ? `[${editTitle.trim()}]\n${editBody.trim()}`
                    : editBody.trim(),
            });
            setEditingId(null);
            await fetchNotes();
        } catch (err) {
            console.warn("[notes] Edit failed:", err.message);
        }
    };

    // ── Delete ─────────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        try {
            await api.delete(`/annotation/single/${id}`);
            setNotes((prev) => prev.filter((n) => n._id !== id));
        } catch (err) {
            console.warn("[notes] Delete failed:", err.message);
        }
    };

    // ── Drag ───────────────────────────────────────────────────────────────
    const onMouseDown = (e) => {
        dragging.current = true;
        dragOffset.current = {
            x: e.clientX - pos.x,
            y: e.clientY - pos.y,
        };
        e.preventDefault();
    };

    useEffect(() => {
        const onMouseMove = (e) => {
            if (!dragging.current) return;
            setPos({
                x: e.clientX - dragOffset.current.x,
                y: e.clientY - dragOffset.current.y,
            });
        };
        const onMouseUp = () => { dragging.current = false; };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, []);

    // ── Helpers ────────────────────────────────────────────────────────────
    const parseNote = (note) => {
        const match = note.note_text?.match(/^\[(.+?)\]\n([\s\S]*)$/);
        if (match) return { title: match[1], body: match[2] };
        return { title: null, body: note.note_text || "" };
    };

    const formatDate = (d) =>
        new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });

    if (!open) return null;

    return (
        <Box
            ref={modalRef}
            sx={{
                position: "fixed",
                left: pos.x,
                top: pos.y,
                zIndex: 999,
                width: 360,
                maxHeight: 560,
                display: "flex",
                flexDirection: "column",
                background: `rgba(10, 10, 18, ${opacity})`,
                border: "1px solid rgba(0, 224, 255, 0.15)",
                borderRadius: "14px",
                boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 32px rgba(0,224,255,0.05)",
                backdropFilter: "blur(16px)",
                overflow: "hidden",
                opacity: opacity,
                transition: "opacity 0.1s",
            }}
        >
            {/* ── Title bar (drag handle) ── */}
            <Box
                onMouseDown={onMouseDown}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    py: 1,
                    borderBottom: "1px solid rgba(0, 224, 255, 0.08)",
                    cursor: "grab",
                    userSelect: "none",
                    background: "rgba(0, 224, 255, 0.03)",
                    "&:active": { cursor: "grabbing" },
                }}
            >
                <DragIcon sx={{ fontSize: "0.9rem", color: "#3f3f46" }} />
                <NoteIcon sx={{ fontSize: "0.85rem", color: "#00e0ff" }} />
                <Typography sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.8rem", color: "#e4e4e8", flex: 1 }}>
                    Notes
                </Typography>
                {notes.length > 0 && (
                    <Box sx={{ background: "rgba(0,224,255,0.1)", border: "1px solid rgba(0,224,255,0.18)", borderRadius: "6px", px: 0.75, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.62rem", color: "#00e0ff", lineHeight: 1.8 }}>
                        {notes.length}
                    </Box>
                )}

                {/* Opacity toggle */}
                <Tooltip title="Opacity" placement="top">
                    <IconButton size="small" onClick={() => setShowOpacity(p => !p)} sx={{ color: showOpacity ? "#00e0ff" : "#3f3f46", width: 24, height: 24, borderRadius: "6px", "&:hover": { color: "#00e0ff" } }}>
                        <OpacityIcon sx={{ fontSize: "0.8rem" }} />
                    </IconButton>
                </Tooltip>

                {/* Add note */}
                <Tooltip title="Add note" placement="top">
                    <IconButton size="small" onClick={() => setComposing(p => !p)} sx={{ color: composing ? "#00e0ff" : "#52525b", border: "1px solid rgba(0,224,255,0.15)", borderRadius: "6px", width: 24, height: 24, "&:hover": { color: "#00e0ff", background: "rgba(0,224,255,0.08)" } }}>
                        {composing ? <CloseIcon sx={{ fontSize: "0.8rem" }} /> : <AddIcon sx={{ fontSize: "0.8rem" }} />}
                    </IconButton>
                </Tooltip>

                {/* Close */}
                <Tooltip title="Close" placement="top">
                    <IconButton size="small" onClick={onClose} sx={{ color: "#52525b", width: 24, height: 24, borderRadius: "6px", "&:hover": { color: "#ff6b6b", background: "rgba(255,107,107,0.06)" } }}>
                        <CloseIcon sx={{ fontSize: "0.8rem" }} />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* ── Opacity slider ── */}
            <Collapse in={showOpacity} unmountOnExit>
                <Box sx={{ px: 2, py: 1, borderBottom: "1px solid rgba(0,224,255,0.06)", display: "flex", alignItems: "center", gap: 1.5 }}>
                    <OpacityIcon sx={{ fontSize: "0.75rem", color: "#52525b" }} />
                    <Slider
                        value={opacity}
                        onChange={(_, v) => setOpacity(v)}
                        min={0.2}
                        max={1}
                        step={0.05}
                        size="small"
                        sx={{
                            color: "#00e0ff",
                            "& .MuiSlider-thumb": { width: 12, height: 12 },
                            "& .MuiSlider-rail": { background: "rgba(255,255,255,0.08)" },
                        }}
                    />
                    <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.62rem", color: "#52525b", minWidth: 28 }}>
                        {Math.round(opacity * 100)}%
                    </Typography>
                </Box>
            </Collapse>

            {/* ── Compose form ── */}
            <Collapse in={composing} unmountOnExit>
                <Box sx={{ px: 2, py: 1.5, display: "flex", flexDirection: "column", gap: 1, borderBottom: "1px solid rgba(0,224,255,0.06)", background: "rgba(0,224,255,0.02)" }}>
                    <TextField
                        placeholder="Note title (optional)"
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        fullWidth size="small" variant="outlined"
                        sx={sx.input}
                        inputProps={{ maxLength: 80 }}
                    />
                    <TextField
                        placeholder="Write your note…"
                        value={draftBody}
                        onChange={(e) => setDraftBody(e.target.value)}
                        fullWidth multiline minRows={3} maxRows={5}
                        size="small" variant="outlined"
                        sx={sx.input}
                    />
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Box
                            component="button"
                            onClick={handleCreate}
                            disabled={saving || !draftBody.trim()}
                            sx={sx.saveBtn}
                        >
                            {saving ? <CircularProgress size={10} sx={{ color: "#0a0a0f" }} /> : "Save note"}
                        </Box>
                    </Box>
                </Box>
            </Collapse>

            {/* ── Notes list ── */}
            <Box sx={{ flex: 1, overflowY: "auto", py: 1, px: 1.5, display: "flex", flexDirection: "column", gap: 0.5, "&::-webkit-scrollbar": { width: "3px" }, "&::-webkit-scrollbar-track": { background: "transparent" }, "&::-webkit-scrollbar-thumb": { background: "rgba(0,224,255,0.1)", borderRadius: "2px" } }}>
                {loading ? (
                    <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
                        <CircularProgress size={18} sx={{ color: "#52525b" }} />
                    </Box>
                ) : notes.length === 0 ? (
                    <Box sx={{ py: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                        <NoteIcon sx={{ fontSize: "1.4rem", color: "#27272a" }} />
                        <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.73rem", color: "#3f3f46" }}>
                            No notes on this page — click + to add one
                        </Typography>
                    </Box>
                ) : (
                    notes
                        .filter((note) => !currentCfi || note.chapter === currentCfi)
                        .map((note) => {
                            const { title, body } = parseNote(note);
                            const isEditing = editingId === note._id;
                            const isCurrentPage = true;
                            return (
                                <Box key={note._id} sx={{ ...sx.noteCard, ...(isCurrentPage ? sx.noteCardActive : {}) }}>
                                    {isEditing ? (
                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                                            <TextField value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title (optional)" fullWidth size="small" variant="outlined" sx={sx.input} inputProps={{ maxLength: 80 }} />
                                            <TextField value={editBody} onChange={(e) => setEditBody(e.target.value)} multiline minRows={2} maxRows={5} fullWidth size="small" variant="outlined" sx={sx.input} />
                                            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                                                <IconButton size="small" onClick={() => setEditingId(null)} sx={sx.iconBtnGhost}><CloseIcon sx={{ fontSize: "0.8rem" }} /></IconButton>
                                                <IconButton size="small" onClick={() => handleSaveEdit(note._id)} sx={sx.iconBtnCyan}><CheckIcon sx={{ fontSize: "0.8rem" }} /></IconButton>
                                            </Box>
                                        </Box>
                                    ) : (
                                        <>
                                            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 0.5, gap: 1 }}>
                                                <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, gap: 0.4 }}>
                                                    {title && <Typography sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "0.78rem", color: "#e4e4e8" }}>{title}</Typography>}
                                                    {/* currentPageBadge — commented out
                                                {isCurrentPage && (
                                                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, background: "rgba(0,224,255,0.08)", border: "1px solid rgba(0,224,255,0.2)", borderRadius: "4px", px: 0.6, py: 0.1, width: "fit-content" }}>
                                                        <Box sx={{ width: 5, height: 5, borderRadius: "50%", background: "#00e0ff", boxShadow: "0 0 4px rgba(0,224,255,0.8)" }} />
                                                        <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.58rem", color: "#00e0ff", lineHeight: 1.6 }}>current page</Typography>
                                                    </Box>
                                                )}
                                                */}
                                                </Box>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexShrink: 0 }}>
                                                    <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.62rem", color: "#3f3f46", mr: 0.5 }}>{formatDate(note.created_at)}</Typography>
                                                    <Tooltip title="Edit" placement="top">
                                                        <IconButton size="small" onClick={() => startEdit(note)} sx={sx.iconBtnGhost}><EditIcon sx={{ fontSize: "0.75rem" }} /></IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete" placement="top">
                                                        <IconButton size="small" onClick={() => handleDelete(note._id)} sx={sx.iconBtnRed}><DeleteIcon sx={{ fontSize: "0.75rem" }} /></IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Box>
                                            <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.76rem", color: isCurrentPage ? "#c8c8d0" : "#71717a", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{body}</Typography>
                                        </>
                                    )}
                                </Box>
                            );
                        })
                )}
            </Box>
        </Box>
    );
}

const sx = {
    input: {
        "& .MuiOutlinedInput-root": {
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.78rem",
            color: "#c8c8d0",
            background: "rgba(255,255,255,0.02)",
            "& fieldset": { borderColor: "rgba(0,224,255,0.12)" },
            "&:hover fieldset": { borderColor: "rgba(0,224,255,0.25)" },
            "&.Mui-focused fieldset": { borderColor: "rgba(0,224,255,0.45)", borderWidth: "1px" },
        },
        "& .MuiInputBase-input::placeholder": { color: "#3f3f46", opacity: 1 },
    },
    saveBtn: {
        background: "#00e0ff",
        color: "#0a0a0f",
        border: "none",
        borderRadius: "8px",
        px: 2,
        py: 0.6,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.75rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        "&:hover:not(:disabled)": { background: "#33e8ff", boxShadow: "0 0 12px rgba(0,224,255,0.3)" },
        "&:disabled": { opacity: 0.35, cursor: "not-allowed" },
    },
    noteCard: {
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(0,224,255,0.07)",
        borderRadius: "10px",
        px: 1.5,
        py: 1.25,
        transition: "border-color 0.2s",
        "&:hover": { borderColor: "rgba(0,224,255,0.14)" },
    },
    noteCardActive: {
        background: "rgba(0,224,255,0.04)",
        border: "1px solid rgba(0,224,255,0.2)",
        boxShadow: "0 0 12px rgba(0,224,255,0.04)",
    },
    iconBtnGhost: {
        color: "#52525b",
        width: 24, height: 24,
        borderRadius: "6px",
        "&:hover": { color: "#a1a1aa", background: "rgba(255,255,255,0.05)" },
    },
    iconBtnCyan: {
        color: "#00e0ff",
        width: 24, height: 24,
        borderRadius: "6px",
        border: "1px solid rgba(0,224,255,0.25)",
        "&:hover": { background: "rgba(0,224,255,0.1)", borderColor: "rgba(0,224,255,0.5)" },
    },
    iconBtnRed: {
        color: "#52525b",
        width: 24, height: 24,
        borderRadius: "6px",
        "&:hover": { color: "#ff6b6b", background: "rgba(255,107,107,0.06)" },
    },
};