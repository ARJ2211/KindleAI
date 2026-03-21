import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";

export default function ReaderPage() {
    const { bookId } = useParams();
    const navigate = useNavigate();

    return (
        <Box sx={styles.page}>
            <Box sx={styles.topBar}>
                <IconButton onClick={() => navigate("/home?tab=My+Books")} sx={styles.backBtn}>
                    <ArrowBackIcon />
                </IconButton>
            </Box>

            <Box sx={styles.center}>
                <AutoStoriesIcon sx={{ fontSize: 64, color: "rgba(0,224,255,0.15)" }} />
                <Typography sx={styles.heading}>EPUB Reader</Typography>
                <Typography sx={styles.sub}>Coming soon</Typography>
                <Typography sx={styles.bookId}>Book ID: {bookId}</Typography>
            </Box>
        </Box>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#050508",
        display: "flex",
        flexDirection: "column",
    },
    topBar: {
        p: 2,
    },
    backBtn: {
        color: "#d4d4d8",
        border: "1px solid rgba(0, 224, 255, 0.1)",
        borderRadius: "8px",
        "&:hover": {
            background: "rgba(0, 224, 255, 0.05)",
            borderColor: "rgba(0, 224, 255, 0.3)",
        },
    },
    center: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
    },
    heading: {
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: "1.5rem",
        color: "#fff",
    },
    sub: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.9rem",
        color: "#52525b",
    },
    bookId: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.65rem",
        color: "#3f3f46",
        mt: 2,
    },
};
