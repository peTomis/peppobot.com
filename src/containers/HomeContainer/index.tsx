import { useTranslations } from "@/modules/translations/use";
import Link from "next/link";

export default function HomeContainer() {
  const { t } = useTranslations("home");
  return (
    <div className="flex">
      <div className="flex items-center justify-center text-[#ff0000]">
        <Link href={{ pathname: "/game", query: { g: "Tekken" } }}>{t("test")}</Link>
      </div>
    </div>
  );
}
