"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/Button";
import { InputField } from "@/components/Forms/Input";
import { Heading } from "@/components/Headings";
import styles from "./Subscribe.module.scss";
import { useSubscribe } from "./useSubscribe";

export default function SubscribeForm() {
  const t = useTranslations();
  const { email, setEmail, firstName, setFirstName, lastName, setLastName, status, errorMessage, handleSubmit } =
    useSubscribe();

  return (
    <div className={styles.form}>
      <Heading as="h2" size="base" highlight>
        {t("Subscribe.title")}
      </Heading>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <InputField
          label={t("Subscribe.emailPlaceholder")}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <InputField
          label={t("Subscribe.firstNamePlaceholder")}
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <InputField
          label={t("Subscribe.lastNamePlaceholder")}
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />

        <Button
          type="submit"
          disabled={status === "loading"}
          variant="primary"
          iconAfter="Send"
          label={status === "loading" ? t("Subscribe.subscribing") : t("Subscribe.button")}
        />

        {status === "success" && <p className="text-green-600 text-sm">{t("Subscribe.successMessage")} 🎉</p>}

        {status === "error" && <p className="text-red-600 text-sm">{errorMessage}</p>}
      </form>
    </div>
  );
}
