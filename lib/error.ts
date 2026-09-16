/**
 * Centralized error extraction utility for API responses.
 *
 * Handles:
 * - FastAPI string detail:      { "detail": "Email already registered" }
 * - FastAPI validation errors:  { "detail": [{ "loc": [...], "msg": "..." }] }
 * - Generic message field:      { "message": "..." }
 * - HTTP status-based fallbacks (401, 403, 404, 413, 422, 500)
 */

type LangKey = "id" | "en" | string;

const STATUS_MESSAGES: Record<number, { id: string; en: string }> = {
  401: {
    id: "Sesi login Anda telah berakhir. Silakan masuk kembali.",
    en: "Your session has expired. Please sign in again.",
  },
  403: {
    id: "Anda tidak memiliki izin untuk melakukan tindakan ini.",
    en: "You do not have permission to perform this action.",
  },
  404: {
    id: "Data yang diminta tidak ditemukan.",
    en: "The requested data was not found.",
  },
  413: {
    id: "Ukuran file terlalu besar untuk server.",
    en: "The file is too large for the server.",
  },
  422: {
    id: "Data yang dikirim tidak valid. Periksa kembali isian Anda.",
    en: "The submitted data is invalid. Please check your inputs.",
  },
  500: {
    id: "Terjadi gangguan pada server. Coba lagi nanti.",
    en: "A server error occurred. Please try again later.",
  },
};

/**
 * Extract a human-readable error message from a fetch Response.
 *
 * @param res      - The fetch Response object (already checked `!res.ok`)
 * @param fallback - A fallback message if nothing meaningful can be extracted
 * @param lang     - "id" | "en" to pick a localised status-level fallback
 * @returns        A user-friendly error string
 */
export async function extractErrorMessage(
  res: Response,
  fallback: string,
  lang: LangKey = "id",
): Promise<string> {
  const isId = lang === "id";

  // Try to parse the JSON body
  let body: any;
  try {
    body = await res.json();
  } catch {
    // If JSON parsing fails, fall through to status-based message
  }

  if (body) {
    // FastAPI string detail
    if (typeof body.detail === "string" && body.detail.trim()) {
      return body.detail;
    }

    // FastAPI 422 validation array
    if (Array.isArray(body.detail) && body.detail.length > 0) {
      const msgs = body.detail
        .map((e: any) => {
          if (typeof e === "string") return e;
          if (typeof e?.msg === "string") return e.msg;
          return null;
        })
        .filter(Boolean);
      if (msgs.length > 0) return msgs.join(". ");
    }

    // Generic message field
    if (typeof body.message === "string" && body.message.trim()) {
      return body.message;
    }

    // Generic error field
    if (typeof body.error === "string" && body.error.trim()) {
      return body.error;
    }
  }

  // Status-based localised fallback
  const statusMsg = STATUS_MESSAGES[res.status];
  if (statusMsg) {
    return isId ? statusMsg.id : statusMsg.en;
  }

  return fallback;
}

/**
 * Extract error message from an already-caught Error or unknown value.
 * Useful in `catch` blocks where you don't have the Response anymore.
 */
export function getErrorMessage(err: unknown, fallback = "Error"): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  return fallback;
}
