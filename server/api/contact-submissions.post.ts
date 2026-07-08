import { z } from "zod";

const contactSubmissionSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  phone: z.string().trim().max(50).nullable().optional(),
  subject: z.string().trim().max(200).nullable().optional(),
  message: z.string().trim().min(1).max(5000),
});

export default defineEventHandler(async (event) => {
  const body = contactSubmissionSchema.parse(await readBody(event));
  const config = useRuntimeConfig();
  const supabaseUrl = config.public.supabase?.url ?? config.public.supabaseUrl;
  const supabaseKey = config.supabase.secretKey ?? config.supabaseSecretKey;

  const response = await fetch(
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
  );

  if (!response.ok) {
    throw createError({
      statusCode: 500,
      statusMessage: "Could not submit your enquiry.",
    });
  }

  return { ok: true };
});
