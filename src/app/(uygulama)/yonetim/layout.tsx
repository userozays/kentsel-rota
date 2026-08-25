import { redirect } from "next/navigation";
import { oturumGerekli } from "@/lib/auth";
import { yetkiVar } from "@/lib/roller";
import { YonetimNav } from "@/components/YonetimNav";

export default async function YonetimYerlesimi({ children }: { children: React.ReactNode }) {
  const kullanici = await oturumGerekli();
  if (!yetkiVar(kullanici.rol, "yonetim")) redirect("/");

  return (
    <>
      <YonetimNav />
      {children}
    </>
  );
}
