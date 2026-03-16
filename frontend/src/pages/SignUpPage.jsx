import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config.js";
import { Box, TextField, Button, Typography, Alert } from "@mui/material";
import axios from "axios";

const API = "http://localhost:3000";

export default function SignUpPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setSubmitting(true);

        try {
            if (password !== confirmPassword) {
                setError("Passwords do not match.");
                setSubmitting(false);
                return;
            }

            await axios.post(`${API}/user/signup`, {
                email,
                password,
                confirmPassword,
                displayName,
            });

            setSuccess("Account created! Redirecting to sign in...");
            setTimeout(() => navigate("/signin"), 2000);
        } catch (err) {
            setError(err.response?.data?.msg || err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box sx={styles.page}>
            <Box sx={styles.grain} />
            <Box sx={styles.vignette} />

            <Box sx={styles.card}>
                <Box sx={styles.glowTop} />

                <Link to="/" style={{ textDecoration: "none" }}>
                    <Typography sx={styles.logo}>
                        <span style={{ color: "#fff" }}>Kindle</span>
                        <span style={{ color: "#00e0ff" }}>AI</span>
                    </Typography>
                </Link>

                <Typography sx={styles.subtitle}>Join the library</Typography>

                <Box component="form" onSubmit={handleSubmit} sx={styles.form}>
                    <TextField
                        fullWidth
                        label="Display Name"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                        variant="outlined"
                        sx={styles.input}
                        autoComplete="off"
                    />

                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        variant="outlined"
                        sx={styles.input}
                        autoComplete="off"
                    />

                    <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        variant="outlined"
                        sx={styles.input}
                        autoComplete="off"
                    />

                    <TextField
                        fullWidth
                        label="Confirm Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        variant="outlined"
                        sx={styles.input}
                        autoComplete="off"
                    />

                    {error && (
                        <Alert severity="error" sx={styles.alert}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={styles.successAlert}>
                            {success}
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        fullWidth
                        disabled={submitting || success}
                        sx={styles.submitBtn}
                    >
                        {submitting ? "Creating account..." : "Sign Up"}
                    </Button>
                </Box>

                <Typography sx={styles.footerText}>
                    Already have an account?{" "}
                    <Link to="/signin" style={styles.link}>
                        Sign In
                    </Link>
                </Typography>
            </Box>
        </Box>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050508",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
    },
    grain: {
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.025,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "200px",
    },
    vignette: {
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(5,5,8,0.75) 100%)",
    },
    card: {
        position: "relative",
        zIndex: 2,
        width: "100%",
        maxWidth: 420,
        mx: "auto",
        p: "48px 36px",
        background: "rgba(255,255,255,0.015)",
        border: "1px solid rgba(0, 224, 255, 0.08)",
        borderRadius: "16px",
        backdropFilter: "blur(20px)",
        overflow: "hidden",
    },
    glowTop: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "1px",
        background:
            "linear-gradient(90deg, transparent 10%, #00e0ff 50%, transparent 90%)",
        opacity: 0.6,
    },
    logo: {
        fontFamily: "'Syne', sans-serif",
        fontWeight: 800,
        fontSize: "1.8rem",
        textAlign: "center",
        mb: 1,
    },
    subtitle: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.75rem",
        color: "#52525b",
        textAlign: "center",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        mb: 4,
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
    },
    input: {
        "& .MuiOutlinedInput-root": {
            fontFamily: "'DM Sans', sans-serif",
            color: "#d4d4d8",
            "& fieldset": {
                borderColor: "rgba(0, 224, 255, 0.08)",
            },
            "&:hover fieldset": {
                borderColor: "rgba(0, 224, 255, 0.2)",
            },
            "&.Mui-focused fieldset": {
                borderColor: "#00e0ff",
                borderWidth: "1px",
            },
        },
        "& .MuiInputLabel-root": {
            fontFamily: "'DM Sans', sans-serif",
            color: "#52525b",
            "&.Mui-focused": {
                color: "#00e0ff",
            },
        },
    },
    alert: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.85rem",
        background: "rgba(255, 50, 50, 0.08)",
        border: "1px solid rgba(255, 50, 50, 0.15)",
        color: "#ff6b6b",
        "& .MuiAlert-icon": {
            color: "#ff6b6b",
        },
    },
    submitBtn: {
        mt: 1,
        py: 1.5,
        fontFamily: "'Syne', sans-serif",
        fontWeight: 600,
        fontSize: "0.85rem",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: "#fff",
        background: "linear-gradient(135deg, #00e0ff, #7b2fff)",
        borderRadius: "8px",
        boxShadow:
            "0 0 30px rgba(0,224,255,0.15), 0 0 60px rgba(123,47,255,0.08)",
        "&:hover": {
            boxShadow:
                "0 0 50px rgba(0,224,255,0.3), 0 0 100px rgba(123,47,255,0.15)",
        },
        "&.Mui-disabled": {
            background: "rgba(255,255,255,0.05)",
            color: "#52525b",
        },
    },
    footerText: {
        mt: 4,
        textAlign: "center",
        fontSize: "0.85rem",
        color: "#52525b",
        fontFamily: "'DM Sans', sans-serif",
    },
    link: {
        color: "#00e0ff",
        textDecoration: "none",
        fontWeight: 500,
        fontFamily: "'Syne', sans-serif",
    },
    successAlert: {
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.85rem",
        background: "rgba(0, 224, 255, 0.06)",
        border: "1px solid rgba(0, 224, 255, 0.15)",
        color: "#00e0ff",
        "& .MuiAlert-icon": {
            color: "#00e0ff",
        },
    },
};
