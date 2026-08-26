import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  IconAlertTriangle,
  IconClock,
  IconEdit,
  IconExternalLink,
  IconMail,
  IconMapPin,
  IconPhone,
  IconTrash,
} from "@tabler/icons-react";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import { AKTIVITE_TURU, BINA_DURUMU, MUTEAHHIT_DURUMU, SUREC_ADIMI, yazabilir } from "@/lib/sabitler";
import { goreceli, onayOzeti, sayi, tarih, tarihSaat, yuzde } from "@/lib/yardimcilar";
import {
  Avatar,
  BilgiSatiri,
  BosDurum,
  Rozet,
  SayfaBasligi,
  Uyari,
  YildizPuan,
} from "@/components/ortak";
import { AktiviteFormu } from "../../binalar/[id]/etkilesim";
import { SilOnayi } from "@/components/modal";
import { BelgelerKarti } from "@/components/belgeler-karti";
import { belgeleriGetir } from "@/lib/belge-listesi";
import { MuteahhitModali } from "../muteahhit-modali";
import { muteahhitSil } from "../eylemler";
import { muteahhitDetayiGetir } from "../muteahhit-verisi";
import { MuteahhitGovdesi } from "../muteahhit-govdesi";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const m = await db.muteahhit.findUnique({ where: { id }, select: { firmaAdi: true } });
  return { title: m?.firmaAdi ?? "Müteahhit" };
}

export default async function MuteahhitDetaySayfasi({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  const oturum = await oturumGerekli();
  const { id } = await params;

  const muteahhit = await muteahhitDetayiGetir(id);

  if (!muteahhit) notFound();

  const duzenlenebilir = yazabilir(oturum.rol);
  const belgeler = await belgeleriGetir({ muteahhitId: muteahhit.id }, oturum);
  const bolgeler = (muteahhit.calismaBolgeleri ?? "")
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <>
      <SayfaBasligi
        ustBaslik={`Müteahhit · ${muteahhit.kod}`}
        baslik={muteahhit.firmaAdi}
        aciklama={
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <YildizPuan puan={muteahhit.puan} />
            <Rozet harita={MUTEAHHIT_DURUMU} deger={muteahhit.durum} />
            {muteahhit.yetkiliKisi && <span className="text-secondary">Yetkili: {muteahhit.yetkiliKisi}</span>}
          </div>
        }
        aksiyonlar={
          duzenlenebilir ? (
            <>
              <Link href={`/muteahhitler/${muteahhit.id}?duzenle=${muteahhit.id}`} scroll={false} className="btn btn-primary">
                <IconEdit size={18} stroke={1.5} className="me-1" />
                Düzenle
              </Link>
              {oturum.rol === "ADMIN" && (
                <SilOnayi
                  eylem={muteahhitSil}
                  alanlar={{ id: muteahhit.id }}
                  baslik="Müteahhit kaydını sil"
                  mesaj={
                    <>
                      <strong>{muteahhit.firmaAdi}</strong> kaydı silinecek. Bu firmaya atanmış{" "}
                      {sayi(muteahhit.binalar.length)} bina dosyasındaki müteahhit ataması kaldırılır,
                      dosyalar silinmez.
                      <div className="text-secondary small mt-2">Bu işlem geri alınamaz.</div>
                    </>
                  }
                  tetikleyici={
                    <>
                      <IconTrash size={18} stroke={1.5} className="me-1" />
                      Sil
                    </>
                  }
                />
              )}
            </>
          ) : null
        }
      />

      {duzenlenebilir && p.duzenle === muteahhit.id && <MuteahhitModali muteahhit={muteahhit} />}

      <div className="page-body">
        <div className="container-fluid">
          <MuteahhitGovdesi
            muteahhit={muteahhit}
            belgeler={belgeler}
            duzenlenebilir={duzenlenebilir}
          />
        </div>
      </div>
    </>
  );
}
