import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { appWithTranslation } from "next-i18next";
import { useLanguageDetector } from "@/modules/localization";

function CustomApp({ Component, pageProps }: AppProps) {
  useLanguageDetector();
  return <Component {...pageProps} />;
}

export default appWithTranslation(CustomApp as any);
