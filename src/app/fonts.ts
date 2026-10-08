import { Chakra_Petch, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

/** The design's three typefaces as CSS variables, for the `<html>` element (also used by the maker app). */
export const fontVariables = `${chakraPetch.variable} ${plexSans.variable} ${jetbrainsMono.variable}`;
