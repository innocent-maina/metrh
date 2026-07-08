import { z } from "zod";

const pagePulseSchema = z.object({
  sessionId: z.string().uuid(),
  path: z.string().trim().min(1).max(2048),
  title: z.string().trim().max(500).nullable().optional(),
  referrer: z.string().trim().max(2048).nullable().optional(),
  language: z.string().trim().max(50).nullable().optional(),
  screenWidth: z.number().int().positive().max(10000).nullable().optional(),
  screenHeight: z.number().int().positive().max(10000).nullable().optional(),
  viewportWidth: z.number().int().positive().max(10000).nullable().optional(),
  viewportHeight: z.number().int().positive().max(10000).nullable().optional(),
});

export default defineEventHandler(async (event) => {
  const body = pagePulseSchema.parse(await readBody(event));
  const config = useRuntimeConfig();
  const supabaseUrl = config.public.supabase?.url ?? config.public.supabaseUrl;
  const supabaseKey = config.supabase.secretKey ?? config.supabaseSecretKey;
  const payload = {
    session_id: body.sessionId,
    path: body.path,
    page_title: body.title ?? null,
    referrer: body.referrer ?? null,
    language: body.language ?? null,
    user_agent: getRequestHeader(event, "user-agent") ?? null,
    ip_address: getRequestIP(event) ?? null,
    screen_width: body.screenWidth ?? null,
    screen_height: body.screenHeight ?? null,
    viewport_width: body.viewportWidth ?? null,
    viewport_height: body.viewportHeight ?? null,
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/page_pulses`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw createError({
      statusCode: 500,
      statusMessage: "Could not record page activity.",
    });
  }

  return { ok: true };
});
