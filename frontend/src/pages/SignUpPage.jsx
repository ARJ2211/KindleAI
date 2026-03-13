import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config.js";
import axios from "axios";

const API = "http://localhost:3000";

export default function SignUpPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            // Create user on backend (Firebase Admin + Mongo)
            await axios.post(`${API}/user/signup`, {
                email,
                password,
                displayName,
            });

            // Sign in on the client side
            await signInWithEmailAndPassword(auth, email, password);

            navigate("/");
        } catch (err) {
            setError(err.response?.data?.msg || err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div>
            <h2>Sign Up</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email</label>
                    <br />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password</label>
                    <br />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Display Name</label>
                    <br />
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                    />
                </div>
                <br />
                <button type="submit" disabled={submitting}>
                    {submitting ? "Signing up..." : "Sign Up"}
                </button>
            </form>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <p>
                Already have an account? <Link to="/signin">Sign In</Link>
            </p>
        </div>
    );
}
