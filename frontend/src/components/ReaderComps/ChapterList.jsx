import { Box, Typography } from "@mui/material";

export default function ChapterList({ toc, onSelect }) {
    return (
        <Box sx={sx.container}>
            <Typography sx={sx.heading}>Chapters</Typography>
            <Box sx={sx.list}>
                {toc.map((item, i) => (
                    <Box
                        key={item.id || i}
                        onClick={() => onSelect(item.href)}
                        sx={sx.item}
                    >
                        <Typography sx={sx.label}>
                            {item.label?.trim()}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

const sx = {
    container: {
        width: 240,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "#0c0c14",
        borderRight: "1px solid rgba(0, 224, 255, 0.08)",
        overflowY: "auto",
    },
    heading: {
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: "0.8rem",
        color: "#e4e4e8",
        px: 2,
        py: 1.5,
        borderBottom: "1px solid rgba(0, 224, 255, 0.06)",
    },
    list: {
        flex: 1,
        overflowY: "auto",
        py: 1,
    },
    item: {
        px: 2,
        py: 1,
        cursor: "pointer",
        transition: "background 0.2s",
        "&:hover": {
            background: "rgba(0, 224, 255, 0.05)",
        },
    },
    label: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.78rem",
        color: "#a1a1aa",
    },
};
