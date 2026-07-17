import { createError, readBody } from "h3";
import { z } from "zod";
import { useRuntimeConfig } from "#imports";

const jobApplicationSchema = z.object({
  jobSlug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/i)
    .transform((value) => value.toLowerCase()),
  applicantName: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  phone: z.string().trim().max(50).nullable().optional(),
  coverLetter: z.string().trim().max(5000).nullable().optional(),
  resumeUrl: z.string().trim().min(1),
  supportingDocumentUrl: z.string().trim().min(1).nullable().optional(),
});

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

export default defineEventHandler(async (event) => {
  const parsedBody = jobApplicationSchema.safeParse(await readBody(event));
  if (!parsedBody.success) {
    throw createError({
      statusCode: 400,
      statusMessage:
        parsedBody.error.issues[0]?.message ?? "Invalid application data.",
    });
  }

  const body = parsedBody.data;
  const config = useRuntimeConfig();
  const supabaseUrl = config.public.supabase?.url ?? config.public.supabaseUrl;
  const supabaseKey = config.supabase.secretKey ?? config.supabaseSecretKey;

  const postingResponse = await fetch(
    `${supabaseUrl}/rest/v1/job_postings?slug=ilike.${encodeURIComponent(body.jobSlug)}&select=id,status,slug`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    },
  );

  if (!postingResponse.ok) {
    throw createError({
      statusCode: 500,
      statusMessage: "Could not verify the job posting.",
    });
  }

  const postings = (await postingResponse.json()) as Array<{
    id: string;
    status: string;
    slug: string;
  }>;

  const posting = postings[0];
  if (!posting || posting.status !== "open") {
    throw createError({
      statusCode: 400,
      statusMessage: "This posting is no longer open.",
    });
  }

  const resumePrefix = `applications/${body.jobSlug}/`;

  if (!body.resumeUrl.toLowerCase().startsWith(resumePrefix)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Resume path is invalid.",
    });
  }

  if (
    body.supportingDocumentUrl &&
    !body.supportingDocumentUrl.toLowerCase().startsWith(resumePrefix)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Supporting document path is invalid.",
    });
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/job_applications`,
    {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        job_id: posting.id,
        applicant_name: body.applicantName,
        email: body.email,
        phone: body.phone ?? null,
        cover_letter: body.coverLetter ?? null,
        resume_url: body.resumeUrl,
        supporting_document_url: body.supportingDocumentUrl ?? null,
      }),
    },
  );

  if (!response.ok) {
    const errorMessage = await readSupabaseError(response);

    console.error("[job-applications] Failed to insert application", {
      status: response.status,
      errorMessage,
      jobSlug: body.jobSlug,
      applicantName: body.applicantName,
    });

    throw createError({
      statusCode: response.status >= 500 ? 500 : 400,
      statusMessage: errorMessage || "Could not submit your application.",
    });
  }

  return { ok: true };
});
