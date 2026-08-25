import { oturumGerekli, gorunurBinaIdleri } from "@/lib/auth";
import { ayarlariOku } from "@/lib/ayarlar";
import { yetkiVar } from "@/lib/roller";
import { db } from "@/lib/db";
import { cikisYap } from "@/actions/oturum";
import { Kabuk, type NavOgesi } from "@/components/Kabuk";

export default async function UygulamaYerlesimi({ children }: { children: React.ReactNode }) {
  const kullanici = await oturumGerekli();
  const ayarlar = await ayarlariOku();
  const gorunur = await gorunurBinaIdleri(kullanici);
  const binaFiltre = gorunur === null ? {} : { id: { in: gorunur } };

  const [binaSayi, mutSayi, teklifSayi] = await Promise.all([
    db.bina.count({ where: binaFiltre }),
    yetkiVar(kullanici.rol, "tumBinalar") ? db.muteahhit.count() : Promise.resolve(0),
    yetkiVar(kullanici.rol, "teklifOku") ? db.teklif.count() : Promise.resolve(0),
  ]);

  const ogeler: NavOgesi[] = [{ yol: "/", ad: "Panel", ikon: "panel", sayi: binaSayi }];

  if (yetkiVar(kullanici.rol, "tumBinalar")) {
    ogeler.push({ yol: "/fizibilite", ad: "Fizibilite", ikon: "fizibilite" });
    ogeler.push({ yol: "/muteahhitler", ad: "Müteahhitler", ikon: "muteahhit", sayi: mutSayi });
  }
  if (yetkiVar(kullanici.rol, "teklifOku")) {
    ogeler.push({ yol: "/teklifler", ad: "Teklifler", ikon: "teklif", sayi: teklifSayi });
  }
  if (yetkiVar(kullanici.rol, "yonetim")) {
    ogeler.push({ yol: "/yonetim", ad: "Yönetim", ikon: "yonetim", grup: "Sistem" });
  }

  return (
    <Kabuk sirketAd={ayarlar.sirketAd} ogeler={ogeler} kullanici={kullanici} cikis={cikisYap}>
      {children}
    </Kabuk>
  );
}
