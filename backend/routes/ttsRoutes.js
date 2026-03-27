import { Router } from "express";
import { EdgeTTS, VoicesManager, Communicate } from "edge-tts-universal";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

/**
 * The frontend sends the visible page text the backend synthesizes it
 * with Microsoft Edge TTS and streams back an MP3 buffer.
 */
router.post("/synthesize", verifyToken, async (req, res) => {
    try {
        const { text, voice, rate, pitch } = req.body;

        if (!text || typeof text !== "string" || text.trim().length === 0) {
            return res.status(400).json({ msg: "Text is required" });
        }

        if (text.length > 10000) {
            return res.status(400).json({
                msg: "Text exceeds maximum length of 10,000 characters",
            });
        }

        const selectedVoice = voice || "en-US-EmmaMultilingualNeural";

        const options = { voice: selectedVoice };
        if (rate) options.rate = rate;
        if (pitch) options.pitch = pitch;

        const communicate = new Communicate(text, options);

        // Set headers for a streamed audio response
        res.set({
            "Content-Type": "audio/mpeg",
            "Transfer-Encoding": "chunked",
            "Cache-Control": "no-cache",
        });

        // Stream audio chunks to the client as they arrive
        for await (const chunk of communicate.stream()) {
            if (chunk.type === "audio" && chunk.data) {
                res.write(chunk.data);
            }
        }

        res.end();
    } catch (e) {
        console.error("[tts] Synthesis error:", e.message);
        // Only send error JSON if headers haven't been sent yet
        if (!res.headersSent) {
            return res.status(500).json({
                msg: e.message || "TTS synthesis failed",
            });
        }
        res.end();
    }
});

/**
 * GET /tts/voices
 * Returns the list of available Edge TTS voices.
 */
router.get("/voices", async (req, res) => {
    try {
        const voicesManager = await VoicesManager.create();
        const { language, gender } = req.query;

        // Build filter criteria
        const filter = {};
        if (language) filter.Language = language;
        if (gender) filter.Gender = gender;

        const voices =
            Object.keys(filter).length > 0
                ? voicesManager.find(filter)
                : voicesManager.find({ Language: "en" }); // default to English

        // Return a simplified list for the frontend
        const simplified = voices.map((v) => ({
            name: v.ShortName,
            friendlyName: v.FriendlyName,
            locale: v.Locale,
            gender: v.Gender,
        }));

        return res.status(200).json(simplified);
    } catch (e) {
        console.error("[tts] Voices fetch error:", e.message);
        return res.status(500).json({
            msg: e.message || "Failed to fetch voices",
        });
    }
});

export default router;
