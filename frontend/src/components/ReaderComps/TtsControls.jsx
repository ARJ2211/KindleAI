import { Box, Typography, Tooltip } from "@mui/material";
import { StickyNote2Outlined as NoteIcon } from "@mui/icons-material";


/**
 * TtsControls
 *
 * Props:
 *  - renditionRef   {ref}      existing prop
 *  - currentPageHasNotes  {boolean}  true if current page has notes — green dot, else red
 *  - onNotesClick          {function} called when dot is clicked — toggles modelNotes
 */
export default function TtsControls({ renditionRef, currentPageHasNotes = false, onNotesClick }) {

    return (
        <Box sx={sx.container}>
            {/* Header row: Listen Mode label + notes dot side by side */}
            <Box sx={sx.headerRow}>
                <Typography sx={sx.heading}>Listen Mode</Typography>

                {/* Notes dot indicator */}
                <Tooltip
                    title={currentPageHasNotes ? "Notes on this page" : "No notes on this page"}
                    placement="top"
                >
                    <Box sx={sx.dotWrap} onClick={onNotesClick}>
                        <Box sx={currentPageHasNotes ? sx.dotGreen : sx.dotRed} />
                        <NoteIcon sx={{ fontSize: "0.7rem", color: currentPageHasNotes ? "#4ade80" : "#ff6b6b" }} />
                    </Box>
                </Tooltip>
            </Box>

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
    headerRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    heading: {
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: "0.8rem",
        color: "#e4e4e8",
    },
    dotWrap: {
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        cursor: "pointer",
        px: 0.75,
        py: 0.4,
        borderRadius: "6px",
        border: "1px solid rgba(255,255,255,0.05)",
        transition: "all 0.2s",
        "&:hover": {
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.1)",
        },
    },
    dotGreen: {
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: "#4ade80",
        boxShadow: "0 0 6px rgba(74, 222, 128, 0.6)",
        flexShrink: 0,
    },
    dotRed: {
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: "#ff6b6b",
        boxShadow: "0 0 6px rgba(255, 107, 107, 0.5)",
        flexShrink: 0,
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