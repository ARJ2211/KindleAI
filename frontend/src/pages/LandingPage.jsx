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

/* ━━━ OPEN BOOK ━━━ */
function HoloBook() {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const move = (e) => {
            const rect = el.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            gsap.to(el, { rotateY: x * 18, rotateX: -y * 12, duration: 0.6, ease: "power2.out" });
        };
        const leave = () => {
            gsap.to(el, { rotateY: 0, rotateX: 0, duration: 1.2, ease: "elastic.out(1, 0.5)" });
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
            <svg viewBox="0 0 480 360" fill="none" className="holo-book">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="b" />
                        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="glowMd">
                        <feGaussianBlur stdDeviation="8" result="b" />
                        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <linearGradient id="pageL" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#07101f" />
                        <stop offset="100%" stopColor="#0c1a2e" />
                    </linearGradient>
                    <linearGradient id="pageR" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0c1a2e" />
                        <stop offset="100%" stopColor="#07101f" />
                    </linearGradient>
                    <linearGradient id="spineG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00e0ff" />
                        <stop offset="50%" stopColor="#7b2fff" />
                        <stop offset="100%" stopColor="#00e0ff" />
                    </linearGradient>
                    <linearGradient id="topEdge" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="rgba(0,224,255,0)" />
                        <stop offset="30%" stopColor="rgba(0,224,255,0.5)" />
                        <stop offset="50%" stopColor="rgba(0,224,255,0.8)" />
                        <stop offset="70%" stopColor="rgba(0,224,255,0.5)" />
                        <stop offset="100%" stopColor="rgba(0,224,255,0)" />
                    </linearGradient>
                    <radialGradient id="spineBloom" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(0,224,255,0.18)" />
                        <stop offset="100%" stopColor="rgba(0,224,255,0)" />
                    </radialGradient>
                </defs>

                {/* Drop shadow */}
                <ellipse cx="240" cy="348" rx="170" ry="14" fill="rgba(0,224,255,0.07)" filter="url(#glowMd)" />

                {/* Left page */}
                <path d="M 52 36 L 232 24 L 232 326 L 52 316 Z" fill="url(#pageL)" stroke="rgba(0,224,255,0.18)" strokeWidth="0.7" />
                {/* Right page */}
                <path d="M 248 24 L 428 36 L 428 316 L 248 326 Z" fill="url(#pageR)" stroke="rgba(0,224,255,0.18)" strokeWidth="0.7" />

                {/* Spine bloom */}
                <rect x="200" y="24" width="80" height="302" fill="url(#spineBloom)" />
                {/* Spine line */}
                <line x1="240" y1="23" x2="240" y2="327" stroke="url(#spineG)" strokeWidth="2.5" filter="url(#glow)" />
                {/* Top edge glow */}
                <path d="M 52 36 L 232 24 L 248 24 L 428 36" stroke="url(#topEdge)" strokeWidth="1.2" />

                {/* ── LEFT PAGE: Reading content ── */}
                {/* Chapter label */}
                <text x="70" y="62" fontFamily="JetBrains Mono, monospace" fontSize="6" fill="rgba(0,224,255,0.45)" letterSpacing="2.5">CHAPTER 12</text>
                {/* Chapter title */}
                <rect x="70" y="70" width="140" height="3" rx="1.5" fill="rgba(255,255,255,0.65)" />
                <rect x="70" y="78" width="95" height="2" rx="1" fill="rgba(255,255,255,0.3)" />

                {/* Body text lines */}
                {[88,95,102,109,116,123,130].map((y, i) => (
                    <rect key={i} x="70" y={y} width={[148,136,152,128,144,138,150][i]} height="1.5" rx="0.75" fill={`rgba(255,255,255,${[0.13,0.10,0.13,0.09,0.12,0.10,0.13][i]})`} />
                ))}

                {/* Highlighted passage */}
                <rect x="70" y="140" width="148" height="22" rx="3" fill="rgba(0,224,255,0.07)" stroke="rgba(0,224,255,0.15)" strokeWidth="0.6" />
                <rect x="70" y="143" width="138" height="1.8" rx="0.9" fill="rgba(0,224,255,0.4)" />
                <rect x="70" y="148" width="144" height="1.8" rx="0.9" fill="rgba(0,224,255,0.3)" />
                <rect x="70" y="153" width="112" height="1.8" rx="0.9" fill="rgba(0,224,255,0.22)" />
                {/* Highlight margin mark */}
                <rect x="64" y="140" width="3" height="22" rx="1.5" fill="rgba(0,224,255,0.6)" filter="url(#glow)" />

                {/* More body text */}
                {[170,177,184,191,198,205,212,219].map((y, i) => (
                    <rect key={i} x="70" y={y} width={[142,130,150,118,140,136,148,100][i]} height="1.5" rx="0.75" fill={`rgba(255,255,255,${[0.10,0.08,0.11,0.07,0.10,0.09,0.11,0.06][i]})`} />
                ))}

                {/* Paragraph gap + more lines */}
                {[232,239,246,253,260,267].map((y, i) => (
                    <rect key={i} x="70" y={y} width={[144,132,150,126,142,88][i]} height="1.5" rx="0.75" fill={`rgba(255,255,255,${[0.09,0.07,0.10,0.06,0.08,0.05][i]})`} />
                ))}

                {/* Page number */}
                <text x="152" y="312" fontFamily="JetBrains Mono, monospace" fontSize="6.5" fill="rgba(255,255,255,0.14)" textAnchor="middle">142</text>

                {/* ── RIGHT PAGE: AI Chat ── */}
                {/* Header bar */}
                <rect x="256" y="32" width="156" height="18" rx="4" fill="rgba(0,224,255,0.05)" stroke="rgba(0,224,255,0.1)" strokeWidth="0.6" />
                <circle cx="266" cy="41" r="3.5" fill="rgba(0,224,255,0.15)" stroke="rgba(0,224,255,0.4)" strokeWidth="0.8">
                    <animate attributeName="r" values="3.5;4.2;3.5" dur="3s" repeatCount="indefinite" />
                </circle>
                <rect x="274" y="38.5" width="42" height="2" rx="1" fill="rgba(0,224,255,0.5)" />
                <rect x="274" y="43" width="28" height="1.5" rx="0.75" fill="rgba(0,224,255,0.25)" />
                <rect x="392" y="37" width="12" height="1.5" rx="0.75" fill="rgba(255,255,255,0.1)" />
                <rect x="392" y="41" width="12" height="1.5" rx="0.75" fill="rgba(255,255,255,0.1)" />
                <rect x="392" y="45" width="12" height="1.5" rx="0.75" fill="rgba(255,255,255,0.1)" />

                {/* Divider */}
                <line x1="256" y1="58" x2="412" y2="58" stroke="rgba(0,224,255,0.08)" strokeWidth="0.8" />

                {/* User message bubble */}
                <rect x="316" y="68" width="90" height="26" rx="9" fill="rgba(123,47,255,0.18)" stroke="rgba(123,47,255,0.3)" strokeWidth="0.7" />
                <rect x="325" y="74" width="72" height="1.8" rx="0.9" fill="rgba(255,255,255,0.5)" />
                <rect x="325" y="79" width="60" height="1.8" rx="0.9" fill="rgba(255,255,255,0.3)" />
                <rect x="325" y="84" width="44" height="1.8" rx="0.9" fill="rgba(255,255,255,0.2)" />

                {/* AI response bubble */}
                <rect x="256" y="106" width="112" height="46" rx="9" fill="rgba(0,224,255,0.06)" stroke="rgba(0,224,255,0.18)" strokeWidth="0.7" />
                <circle cx="265" cy="114" r="2.5" fill="rgba(0,224,255,0.7)">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
                </circle>
                <rect x="272" y="112.5" width="28" height="1.8" rx="0.9" fill="rgba(0,224,255,0.55)" />
                <rect x="264" y="120" width="96" height="1.8" rx="0.9" fill="rgba(255,255,255,0.38)" />
                <rect x="264" y="125.5" width="100" height="1.8" rx="0.9" fill="rgba(255,255,255,0.28)" />
                <rect x="264" y="131" width="88" height="1.8" rx="0.9" fill="rgba(255,255,255,0.22)" />
                <rect x="264" y="136.5" width="68" height="1.8" rx="0.9" fill="rgba(255,255,255,0.15)" />
                <rect x="264" y="142" width="48" height="1.8" rx="0.9" fill="rgba(255,255,255,0.1)" />

                {/* Source citation chip */}
                <rect x="264" y="158" width="72" height="13" rx="6" fill="rgba(0,224,255,0.06)" stroke="rgba(0,224,255,0.22)" strokeWidth="0.7" />
                <rect x="271" y="162" width="4" height="5" rx="1" fill="rgba(0,224,255,0.35)" />
                <rect x="279" y="162.5" width="36" height="1.5" rx="0.75" fill="rgba(0,224,255,0.35)" />
                <rect x="279" y="166" width="24" height="1.2" rx="0.6" fill="rgba(0,224,255,0.2)" />
                <text x="326" y="167" fontFamily="JetBrains Mono, monospace" fontSize="5" fill="rgba(0,224,255,0.4)">p.142</text>

                {/* Second user bubble */}
                <rect x="322" y="182" width="84" height="22" rx="8" fill="rgba(123,47,255,0.18)" stroke="rgba(123,47,255,0.3)" strokeWidth="0.7" />
                <rect x="330" y="188" width="66" height="1.8" rx="0.9" fill="rgba(255,255,255,0.45)" />
                <rect x="330" y="193.5" width="48" height="1.8" rx="0.9" fill="rgba(255,255,255,0.25)" />

                {/* Typing indicator */}
                <rect x="256" y="214" width="52" height="18" rx="9" fill="rgba(0,224,255,0.06)" stroke="rgba(0,224,255,0.15)" strokeWidth="0.7" />
                <circle cx="268" cy="223" r="2.8" fill="rgba(0,224,255,0.45)">
                    <animate attributeName="opacity" values="0.45;1;0.45" dur="1.1s" begin="0s" repeatCount="indefinite" />
                </circle>
                <circle cx="279" cy="223" r="2.8" fill="rgba(0,224,255,0.45)">
                    <animate attributeName="opacity" values="0.45;1;0.45" dur="1.1s" begin="0.35s" repeatCount="indefinite" />
                </circle>
                <circle cx="290" cy="223" r="2.8" fill="rgba(0,224,255,0.45)">
                    <animate attributeName="opacity" values="0.45;1;0.45" dur="1.1s" begin="0.7s" repeatCount="indefinite" />
                </circle>

                {/* Divider */}
                <line x1="256" y1="242" x2="412" y2="242" stroke="rgba(0,224,255,0.07)" strokeWidth="0.8" />

                {/* Sources section */}
                <text x="256" y="255" fontFamily="JetBrains Mono, monospace" fontSize="5.5" fill="rgba(0,224,255,0.4)" letterSpacing="1.8">SOURCES</text>
                <rect x="256" y="261" width="148" height="18" rx="5" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.6" />
                <rect x="263" y="266" width="3.5" height="8" rx="1.2" fill="rgba(0,224,255,0.35)" />
                <rect x="271" y="266.5" width="60" height="1.8" rx="0.9" fill="rgba(255,255,255,0.28)" />
                <rect x="271" y="271" width="40" height="1.4" rx="0.7" fill="rgba(255,255,255,0.14)" />
                <text x="384" y="272" fontFamily="JetBrains Mono, monospace" fontSize="5.5" fill="rgba(0,224,255,0.35)" textAnchor="end">p.142</text>

                <rect x="256" y="283" width="148" height="18" rx="5" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" />
                <rect x="263" y="288" width="3.5" height="8" rx="1.2" fill="rgba(123,47,255,0.4)" />
                <rect x="271" y="288.5" width="52" height="1.8" rx="0.9" fill="rgba(255,255,255,0.22)" />
                <rect x="271" y="293" width="36" height="1.4" rx="0.7" fill="rgba(255,255,255,0.11)" />
                <text x="384" y="294" fontFamily="JetBrains Mono, monospace" fontSize="5.5" fill="rgba(123,47,255,0.4)" textAnchor="end">p.89</text>

                {/* Page number */}
                <text x="333" y="312" fontFamily="JetBrains Mono, monospace" fontSize="6.5" fill="rgba(255,255,255,0.14)" textAnchor="middle">143</text>

                {/* Scan line */}
                <rect x="52" y="24" width="376" height="3" rx="1.5" fill="rgba(0,224,255,0.08)">
                    <animate attributeName="y" values="24;327;24" dur="5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.1;0.03;0.1" dur="5s" repeatCount="indefinite" />
                </rect>

                {/* Floating particles */}
                <circle cx="36" cy="110" r="1.8" fill="rgba(0,224,255,0.5)">
                    <animate attributeName="cy" values="110;96;110" dur="4.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0.9;0.5" dur="4.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="448" cy="190" r="1.2" fill="rgba(123,47,255,0.6)">
                    <animate attributeName="cy" values="190;174;190" dur="5.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="28" cy="260" r="1" fill="rgba(0,224,255,0.35)">
                    <animate attributeName="cy" values="260;246;260" dur="6s" repeatCount="indefinite" />
                </circle>
                <circle cx="456" cy="80" r="0.9" fill="rgba(0,224,255,0.4)">
                    <animate attributeName="cy" values="80;66;80" dur="3.8s" repeatCount="indefinite" />
                </circle>
            </svg>
            <div className="holo-reflection" />
        </div>
    );
}

/* ━━━ TERMINAL DEMO ━━━ */
const SCRIPT = [
    { text: '$ kindleai upload "dune.epub"',                color: "cmd"    },
    { text: "  ✓ Parsed 23 chapters  (412 pages)",          color: "ok"     },
    { text: "  ✓ Generated 2,847 vector embeddings",        color: "ok"     },
    { text: "  ✓ Indexed in Qdrant  [ready]",               color: "ok"     },
    { text: "",                                              color: "blank"  },
    { text: '$ kindleai ask "What is the Kwisatz Haderach?"', color: "cmd"  },
    { text: "",                                              color: "blank"  },
    { text: "  Searching 2,847 vectors...",                  color: "dim"    },
    { text: "",                                              color: "blank"  },
    { text: '  "The Kwisatz Haderach was the Bene Gesserit', color: "answer" },
    { text: '   name for the superbeing they sought to',     color: "answer" },
    { text: '   create through careful genetic breeding."',  color: "answer" },
    { text: "",                                              color: "blank"  },
    { text: "  → Source: Chapter 14 · p.189 · match 97.3%", color: "source" },
];

function TerminalDemo() {
    const [lines, setLines] = useState([]);
    const [done, setDone] = useState(false);
    const ref = useRef(null);
    // cancelFn holds the cancel callback of the currently running typewriter
    const cancelFn = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // Cancel any previous run (handles Strict Mode double-invoke)
        if (cancelFn.current) { cancelFn.current(); cancelFn.current = null; }
        setLines([]);
        setDone(false);

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !cancelFn.current) {
                    cancelFn.current = startTypewriter(setLines, setDone);
                }
            },
            { threshold: 0.25 },
        );
        observer.observe(el);

        return () => {
            observer.disconnect();
            if (cancelFn.current) { cancelFn.current(); cancelFn.current = null; }
        };
    }, []);

    return (
        <div className="terminal-wrap" ref={ref}>
            <div className="terminal-header">
                <span className="t-dot t-red" />
                <span className="t-dot t-yellow" />
                <span className="t-dot t-green" />
                <span className="t-title">kindleai — zsh</span>
            </div>
            <div className="terminal-body">
                {lines.map((line, i) => (
                    <div key={i} className={`t-line t-${line.color}`}>
                        {line.display || "\u00A0"}
                    </div>
                ))}
                {!done && <span className="t-cursor">█</span>}
            </div>
        </div>
    );
}

// Pure function — no component scope, returns a cancel callback
function startTypewriter(setLines, setDone) {
    let cancelled = false;
    let li = 0;
    let ci = 0;
    let lineOpen = false;

    function tick() {
        if (cancelled) return;
        if (li >= SCRIPT.length) { setDone(true); return; }

        const line = SCRIPT[li];

        if (line.color === "blank") {
            setLines((prev) => [...prev, { color: "blank", display: "" }]);
            li++; ci = 0; lineOpen = false;
            setTimeout(tick, 100);
            return;
        }

        const full = line.text;

        if (!lineOpen) {
            setLines((prev) => [...prev, { color: line.color, display: "" }]);
            lineOpen = true;
        }

        if (ci < full.length) {
            const current = full.slice(0, ci + 1);
            setLines((prev) => {
                const n = [...prev];
                n[n.length - 1] = { color: line.color, display: current };
                return n;
            });
            ci++;
            const delay = line.color === "cmd" ? 32 : line.color === "ok" ? 9 : 13;
            setTimeout(tick, delay);
        } else {
            li++; ci = 0; lineOpen = false;
            const pause = line.color === "cmd" ? 280 : line.color === "ok" ? 50 : 160;
            setTimeout(tick, pause);
        }
    }

    setTimeout(tick, 600);
    return () => { cancelled = true; };
}

/* ━━━ MAIN ━━━ */
export default function LandingPage() {
    const { user } = useAuth();
    const landingRef = useRef(null);
    const scrambledTitle = useTextScramble(
        "KindleAI",
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
                <Link to="/" className="lp-nav-logo">
                    <span className="logo-k">K</span>
                    <span className="logo-dot">.</span>
                    <span className="logo-ai">AI</span>
                </Link>
                <div className="lp-nav-center">
                    <a href="#features" className="nav-anchor">Features</a>
                    <a href="#how-it-works" className="nav-anchor">How it Works</a>
                    <a href="#in-action" className="nav-anchor">In Action</a>
                </div>
                <div className="lp-nav-links">
                    {user ? (
                        <Button
                            component={Link}
                            to="/home"
                            className="nav-btn-ghost"
                        >
                            Library
                        </Button>
                    ) : (
                        <Button
                            component={Link}
                            to="/signin"
                            className="nav-btn-ghost"
                        >
                            Sign In
                        </Button>
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
            <section id="features" className="lp-features">
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
            <section id="how-it-works" className="lp-how">
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

            {/* TERMINAL DEMO / FINAL */}
            <section id="in-action" className="lp-final-cta">
                <Container maxWidth="lg">
                    <div className="section-label">
                        <span className="label-index">03</span>
                        <span className="label-text">In Action</span>
                        <span className="label-line" />
                    </div>
                    <div className="terminal-section">
                        <div className="terminal-left">
                            <Typography className="final-heading">
                                See it
                                <br />
                                <span className="final-accent">working.</span>
                            </Typography>
                            <p className="terminal-sub">
                                Upload any EPUB. The pipeline chunks, embeds,
                                and indexes it in Qdrant. Ask anything —
                                answers come back with exact page references.
                            </p>
                            <Box mt={4}>
                                {user ? (
                                    <MagneticButton
                                        component={Link}
                                        to="/home"
                                        variant="contained"
                                        className="hero-cta cta-primary"
                                        size="large"
                                    >
                                        Open Library
                                    </MagneticButton>
                                ) : (
                                    <MagneticButton
                                        component={Link}
                                        to="/signup"
                                        variant="contained"
                                        className="hero-cta cta-primary"
                                        size="large"
                                    >
                                        Try it yourself
                                    </MagneticButton>
                                )}
                            </Box>
                        </div>
                        <TerminalDemo />
                    </div>
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
