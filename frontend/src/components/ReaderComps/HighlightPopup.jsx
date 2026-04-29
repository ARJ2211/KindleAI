import React from "react";
import { Box, Typography } from "@mui/material";

const HighlightPopup = ({ selection, onConfirm, onDismiss, onRemove, saving, highlights }) => {
  if (!selection) {
    return null;
  }
  const isHighlighted = highlights?.some((h) => h.chapter === selection.cfi);
  return (
    <Box sx={sx.wrap}>
      <Typography sx={sx.preview} noWrap>
        &ldquo;
        {selection.text.length > 50
          ? selection.text.slice(0, 50) + "…"
          : selection.text}
        &rdquo;
      </Typography>
      <Box sx={sx.actions}>
        {isHighlighted ? (
          <Box sx={{ ...sx.btn, ...sx.btnRemove }} onClick={onRemove}>
            Remove
          </Box>
        ) : (
          <Box sx={saving ? { ...sx.btn, ...sx.btnOff } : sx.btn} onClick={saving ? undefined : onConfirm}>
            {saving ? "Saving..." : "Highlight"}
          </Box>
        )}
        <Box sx={sx.cancel} onClick={onDismiss}>✕</Box>
      </Box>
    </Box>
  );
};

export default HighlightPopup;

const sx = {
  wrap: {
    position: "fixed",
    bottom: 28,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1400,
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    px: 2,
    py: 1,
    background: "#050508",
    border: "1px solid rgba(167, 139, 250, 0.45)",
    borderRadius: "12px",
    boxShadow: "0 12px 40px rgba(0,0,0,0.85), 0 0 24px rgba(167,139,250,0.12)",
    maxWidth: 440,
    minWidth: 260,
  },
  preview: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.72rem",
    color: "#a1a1aa",
    flex: 1,
    minWidth: 0,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 0.75,
    flexShrink: 0,
  },
  btn: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.72rem",
    color: "#a78bfa",
    px: 1.25,
    py: 0.5,
    borderRadius: "8px",
    border: "1px solid rgba(167, 139, 250, 0.4)",
    background: "rgba(167, 139, 250, 0.1)",
    cursor: "pointer",
    whiteSpace: "nowrap",
    userSelect: "none",
    "&:hover": {
      background: "rgba(167, 139, 250, 0.22)",
    },
  },
  btnOff: {
    opacity: 0.45,
    cursor: "default",
    "&:hover": { background: "rgba(167, 139, 250, 0.1)" },
  },
  btnRemove: {
    color: "#ff6b6b",
    border: "1px solid rgba(255, 107, 107, 0.35)",
    background: "rgba(255, 107, 107, 0.08)",
    "&:hover": { background: "rgba(255, 107, 107, 0.18)" },
  },
  cancel: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.7rem",
    color: "#52525b",
    px: 0.75,
    py: 0.5,
    borderRadius: "8px",
    cursor: "pointer",
    userSelect: "none",
    "&:hover": { color: "#a1a1aa" },
  },
};
