import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const DEFAULT_TTL = 3600; // 1 hour in seconds

let _client = null;

/**
 * Get or create the Redis client. Connects on first call.
 *
 * @returns {object} connected Redis client
 */
export async function getRedisClient() {
    if (!_client) {
        _client = createClient({ url: REDIS_URL });
        _client.on("error", (err) => console.error("[redis] Error:", err));
        await _client.connect();
        console.log("[redis] Connected.");
    }
    return _client;
}

/**
 * Cache a value as JSON under the given key with a TTL.
 *
 * @param {string} key
 * @param {object} value
 * @param {number} ttl seconds (default 3600)
 */
export async function setCache(key, value, ttl = DEFAULT_TTL) {
    const client = await getRedisClient();
    await client.set(key, JSON.stringify(value), { EX: ttl });
}

/**
 * Retrieve a cached value by key. Returns null if not found.
 *
 * @param {string} key
 * @returns {object | null}
 */
export async function getCache(key) {
    const client = await getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
}

/**
 * Delete a cached key.
 *
 * @param {string} key
 */
export async function delCache(key) {
    const client = await getRedisClient();
    await client.del(key);
}
