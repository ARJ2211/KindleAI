import { IconButton } from "@mui/material";

export default function PageNavButtons({ renditionRef }) {
    const handlePrev = () => {
        renditionRef.current?.prev();
        const loc = renditionRef.current?.currentLocation();
        console.log("[reader] Left click: Previous page", {
            cfi: loc?.start?.cfi || "unknown",
            href: loc?.start?.href || "unknown",
            index: loc?.start?.index || "unknown",
        });
        // TODO: save progress to backend
    };

    const handleNext = () => {
        renditionRef.current?.next();
        const loc = renditionRef.current?.currentLocation();
        console.log("[reader] Right click: Next page", {
            cfi: loc?.start?.cfi || "unknown",
            href: loc?.start?.href || "unknown",
            index: loc?.start?.index || "unknown",
        });
        // TODO: save progress to backend
    };

    return (
        <>
            <IconButton onClick={handlePrev} sx={sx.btn}>
                ‹
            </IconButton>
            <IconButton
                onClick={handleNext}
                sx={{ ...sx.btn, left: "auto", right: 12 }}
            >
                ›
            </IconButton>
        </>
    );
}

const sx = {
    btn: {
        position: "absolute",
        left: 12,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 5,
        color: "#00e0ff",
        fontSize: "1.6rem",
        width: 44,
        height: 44,
        fontFamily: "serif",
        background: "rgba(0, 224, 255, 0.06)",
        border: "1px solid rgba(0, 224, 255, 0.12)",
        borderRadius: "12px",
        backdropFilter: "blur(8px)",
        transition: "all 0.25s ease",
        "&:hover": {
            color: "#fff",
            background: "rgba(0, 224, 255, 0.15)",
            borderColor: "rgba(0, 224, 255, 0.35)",
            boxShadow: "0 0 20px rgba(0, 224, 255, 0.15)",
            transform: "translateY(-50%) scale(1.08)",
        },
    },
};
