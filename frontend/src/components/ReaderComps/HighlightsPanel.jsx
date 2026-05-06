import React, { useState } from "react";
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
  Highlight as HighlightIcon,
} from "@mui/icons-material";

const HighlightsPanel = ({ open, onClose, onNavigate, onRemoved, highlights }) => {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id, cfi) => {
    setDeletingId(id);
    try {
      await api.delete(`/annotation/single/${id}`);
      onRemoved?.(cfi, id);
    } catch (error) {
      console.warn("[highlights] Delete failed:", error.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (!open) return null;

  return (
    <Box sx={sx.backdrop} onClick={onClose}>
      <Box sx={sx.panel} onClick={(e) => e.stopPropagation()}>
        <Box sx={sx.header}>
          <HighlightIcon sx={{ fontSize: 15, color: "#a78bfa" }} />
          <Typography sx={sx.title}>Highlights</Typography>
          <IconButton size="small" onClick={onClose} sx={sx.closeBtn}>
            <CloseIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Box>

        {highlights.length === 0 ? (
          <Box sx={sx.centered}>
            <Typography sx={sx.emptyText}>No highlights yet</Typography>
          </Box>
        ) : (
          <Box sx={sx.list}>
            {highlights.map((h) => (
              <Box key={h._id} sx={sx.item}>
                <Box
                  sx={sx.itemLeft}
                  onClick={() => {
                    onNavigate?.(h.chapter);
                    onClose();
                  }}
                >
                  <Box sx={sx.strip} />
                  <Box sx={sx.itemContent}>
                    <Typography sx={sx.itemText} noWrap>
                      &ldquo;{h.selected_text}&rdquo;
                    </Typography>
                    <Typography sx={sx.itemDate}>
                      {new Date(h.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Typography>
                  </Box>
                </Box>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    disabled={deletingId === h._id.toString()}
                    onClick={() => handleDelete(h._id.toString(), h.chapter)}
                    sx={sx.deleteBtn}
                  >
                    {deletingId === h._id.toString() ? (
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

export default HighlightsPanel;

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
    width: 300,
    maxHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(145deg, #101018 0%, #0a0a12 100%)",
    border: "1px solid rgba(167, 139, 250, 0.2)",
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
    borderBottom: "1px solid rgba(167, 139, 250, 0.08)",
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
    px: 1.5,
    py: 1.25,
    gap: 1,
    borderBottom: "1px solid rgba(255,255,255,0.03)",
    transition: "background 0.15s",
    "&:hover": { background: "rgba(167, 139, 250, 0.04)" },
  },
  itemLeft: {
    display: "flex",
    alignItems: "center",
    gap: 1,
    flex: 1,
    minWidth: 0,
    cursor: "pointer",
  },
  strip: {
    width: 3,
    height: 32,
    borderRadius: "2px",
    background: "rgba(167, 139, 250, 0.6)",
    flexShrink: 0,
  },
  itemContent: {
    minWidth: 0,
    flex: 1,
  },
  itemText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.72rem",
    color: "#c4b5fd",
    lineHeight: 1.4,
  },
  itemDate: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.62rem",
    color: "#52525b",
    mt: 0.25,
  },
  deleteBtn: {
    color: "#52525b",
    flexShrink: 0,
    "&:hover": { color: "#ff6b6b" },
  },
};
