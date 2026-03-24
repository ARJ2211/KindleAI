import { Box, Typography } from "@mui/material";

export default function TtsControls() {
    return (
        <Box sx={sx.container}>
            <Typography sx={sx.heading}>Listen Mode</Typography>
            <Box sx={sx.controls}>
                <Box
                    sx={sx.btn}
                    onClick={() => console.log("[tts] Play/Pause clicked")}
                >
                    ▶
                </Box>
                <Box
                    sx={sx.btn}
                    onClick={() => console.log("[tts] Stop clicked")}
                >
                    ■
                </Box>
            </Box>
            <Typography sx={sx.status}>TTS — coming soon</Typography>
        </Box>
    );
}

const sx = {
    container: {
        display: "flex",

        flexDirection: "column",
        gap: 1,
        px: 2,
        py: 1.5,
        borderBottom: "1px solid rgba(0, 224, 255, 0.06)",
    },
    heading: {
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: "0.8rem",
        color: "#e4e4e8",
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
        "&:hover": {
            background: "rgba(0, 224, 255, 0.15)",
            borderColor: "rgba(0, 224, 255, 0.35)",
            boxShadow: "0 0 12px rgba(0, 224, 255, 0.1)",
        },
    },
    status: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.7rem",
        color: "#3f3f46",
    },
};
