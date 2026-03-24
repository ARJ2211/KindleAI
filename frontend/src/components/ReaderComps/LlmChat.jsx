import { Box, Typography } from "@mui/material";

export default function LlmChat() {
    return (
        <Box
            sx={{
                width: 360,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderLeft: "1px solid rgba(0, 224, 255, 0.08)",
                background: "#0a0a12",
            }}
        >
            <Typography sx={{ color: "#3f3f46", fontSize: "0.8rem" }}>
                AI Chat — coming soon
            </Typography>
        </Box>
    );
}
