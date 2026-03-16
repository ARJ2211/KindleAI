import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { auth } from "../firebase/config.js";
import Button from "@mui/material/Button";

export default function Navbar() {
    const { user } = useAuth();
    const location = useLocation();
    const isLanding = location.pathname === "/";

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
                    <>
                        <Button
                            component={Link}
                            to="/home"
                            className="nav-anchor"
                        >
                            Library
                        </Button>
                    </>
                )}
            </div>

            <div className="lp-nav-links">
                {user ? (
                    <>
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
