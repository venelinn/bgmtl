import type { SupportedLocale } from "@/constants";

export interface FormattedMoneyProps {
  number: number | string;
  locale: SupportedLocale;
  currency?: string;
  showCents?: boolean;
  className?: string;
  renderCurrencyAsSup?: boolean;
}

export const FormattedMoney = ({
  number,
  locale = "en-US",
  currency = "USD",
  showCents = false,
  className,
  renderCurrencyAsSup = false,
}: FormattedMoneyProps) => {
  if (number === null || number === undefined || number === "") return null;

  const numericValue = Number(number);
  if (Number.isNaN(numericValue)) return <>{String(number)}</>;

  const hasCents = typeof showCents === "boolean" ? showCents : numericValue % 1 !== 0;

  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  });

  const formatted = formatter.format(numericValue);

  const match = formatted.match(/([^\d\s.,]+)/); // this finds the currency symbol
  if (!renderCurrencyAsSup || !match) {
    return <span className={className}>{formatted}</span>;
  }

  const currencySymbol = match[1];
  const parts = formatted.split(currencySymbol);

  return (
    <span className={className}>
      {parts[0]}
      <sup>{currencySymbol}</sup>
      {parts[1]}
    </span>
  );
};
