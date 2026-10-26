import { useCallback, useEffect, useState } from "react";

import {
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
  REGION_CURRENCY,
  type CurrencyCode,
} from "@/data/pricing.config";
import { useRegion } from "@/hooks/use-region";

const STORAGE_KEY = "ziad.currency";

/** عملة العرض: اختيار الزائر المحفوظ، وإلا حسب منطقة المتصفح، وإلا الجنيه المصري. */
export function usePricingCurrency() {
  const { country } = useRegion();
  const [chosen, setChosen] = useState<CurrencyCode | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && CURRENCY_OPTIONS.some((c) => c.code === saved)) setChosen(saved as CurrencyCode);
    } catch {
      /* التخزين غير متاح */
    }
  }, []);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setChosen(code);
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* التخزين غير متاح */
    }
  }, []);

  const currency = chosen ?? REGION_CURRENCY[country] ?? DEFAULT_CURRENCY;
  return { currency, setCurrency };
}
