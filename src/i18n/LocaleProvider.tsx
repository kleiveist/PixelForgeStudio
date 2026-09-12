import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  formatDate,
  translate,
  translateText,
  type Locale,
  type MessageKey
} from "./translate";

const LocaleContext = createContext<Locale>("de");

export function LocaleProvider({
  locale,
  children
}: Readonly<{ locale: Locale; children: ReactNode }>) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useI18n() {
  const locale = useContext(LocaleContext);
  return useMemo(
    () => ({
      locale,
      t: (key: MessageKey, ...values: readonly (string | number)[]) =>
        translate(locale, key, ...values),
      tx: (text: string) => translateText(locale, text),
      date: (timestamp: string) => formatDate(locale, timestamp),
      number: (value: number) =>
        new Intl.NumberFormat(locale === "en" ? "en-GB" : "de-DE").format(value)
    }),
    [locale]
  );
}
