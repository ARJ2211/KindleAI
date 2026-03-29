import {
    Box,
    Typography,
    IconButton,
    TextField,
    CircularProgress,
    Collapse,
    Tooltip,
} from "@mui/material";
import {
    Add as AddIcon,
    Close as CloseIcon,
    Check as CheckIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    StickyNote2Outlined as NoteIcon,
} from "@mui/icons-material";
import { useEffect, useState, useCallback } from "react";
import api from "../../api/axios.js";

/**
 * NotesPanel
 *
 * Props:
 *  - bookId         {string}    from useParams in ReaderPage
 *  - currentCfi     {string}    current epub CFI — passed down from ReaderPage state
 *  - onCountChange  {function}  called with (count, notesArray) whenever notes list changes
 */
export default function NotesPanel({ bookId, currentCfi, onCountChange }) {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [composing, setComposing] = useState(false);
    const [draftTitle, setDraftTitle] = useState("");
    const [draftBody, setDraftBody] = useState("");
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editBody, setEditBody] = useState("");
    const [editTitle, setEditTitle] = useState("");

    // Sync count + list up to parent whenever notes changes
    useEffect(() => {
        onCountChange?.(notes.length, notes);
    }, [notes, onCountChange]);

    // ── Fetch all notes for this book ──────────────────────────────────────
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
        if (bookId) fetchNotes();
    }, [bookId, fetchNotes]);

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
        // Parse stored title prefix if present
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

    // ── Helpers ────────────────────────────────────────────────────────────
    const parseNote = (note) => {
        const match = note.note_text?.match(/^\[(.+?)\]\n([\s\S]*)$/);
        if (match) return { title: match[1], body: match[2] };
        return { title: null, body: note.note_text || "" };
    };

    const formatDate = (d) =>
        new Date(d).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        });

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <Box sx={sx.container}>
            {/* Header */}
            <Box sx={sx.header}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <NoteIcon sx={{ fontSize: "0.9rem", color: "#00e0ff" }} />
                    <Typography sx={sx.heading}>Notes</Typography>
                    {notes.length > 0 && (
                        <Box sx={sx.badge}>{notes.length}</Box>
                    )}
                </Box>
                <Tooltip title="Add note" placement="left">
                    <IconButton
                        size="small"
                        onClick={() => setComposing((p) => !p)}
                        sx={sx.addBtn}
                    >
                        {composing ? (
                            <CloseIcon sx={{ fontSize: "0.85rem" }} />
                        ) : (
                            <AddIcon sx={{ fontSize: "0.85rem" }} />
                        )}
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Compose form */}
            <Collapse in={composing} unmountOnExit>
                <Box sx={sx.composeBox}>
                    <TextField
                        placeholder="Note title (optional)"
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        fullWidth
                        size="small"
                        variant="outlined"
                        sx={sx.input}
                        inputProps={{ maxLength: 80 }}
                    />
                    <TextField
                        placeholder="Write your note…"
                        value={draftBody}
                        onChange={(e) => setDraftBody(e.target.value)}
                        fullWidth
                        multiline
                        minRows={3}
                        maxRows={6}
                        size="small"
                        variant="outlined"
                        sx={sx.input}
                    />
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <Box
                            component="button"
                            onClick={handleCreate}
                            disabled={saving || !draftBody.trim()}
                            sx={sx.saveBtn}
                        >
                            {saving ? (
                                <CircularProgress
                                    size={10}
                                    sx={{ color: "#0a0a0f" }}
                                />
                            ) : (
                                "Save note"
                            )}
                        </Box>
                    </Box>
                </Box>
            </Collapse>

            {/* Notes list */}
            <Box sx={sx.list}>
                {loading ? (
                    <Box sx={sx.emptyState}>
                        <CircularProgress
                            size={18}
                            sx={{ color: "#52525b" }}
                        />
                    </Box>
                ) : notes.length === 0 ? (
                    <Box sx={sx.emptyState}>
                        <NoteIcon
                            sx={{ fontSize: "1.6rem", color: "#27272a" }}
                        />
                        <Typography sx={sx.emptyText}>
                            No notes yet
                        </Typography>
                    </Box>
                ) : (
                    notes.map((note) => {
                        const { title, body } = parseNote(note);
                        const isEditing = editingId === note._id;

                        return (
                            <Box key={note._id} sx={sx.noteCard}>
                                {isEditing ? (
                                    /* Edit mode */
                                    <Box sx={sx.editBox}>
                                        <TextField
                                            value={editTitle}
                                            onChange={(e) =>
                                                setEditTitle(e.target.value)
                                            }
                                            placeholder="Title (optional)"
                                            fullWidth
                                            size="small"
                                            variant="outlined"
                                            sx={sx.input}
                                            inputProps={{ maxLength: 80 }}
                                        />
                                        <TextField
                                            value={editBody}
                                            onChange={(e) =>
                                                setEditBody(e.target.value)
                                            }
                                            multiline
                                            minRows={2}
                                            maxRows={5}
                                            fullWidth
                                            size="small"
                                            variant="outlined"
                                            sx={sx.input}
                                        />
                                        <Box
                                            sx={{
                                                display: "flex",
                                                gap: 1,
                                                justifyContent: "flex-end",
                                            }}
                                        >
                                            <IconButton
                                                size="small"
                                                onClick={() =>
                                                    setEditingId(null)
                                                }
                                                sx={sx.iconBtnGhost}
                                            >
                                                <CloseIcon
                                                    sx={{ fontSize: "0.8rem" }}
                                                />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() =>
                                                    handleSaveEdit(note._id)
                                                }
                                                sx={sx.iconBtnCyan}
                                            >
                                                <CheckIcon
                                                    sx={{ fontSize: "0.8rem" }}
                                                />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                ) : (
                                    /* Read mode */
                                    <>
                                        <Box sx={sx.noteTopRow}>
                                            {title && (
                                                <Typography sx={sx.noteTitle}>
                                                    {title}
                                                </Typography>
                                            )}
                                            <Box sx={sx.noteActions}>
                                                <Typography sx={sx.noteDate}>
                                                    {formatDate(note.created_at)}
                                                </Typography>
                                                <Tooltip
                                                    title="Edit"
                                                    placement="top"
                                                >
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            startEdit(note)
                                                        }
                                                        sx={sx.iconBtnGhost}
                                                    >
                                                        <EditIcon
                                                            sx={{
                                                                fontSize:
                                                                    "0.75rem",
                                                            }}
                                                        />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip
                                                    title="Delete"
                                                    placement="top"
                                                >
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            handleDelete(
                                                                note._id,
                                                            )
                                                        }
                                                        sx={sx.iconBtnRed}
                                                    >
                                                        <DeleteIcon
                                                            sx={{
                                                                fontSize:
                                                                    "0.75rem",
                                                            }}
                                                        />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                        <Typography sx={sx.noteBody}>
                                            {body}
                                        </Typography>
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
    container: {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
        minHeight: 0,
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        py: 1.25,
        borderBottom: "1px solid rgba(0, 224, 255, 0.06)",
        flexShrink: 0,
    },
    heading: {
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: "0.8rem",
        color: "#e4e4e8",
    },
    badge: {
        background: "rgba(0, 224, 255, 0.1)",
        border: "1px solid rgba(0, 224, 255, 0.18)",
        borderRadius: "6px",
        px: 0.75,
        py: 0.1,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.65rem",
        color: "#00e0ff",
        lineHeight: 1.6,
    },
    addBtn: {
        color: "#00e0ff",
        border: "1px solid rgba(0, 224, 255, 0.18)",
        borderRadius: "8px",
        width: 28,
        height: 28,
        "&:hover": {
            background: "rgba(0, 224, 255, 0.08)",
            borderColor: "rgba(0, 224, 255, 0.4)",
        },
    },
    composeBox: {
        px: 2,
        py: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        borderBottom: "1px solid rgba(0, 224, 255, 0.06)",
        background: "rgba(0, 224, 255, 0.02)",
        flexShrink: 0,
    },
    input: {
        "& .MuiOutlinedInput-root": {
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.78rem",
            color: "#c8c8d0",
            background: "rgba(255,255,255,0.02)",
            "& fieldset": {
                borderColor: "rgba(0, 224, 255, 0.12)",
            },
            "&:hover fieldset": {
                borderColor: "rgba(0, 224, 255, 0.25)",
            },
            "&.Mui-focused fieldset": {
                borderColor: "rgba(0, 224, 255, 0.45)",
                borderWidth: "1px",
            },
        },
        "& .MuiInputBase-input::placeholder": {
            color: "#3f3f46",
            opacity: 1,
        },
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
        "&:hover:not(:disabled)": {
            background: "#33e8ff",
            boxShadow: "0 0 12px rgba(0, 224, 255, 0.3)",
        },
        "&:disabled": {
            opacity: 0.35,
            cursor: "not-allowed",
        },
    },
    list: {
        flex: 1,
        overflowY: "auto",
        py: 1,
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        px: 1.5,
        "&::-webkit-scrollbar": { width: "4px" },
        "&::-webkit-scrollbar-track": { background: "transparent" },
        "&::-webkit-scrollbar-thumb": {
            background: "rgba(0, 224, 255, 0.12)",
            borderRadius: "2px",
        },
    },
    emptyState: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        py: 4,
    },
    emptyText: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.75rem",
        color: "#3f3f46",
    },
    noteCard: {
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(0, 224, 255, 0.07)",
        borderRadius: "10px",
        px: 1.5,
        py: 1.25,
        transition: "border-color 0.2s",
        "&:hover": {
            borderColor: "rgba(0, 224, 255, 0.14)",
        },
    },
    noteTopRow: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        mb: 0.5,
        gap: 1,
    },
    noteTitle: {
        fontFamily: "'Syne', sans-serif",
        fontWeight: 600,
        fontSize: "0.78rem",
        color: "#e4e4e8",
        flex: 1,
        minWidth: 0,
    },
    noteActions: {
        display: "flex",
        alignItems: "center",
        gap: 0.25,
        flexShrink: 0,
    },
    noteDate: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.62rem",
        color: "#3f3f46",
        mr: 0.5,
    },
    noteBody: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.76rem",
        color: "#a1a1aa",
        lineHeight: 1.6,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
    },
    editBox: {
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
    },
    iconBtnGhost: {
        color: "#52525b",
        width: 24,
        height: 24,
        borderRadius: "6px",
        "&:hover": { color: "#a1a1aa", background: "rgba(255,255,255,0.05)" },
    },
    iconBtnCyan: {
        color: "#00e0ff",
        width: 24,
        height: 24,
        borderRadius: "6px",
        border: "1px solid rgba(0, 224, 255, 0.25)",
        "&:hover": {
            background: "rgba(0, 224, 255, 0.1)",
            borderColor: "rgba(0, 224, 255, 0.5)",
        },
    },
    iconBtnRed: {
        color: "#52525b",
        width: 24,
        height: 24,
        borderRadius: "6px",
        "&:hover": { color: "#ff6b6b", background: "rgba(255,107,107,0.06)" },
    },
};