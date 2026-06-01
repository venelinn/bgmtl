"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Heading } from "@/components/Headings";
import { Icon } from "@/components/Icon";
import type { MembershipConfig, MembershipTier } from "@/utils/content";
import styles from "./Membership.module.scss";

const DEFAULT_ACTION = "https://www.paypal.com/cgi-bin/webscr";

export type MembershipWidgetProps = MembershipConfig;

export const MembershipWidget = ({
  title,
  description,
  selectLabel,
  buttonLabel,
  trustText,
  hostedButtonId,
  paypalOptionName,
  currencyCode,
  paypalAction,
  tiers,
}: MembershipWidgetProps) => {
  const list: MembershipTier[] = Array.isArray(tiers) ? tiers : [];
  const [selected, setSelected] = useState(list[0]?.value ?? "");

  // Without tiers or a PayPal button there's nothing to post — render nothing.
  if (!list.length || !hostedButtonId) return null;

  const useSelect = list.length > 3;

  return (
    <aside className={styles["membership-widget"]}>
      {title && (
        <Heading as="h2" size="base" highlight>
          {title}
        </Heading>
      )}

      <div className={styles["membership-widget__media"]}>
        <span className={styles["membership-widget__icon"]}>
          <Icon name="Users" size={22} strokeWidth="1.8" />
        </span>
        {description && <p className={styles["membership-widget__text"]}>{description}</p>}
      </div>

      <form
        action={paypalAction || DEFAULT_ACTION}
        method="post"
        target="_blank"
        rel="noopener noreferrer"
        className={styles["membership-widget__form"]}
      >
        <input type="hidden" name="cmd" value="_s-xclick" />
        <input type="hidden" name="hosted_button_id" value={hostedButtonId} />
        {paypalOptionName && <input type="hidden" name="on0" value={paypalOptionName} />}
        {currencyCode && <input type="hidden" name="currency_code" value={currencyCode} />}

        {selectLabel && <span className={styles["membership-widget__label"]}>{selectLabel}</span>}

        {useSelect ? (
          <select
            name="os0"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className={styles["membership-widget__select"]}
            aria-label={selectLabel || paypalOptionName || "Membership type"}
          >
            {list.map((tier) => (
              <option key={tier.value} value={tier.value}>
                {tier.amount ? `${tier.label} — ${tier.amount}` : tier.label}
              </option>
            ))}
          </select>
        ) : (
          <ul className={styles["membership-widget__options"]}>
            {list.map((tier) => (
              <li key={tier.value}>
                <label
                  className={styles["membership-widget__option"]}
                  data-selected={selected === tier.value}
                >
                  <input
                    type="radio"
                    name="os0"
                    value={tier.value}
                    checked={selected === tier.value}
                    onChange={() => setSelected(tier.value)}
                  />
                  <span className={styles["membership-widget__option-label"]}>{tier.label}</span>
                  {tier.amount && <span className={styles["membership-widget__option-amount"]}>{tier.amount}</span>}
                </label>
              </li>
            ))}
          </ul>
        )}

        <Button
          type="submit"
          variant="success"
          iconAfter="UserPlus"
          label={buttonLabel || "Join Now"}
          className={styles["membership-widget__button"]}
        />
      </form>

      {trustText && <small className={styles["membership-widget__trust"]}>{trustText}</small>}
    </aside>
  );
};
