import { Box, Typography, Modal, IconButton, Divider } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const issues = [
    {
        index: "01",
        title: "Page Tracking Inconsistencies",
        body: "Page positions are sometimes not tracked accurately. This is a known limitation of epub.js and is not specific to this application. The library can occasionally misreport the current location, especially in books with complex layouts or non-standard chapter structures.",
        ref: {
            label: "futurepress/epub.js#895",
            href: "https://github.com/futurepress/epub.js/issues/895",
        },
    },
    {
        index: "02",
        title: "Notes and Bookmarks May Fail to Save on Untracked Pages",
        body: "If the current page has not been properly resolved by epub.js, saving a note or bookmark may silently fail. This happens because no location can be associated with the entry. The fix is simple: navigate to the next page and come back to the previous one. After that, the page will be correctly identified and both notes and bookmarks will save as expected.",
        ref: {
            label: "futurepress/epub.js#691",
            href: "https://github.com/futurepress/epub.js/issues/691",
        },
    },
    {
        index: "03",
        title: "Resume Position May Have a Small Offset",
        body: "Reading progress is saved accurately as a percentage of the book. However, when reopening a book, epub.js may bring you back to a position that is slightly off from where you left. This is a side effect of the same page tracking issue above. Progress itself is correct and only the visual position may shift by a small amount.",
        ref: {
            label: "futurepress/epub.js#895",
            href: "https://github.com/futurepress/epub.js/issues/895",
        },
    },
];

export default function ReadMeModal({ open, onClose }) {
    return (
        <Modal open={open} onClose={onClose} closeAfterTransition>
            <Box sx={sx.backdrop} onClick={onClose}>
                <Box sx={sx.modal} onClick={(e) => e.stopPropagation()}>
                    <Box sx={sx.header}>
                        <Box>
                            <Typography sx={sx.headerTitle}>
                                Known Limitations
                            </Typography>
                            <Typography sx={sx.headerSub}>
                                Upstream issues in{" "}
                                <Link href="https://github.com/futurepress/epub.js">
                                    epub.js
                                </Link>{" "}
                                that may occasionally affect behaviour.
                            </Typography>
                        </Box>
                        <IconButton onClick={onClose} sx={sx.closeBtn}>
                            <CloseIcon sx={{ fontSize: "0.95rem" }} />
                        </IconButton>
                    </Box>

                    <Divider sx={sx.divider} />

                    <Box sx={sx.issueList}>
                        {issues.map((issue, i) => (
                            <Box key={i} sx={sx.issueRow}>
                                <Typography sx={sx.issueIndex}>
                                    {issue.index}
                                </Typography>
                                <Box sx={sx.issueContent}>
                                    <Typography sx={sx.issueTitle}>
                                        {issue.title}
                                    </Typography>
                                    <Typography sx={sx.issueBody}>
                                        {issue.body}
                                    </Typography>
                                    <Link href={issue.ref.href}>
                                        {issue.ref.label}
                                    </Link>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
}

function Link({ href, children }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                color: "#00c8e0",
                textDecoration: "none",
                fontFamily: "monospace",
                fontSize: "0.72rem",
                opacity: 0.75,
            }}
            onMouseEnter={(e) => (e.target.style.opacity = 1)}
            onMouseLeave={(e) => (e.target.style.opacity = 0.75)}
        >
            {children}
        </a>
    );
}

const sx = {
    backdrop: {
        position: "fixed",
        inset: 0,
        background: "rgba(5,5,8,0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1300,
        p: 2,
    },
    modal: {
        width: "100%",
        maxWidth: 520,
        maxHeight: "85vh",
        overflowY: "auto",
        background: "#0d0d14",
        border: "1px solid rgba(0, 224, 255, 0.1)",
        borderRadius: "12px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
        "&::-webkit-scrollbar": { width: "3px" },
        "&::-webkit-scrollbar-track": { background: "transparent" },
        "&::-webkit-scrollbar-thumb": {
            background: "rgba(0,224,255,0.12)",
            borderRadius: "4px",
        },
    },
    header: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        px: 3,
        pt: 2.5,
        pb: 2,
        gap: 2,
    },
    headerTitle: {
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: "0.95rem",
        color: "#e4e4e8",
        mb: 0.4,
    },
    headerSub: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.75rem",
        color: "#52525b",
        lineHeight: 1.5,
    },
    closeBtn: {
        color: "#3f3f46",
        width: 28,
        height: 28,
        flexShrink: 0,
        mt: 0.25,
        "&:hover": { color: "#a1a1aa", background: "rgba(255,255,255,0.04)" },
    },
    divider: {
        borderColor: "rgba(255,255,255,0.05)",
        mx: 3,
    },
    issueList: {
        display: "flex",
        flexDirection: "column",
        px: 3,
        py: 2.5,
        gap: 3,
    },
    issueRow: {
        display: "flex",
        gap: 2,
    },
    issueIndex: {
        fontFamily: "monospace",
        fontSize: "0.65rem",
        color: "#3f3f46",
        pt: 0.2,
        flexShrink: 0,
        letterSpacing: "0.05em",
    },
    issueContent: {
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
    },
    issueTitle: {
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600,
        fontSize: "0.78rem",
        color: "#c4c4cc",
        letterSpacing: "0.01em",
    },
    issueBody: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.74rem",
        color: "#52525b",
        lineHeight: 1.75,
    },
};
