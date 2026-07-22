import { createError, readBody } from "h3";
import { useRuntimeConfig } from "#imports";
import { z } from "zod";

const contactSubmissionSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  phone: z.string().trim().max(50).nullable().optional(),
  subject: z.string().trim().max(200).nullable().optional(),
  message: z.string().trim().min(1).max(5000),
});

const CONTACT_SUBMISSION_TIMEOUT_MS = 10_000;

async function readSupabaseError(response: Response) {
  const raw = await response.text();

  if (!raw) {
    return response.statusText || "Unknown database error.";
  }

  try {
    const parsed = JSON.parse(raw) as {
      message?: string;
      details?: string;
      hint?: string;
    };

    return parsed.message ?? parsed.details ?? parsed.hint ?? raw;
  } catch {
    return raw;
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  timeoutMessage: string,
) {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    const timeoutPromise = new Promise<Response>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(
          createError({
            statusCode: 504,
            statusMessage: timeoutMessage,
          }),
        );
      }, timeoutMs);
    });

    return await Promise.race([
      fetch(url, {
        ...init,
        signal: controller.signal,
      }),
      timeoutPromise,
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export default defineEventHandler(async (event) => {
  const parsedBody = contactSubmissionSchema.safeParse(await readBody(event));
  if (!parsedBody.success) {
    throw createError({
      statusCode: 400,
      statusMessage:
        parsedBody.error.issues[0]?.message ?? "Invalid enquiry data.",
    });
  }

  const body = parsedBody.data;
  const config = useRuntimeConfig();
  const supabaseUrl = config.public.supabase?.url ?? config.public.supabaseUrl;
  const supabaseKey =
    config.supabase.secretKey ??
    config.supabase.serviceKey ??
    config.supabaseSecretKey;

  if (!supabaseUrl || !supabaseKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Supabase is not configured for contact submissions.",
    });
  }

  const response = await fetchWithTimeout(
    `${supabaseUrl}/rest/v1/contact_submissions`,
    {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        name: body.name,
        email: body.email,
        phone: body.phone ?? null,
        subject: body.subject ?? null,
        message: body.message,
      }),
    },
    CONTACT_SUBMISSION_TIMEOUT_MS,
    "Contact submission timed out. Please try again.",
  );

  if (!response.ok) {
    const errorMessage = await readSupabaseError(response);
    console.error("[contact-submissions] Failed to insert submission", {
      status: response.status,
      errorMessage,
      email: body.email,
    });

    throw createError({
      statusCode: response.status >= 500 ? 500 : 400,
      statusMessage: errorMessage || "Could not submit your enquiry.",
    });
  }

  return { ok: true };
});
