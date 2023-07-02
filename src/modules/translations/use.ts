import { useTranslation } from "next-i18next";

export const useTranslations = (key: string) => {
  const { t } = useTranslation(key);
  return {
    t,
  };
};
