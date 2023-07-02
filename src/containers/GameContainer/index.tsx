import { useTranslations } from "@/modules/translations/use";
import { useRouter } from "next/router";

const GameContainer = () => {
  const router = useRouter();
  const { g: name } = router.query;
  const { t } = useTranslations("home");
  return (
    <div className="flex items-center justify-center bg-black text-[#ff0000]">
      <div>{name}</div>
    </div>
  );
};

export default GameContainer;
