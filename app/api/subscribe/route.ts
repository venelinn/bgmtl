import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, firstName, lastName } = await req.json();

    const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
    const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;

    if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID) {
      console.error("Missing Mailchimp environment variables");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract data center from API key (format: key-dc, e.g., "abc123-us1")
    const MAILCHIMP_DC = MAILCHIMP_API_KEY.split("-").pop();

    const data = {
      email_address: email,
      status: "subscribed",
      merge_fields: { FNAME: firstName, LNAME: lastName },
    };

    const res = await fetch(`https://${MAILCHIMP_DC}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`, {
      method: "POST",
      headers: {
        Authorization: `apikey ${MAILCHIMP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
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

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
