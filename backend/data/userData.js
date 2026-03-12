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

/**
 * Get a user by their Firebase UID.
 *
 * @param {string} firebaseUid
 * @returns {{ _id: string, email: string, display_name: string, created_at: Date, preferences: object }}
 */
export async function getUserById(firebaseUid) {
    if (!firebaseUid) {
        throw { status: 400, msg: "firebaseUid is required" };
    }

    const usersCol = await users();
    const user = await usersCol.findOne({ _id: firebaseUid });

    if (!user) {
        throw { status: 404, msg: "user not found" };
    }

    return user;
}

/**
 * Get a user by email.
 *
 * @param {string} email
 * @returns {{ _id: string, email: string, display_name: string, created_at: Date, preferences: object }}
 */
export async function getUserByEmail(email) {
    email = helper.isValidEmail(email);

    const usersCol = await users();
    const user = await usersCol.findOne({ email: email });

    if (!user) {
        throw { status: 404, msg: "user not found" };
    }

    return user;
}

/**
 * Delete a user document.
 *
 * @param {string} firebaseUid
 * @returns {boolean} true if deleted
 */
export async function deleteUser(firebaseUid) {
    if (!firebaseUid) {
        throw { status: 400, msg: "firebaseUid is required" };
    }

    const usersCol = await users();
    const result = await usersCol.deleteOne({ _id: firebaseUid });

    if (result.deletedCount === 0) {
        throw { status: 404, msg: "user not found" };
    }

    return true;
}

/**
 * Update a user's reader preferences (theme, font_size, tts_voice).
 * Merges with existing preferences so you can update one field at a time.
 *
 * @param {string} firebaseUid
 * @param {object} prefs
 * @param {string} [prefs.theme]
 * @param {number} [prefs.font_size]
 * @param {string} [prefs.tts_voice]
 * @returns {{ _id: string, email: string, display_name: string, created_at: Date, preferences: object }}
 */
export async function updatePreferences(firebaseUid, prefs) {
    if (!firebaseUid) {
        throw { status: 400, msg: "firebaseUid is required" };
    }

    const setFields = {};

    if (prefs.theme !== undefined) {
        setFields["preferences.theme"] = prefs.theme;
    }
    if (prefs.font_size !== undefined) {
        if (
            typeof prefs.font_size !== "number" ||
            prefs.font_size < 8 ||
            prefs.font_size > 48
        ) {
            throw {
                status: 400,
                msg: "font_size must be a number between 8 and 48",
            };
        }
        setFields["preferences.font_size"] = prefs.font_size;
    }
    if (prefs.tts_voice !== undefined) {
        setFields["preferences.tts_voice"] = prefs.tts_voice;
    }

    if (Object.keys(setFields).length === 0) {
        throw { status: 400, msg: "No valid preference fields provided" };
    }

    const usersCol = await users();
    const result = await usersCol.findOneAndUpdate(
        { _id: firebaseUid },
        { $set: setFields },
        { returnDocument: "after" },
    );

    if (!result) {
        throw { status: 404, msg: `User ${firebaseUid} not found` };
    }

    return result;
}
