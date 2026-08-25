import { Kabuk } from "@/components/kabuk";
import { oturumGerekli } from "@/lib/oturum";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const oturum = await oturumGerekli();
  return <Kabuk oturum={oturum}>{children}</Kabuk>;
}
