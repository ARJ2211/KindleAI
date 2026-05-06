import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";

import AlertPopup from "../components/AlertPopup.jsx";
import Library from "../components/LibraryComps/Library.jsx";
import MyBooks from "../components/MyBooksComps/MyBooks.jsx";
import Navbar from "../components/NavBar.jsx";

import api from "../api/axios.js";
import "../css/LandingPage.css";
import MyReading from "../components/MyReadingComps/MyReading.jsx";

export default function HomePage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "Global Library";
    const setActiveTab = (tab) => setSearchParams({ tab });
    const [uploading, setUploading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleUpload = async (file) => {
        if (!file) return;
        setUploading(true);
        setAlert(null);
        try {
            const formData = new FormData();
            formData.append("epub", file);
            const res = await api.post("/book/upload_book", formData);
            setAlert({
                message: res.data.deduplicated
                    ? `"${res.data.book.title}" already in library`
                    : `"${res.data.book.title}" uploaded successfully`,
                severity: res.data.deduplicated ? "warning" : "success",
            });
            if (!res.data.deduplicated) setRefreshKey((prev) => prev + 1);
        } catch (err) {
            setAlert({
                message: err.response?.data?.msg || err.message,
                severity: "error",
            });
        } finally {
            setUploading(false);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case "Global Library":
                return (
                    <Library
                        key={refreshKey}
                        onUpload={handleUpload}
                        uploading={uploading}
                        onAlert={setAlert}
                    />
                );
            case "My Books":
                return <MyBooks onAlert={setAlert} />;
            case "My Reading":
                return <MyReading onAlert={setAlert} />;
            default:
                return null;
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", background: "#050508", pt: "80px" }}>
            <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

            <Box p={4}>{renderTabContent()}</Box>

            <AlertPopup
                message={alert?.message}
                severity={alert?.severity}
                onClose={() => setAlert(null)}
            />
        </Box>
    );
}
