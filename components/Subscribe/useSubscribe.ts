"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

export type SubscribeStatus = "idle" | "loading" | "success" | "error";

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
          email,
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
    setEmail,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    status,
    errorMessage,
    handleSubmit,
  };
}
