import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import "../css/LandingPage.css";

gsap.registerPlugin(ScrollTrigger);

/* ━━━ TEXT SCRAMBLE ━━━ */
function useTextScramble(finalText, trigger = true, speed = 25) {
    const [display, setDisplay] = useState("");
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*!<>{}[]";
    useEffect(() => {
        if (!trigger) return;
        let iteration = 0;
        const interval = setInterval(() => {
            setDisplay(
                finalText
                    .split("")
                    .map((c, i) =>
                        i < iteration
                            ? c
                            : chars[Math.floor(Math.random() * chars.length)],
                    )
                    .join(""),
            );
            iteration += 1 / 3;
            if (iteration >= finalText.length) {
                setDisplay(finalText);
                clearInterval(interval);
            }
        }, speed);
        return () => clearInterval(interval);
    }, [trigger, finalText]);
    return display;
}

/* ━━━ NETWORK CANVAS ━━━ */
function NetworkCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        let animId;
        let nodes = [];
        const MOUSE = { x: -9999, y: -9999 };

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height =
                document.documentElement.scrollHeight || window.innerHeight * 4;
        }
        resize();
        window.addEventListener("resize", resize);

        const nodeCount = Math.floor((canvas.width * canvas.height) / 18000);
        for (let i = 0; i < nodeCount; i++) {
            nodes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                r: 0.8 + Math.random() * 1.5,
                pulse: Math.random() * Math.PI * 2,
                hue: Math.random() > 0.7 ? 270 : 187,
            });
        }

        function handleMouse(e) {
            MOUSE.x = e.clientX;
            MOUSE.y = e.clientY + window.scrollY;
        }
        window.addEventListener("mousemove", handleMouse);

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < nodes.length; i++) {
                const a = nodes[i];
                a.x += a.vx;
                a.y += a.vy;
                a.pulse += 0.015;
                if (a.x < 0 || a.x > canvas.width) a.vx *= -1;
                if (a.y < 0 || a.y > canvas.height) a.vy *= -1;
                const dm = Math.hypot(a.x - MOUSE.x, a.y - MOUSE.y);
                if (dm < 150) {
                    a.vx += ((a.x - MOUSE.x) / dm) * 0.08;
                    a.vy += ((a.y - MOUSE.y) / dm) * 0.08;
                }
                a.vx *= 0.999;
                a.vy *= 0.999;
                const glow = 0.35 + Math.sin(a.pulse) * 0.3;
                const isCyan = a.hue === 187;
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
                ctx.fillStyle = isCyan
                    ? `rgba(0,224,255,${glow})`
                    : `rgba(123,47,255,${glow * 0.8})`;
                ctx.shadowColor = isCyan
                    ? "rgba(0,224,255,0.3)"
                    : "rgba(123,47,255,0.3)";
                ctx.shadowBlur = 6;
                ctx.fill();
                ctx.shadowBlur = 0;
                for (let j = i + 1; j < nodes.length; j++) {
                    const b = nodes[j];
                    const d = Math.hypot(a.x - b.x, a.y - b.y);
                    if (d < 140) {
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = `rgba(0,224,255,${0.06 * (1 - d / 140)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            animId = requestAnimationFrame(draw);
        }
        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMouse);
        };
    }, []);

    return <canvas ref={canvasRef} className="network-canvas" />;
}

/* ━━━ MAGNETIC BUTTON ━━━ */
function MagneticButton({ children, component, to, className, variant, size }) {
    const ref = useRef(null);
    const handleMove = useCallback((e) => {
        const btn = ref.current;
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, {
            x: x * 0.3,
            y: y * 0.3,
            duration: 0.4,
            ease: "power2.out",
        });
    }, []);
    const handleLeave = useCallback(() => {
        gsap.to(ref.current, {
            x: 0,
            y: 0,
            duration: 0.6,
            ease: "elastic.out(1, 0.4)",
        });
    }, []);
    return (
        <Button
            ref={ref}
            component={component}
            to={to}
            variant={variant}
            size={size}
            className={className}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
        >
            {children}
        </Button>
    );
}

/* ━━━ FEATURE CARD ━━━ */
function FeatureCard({ icon, title, desc, tag, index }) {
    const ref = useRef(null);
    const handleMove = useCallback((e) => {
        const card = ref.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty(
            "--glow-x",
            `${((e.clientX - rect.left) / rect.width) * 100}%`,
        );
        card.style.setProperty(
            "--glow-y",
            `${((e.clientY - rect.top) / rect.height) * 100}%`,
        );
    }, []);
    return (
        <Box className="ft-card" ref={ref} onMouseMove={handleMove}>
            <div className="ft-glow-track" />
            <div className="ft-icon">{icon}</div>
            <Typography variant="h6" className="ft-title">
                {title}
            </Typography>
            <Typography className="ft-desc">{desc}</Typography>
            <div className="ft-tag">{tag}</div>
            <div className="ft-index">{String(index).padStart(2, "0")}</div>
        </Box>
    );
}

/* ━━━ SVG ICONS ━━━ */
const IconLibrary = () => (
    <svg viewBox="0 0 64 64" fill="none" className="feature-svg">
        <rect
            x="8"
            y="12"
            width="10"
            height="40"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.2"
        />
        <rect
            x="21"
            y="8"
            width="10"
            height="44"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.2"
        />
        <rect
            x="34"
            y="14"
            width="10"
            height="38"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.2"
        />
        <path
            d="M47 16l10-4v38l-10 4V16z"
            stroke="currentColor"
            strokeWidth="1.2"
        />
        <circle cx="26" cy="24" r="3" fill="currentColor" opacity="0.3">
            <animate
                attributeName="opacity"
                values="0.3;0.8;0.3"
                dur="3s"
                repeatCount="indefinite"
            />
        </circle>
    </svg>
);

const IconAI = () => (
    <svg viewBox="0 0 64 64" fill="none" className="feature-svg">
        <circle
            cx="32"
            cy="32"
            r="22"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 3"
            opacity="0.5"
        >
            <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 32 32;360 32 32"
                dur="30s"
                repeatCount="indefinite"
            />
        </circle>
        <circle cx="32" cy="32" r="14" stroke="currentColor" strokeWidth="1.2">
            <animateTransform
                attributeName="transform"
                type="rotate"
                values="360 32 32;0 32 32"
                dur="20s"
                repeatCount="indefinite"
            />
        </circle>
        <circle cx="32" cy="32" r="6" stroke="currentColor" strokeWidth="1" />
        <circle cx="32" cy="32" r="2.5" fill="currentColor">
            <animate
                attributeName="r"
                values="2.5;3.5;2.5"
                dur="2s"
                repeatCount="indefinite"
            />
        </circle>
        <line
            x1="32"
            y1="4"
            x2="32"
            y2="10"
            stroke="currentColor"
            strokeWidth="1"
        />
        <line
            x1="32"
            y1="54"
            x2="32"
            y2="60"
            stroke="currentColor"
            strokeWidth="1"
        />
        <line
            x1="4"
            y1="32"
            x2="10"
            y2="32"
            stroke="currentColor"
            strokeWidth="1"
        />
        <line
            x1="54"
            y1="32"
            x2="60"
            y2="32"
            stroke="currentColor"
            strokeWidth="1"
        />
    </svg>
);

const IconWave = () => (
    <svg viewBox="0 0 64 64" fill="none" className="feature-svg">
        <path
            d="M4 32c5-12 10 12 15 0s10 12 15 0 10 12 15 0 5-12 5-12"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
        >
            <animate
                attributeName="d"
                values="M4 32c5-12 10 12 15 0s10 12 15 0 10 12 15 0 5-12 5-12;M4 32c5-8 10 8 15 0s10 8 15 0 10 8 15 0 5-8 5-8;M4 32c5-12 10 12 15 0s10 12 15 0 10 12 15 0 5-12 5-12"
                dur="4s"
                repeatCount="indefinite"
            />
        </path>
        <path
            d="M4 42c5-8 10 8 15 0s10 8 15 0 10 8 15 0 5-8 5-8"
            stroke="currentColor"
            strokeWidth="0.8"
            opacity="0.3"
        />
        <circle cx="12" cy="32" r="2" fill="currentColor" opacity="0.5">
            <animate
                attributeName="cy"
                values="32;28;32;36;32"
                dur="4s"
                repeatCount="indefinite"
            />
        </circle>
    </svg>
);

const IconPen = () => (
    <svg viewBox="0 0 64 64" fill="none" className="feature-svg">
        <path
            d="M42 8l14 14-30 30H12V38L42 8z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
        />
        <line
            x1="36"
            y1="14"
            x2="50"
            y2="28"
            stroke="currentColor"
            strokeWidth="1"
        />
        <line
            x1="12"
            y1="52"
            x2="26"
            y2="52"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
        />
        <circle cx="50" cy="14" r="3" fill="currentColor" opacity="0.2">
            <animate
                attributeName="opacity"
                values="0.2;0.6;0.2"
                dur="2.5s"
                repeatCount="indefinite"
            />
        </circle>
    </svg>
);

/* ━━━ HOLO BOOK ━━━ */
function HoloBook() {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const move = (e) => {
            const rect = el.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            gsap.to(el, {
                rotateY: x * 20,
                rotateX: -y * 15,
                duration: 0.6,
                ease: "power2.out",
            });
        };
        const leave = () => {
            gsap.to(el, {
                rotateY: 0,
                rotateX: 0,
                duration: 1.2,
                ease: "elastic.out(1, 0.5)",
            });
        };
        el.addEventListener("mousemove", move);
        el.addEventListener("mouseleave", leave);
        return () => {
            el.removeEventListener("mousemove", move);
            el.removeEventListener("mouseleave", leave);
        };
    }, []);

    return (
        <div className="holo-book-wrap" ref={ref}>
            <svg viewBox="0 0 320 420" fill="none" className="holo-book">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="6" result="b" />
                        <feMerge>
                            <feMergeNode in="b" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="glowHeavy">
                        <feGaussianBlur stdDeviation="12" result="b" />
                        <feMerge>
                            <feMergeNode in="b" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <linearGradient id="bookGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop
                            offset="0%"
                            stopColor="#00e0ff"
                            stopOpacity="0.12"
                        />
                        <stop
                            offset="50%"
                            stopColor="#7b2fff"
                            stopOpacity="0.06"
                        />
                        <stop
                            offset="100%"
                            stopColor="#00e0ff"
                            stopOpacity="0.08"
                        />
                    </linearGradient>
                    <linearGradient id="edgeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00e0ff" />
                        <stop offset="50%" stopColor="#7b2fff" />
                        <stop offset="100%" stopColor="#00e0ff" />
                    </linearGradient>
                    <linearGradient id="shimmer" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="rgba(0,224,255,0)" />
                        <stop offset="50%" stopColor="rgba(0,224,255,0.12)">
                            <animate
                                attributeName="offset"
                                values="0;1;0"
                                dur="3s"
                                repeatCount="indefinite"
                            />
                        </stop>
                        <stop offset="100%" stopColor="rgba(0,224,255,0)" />
                    </linearGradient>
                </defs>
                <rect
                    x="50"
                    y="45"
                    width="200"
                    height="280"
                    rx="6"
                    fill="rgba(0,0,0,0.4)"
                    filter="url(#glowHeavy)"
                />
                <rect
                    x="42"
                    y="35"
                    width="200"
                    height="280"
                    rx="5"
                    fill="url(#bookGrad)"
                    stroke="url(#edgeGrad)"
                    strokeWidth="0.6"
                    opacity="0.6"
                />
                <rect
                    x="48"
                    y="30"
                    width="200"
                    height="280"
                    rx="5"
                    fill="rgba(0,224,255,0.02)"
                    stroke="rgba(0,224,255,0.1)"
                    strokeWidth="0.4"
                />
                <rect
                    x="58"
                    y="24"
                    width="200"
                    height="280"
                    rx="5"
                    fill="url(#bookGrad)"
                    stroke="url(#edgeGrad)"
                    strokeWidth="1.2"
                    filter="url(#glow)"
                />
                <rect
                    x="58"
                    y="24"
                    width="200"
                    height="280"
                    rx="5"
                    fill="url(#shimmer)"
                />
                <line
                    x1="90"
                    y1="75"
                    x2="226"
                    y2="75"
                    stroke="rgba(0,224,255,0.35)"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <line
                    x1="90"
                    y1="95"
                    x2="195"
                    y2="95"
                    stroke="rgba(0,224,255,0.2)"
                    strokeWidth="1"
                />
                <line
                    x1="90"
                    y1="110"
                    x2="210"
                    y2="110"
                    stroke="rgba(0,224,255,0.12)"
                    strokeWidth="0.8"
                />
                <circle
                    cx="158"
                    cy="190"
                    r="40"
                    stroke="rgba(0,224,255,0.15)"
                    strokeWidth="0.8"
                    strokeDasharray="5 4"
                >
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        values="0 158 190;360 158 190"
                        dur="25s"
                        repeatCount="indefinite"
                    />
                </circle>
                <circle
                    cx="158"
                    cy="190"
                    r="28"
                    stroke="rgba(123,47,255,0.25)"
                    strokeWidth="0.8"
                    strokeDasharray="3 4"
                >
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        values="360 158 190;0 158 190"
                        dur="18s"
                        repeatCount="indefinite"
                    />
                </circle>
                <circle
                    cx="158"
                    cy="190"
                    r="16"
                    stroke="rgba(0,224,255,0.2)"
                    strokeWidth="1"
                >
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        values="0 158 190;-360 158 190"
                        dur="12s"
                        repeatCount="indefinite"
                    />
                </circle>
                <circle
                    cx="158"
                    cy="190"
                    r="5"
                    fill="rgba(0,224,255,0.7)"
                    filter="url(#glow)"
                >
                    <animate
                        attributeName="r"
                        values="4;7;4"
                        dur="2s"
                        repeatCount="indefinite"
                    />
                </circle>
                <circle r="2" fill="rgba(0,224,255,0.6)">
                    <animateMotion
                        dur="8s"
                        repeatCount="indefinite"
                        path="M158,190 m-28,0 a28,28 0 1,1 56,0 a28,28 0 1,1 -56,0"
                    />
                </circle>
                <circle r="1.5" fill="rgba(123,47,255,0.8)">
                    <animateMotion
                        dur="12s"
                        repeatCount="indefinite"
                        path="M158,190 m-40,0 a40,40 0 1,0 80,0 a40,40 0 1,0 -80,0"
                    />
                </circle>
                <rect
                    x="58"
                    y="24"
                    width="200"
                    height="4"
                    fill="rgba(0,224,255,0.12)"
                    rx="2"
                >
                    <animate
                        attributeName="y"
                        values="24;300;24"
                        dur="4s"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="opacity"
                        values="0.15;0.05;0.15"
                        dur="4s"
                        repeatCount="indefinite"
                    />
                </rect>
            </svg>
            <div className="holo-reflection" />
        </div>
    );
}

/* ━━━ MAIN ━━━ */
export default function LandingPage() {
    const { user } = useAuth();
    const landingRef = useRef(null);
    const scrambledTitle = useTextScramble(
        "KindleAI - THIS IS JUST A TEMPLATE",
        true,
        25,
    );

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Hero entrance
            gsap.set(".hero-title-wrap", { opacity: 0, y: 40 });
            gsap.set(".hero-accent-line", { scaleX: 0 });
            gsap.set(".hero-sub", { opacity: 0, y: 30 });
            gsap.set(".hero-cta", { opacity: 0, y: 20 });
            gsap.set(".holo-book-wrap", {
                opacity: 0,
                scale: 0.8,
                rotateY: -15,
            });
            gsap.set(".stat-item", { opacity: 0, y: 30 });

            const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
            tl.to(".hero-title-wrap", { opacity: 1, y: 0, duration: 1.2 })
                .to(
                    ".hero-accent-line",
                    { scaleX: 1, duration: 0.8, ease: "power3.inOut" },
                    "-=0.6",
                )
                .to(".hero-sub", { opacity: 1, y: 0, duration: 1 }, "-=0.4")
                .to(
                    ".hero-cta",
                    { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 },
                    "-=0.5",
                )
                .to(
                    ".holo-book-wrap",
                    { opacity: 1, scale: 1, rotateY: 0, duration: 1.5 },
                    "-=1.0",
                )
                .to(
                    ".stat-item",
                    { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 },
                    "-=0.5",
                );

            // Float book
            gsap.to(".holo-book-wrap", {
                y: -15,
                duration: 4,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });

            // Scroll triggers
            gsap.utils.toArray(".section-label").forEach((el) => {
                gsap.from(el, {
                    x: -60,
                    opacity: 0,
                    duration: 0.8,
                    scrollTrigger: { trigger: el, start: "top 85%" },
                });
            });

            gsap.utils.toArray(".ft-card").forEach((card, i) => {
                gsap.from(card, {
                    y: 100,
                    opacity: 0,
                    scale: 0.92,
                    duration: 0.9,
                    delay: i * 0.08,
                    scrollTrigger: { trigger: card, start: "top 88%" },
                });
            });

            gsap.utils.toArray(".step").forEach((step, i) => {
                gsap.from(step, {
                    x: i % 2 === 0 ? -80 : 80,
                    opacity: 0,
                    duration: 0.9,
                    scrollTrigger: { trigger: step, start: "top 85%" },
                });
            });

            gsap.utils.toArray(".step-connector").forEach((l) => {
                gsap.from(l, {
                    scaleY: 0,
                    duration: 0.6,
                    scrollTrigger: { trigger: l, start: "top 90%" },
                });
            });

            gsap.utils.toArray(".stat-number").forEach((el) => {
                const target = parseInt(el.dataset.value);
                if (isNaN(target)) return;
                const obj = { val: 0 };
                gsap.to(obj, {
                    val: target,
                    duration: 2,
                    ease: "power1.out",
                    scrollTrigger: { trigger: el, start: "top 90%" },
                    onUpdate: () => {
                        el.textContent = Math.floor(obj.val).toLocaleString();
                    },
                });
            });

            gsap.from(".final-heading", {
                y: 60,
                opacity: 0,
                duration: 1,
                ease: "expo.out",
                scrollTrigger: { trigger: ".final-heading", start: "top 85%" },
            });
        }, landingRef);

        return () => ctx.revert();
    }, []);

    return (
        <Box ref={landingRef} className="landing">
            <NetworkCanvas />
            <div className="grain" />
            <div className="vignette" />

            {/* NAV */}
            <nav className="lp-nav">
                <div className="lp-nav-logo">
                    <span className="logo-k">K</span>
                    <span className="logo-dot">.</span>
                    <span className="logo-ai">AI</span>
                </div>
                <div className="lp-nav-links">
                    {user ? (
                        <MagneticButton
                            component={Link}
                            to="/home"
                            variant="contained"
                            className="nav-btn-primary"
                        >
                            Library
                        </MagneticButton>
                    ) : (
                        <>
                            <Button
                                component={Link}
                                to="/signin"
                                className="nav-btn-ghost"
                            >
                                Sign In
                            </Button>
                            <MagneticButton
                                component={Link}
                                to="/signup"
                                variant="contained"
                                className="nav-btn-primary"
                            >
                                Get Started
                            </MagneticButton>
                        </>
                    )}
                </div>
            </nav>

            {/* HERO */}
            <section className="lp-hero">
                <Container maxWidth="lg" className="hero-container">
                    <Box className="hero-left">
                        <div className="hero-title-wrap">
                            <div className="hero-title-scramble">
                                {scrambledTitle || "\u00A0"}
                            </div>
                        </div>
                        <div className="hero-accent-line" />
                        <Typography className="hero-sub">
                            The reading experience, reimagined with
                            intelligence.
                            <br />
                            <span className="hero-sub-dim">
                                Upload EPUBs · Read with focus · Ask your book
                                anything
                            </span>
                        </Typography>
                        <Box className="hero-cta-group">
                            {user ? (
                                <MagneticButton
                                    component={Link}
                                    to="/home"
                                    variant="contained"
                                    className="hero-cta cta-primary"
                                    size="large"
                                >
                                    Enter Library
                                </MagneticButton>
                            ) : (
                                <>
                                    <MagneticButton
                                        component={Link}
                                        to="/signup"
                                        variant="contained"
                                        className="hero-cta cta-primary"
                                        size="large"
                                    >
                                        Start Reading — Free
                                    </MagneticButton>
                                    <MagneticButton
                                        component={Link}
                                        to="/signin"
                                        variant="outlined"
                                        className="hero-cta cta-ghost"
                                        size="large"
                                    >
                                        Sign In
                                    </MagneticButton>
                                </>
                            )}
                        </Box>
                    </Box>
                    <Box className="hero-right">
                        <HoloBook />
                    </Box>
                </Container>
            </section>

            {/* STATS */}
            <section className="stats-bar">
                <div className="stat-item">
                    <span className="stat-number" data-value="1024">
                        0
                    </span>
                    <span className="stat-label">Vector Dimensions</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                    <span className="stat-number" data-value="500">
                        0
                    </span>
                    <span className="stat-label">ms Avg Response</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                    <span className="stat-number" data-value="1">
                        0
                    </span>
                    <span className="stat-label">Upload Per Book</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                    <span className="stat-infinity">∞</span>
                    <span className="stat-label">Readers Per Book</span>
                </div>
            </section>

            {/* FEATURES */}
            <section className="lp-features">
                <Container maxWidth="lg">
                    <div className="section-label">
                        <span className="label-index">01</span>
                        <span className="label-text">Features</span>
                        <span className="label-line" />
                    </div>
                    <Box className="ft-grid">
                        <FeatureCard
                            index={1}
                            icon={<IconLibrary />}
                            title="Shared Library"
                            tag="Distributed"
                            desc="Upload once — every user gets access. Books are deduplicated by content hash. The entire collection grows with every upload."
                        />
                        <FeatureCard
                            index={2}
                            icon={<IconAI />}
                            title="RAG-Powered Chat"
                            tag="Intelligence"
                            desc="Ask questions grounded in the actual text. Qdrant vector search retrieves the most relevant passages. No hallucinations."
                        />
                        <FeatureCard
                            index={3}
                            icon={<IconWave />}
                            title="Listen Mode"
                            tag="Audio"
                            desc="Seamless text-to-speech that tracks your position. Switch between reading and listening without losing your place."
                        />
                        <FeatureCard
                            index={4}
                            icon={<IconPen />}
                            title="Annotations"
                            tag="Personal"
                            desc="Highlights, bookmarks, and notes that persist across sessions. Your marginalia, digitized and always accessible."
                        />
                    </Box>
                </Container>
            </section>

            {/* HOW IT WORKS */}
            <section className="lp-how">
                <Container maxWidth="md">
                    <div className="section-label">
                        <span className="label-index">02</span>
                        <span className="label-text">How It Works</span>
                        <span className="label-line" />
                    </div>
                    <div className="steps">
                        <div className="step">
                            <div className="step-num">01</div>
                            <div className="step-content">
                                <h3>Upload an EPUB</h3>
                                <p>
                                    Drop your file — the system hashes,
                                    deduplicates, and stores it. If someone
                                    already uploaded that book, you get instant
                                    access.
                                </p>
                            </div>
                        </div>
                        <div className="step-connector" />
                        <div className="step">
                            <div className="step-num">02</div>
                            <div className="step-content">
                                <h3>Background Indexing</h3>
                                <p>
                                    The book is chunked into passages and
                                    embedded into 1024-dimensional vectors.
                                    Stored in Qdrant. You can start reading
                                    immediately.
                                </p>
                            </div>
                        </div>
                        <div className="step-connector" />
                        <div className="step">
                            <div className="step-num">03</div>
                            <div className="step-content">
                                <h3>Read & Ask</h3>
                                <p>
                                    Read in the browser with full e-reader
                                    controls. Open the AI panel and ask anything
                                    — answers come straight from the book's
                                    content.
                                </p>
                            </div>
                        </div>
                    </div>
                </Container>
            </section>

            {/* FINAL CTA */}
            <section className="lp-final-cta">
                <Container maxWidth="sm" sx={{ textAlign: "center" }}>
                    <Typography className="final-heading">
                        Ready to read
                        <br />
                        <span className="final-accent">smarter</span>?
                    </Typography>
                    <Box mt={4} display="flex" gap={2} justifyContent="center">
                        {user ? (
                            <MagneticButton
                                component={Link}
                                to="/home"
                                variant="contained"
                                className="hero-cta cta-primary"
                                size="large"
                            >
                                Go to Library
                            </MagneticButton>
                        ) : (
                            <MagneticButton
                                component={Link}
                                to="/signup"
                                variant="contained"
                                className="hero-cta cta-primary"
                                size="large"
                            >
                                Create Free Account
                            </MagneticButton>
                        )}
                    </Box>
                </Container>
            </section>

            {/* FOOTER */}
            <footer className="lp-footer">
                <div className="footer-rule" />
                <Typography className="footer-text">
                    Built by{" "}
                    <span className="footer-accent">Developers in Paris</span>
                </Typography>
            </footer>
        </Box>
    );
}
