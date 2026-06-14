import type { NextRequest } from "next/server";

type SubscribePayload = {
  email: string;
  firstName?: string;
  lastName?: string;
};

type ProviderResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

// Mirrors the client check in useSubscribe — rejects malformed addresses like
// "foo@gmailc" that the browser's lax type="email" validation lets through.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function subscribeMailchimp({ email, firstName, lastName }: SubscribePayload): Promise<ProviderResult> {
  const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
  const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;

  if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID) {
    console.error("Missing Mailchimp environment variables");
    return { ok: false, status: 500, error: "Server configuration error" };
  }

  // Extract data center from API key (format: key-dc, e.g., "abc123-us1")
  const MAILCHIMP_DC = MAILCHIMP_API_KEY.split("-").pop();

  const res = await fetch(`https://${MAILCHIMP_DC}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`, {
    method: "POST",
    headers: {
      Authorization: `apikey ${MAILCHIMP_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: email,
      status: "subscribed",
      merge_fields: { FNAME: firstName, LNAME: lastName },
    }),
  });

  if (res.status >= 400) {
    const errorData = await res.json();
    console.error("Mailchimp error:", errorData);

    let errorMessage = "Error subscribing";
    if (errorData.title === "Member Exists") {
      errorMessage = "Email address is already subscribed";
    } else if (errorData.title === "Invalid Resource") {
      errorMessage = "Invalid email address";
    }

    return { ok: false, status: 400, error: errorMessage };
  }

  return { ok: true };
}

async function subscribeBrevo({ email, firstName, lastName }: SubscribePayload): Promise<ProviderResult> {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const BREVO_LIST_ID = process.env.BREVO_LIST_ID;

  if (!BREVO_API_KEY || !BREVO_LIST_ID) {
    console.error("Missing Brevo environment variables");
    return { ok: false, status: 500, error: "Server configuration error" };
  }

  const res = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      email,
      attributes: { FIRSTNAME: firstName, LASTNAME: lastName },
      listIds: [Number(BREVO_LIST_ID)],
      updateEnabled: true,
    }),
  });

  // Brevo returns 201 (created) or 204 (updated) on success.
  if (res.status >= 400) {
    const errorData = await res.json().catch(() => ({}));
    console.error("Brevo error:", errorData);

    let errorMessage = "Error subscribing";
    if (errorData.code === "duplicate_parameter") {
      errorMessage = "Email address is already subscribed";
    } else if (errorData.code === "invalid_parameter") {
      errorMessage = "Invalid email address";
    }

    return { ok: false, status: 400, error: errorMessage };
  }

  return { ok: true };
}

export async function POST(req: NextRequest) {
  try {
    const { email, firstName, lastName } = (await req.json()) as SubscribePayload;

    if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
      return json({ error: "Invalid email address" }, 400);
    }

    const provider = (process.env.SUBSCRIBE_PROVIDER || "brevo").toLowerCase();

    const result =
      provider === "mailchimp"
        ? await subscribeMailchimp({ email, firstName, lastName })
        : await subscribeBrevo({ email, firstName, lastName });

    if (!result.ok) {
      return json({ error: result.error }, result.status);
    }

    return json({ success: true });
  } catch (error) {
    console.error("Subscribe error:", error);
    return json({ error: "Internal server error" }, 500);
  }
}
