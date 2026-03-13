import { useAuth } from "../context/AuthContext.jsx";
import { auth } from "../firebase/config.js";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    async function handleSignOut() {
        await auth.signOut();
        navigate("/signin");
    }

    return (
        <div>
            <h2>KindleAI</h2>
            <p>Welcome, {user?.email}</p>
            <button onClick={handleSignOut}>Sign Out</button>
            <hr />
            <p>Library will go here...</p>
        </div>
    );
}
