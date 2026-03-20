import { useState } from "react";
import { Box, Typography, IconButton, Tooltip, LinearProgress } from "@mui/material";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";

const DefaultCover = ({ title }) => (
    <Box
        sx={{
            width: "100%",
            aspectRatio: "2/3",
            borderRadius: "6px",
            background: "linear-gradient(145deg, #0c1a2e 0%, #07101f 100%)",
            border: "1px solid rgba(0, 224, 255, 0.1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            px: 2,
        }}
    >
        <AutoStoriesIcon
            sx={{ color: "rgba(0, 224, 255, 0.3)", fontSize: 36 }}
        />
        <Typography
            sx={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "0.7rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.35)",
                textAlign: "center",
                lineHeight: 1.3,
            }}
        >
            {title}
        </Typography>
    </Box>
);

export default function MyBookCard({ book, onFavorite, onRemove }) {
    const [imgError, setImgError] = useState(false);
    const hasCover = book.cover_asset_key && !imgError;

    const progress = book.progress_percent || 0;

    return (
        <Box sx={styles.card}>
            <Box sx={styles.glowTrack} className="glow-track" />

            <Box sx={styles.actions} className="card-actions">
                <Tooltip title={book.favorite ? "Unfavorite" : "Favorite"}>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onFavorite(book);
                        }}
                        sx={styles.favBtn}
                    >
                        {book.favorite ? (
                            <FavoriteIcon sx={{ fontSize: 16 }} />
                        ) : (
                            <FavoriteBorderIcon sx={{ fontSize: 16 }} />
                        )}
                    </IconButton>
                </Tooltip>
                <Tooltip title="Remove from My Books">
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(book);
                        }}
                        sx={styles.removeBtn}
                    >
                        <RemoveCircleOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                </Tooltip>
            </Box>

            {hasCover ? (
                <img
                    src={book.cover_asset_key}
                    alt={book.title}
                    style={styles.coverImg}
                    onError={() => setImgError(true)}
                />
            ) : (
                <DefaultCover title={book.title} />
            )}

            <Box sx={styles.info}>
                <Typography sx={styles.title}>{book.title}</Typography>
                <Typography sx={styles.author}>{book.author}</Typography>

                <Box sx={styles.progressSection}>
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={styles.progressBar}
                    />
                    <Typography sx={styles.progressText}>
                        {progress}% read
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}

const styles = {
    card: {
        position: "relative",
        overflow: "hidden",
        p: 2,
        borderRadius: "12px",
        background: "rgba(255,255,255,0.015)",
        border: "1px solid rgba(0, 224, 255, 0.06)",
        cursor: "pointer",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
            border: "1px solid rgba(0, 224, 255, 0.15)",
            transform: "translateY(-4px)",
            boxShadow:
                "0 12px 40px rgba(0,0,0,0.4), 0 0 30px rgba(0,224,255,0.04)",
        },
        "&:hover .glow-track": {
            opacity: 1,
        },
        "&:hover .card-actions": {
            opacity: 1,
        },
    },
    glowTrack: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "1px",
        background:
            "linear-gradient(90deg, transparent 10%, #00e0ff 50%, transparent 90%)",
        opacity: 0,
        transition: "opacity 0.4s",
    },
    actions: {
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 2,
        display: "flex",
        gap: 0.5,
        opacity: 0,
        transition: "opacity 0.3s",
    },
    favBtn: {
        background: "rgba(255, 80, 120, 0.15)",
        backdropFilter: "blur(8px)",
        color: "#ff5078",
        border: "1px solid rgba(255, 80, 120, 0.2)",
        "&:hover": {
            background: "rgba(255, 80, 120, 0.25)",
        },
    },
    removeBtn: {
        background: "rgba(255, 50, 50, 0.15)",
        backdropFilter: "blur(8px)",
        color: "#ff6b6b",
        border: "1px solid rgba(255, 50, 50, 0.2)",
        "&:hover": {
            background: "rgba(255, 50, 50, 0.25)",
        },
    },
    coverImg: {
        width: "100%",
        aspectRatio: "2/3",
        objectFit: "cover",
        borderRadius: 6,
        display: "block",
    },
    info: {
        mt: 1.5,
        display: "flex",
        flexDirection: "column",
        flex: 1,
    },
    title: {
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: "0.85rem",
        color: "#fff",
        lineHeight: 1.3,
        height: "2.6em",
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
    },
    author: {
        mt: 0.5,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.75rem",
        color: "#52525b",
    },
    progressSection: {
        mt: "auto",
        pt: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
        backgroundColor: "rgba(0, 224, 255, 0.08)",
        "& .MuiLinearProgress-bar": {
            borderRadius: 2,
            background: "linear-gradient(90deg, #00e0ff, #007cf0)",
        },
    },
    progressText: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.55rem",
        color: "#52525b",
        letterSpacing: "0.05em",
    },
};
