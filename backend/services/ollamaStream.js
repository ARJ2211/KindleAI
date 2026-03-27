import { ollamaConfig } from "../config/settings.js";

/**
 * Stream a chat completion from Ollama (/api/chat, stream: true).
 * Calls onToken for each text delta from message.content.
 *
 * @param {{ role: string, content: string }[]} messages
 * @param {(piece: string) => void} onToken
 * @param {AbortSignal} [outerSignal]
 * @returns {Promise<void>}
 */
export async function streamOllamaChat(messages, onToken, outerSignal) {
    const { baseUrl, model, timeoutMs } = ollamaConfig;
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    if (outerSignal) {
        if (outerSignal.aborted) controller.abort();
        else outerSignal.addEventListener("abort", onAbort, { once: true });
    }
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(`${baseUrl}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model, messages, stream: true }),
            signal: controller.signal,
        });

        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(
                `Ollama error ${res.status}: ${errBody.slice(0, 240)}`,
            );
        }

        if (!res.body) {
            throw new Error("Ollama returned empty body");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                try {
                    const json = JSON.parse(trimmed);
                    const piece = json.message?.content;
                    if (piece) onToken(piece);
                } catch {
                    // ignore malformed stream lines
                }
            }
        }

        const tail = buffer.trim();
        if (tail) {
            try {
                const json = JSON.parse(tail);
                const piece = json.message?.content;
                if (piece) onToken(piece);
            } catch {
                /* ignore */
            }
        }
    } finally {
        clearTimeout(timer);
        if (outerSignal) {
            outerSignal.removeEventListener("abort", onAbort);
        }
    }
}
