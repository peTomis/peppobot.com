import GameContainer from "@/containers/GameContainer";
import { fetchTranslations } from "@/modules/translations/fetch";

export default function GamePage() {
  return <GameContainer />;
}

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      ...(await fetchTranslations(locale, ["home"])),
    },
  };
}
