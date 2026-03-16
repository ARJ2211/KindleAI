import { createPortal } from "react-dom";
import { Alert } from "@mui/material";

const severityStyles = {
    success: {
        background: "rgba(0, 224, 255, 0.06)",
        border: "1px solid rgba(0, 224, 255, 0.2)",
        color: "#00e0ff",
        "& .MuiAlert-icon": { color: "#00e0ff" },
        "& .MuiAlert-action svg": { color: "#00e0ff" },
    },
    error: {
        background: "rgba(255, 50, 50, 0.06)",
        border: "1px solid rgba(255, 50, 50, 0.2)",
        color: "#ff6b6b",
        "& .MuiAlert-icon": { color: "#ff6b6b" },
        "& .MuiAlert-action svg": { color: "#ff6b6b" },
    },
    warning: {
        background: "rgba(255, 180, 0, 0.06)",
        border: "1px solid rgba(255, 180, 0, 0.2)",
        color: "#ffb400",
        "& .MuiAlert-icon": { color: "#ffb400" },
        "& .MuiAlert-action svg": { color: "#ffb400" },
    },
    info: {
        background: "rgba(123, 47, 255, 0.06)",
        border: "1px solid rgba(123, 47, 255, 0.2)",
        color: "#a78bfa",
        "& .MuiAlert-icon": { color: "#a78bfa" },
        "& .MuiAlert-action svg": { color: "#a78bfa" },
    },
};

export default function AlertPopup({ message, severity = "success", onClose }) {
    if (!message) return null;

    return createPortal(
        <Alert
            severity={severity}
            onClose={onClose}
            sx={{
                position: "fixed",
                bottom: 24,
                left: 24,
                zIndex: 9999,
                minWidth: 280,
                maxWidth: 420,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.85rem",
                borderRadius: "8px",
                backdropFilter: "blur(12px)",
                ...severityStyles[severity],
            }}
        >
            {message}
        </Alert>,
        document.body,
    );
}
