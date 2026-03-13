import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function LandingPage() {
    const { user } = useAuth();

    return (
        <div>
            <h1>KindleAI</h1>
            <p>Some dope shit (well make this better later lol)</p>

            {user ? (
                <Link to="/home">Go to Library</Link>
            ) : (
                <div>
                    <Link to="/signin">Sign In</Link>
                    {" | "}
                    <Link to="/signup">Sign Up</Link>
                </div>
            )}
        </div>
    );
}
