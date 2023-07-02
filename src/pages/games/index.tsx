import { fetchTranslations } from "@/modules/translations/fetch";

export default function GamesPage() {
  return <div>List</div>;
}

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      ...(await fetchTranslations(locale, ["home"])),
    },
  };
}
