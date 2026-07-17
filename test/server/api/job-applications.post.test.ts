import { beforeEach, describe, expect, it, vi } from "vitest";

const jobApplicationMocks = vi.hoisted(() => ({
  useRuntimeConfig: vi.fn(),
  readBody: vi.fn(),
}));

vi.mock("#imports", () => ({
  useRuntimeConfig: jobApplicationMocks.useRuntimeConfig,
}));

vi.mock("h3", async () => {
  const actual = await vi.importActual<typeof import("h3")>("h3");
  return {
    ...actual,
    readBody: jobApplicationMocks.readBody,
  };
});

import handler from "../../../../server/api/job-applications.post";

describe("server/api/job-applications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jobApplicationMocks.useRuntimeConfig.mockReturnValue({
      public: {
        supabase: {
          url: "https://example.supabase.co",
        },
        supabaseUrl: "https://example.supabase.co",
      },
      supabase: {
        secretKey: "service-role-key",
      },
    });
  });

  it("accepts uppercase job slugs and normalizes them before lookup", async () => {
    jobApplicationMocks.readBody.mockResolvedValue({
      jobSlug: "TEST",
      applicantName: "Test Applicant",
      email: "test@example.com",
      phone: "43948394834",
      coverLetter: "FERERERE",
      resumeUrl: "applications/test/1784267095188-Kibush-Chege-NL-QTN-3454.pdf",
      supportingDocumentUrl:
        "applications/test/1784267098347-Kibush-Chege-NL-QTN-3454.pdf",
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => [{ id: "job-1", status: "open", slug: "test" }],
        text: async () => "",
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        statusText: "Created",
        text: async () => "",
      });

    vi.stubGlobal("fetch", fetchMock);

    await expect(handler({} as never)).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("slug=ilike.test"),
      expect.objectContaining({
        headers: expect.objectContaining({
          apikey: "service-role-key",
          Authorization: "Bearer service-role-key",
        }),
      }),
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://example.supabase.co/rest/v1/job_applications",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });
});
