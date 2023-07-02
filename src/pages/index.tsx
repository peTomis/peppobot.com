import HomeContainer from "@/containers/HomeContainer";
import { useTranslations } from "@/modules/translations/use";
import { fetchTranslations } from "@modules/translations/fetch";
import type { NextPage } from "next";
import Head from "next/head";

const Home: NextPage = () => {
  const { t } = useTranslations("home");
  return (
    <>
      <Head>
        <title>{t("title")}</title>
        <meta name="description" content={t("description")} />
      </Head>

      <HomeContainer />
    </>
  );
};

export default Home;

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      ...(await fetchTranslations(locale, ["home"])),
    },
  };
}
