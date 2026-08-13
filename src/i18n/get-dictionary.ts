import type { Locale } from "./config";
import en from "./dictionaries/en.json";
import ptBr from "./dictionaries/pt-br.json";

export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = {
  en,
  "pt-br": ptBr,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
