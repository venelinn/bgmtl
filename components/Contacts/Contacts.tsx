"use client";

import cx from "clsx";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "../Button";
import styles from "./Contacts.module.scss";

type FormStatus = "pending" | "ok" | "error" | null;

interface ContactsProps {
  message?: string;
  errorMessage?: string;
}

export const Contacts = ({ message, errorMessage }: ContactsProps) => {
  const t = useTranslations();
  const [status, setStatus] = useState<FormStatus>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setStatus("pending");
      setError(null);

      const myForm = event.currentTarget;
      const formData = new FormData(myForm);

      const res = await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData as any).toString(),
      });

      if (res.status === 200) {
        setStatus("ok");
      } else {
        setStatus("error");
        setError(`${res.status} ${res.statusText}`);
      }
    } catch (e) {
      setStatus("error");
      setError(String(e));
    }
  };

  return (
    <div className={styles.contact}>
      <form name="feedback" onSubmit={handleFormSubmit}>
        <input type="hidden" name="form-name" value="feedback" />
        <p hidden>
          <label>
            Don't fill this out: <input name="bot-field" />
          </label>
        </p>

        <p className={styles.contact__item} data-anim-item>
          <label>
            <span>{t("Contact.name")}</span>
            <input
              aria-label={t("Contact.name")}
              required
              name="name"
              type="text"
              placeholder={t("Contact.name")}
              minLength={2}
            />
          </label>
        </p>

        <p className={styles.contact__item} data-anim-item>
          <label>
            <span>{t("Contact.email")}</span>
            <input
              name="email"
              type="email"
              aria-label={t("Contact.email")}
              required
              placeholder={t("Contact.email")}
            />
          </label>
        </p>

        <p className={styles.contact__item} data-anim-item>
          <label>
            <span>{t("Contact.message")}</span>
            <textarea
              name="message"
              placeholder={t("Contact.message")}
              aria-label={t("Contact.message")}
              required
              rows={5}
              cols={5}
            />
          </label>
        </p>

        <p className={cx(styles.contact__item, styles["contact__item--right"])} data-anim-item>
          <Button variant="primary" type="submit" label={t("Contact.submit")} disabled={status === "pending"} />
        </p>

        {status === "ok" && <div className="alert alert-success">{message}</div>}

        {status === "error" && <div className="alert alert-error">{errorMessage || error}</div>}
      </form>
    </div>
  );
};

export default Contacts;
