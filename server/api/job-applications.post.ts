import { z } from "zod";

const jobApplicationSchema = z.object({
  jobSlug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/),
  applicantName: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  phone: z.string().trim().max(50).nullable().optional(),
  coverLetter: z.string().trim().max(5000).nullable().optional(),
  resumeUrl: z.string().trim().min(1),
});

export default defineEventHandler(async (event) => {
  const body = jobApplicationSchema.parse(await readBody(event));
  const config = useRuntimeConfig();
  const supabaseUrl = config.public.supabase?.url ?? config.public.supabaseUrl;
  const supabaseKey = config.supabase.secretKey ?? config.supabaseSecretKey;

  const postingResponse = await fetch(
    `${supabaseUrl}/rest/v1/job_postings?slug=eq.${body.jobSlug}&select=id,status,slug`,
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

  if (!body.resumeUrl.startsWith(`applications/${body.jobSlug}/`)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Resume path is invalid.",
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
      }),
    },
  );

  if (!response.ok) {
    throw createError({
      statusCode: 500,
      statusMessage: "Could not submit your application.",
    });
  }

  return { ok: true };
});
