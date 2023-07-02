import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const fetchTranslations = (locale: string, keys: string[]) => serverSideTranslations(locale, keys);
