import { Button } from "@/components/ui/button";
import { CURRENCY_OPTIONS, type CurrencyCode } from "@/data/pricing.config";

/** محدد عملة الأسعار: جنيه مصري · ريال سعودي · درهم إماراتي. */
export function CurrencySelect({
  value,
  onChange,
  className = "sahl-home-billing",
}: {
  value: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
  className?: string;
}) {
  return (
    <div className={`${className} sahl-currency-select`} role="radiogroup" aria-label="عملة الأسعار">
      {CURRENCY_OPTIONS.map((option) => (
        <Button
          key={option.code}
          type="button"
          variant="ghost"
          role="radio"
          aria-checked={value === option.code}
          className={value === option.code ? "is-active" : undefined}
          onClick={() => onChange(option.code)}
        >
          {option.name}
        </Button>
      ))}
    </div>
  );
}
