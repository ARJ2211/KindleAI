import { createPortal } from "react-dom";
import { Alert } from "@mui/material";

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
            }}
        >
            {message}
        </Alert>,
        document.body,
    );
}
