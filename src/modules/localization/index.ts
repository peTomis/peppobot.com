import { NextRouter, useRouter } from "next/router";
import { readCookie, writeCookie } from "@modules/cookies";
import React from "react";

// const APP_LOCALES = ["it-IT", "en-US"]

const switchLanguage = (router: NextRouter, locale: string) => {
  writeCookie("LOCALE", locale);
  router.push(router.asPath, router.asPath, {
    locale,
  });
};

export const useLocaleSwitch = () => {
  const router = useRouter();

  const switchLocale = (newLocale: string) => {
    switchLanguage(router, newLocale);
  };

  return {
    switchLocale,
  };
};

const getUserLanguage = () => navigator.language;

export const useLanguageDetector = () => {
  const router = useRouter();

  const ensureDefaultLanguage = () => {
    const cookie = readCookie("LOCALE");

    if (!!cookie) {
      return;
    }

    const userLanguage = getUserLanguage();

    if (userLanguage && router.locale && userLanguage !== router.locale) {
      switch (userLanguage) {
        case "it-IT":
          switchLanguage(router, "it-IT");
          break;
        default:
          switchLanguage(router, "en-US");
          break;
      }
    }
  };

  React.useEffect(() => {
    ensureDefaultLanguage();
  }, []);
};
