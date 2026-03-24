import { Box, Typography } from "@mui/material";

export default function LlmChat() {
    return (
        <Box
            sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Typography sx={{ color: "#3f3f46", fontSize: "0.8rem" }}>
                AI Chat — coming soon
            </Typography>
        </Box>
    );
}
