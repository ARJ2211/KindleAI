import { users } from "../config/mongoCollections.js";
import * as helper from "../helper.js";

/**
 * Create a new user document. Called after Firebase signup.
 * Uses the Firebase UID as the Mongo _id directly.
 *
 * @param {string} firebaseUid
 * @param {string} email
 * @param {string} displayName
 * @returns {Object}
 */
export async function createUser(firebaseUid, email, displayName) {
    firebaseUid = helper.isValidString(firebaseUid);
    email = helper.isValidEmail(email);
    displayName = await helper.isValidDisplayName(displayName);

    const usersCol = await users();

    // Check if display name is already taken
    const existing = await usersCol.findOne({
        display_name: displayName,
    });
    if (existing) {
        throw {
            status: 409,
            msg: `Display name ${displayName} is already taken`,
        };
    }

    const newUser = {
        _id: firebaseUid,
        email: email,
        display_name: displayName,
        created_at: new Date(),
        preferences: {
            theme: "light",
            font_size: 16,
            tts_voice: "default",
        },
    };

    const result = await usersCol.insertOne(newUser);
    if (!result.acknowledged) {
        throw { status: 500, msg: "Failed to create user" };
    }

    return newUser;
}
