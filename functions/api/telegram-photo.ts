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

const TELEGRAM_API_TIMEOUT_MS = 15000;

const jsonResponse = (payload: unknown, status = 200, headers?: Record<string, string>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const onRequest = async ({
  request,
  env
}: {
  request: Request;
  env: Record<string, string | undefined>;
}) => {
  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405, { Allow: "GET" });
  }

  const botToken = env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return jsonResponse({ error: "Telegram bot token tidak tersedia." }, 500);
  }

  try {
    const url = new URL(request.url);
    const fileId = url.searchParams.get("file_id");

    if (!fileId) {
      return jsonResponse({ error: "file_id parameter is required" }, 400);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TELEGRAM_API_TIMEOUT_MS);

    const fileInfoResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`,
      { signal: controller.signal }
    ).catch((error) => {
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
      return jsonResponse({ error: description }, fileInfoResponse.status || 502);
    }

    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileInfo.result.file_path}`;

    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), TELEGRAM_API_TIMEOUT_MS);

    const fileResponse = await fetch(fileUrl, { signal: controller2.signal }).catch((error) => {
      if ((error as Error).name === "AbortError") {
        throw new Error("File download from Telegram timed out.");
      }
      throw error;
    });

    clearTimeout(timeout2);

    if (!fileResponse.ok) {
      console.error("Failed to download file from Telegram");
      return jsonResponse({ error: "Failed to download file from Telegram" }, fileResponse.status || 502);
    }

    const arrayBuffer = await fileResponse.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    const contentType = fileResponse.headers.get("content-type") || "image/jpeg";
    const dataUrl = `data:${contentType};base64,${base64}`;

    return jsonResponse(
      {
        ok: true,
        dataUrl,
        contentType,
        size: arrayBuffer.byteLength
      },
      200,
      { "Cache-Control": "public, max-age=86400" }
    );
  } catch (error) {
    console.error("Failed to fetch Telegram photo:", error);
    return jsonResponse({ error: "Failed to fetch Telegram photo." }, 500);
  }
};
