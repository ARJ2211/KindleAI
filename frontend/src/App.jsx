import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import SignInPage from "./pages/SignInPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import ReaderPage from "./pages/ReaderPage.jsx";

function AppRoutes() {
    const { user, loading } = useAuth();

    if (loading) return <p>Loading...</p>;

    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
                path="/signup"
                element={
                    user ? <Navigate to="/home" replace /> : <SignUpPage />
                }
            />
            <Route
                path="/signin"
                element={
                    user ? <Navigate to="/home" replace /> : <SignInPage />
                }
            />
            <Route
                path="/home"
                element={
                    <ProtectedRoute>
                        <HomePage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/reader/:bookId"
                element={
                    <ProtectedRoute>
                        <ReaderPage />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <SocketProvider>
                    <AppRoutes />
                </SocketProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
