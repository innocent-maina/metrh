import { beforeEach, describe, expect, it, vi } from "vitest";

const contactSubmissionMocks = vi.hoisted(() => ({
  useRuntimeConfig: vi.fn(),
  readBody: vi.fn(),
}));

vi.mock("#imports", () => ({
  useRuntimeConfig: contactSubmissionMocks.useRuntimeConfig,
}));

vi.mock("h3", async () => {
  const actual = await vi.importActual<typeof import("h3")>("h3");
  return {
    ...actual,
    readBody: contactSubmissionMocks.readBody,
  };
});

import handler from "../../../../server/api/contact-submissions.post";

describe("server/api/contact-submissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    contactSubmissionMocks.useRuntimeConfig.mockReturnValue({
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

  it("submits a contact enquiry successfully", async () => {
    contactSubmissionMocks.readBody.mockResolvedValue({
      name: "Ada Lovelace",
      email: "ada@example.org",
      phone: "",
      subject: "Appointment",
      message: "Please call me back.",
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      statusText: "Created",
      text: async () => "",
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(handler({} as never)).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.supabase.co/rest/v1/contact_submissions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          apikey: "service-role-key",
          Authorization: "Bearer service-role-key",
        }),
      }),
    );
  });

  it("times out instead of hanging when Supabase never responds", async () => {
    vi.useFakeTimers();

    contactSubmissionMocks.readBody.mockResolvedValue({
      name: "Ada Lovelace",
      email: "ada@example.org",
      phone: null,
      subject: null,
      message: "Please call me back.",
    });

    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));

    const promise = handler({} as never).catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(promise).resolves.toMatchObject({
      statusCode: 504,
      statusMessage: "Contact submission timed out. Please try again.",
    });

    vi.useRealTimers();
  });
});
