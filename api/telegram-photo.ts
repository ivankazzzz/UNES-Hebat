import type { IncomingMessage, ServerResponse } from "http";

const TELEGRAM_API_TIMEOUT_MS = 15000;

interface TelegramGetFileResponse {
    ok: boolean;
    result?: {
        file_id: string;
        file_unique_id: string;
        file_size?: number;
        file_path?: string;
    };
    description?: string;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== "GET") {
        res.statusCode = 405;
        res.setHeader("Allow", "GET");
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Method not allowed" }));
        return;
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Telegram bot token tidak tersedia." }));
        return;
    }

    try {
        // Parse query parameters from URL
        const url = new URL(req.url || "", `http://${req.headers.host}`);
        const fileId = url.searchParams.get("file_id");

        if (!fileId) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "file_id parameter is required" }));
            return;
        }

        // Get file path from Telegram
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TELEGRAM_API_TIMEOUT_MS);

        const fileInfoResponse = await fetch(
            `https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`,
            { signal: controller.signal }
        ).catch(error => {
            if ((error as Error).name === "AbortError") {
                throw new Error("Request to Telegram timed out.");
            }
            throw error;
        });

        clearTimeout(timeout);

        const fileInfo = (await fileInfoResponse.json()) as TelegramGetFileResponse;

        if (!fileInfoResponse.ok || !fileInfo.ok || !fileInfo.result?.file_path) {
            const description = fileInfo.description || "Failed to get file info from Telegram";
            console.error("Telegram getFile error:", description);
            res.statusCode = fileInfoResponse.status || 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: description }));
            return;
        }

        // Download the file
        const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileInfo.result.file_path}`;
        
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), TELEGRAM_API_TIMEOUT_MS);

        const fileResponse = await fetch(fileUrl, { signal: controller2.signal }).catch(error => {
            if ((error as Error).name === "AbortError") {
                throw new Error("File download from Telegram timed out.");
            }
            throw error;
        });

        clearTimeout(timeout2);

        if (!fileResponse.ok) {
            console.error("Failed to download file from Telegram");
            res.statusCode = fileResponse.status || 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Failed to download file from Telegram" }));
            return;
        }

        // Get the image as a buffer
        const arrayBuffer = await fileResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Convert to base64
        const base64 = buffer.toString('base64');
        const contentType = fileResponse.headers.get('content-type') || 'image/jpeg';
        const dataUrl = `data:${contentType};base64,${base64}`;

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
        res.end(JSON.stringify({ 
            ok: true, 
            dataUrl,
            contentType,
            size: buffer.length
        }));
    } catch (error) {
        console.error("Failed to fetch Telegram photo:", error);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Failed to fetch Telegram photo." }));
    }
}
