export const DEFAULT_LANGUAGE = "ru";

export const LANGUAGE_STORAGE_KEY = "site-language";

export const LANGUAGES = [
  { code: "ru", label: "Ru", htmlLang: "ru" },
  { code: "en", label: "En", htmlLang: "en" },
  { code: "cn", label: "中文", htmlLang: "zh-CN" },
];

export function getLanguageMeta(languageCode) {
  return (
    LANGUAGES.find(({ code }) => code === languageCode) ||
    LANGUAGES.find(({ code }) => code === DEFAULT_LANGUAGE)
  );
}

export function isSupportedLanguage(languageCode) {
  return LANGUAGES.some(({ code }) => code === languageCode);
}
