import { users } from "./config/mongoCollections.js";

/**
 * Used for throwing consistent errors up to routes.
 *
 * @param {Number} status
 * @param {String} msg
 */
export const throwError = (status, msg) => {
    throw { status, msg };
};

/**
 * Used for validating the type of variable and making
 * sure it is of valid string. We return a trimmed string.
 *
 * @param {*} val
 * @returns {String}
 */
export const isValidString = (val) => {
    if (typeof val !== "string") {
        throwError(400, `ERROR: ${val} is not a valid string.`);
    }
    val = val.trim();
    if (val.length === 0) {
        throwError(400, `ERROR: empty string detected.`);
    }
    return val;
};

/**
 * Check if the value is a valid email address.
 *
 * @param {*} val
 * @returns {String}
 */
export const isValidEmail = (val) => {
    val = isValidString(val);
    val = val.toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
        throwError(400, `ERROR: ${val} is not a valid email address.`);
    }

    return val;
};

/**
 * Check if the value is a valid display name.
 * Must be between 2 and 20 characters.
 *
 * THIS ALSO CHECKS FOR DUPLICATE USERNAMES!
 * @param {*} val
 * @returns {String}
 */
export const isValidDisplayName = async (val) => {
    const displayName = isValidString(val);

    const usersCol = await users();
    const existing = await usersCol.findOne({
        display_name: displayName,
    });
    if (existing) {
        throw {
            status: 409,
            msg: `Display name ${displayName} is already taken`,
        };
    }

    if (val.length < 2) {
        throwError(
            400,
            `ERROR: displayName must be at least 2 characters long`,
        );
    }

    if (val.length > 20) {
        throwError(
            400,
            `ERROR: displayName must be at most 20 characters long`,
        );
    }

    return val;
};

/**
 * Check if the value is a valid password.
 * Must be at least 8 characters with at least one uppercase letter,
 * one lowercase letter, one number, and one special character.
 *
 * @param {*} val
 * @returns {String}
 */
export const isValidPassword = (val) => {
    val = isValidString(val);

    if (val.length < 8) {
        throwError(400, `ERROR: password must be at least 8 characters long`);
    }

    if (/\s/.test(val)) {
        throwError(400, `ERROR: password may not contain spaces`);
    }

    if (!/[a-z]/.test(val)) {
        throwError(
            400,
            `ERROR: password must contain at least one lowercase letter`,
        );
    }

    if (!/[A-Z]/.test(val)) {
        throwError(
            400,
            `ERROR: password must contain at least one uppercase letter`,
        );
    }

    if (!/[0-9]/.test(val)) {
        throwError(400, `ERROR: password must contain at least one number`);
    }

    if (!/[^A-Za-z0-9]/.test(val)) {
        throwError(
            400,
            `ERROR: password must contain at least one special character`,
        );
    }

    return val;
};
