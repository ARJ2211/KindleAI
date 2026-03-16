import { useState } from "react";
import {
    Box,
    Button,
    TextField,
    Chip,
    CircularProgress,
    InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

export default function LibraryBar({
    onUpload,
    uploading,
    filters,
    onFilterChange,
}) {
    const [searchText, setSearchText] = useState("");

    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
        onFilterChange({ ...filters, search: e.target.value });
    };

    const toggleFilter = (key) => {
        onFilterChange({ ...filters, [key]: !filters[key] });
    };

    return (
        <Box sx={styles.bar}>
            <TextField
                placeholder="Search by title or author..."
                size="small"
                value={searchText}
                onChange={handleSearchChange}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon
                                sx={{ color: "#52525b", fontSize: 20 }}
                            />
                        </InputAdornment>
                    ),
                }}
                autoComplete="off"
                sx={styles.search}
            />

            <Box sx={styles.chips}>
                <Chip
                    label="AI Ready"
                    size="small"
                    onClick={() => toggleFilter("aiReady")}
                    sx={filters.aiReady ? styles.chipActive : styles.chip}
                />
                <Chip
                    label="TTS Ready"
                    size="small"
                    onClick={() => toggleFilter("ttsReady")}
                    sx={filters.ttsReady ? styles.chipActive : styles.chip}
                />
            </Box>

            <Button
                variant="contained"
                component="label"
                disabled={uploading}
                startIcon={
                    uploading ? (
                        <CircularProgress size={16} sx={{ color: "#fff" }} />
                    ) : (
                        <CloudUploadIcon sx={{ fontSize: 18 }} />
                    )
                }
                sx={styles.uploadBtn}
            >
                {uploading ? "Uploading..." : "Upload EPUB"}
                <input type="file" accept=".epub" hidden onChange={onUpload} />
            </Button>
        </Box>
    );
}

const styles = {
    bar: {
        display: "flex",
        alignItems: "center",
        gap: 2,
        mb: 4,
        flexWrap: "wrap",
    },
    search: {
        flex: 1,
        minWidth: 220,
        "& .MuiOutlinedInput-root": {
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.85rem",
            color: "#d4d4d8",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "8px",
            "& fieldset": {
                borderColor: "rgba(0, 224, 255, 0.08)",
            },
            "&:hover fieldset": {
                borderColor: "rgba(0, 224, 255, 0.2)",
            },
            "&.Mui-focused fieldset": {
                borderColor: "#00e0ff",
                borderWidth: "1px",
            },
        },
    },
    chips: {
        display: "flex",
        gap: 1,
    },
    chip: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.65rem",
        letterSpacing: "0.04em",
        color: "#52525b",
        borderColor: "rgba(255,255,255,0.06)",
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.06)",
        cursor: "pointer",
        "&:hover": {
            borderColor: "rgba(0, 224, 255, 0.2)",
            background: "rgba(0, 224, 255, 0.03)",
        },
    },
    chipActive: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.65rem",
        letterSpacing: "0.04em",
        color: "#00e0ff",
        background: "rgba(0, 224, 255, 0.06)",
        border: "1px solid rgba(0, 224, 255, 0.2)",
        cursor: "pointer",
        "&:hover": {
            background: "rgba(0, 224, 255, 0.1)",
        },
    },
    uploadBtn: {
        fontFamily: "'Syne', sans-serif",
        fontWeight: 600,
        fontSize: "0.75rem",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "#fff",
        background: "linear-gradient(135deg, #00e0ff, #7b2fff)",
        borderRadius: "8px",
        px: 3,
        whiteSpace: "nowrap",
        boxShadow:
            "0 0 20px rgba(0,224,255,0.1), 0 0 40px rgba(123,47,255,0.06)",
        "&:hover": {
            boxShadow:
                "0 0 30px rgba(0,224,255,0.2), 0 0 60px rgba(123,47,255,0.1)",
        },
        "&.Mui-disabled": {
            background: "rgba(255,255,255,0.05)",
            color: "#52525b",
        },
    },
};
