"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

export type SubscribeStatus = "idle" | "loading" | "success" | "error";

// Stricter than the browser's lax type="email" check (which accepts
// "foo@gmailc" with no TLD). Requires a dot-separated domain with a 2+ char TLD.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Shared mailing-list subscribe logic used by both the sidebar SubscribeForm
 * widget and the full-width Join section. Posts to /api/subscribe and exposes
 * the field state + submit handler so each surface can render its own markup.
 */
export function useSubscribe() {
  const t = useTranslations("Subscribe");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [status, setStatus] = useState<SubscribeStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function handleEmailChange(value: string) {
    setEmail(value);
    // Dismiss a lingering error as soon as the user edits the field again
    // (including clearing it) so the message doesn't linger over a fresh entry.
    if (status === "error") {
      setStatus("idle");
      setErrorMessage("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setErrorMessage(t("invalidEmail"));
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only send name fields when filled — the Join form is email-only, and
        // Brevo runs with updateEnabled:true, so sending "" would blank out an
        // existing contact's stored name on re-subscribe.
        body: JSON.stringify({
          email: trimmedEmail,
          ...(firstName.trim() && { firstName: firstName.trim() }),
          ...(lastName.trim() && { lastName: lastName.trim() }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.log("Subscribe error:", res.status, data);
        setErrorMessage(data.error || t("errorMessage"));
        setStatus("error");
        return;
      }

      setStatus("success");
      setEmail("");
      setFirstName("");
      setLastName("");
    } catch {
      setErrorMessage(t("errorMessage"));
      setStatus("error");
    }
  }

  return {
    email,
    setEmail: handleEmailChange,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    status,
    errorMessage,
    handleSubmit,
  };
}
