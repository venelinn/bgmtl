"use client";

import clsx from "clsx";
import { type ComponentProps, useId } from "react";
import { useFormStatus } from "react-dom";
import styles from "./Input.module.scss";

export default function InputField({
  label,
  autoFocus,
  error,
  id: externalId,
  ...rest
}: {
  label: string;
  autoFocus?: boolean;
  error?: string;
} & ComponentProps<"input">) {
  const { pending } = useFormStatus();
  const generatedId = useId();
  const inputId = externalId || generatedId;

  return (
    <div className={clsx(styles.input, error && styles.error)}>
      <label htmlFor={inputId} className={styles.input__label}>{label}</label>
      <input id={inputId} autoFocus={autoFocus} className={styles.input__control} disabled={pending} {...rest} />
      {error && <span className={styles.input__error}>{error}</span>}
    </div>
  );
}

export { InputField };
