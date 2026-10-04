import cs from "./cs";

// Dnes vracíme vždy "cs". Budoucí přidání jazyka: vytvořit en.ts se stejným
// tvarem a vybírat podle `useLocale()` / nastavení uživatele.
export function useDictionary() {
  return cs;
}

export const dictionary = cs;
