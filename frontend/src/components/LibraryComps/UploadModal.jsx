import { useState, useRef, useCallback } from "react";
import { Box, Typography, Modal, IconButton, Divider } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CircularProgress from "@mui/material/CircularProgress";

const metrics = [
    {
        spec: "MacBook Pro M5 Pro · 24 GB RAM",
        result: "5 books (~200 KB each)",
    },
    {
        spec: "MacBook Pro M4 Pro · 24 GB RAM",
        result: "4 books (~200 KB each)",
    },
    {
        spec: "Windows 11 · AMD Ryzen 5 · 16 GB RAM",
        result: "3 books (~200 KB each)",
    },
    {
        spec: "Windows · 8 GB RAM · 512 GB SSD",
        result: "2 books (~200 KB each)",
    },
];

export default function UploadModal({
    open,
    onClose,
    onFileSelect,
    uploading,
}) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef(null);

    const handleDrop = useCallback(
        (e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file && file.name.endsWith(".epub")) {
                onFileSelect(file);
            }
        },
        [onFileSelect],
    );

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
            e.target.value = "";
        }
    };

    return (
        <Modal
            open={open}
            onClose={uploading ? undefined : onClose}
            closeAfterTransition
        >
            <Box sx={sx.backdrop} onClick={uploading ? undefined : onClose}>
                <Box sx={sx.modal} onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <Box sx={sx.header}>
                        <Typography sx={sx.headerTitle}>
                            Upload a Book
                        </Typography>
                        <IconButton
                            onClick={onClose}
                            sx={sx.closeBtn}
                            disabled={uploading}
                        >
                            <CloseIcon sx={{ fontSize: "0.95rem" }} />
                        </IconButton>
                    </Box>

                    {/* Warning notice */}
                    <Box sx={sx.notice}>
                        <Typography sx={sx.noticeLabel}>
                            Local Instance Notice
                        </Typography>
                        <Typography sx={sx.noticeBody}>
                            If you are running this on localhost, please avoid
                            uploading many books at once. Each upload spawns a
                            Node worker that loads the embedding model fresh
                            into memory. This was done to keep the Express
                            server unblocked since running embeddings purely on
                            network IO (Express.js) was causeing the server to
                            slow down and block any other API calls.
                        </Typography>
                        <Typography sx={sx.noticeBody} mt={1}>
                            The embedding model (
                            <span
                                style={{
                                    color: "#a1a1aa",
                                    fontFamily: "monospace",
                                    fontSize: "0.72rem",
                                }}
                            >
                                Xenova/bge-large-en-v1.5
                            </span>
                            ) is approximately{" "}
                            <span style={{ color: "#a1a1aa" }}>1.34 GB</span>{" "}
                            and is re-loaded into memory for every upload. On
                            machines with limited RAM, back-to-back uploads can
                            cause slowdowns or failures.
                        </Typography>
                    </Box>

                    {/* Metrics table */}
                    <Box sx={sx.metricsBlock}>
                        <Typography sx={sx.metricsLabel}>
                            Tested Performance
                        </Typography>
                        <Box sx={sx.metricsTable}>
                            {metrics.map((m, i) => (
                                <Box key={i} sx={sx.metricsRow}>
                                    <Typography sx={sx.metricSpec}>
                                        {m.spec}
                                    </Typography>
                                    <Typography sx={sx.metricResult}>
                                        {m.result}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    <Divider sx={sx.divider} />

                    {/* Drop zone */}
                    <Box
                        sx={{
                            ...sx.dropZone,
                            ...(dragging ? sx.dropZoneActive : {}),
                            ...(uploading ? sx.dropZoneDisabled : {}),
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            if (!uploading) setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={uploading ? undefined : handleDrop}
                        onClick={() => !uploading && inputRef.current?.click()}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".epub"
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                        />
                        {uploading ? (
                            <>
                                <CircularProgress
                                    size={20}
                                    sx={{ color: "#00e0ff", mb: 1 }}
                                />
                                <Typography sx={sx.dropText}>
                                    Uploading and indexing...
                                </Typography>
                                <Typography sx={sx.dropSub}>
                                    This may take a moment depending on your
                                    machine.
                                </Typography>
                            </>
                        ) : (
                            <>
                                <UploadFileIcon
                                    sx={{
                                        fontSize: "1.4rem",
                                        color: dragging ? "#00e0ff" : "#3f3f46",
                                        mb: 0.75,
                                    }}
                                />
                                <Typography
                                    sx={{
                                        ...sx.dropText,
                                        color: dragging ? "#e4e4e8" : "#71717a",
                                    }}
                                >
                                    {dragging
                                        ? "Drop your EPUB here"
                                        : "Click or drag an EPUB file here"}
                                </Typography>
                                <Typography sx={sx.dropSub}>
                                    .epub files only
                                </Typography>
                            </>
                        )}
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
}

const sx = {
    backdrop: {
        position: "fixed",
        inset: 0,
        background: "rgba(5,5,8,0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1300,
        p: 2,
    },
    modal: {
        width: "100%",
        maxWidth: 520,
        maxHeight: "90vh",
        overflowY: "auto",
        background: "#0d0d14",
        border: "1px solid rgba(0, 224, 255, 0.1)",
        borderRadius: "12px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
        display: "flex",
        flexDirection: "column",
        "&::-webkit-scrollbar": { width: "3px" },
        "&::-webkit-scrollbar-track": { background: "transparent" },
        "&::-webkit-scrollbar-thumb": {
            background: "rgba(0,224,255,0.12)",
            borderRadius: "4px",
        },
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 3,
        pt: 2.5,
        pb: 2,
    },
    headerTitle: {
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: "0.95rem",
        color: "#e4e4e8",
    },
    closeBtn: {
        color: "#3f3f46",
        width: 28,
        height: 28,
        "&:hover": { color: "#a1a1aa", background: "rgba(255,255,255,0.04)" },
    },
    notice: {
        mx: 3,
        mb: 2,
        p: 2,
        background: "rgba(245, 158, 11, 0.04)",
        border: "1px solid rgba(245, 158, 11, 0.12)",
        borderRadius: "8px",
    },
    noticeLabel: {
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600,
        fontSize: "0.7rem",
        color: "#f59e0b",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        mb: 0.75,
    },
    noticeBody: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.74rem",
        color: "#71717a",
        lineHeight: 1.75,
    },
    metricsBlock: {
        mx: 3,
        mb: 2,
    },
    metricsLabel: {
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600,
        fontSize: "0.7rem",
        color: "#3f3f46",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        mb: 1,
    },
    metricsTable: {
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
    },
    metricsRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 0.75,
        px: 1.25,
        borderRadius: "6px",
        background: "rgba(255,255,255,0.02)",
        "&:nth-of-type(odd)": {
            background: "rgba(255,255,255,0.015)",
        },
    },
    metricSpec: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.73rem",
        color: "#71717a",
    },
    metricResult: {
        fontFamily: "monospace",
        fontSize: "0.7rem",
        color: "#a1a1aa",
        flexShrink: 0,
        ml: 2,
    },
    metricsNote: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.68rem",
        color: "#3f3f46",
        mt: 1,
        fontStyle: "italic",
    },
    divider: {
        borderColor: "rgba(255,255,255,0.05)",
        mx: 3,
        mb: 2,
    },
    dropZone: {
        mx: 3,
        mb: 3,
        border: "1px dashed rgba(255,255,255,0.08)",
        borderRadius: "10px",
        py: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.2s",
        gap: 0.25,
        "&:hover": {
            borderColor: "rgba(0,224,255,0.2)",
            background: "rgba(0,224,255,0.02)",
        },
    },
    dropZoneActive: {
        borderColor: "rgba(0,224,255,0.4)",
        background: "rgba(0,224,255,0.04)",
    },
    dropZoneDisabled: {
        cursor: "default",
        opacity: 0.7,
        "&:hover": {
            borderColor: "rgba(255,255,255,0.08)",
            background: "transparent",
        },
    },
    dropText: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.78rem",
        color: "#71717a",
        transition: "color 0.2s",
    },
    dropSub: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.68rem",
        color: "#3f3f46",
        mt: 0.25,
    },
};
