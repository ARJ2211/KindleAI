import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../firebase/config.js";

// Creating the auth context here
const AuthContext = createContext(null);

/**
 * This is a custom component such that every
 * component under it will have the user, and token
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Function to get the token of the user
    // this will be used for the API auth calls
    const getToken = async () => {
        if (!user) return null;
        return await user.getIdToken();
    };

    return (
        <AuthContext.Provider value={{ user, loading, getToken }}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * This is a custom react hook and we can
 * detructure it to get the user, loading, and getToken()
 *
 * const {user, loading, getToken} = useAuth()
 * @returns {import("react").Context}
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
