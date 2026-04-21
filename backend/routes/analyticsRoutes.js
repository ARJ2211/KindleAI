import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import * as analyticsData from "../data/analyticsData.js";

const router = Router();

router.use(verifyToken);

router.get("/", async(req, res) => {
    try {
        const userId = req.user.uid;
        const analytics = await analyticsData.getUserAnalytics(userId);
        return res.status(200).json(analytics);
    } catch (error) {
        return res.status(error.status || 500).json({
            msg: error.msg || "Internal server error",
        });
    }
});

export default router;