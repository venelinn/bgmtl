import clsx from "clsx";
import React, { forwardRef, useId, useState } from "react";
import { Icon } from "@/components/Icon";
import type { FormElementSize } from "@/types/forms";
import styles from "./Select.module.scss";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id?: string;
  label?: string;
  placeholder?: string;
  full?: boolean;
  icon?: string;
  error?: string;
  value?: string | number | readonly string[] | undefined;
  inputSize?: FormElementSize;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  children?: React.ReactNode;
  theme?: "light" | "dark";
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>((props, ref) => {
  const {
    id,
    label,
    placeholder,
    full,
    icon,
    error,
    value,
    defaultValue,
    inputSize,
    onChange,
    children,
    theme = "light",
    ...rest
  } = props;

  const [internalValue, setInternalValue] = useState(() => {
    if (defaultValue !== undefined) return defaultValue;
    if (placeholder) return "";
    const arr = React.Children.toArray(children);
    const first = arr.find((c) => React.isValidElement(c)) as
      | React.ReactElement<{ value?: string | number | readonly string[] }>
      | undefined;
    return first?.props?.value ?? "";
  });
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isControlled) {
      setInternalValue(e.target.value);
    }
    onChange?.(e);
  };

  const internalId = useId();
  const selectId = id || internalId;

  const classes = clsx(styles.select, inputSize === "sm" && styles.sm, full && styles.full, error && styles.error);

  return (
    <div className={classes} data-theme={theme}>
      {icon && <Icon name={icon} strokeWidth="1.2" className={styles.select__icon} />}
      {label && (
        <label htmlFor={selectId} className={styles.select__label}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        className={styles.select__control}
        value={currentValue}
        onChange={handleChange}
        aria-invalid={error ? "true" : undefined}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      {error && <span className={styles.select__error}>{error}</span>}
    </div>
  );
});

Select.displayName = "Select";
