import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase/config.js";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import axios from "axios";

const API = "http://localhost:3000";

function AuthTest() {
    const { user, loading, getToken } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    async function handleSignUp() {
        setError(null);
        setResult(null);
        try {
            const res = await axios.post(`${API}/user/signup`, {
                email,
                password,
                displayName,
            });
            setResult(res.data);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError(err.response?.data?.msg || err.message);
        }
    }

    async function handleSignIn() {
        setError(null);
        setResult(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setResult("Signed in!");
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleGetMe() {
        setError(null);
        setResult(null);
        try {
            const token = await getToken();
            const res = await axios.get(`${API}/user/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.msg || err.message);
        }
    }

    async function handleSignOut() {
        await auth.signOut();
        setResult(null);
        setError(null);
    }

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <h2>Auth Test</h2>
            <p>
                Status: {user ? `Signed in as ${user.email}` : "Not signed in"}
            </p>

            {!user ? (
                <div>
                    <input
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <br />
                    <input
                        placeholder="Password"
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <br />
                    <input
                        placeholder="Display Name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                    />
                    <br />
                    <button onClick={handleSignUp}>Sign Up</button>
                    <button onClick={handleSignIn}>Sign In</button>
                </div>
            ) : (
                <div>
                    <button onClick={handleGetMe}>GET /user/me</button>
                    <button onClick={handleSignOut}>Sign Out</button>
                </div>
            )}

            {error && <p style={{ color: "red" }}>{error}</p>}
            {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <AuthTest />
        </AuthProvider>
    );
}

export default App;
