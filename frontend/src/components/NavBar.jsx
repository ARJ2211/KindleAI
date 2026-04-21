import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { auth } from "../firebase/config.js";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

export default function Navbar({ activeTab, onTabChange }) {
    const { user } = useAuth();
    const location = useLocation();
    const isLanding = location.pathname === "/";

    const APP_TABS = ["Global Library", "My Books", "My Reading"];

    return (
        <nav className="lp-nav">
            <Link to="/" className="lp-nav-logo">
                <span className="logo-k">K</span>
                <span className="logo-dot">.</span>
                <span className="logo-ai">AI</span>
            </Link>

            <div className="lp-nav-center">
                {isLanding ? (
                    <>
                        <a href="#features" className="nav-anchor">
                            Features
                        </a>
                        <a href="#how-it-works" className="nav-anchor">
                            How it Works
                        </a>
                        <a href="#in-action" className="nav-anchor">
                            In Action
                        </a>
                    </>
                ) : (
                    APP_TABS.map((tab) => (
                        <Button
                            key={tab}
                            className="nav-btn-ghost"
                            onClick={() => onTabChange(tab)}
                            sx={{
                                color:
                                    activeTab === tab
                                        ? "#00e0ff !important"
                                        : undefined,
                            }}
                        >
                            {tab}
                        </Button>
                    ))
                )}
            </div>

            <div className="lp-nav-links">
                {user ? (
                    <>
                        {!isLanding && (
                            <Typography
                                sx={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: "0.7rem",
                                    color: "#52525b",
                                    letterSpacing: "0.02em",
                                }}
                            >
                                {user.email}
                            </Typography>
                        )}
                        {isLanding && (
                            <Button
                                component={Link}
                                to="/home"
                                className="nav-btn-ghost"
                            >
                                Library
                            </Button>
                        )}
                        <Button
                            onClick={async () => await auth.signOut()}
                            className="nav-btn-primary"
                        >
                            Sign Out
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            component={Link}
                            to="/signin"
                            className="nav-btn-ghost"
                        >
                            Sign In
                        </Button>
                        <Button
                            component={Link}
                            to="/signup"
                            className="nav-btn-primary"
                        >
                            Sign Up
                        </Button>
                    </>
                )}
            </div>
        </nav>
    );
}
