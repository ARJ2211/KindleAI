import React, { useCallback, useEffect, useState } from "react";
import api from "../../api/axios.js";
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  BookmarkAdd as BookmarkAddIcon,
  BookmarkBorder as BookmarkIcon,
} from "@mui/icons-material";

const BookmarksPanel = ({ bookId, currentCfi, open, onClose, onNavigate }) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchBookmarks = useCallback(async () => {
    if (!bookId) {
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/annotation/${bookId}?type=bookmark`);
      setBookmarks(res.data || []);
    } catch (error) {
      console.warn("[bookmarks] Failed to load:", error.message);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    if (open) {
      fetchBookmarks();
    }
  }, [open, fetchBookmarks]);

  const handleAdd = async () => {
    if (!currentCfi || adding) {
      return;
    }
    setAdding(true);
    try {
      const res = await api.post(`/annotation/${bookId}`, {
        type: "bookmark",
        chapter: currentCfi,
      });
      setBookmarks((prev) => [...prev, res.data]);
    } catch (error) {
      console.warn("[bookmarks] Add failed:", error.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/annotation/single/${id}`);
      setBookmarks((prev) => prev.filter((b) => b._id.toString() !== id));
    } catch (error) {
      console.warn("[bookmarks] Delete failed:", error.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <Box sx={sx.backdrop} onClick={onClose}>
      <Box sx={sx.panel} onClick={(e) => e.stopPropagation()}>
        <Box sx={sx.header}>
          <BookmarkIcon sx={{ fontSize: 15, color: "#fbbf24" }} />
          <Typography sx={sx.title}>Bookmarks</Typography>
          <IconButton size="small" onClick={onClose} sx={sx.closeBtn}>
            <CloseIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Box>

        <Box sx={sx.addRow}>
          <Box
            sx={adding ? { ...sx.addBtn, ...sx.addBtnDisabled } : sx.addBtn}
            onClick={handleAdd}
          >
            {adding ? (
              <CircularProgress size={12} sx={{ color: "#fbbf24" }} />
            ) : (
              <BookmarkAddIcon sx={{ fontSize: 14, color: "#fbbf24" }} />
            )}
            <Typography sx={sx.addLabel}>
              {adding ? "Saving…" : "Bookmark this page"}
            </Typography>
          </Box>
        </Box>

        {loading ? (
          <Box sx={sx.centered}>
            <CircularProgress size={20} sx={{ color: "#fbbf24" }} />
          </Box>
        ) : bookmarks.length === 0 ? (
          <Box sx={sx.centered}>
            <Typography sx={sx.emptyText}>No bookmarks yet</Typography>
          </Box>
        ) : (
          <Box sx={sx.list}>
            {bookmarks.map((b, i) => (
              <Box key={b._id} sx={sx.item}>
                <Box
                  sx={sx.itemLeft}
                  onClick={() => {
                    onNavigate?.(b.chapter);
                    onClose();
                  }}
                >
                  <Typography sx={sx.itemNum}>{i + 1}</Typography>
                  <Typography sx={sx.itemDate}>
                    {new Date(b.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {" . "}
                    {new Date(b.created_at).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                </Box>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    disabled={deletingId === b._id.toString()}
                    onClick={() => handleDelete(b._id.toString())}
                    sx={sx.deleteBtn}
                  >
                    {deletingId === b._id.toString() ? (
                      <CircularProgress size={12} />
                    ) : (
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default BookmarksPanel;

const sx = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 1300,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    pt: "52px",
    pr: 1.5,
  },
  panel: {
    width: 290,
    maxHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(145deg, #101018 0%, #0a0a12 100%)",
    border: "1px solid rgba(251, 191, 36, 0.2)",
    borderRadius: "14px",
    boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 1,
    px: 2,
    py: 1.25,
    borderBottom: "1px solid rgba(251, 191, 36, 0.08)",
    flexShrink: 0,
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: "0.8rem",
    color: "#e4e4e8",
    flex: 1,
  },
  closeBtn: {
    color: "#52525b",
    "&:hover": { color: "#e4e4e8" },
  },
  addRow: {
    px: 1.5,
    py: 1,
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    flexShrink: 0,
  },
  addBtn: {
    display: "flex",
    alignItems: "center",
    gap: 1,
    px: 1.5,
    py: 0.75,
    borderRadius: "8px",
    border: "1px solid rgba(251, 191, 36, 0.2)",
    background: "rgba(251, 191, 36, 0.04)",
    cursor: "pointer",
    transition: "all 0.2s",
    "&:hover": {
      background: "rgba(251, 191, 36, 0.1)",
      borderColor: "rgba(251, 191, 36, 0.4)",
    },
  },
  addBtnDisabled: {
    opacity: 0.5,
    cursor: "default",
    "&:hover": {
      background: "rgba(251, 191, 36, 0.04)",
      borderColor: "rgba(251, 191, 36, 0.2)",
    },
  },
  addLabel: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.75rem",
    color: "#fbbf24",
  },
  centered: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    py: 4,
  },
  emptyText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.75rem",
    color: "#52525b",
  },
  list: {
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    px: 2,
    py: 1.25,
    gap: 1,
    borderBottom: "1px solid rgba(255,255,255,0.03)",
    transition: "background 0.15s",
    "&:hover": { background: "rgba(251, 191, 36, 0.03)" },
  },
  itemLeft: {
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    flex: 1,
    minWidth: 0,
    cursor: "pointer",
  },
  itemNum: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    color: "#fbbf24",
    width: 14,
    flexShrink: 0,
  },
  itemDate: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.72rem",
    color: "#a1a1aa",
  },
  deleteBtn: {
    color: "#52525b",
    flexShrink: 0,
    "&:hover": { color: "#ff6b6b" },
  },
};
