import { Box, Typography, CircularProgress } from "@mui/material";

export default function ReaderLoader({ message }) {
    return (
        <Box sx={sx.container}>
            <Box sx={sx.card}>
                <Box sx={sx.glow} />
                <CircularProgress
                    size={28}
                    thickness={3}
                    sx={{ color: "#00e0ff" }}
                />
                <Typography sx={sx.text}>
                    {message || "Preparing your book…"}
                </Typography>
                <Box sx={sx.dots}>
                    <Box sx={{ ...sx.dot, animationDelay: "0s" }} />
                    <Box sx={{ ...sx.dot, animationDelay: "0.2s" }} />
                    <Box sx={{ ...sx.dot, animationDelay: "0.4s" }} />
                </Box>
            </Box>
        </Box>
    );
}

const sx = {
    container: {
        height: "100vh",
        background: "#050508",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    card: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        px: 5,
        py: 4,
        borderRadius: "16px",
        background: "rgba(10, 10, 18, 0.8)",
        border: "1px solid rgba(0, 224, 255, 0.08)",
        position: "relative",
        overflow: "hidden",
    },
    glow: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "1px",
        background:
            "linear-gradient(90deg, transparent 10%, #00e0ff 50%, transparent 90%)",
        opacity: 0.5,
    },
    text: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.85rem",
        color: "#a1a1aa",
    },
    dots: {
        display: "flex",
        gap: 0.8,
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: "50%",
        background: "#00e0ff",
        opacity: 0.3,
        animation: "pulse 1s ease-in-out infinite",
        "@keyframes pulse": {
            "0%, 100%": { opacity: 0.2, transform: "scale(0.8)" },
            "50%": { opacity: 0.8, transform: "scale(1.2)" },
        },
    },
};
