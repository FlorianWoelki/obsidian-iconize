import en from './en';
import zh from './zh';

const resources = { en, zh } as const;
type Lang = keyof typeof resources;

const supportedLanguages = new Set<Lang>(['en', 'zh']);

let currentLang: Lang = 'en';

export function setLanguage(lang: string): void {
  if (supportedLanguages.has(lang as Lang))
    currentLang = lang as Lang;
  else
    currentLang = 'en';
}

export function T(key: string): string {
  return resources[currentLang][key as keyof typeof resources[Lang]] || key;
}