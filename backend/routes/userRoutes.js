import { Router } from "express";
import { fireBaseAdmin } from "../app.js";

import * as helper from "../helper.js";
import * as userData from "../data/userData.js";

const router = Router();

// Sign up API call (uses firebase auth)
router.post("/signup", async (req, res) => {
    try {
        const email = helper.isValidEmail(req.body?.email);
        const password = helper.isValidPassword(req.body?.password);
        const displayName = await helper.isValidDisplayName(
            req.body?.displayName,
        );

        const userResponse = await fireBaseAdmin.auth().createUser({
            email: email,
            password: password,
            emailVerified: false,
            disabled: false,
        });

        const createdUser = await userData.createUser(
            userResponse.uid,
            userResponse.email,
            displayName,
        );

        return res.status(200).json(createdUser);
    } catch (e) {
        if (e?.code === "auth/email-already-exists") {
            return res.status(400).json({
                msg: e.message,
            });
        }
        return res.status(e.status || 500).json({
            msg: e.msg || "Internal server error",
        });
    }
});

// EXPORT THE CREATED ROUTER
export default router;
