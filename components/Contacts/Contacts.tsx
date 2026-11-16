"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { InputField } from "@/components/Forms/Input";
import { Select } from "@/components/Forms/Select";
import { Heading } from "@/components/Headings";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { Sidebar } from "@/components/Sidebar";
// Direct path: the Widgets index also re-exports the server-only MembershipConnector.
import { DonateWidget } from "@/components/Widgets/Donate";
import type { SocialLink } from "@/utils/menuHelpers";
import styles from "./Contacts.module.scss";

type FormStatus = "pending" | "ok" | "error" | null;

/** Subjects offered in the form; `?topic=<key>` on the URL preselects one. */
export const CONTACT_TOPICS = ["general", "event", "directory", "partnership", "other"] as const;

const MESSAGE_MAX = 1000;

interface ContactsProps {
  /** Success text from Contentful (falls back to the translation). */
  message?: string;
  /** Error text from Contentful (falls back to the translation). */
  errorMessage?: string;
  /** Locale prefix ("" for bg, "/en", "/fr"). */
  localePrefix?: string;
  /** Social links from the footer, shown as "community channels". */
  channels?: SocialLink[];
}

/**
 * Contacts page body: header band, the contact form card (Netlify Forms — the
 * field list must match public/__forms.html) beside a channels/donate sidebar,
 * and a navy "add to the directory / suggest an event" banner.
 */
export const Contacts = ({ message, errorMessage, localePrefix = "", channels = [] }: ContactsProps) => {
  const t = useTranslations("Contact");
  const [status, setStatus] = useState<FormStatus>(null);
  const [topic, setTopic] = useState("");
  const [length, setLength] = useState(0);

  // Preselect the subject from links like /contacts?topic=event.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("topic") ?? "";
    if ((CONTACT_TOPICS as readonly string[]).includes(fromUrl)) setTopic(fromUrl);
  }, []);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      setStatus("pending");
      const res = await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(form) as unknown as Record<string, string>).toString(),
      });
      if (res.ok) {
        setStatus("ok");
        form.reset();
        setTopic("");
        setLength(0);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <PageHeader
        crumbs={[{ label: t("breadcrumbHome"), href: localePrefix || "/" }, { label: t("pageTitle") }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        titleAccent={t("titleAccent")}
        intro={t("intro")}
      />

      <div className="page__with-sidebar" data-has-sidebar>
        <div className="page__main">
          <section className={styles.card} id="contact-form" aria-labelledby="contact-form-title">
            <span className={styles.card__eyebrow}>
              <Icon name="Mail" size={16} strokeWidth="1.8" />
              {t("formEyebrow")}
            </span>
            <Heading as="h2" size="h3" className={styles.card__title}>
              <span id="contact-form-title">{t("formTitle")}</span>
            </Heading>
            <p className={styles.card__intro}>{t("formIntro")}</p>

            <form name="feedback" className={styles.form} onSubmit={handleFormSubmit}>
              <input type="hidden" name="form-name" value="feedback" />
              <p hidden>
                <label>
                  Don't fill this out: <input name="bot-field" />
                </label>
              </p>

              <InputField label={t("name")} name="name" required minLength={2} placeholder={t("namePlaceholder")} />
              <InputField label={t("email")} name="email" type="email" required placeholder="georgi@example.com" />
              <InputField
                label={`${t("phone")} (${t("optional")})`}
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+1 (514) 000-0000"
              />
              <Select
                label={t("topic")}
                name="topic"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              >
                <option value="" disabled>
                  {t("topicPlaceholder")}
                </option>
                {CONTACT_TOPICS.map((key) => (
                  <option key={key} value={key}>
                    {t(`topics.${key}`)}
                  </option>
                ))}
              </Select>

              <label className={styles.form__message}>
                <span className={styles.form__label}>
                  {t("message")}
                  <span className={styles.form__count}>
                    {length} / {MESSAGE_MAX}
                  </span>
                </span>
                <textarea
                  name="message"
                  required
                  rows={6}
                  maxLength={MESSAGE_MAX}
                  placeholder={t("messagePlaceholder")}
                  onChange={(e) => setLength(e.target.value.length)}
                />
              </label>

              {/* Consent on the left, submit on the right. */}
              <div className={styles.form__footer}>
                <label className={styles.form__consent}>
                  <input type="checkbox" name="consent" value="yes" required />
                  <span>
                    {t("consent")}{" "}
                    <Link href={`${localePrefix}/privacy`} className="link">
                      <span className="link__text">{t("consentLink")}</span>
                    </Link>
                    .
                  </span>
                </label>
                <Button
                  type="submit"
                  variant="danger"
                  iconAfter="Send"
                  label={status === "pending" ? t("sending") : t("submit")}
                  disabled={status === "pending"}
                />
              </div>
              <output className={styles.form__status} aria-live="polite" data-status={status ?? undefined}>
                {status === "ok" && (message || t("success"))}
                {status === "error" && (errorMessage || t("error"))}
              </output>
            </form>
          </section>
        </div>

        <Sidebar>
          {channels.length > 0 && (
            <aside className={styles.channels}>
              <Heading as="h3" size="h4" className={styles.channels__title}>
                {t("channelsTitle")}
              </Heading>
              <ul className={styles.channels__list}>
                {channels.map((channel) => (
                  <li key={channel.id}>
                    <a
                      href={channel.url}
                      target={channel.external ? "_blank" : undefined}
                      rel={channel.external ? "noopener noreferrer" : undefined}
                      className={styles.channels__item}
                    >
                      <span className={styles.channels__icon}>
                        <Icon name={channel.iconName} size={18} strokeWidth="1.6" />
                      </span>
                      <span>{channel.name}</span>
                      <Icon name="ArrowUpRight" size={16} strokeWidth="1.6" className={styles.channels__arrow} />
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          )}
          <DonateWidget />
        </Sidebar>
      </div>

      <Section size="full" padding="medium">
        <aside className={styles.banner}>
          <div className={styles.banner__text}>
            <span className={styles.banner__eyebrow}>{t("bannerEyebrow")}</span>
            <Heading as="h2" size="h2" className={styles.banner__title}>
              {t("bannerTitle")}
            </Heading>
            <p>{t("bannerText")}</p>
          </div>
          <div className={styles.banner__actions}>
            <Button
              href={`${localePrefix}/contacts?topic=directory#contact-form`}
              variant="danger"
              icon="Plus"
              label={t("bannerDirectory")}
            />
            <Button
              href={`${localePrefix}/contacts?topic=event#contact-form`}
              variant="secondary"
              icon="CalendarPlus"
              label={t("bannerEvent")}
              className={styles.banner__secondary}
            />
          </div>
        </aside>
      </Section>
    </>
  );
};

export default Contacts;
