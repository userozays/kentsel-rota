import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconDownload, IconEdit, IconTrash } from "@tabler/icons-react";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import { BINA_DURUMU, ONCELIK, RISK_DURUMU, SUREC_ADIMI, yazabilir } from "@/lib/sabitler";
import { sayi } from "@/lib/yardimcilar";
import { Rozet, RozetDolu, SayfaBasligi } from "@/components/ortak";
import { SilOnayi } from "@/components/modal";
import { belgeleriGetir } from "@/lib/belge-listesi";
import { binaSil } from "../eylemler";
import {
  binaDetayiGetir,
  binayaEklenebilirMalikler,
  portfoyMuteahhitleriGetir,
} from "../bina-verisi";
import { BinaGovdesi } from "../bina-govdesi";
import { BinaModali } from "../bina-modali";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const bina = await db.bina.findUnique({ where: { id }, select: { baslik: true } });
  return { title: bina?.baslik ?? "Bina" };
}

export default async function BinaDetaySayfasi({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const oturum = await oturumGerekli();
  const { id } = await params;
  const p = await searchParams;

  const bina = await binaDetayiGetir(id);

  if (!bina) notFound();

  const duzenlenebilir = yazabilir(oturum.rol);
  const belgeler = await belgeleriGetir({ binaId: bina.id }, oturum);

  const modalAcik = duzenlenebilir && p.duzenle === bina.id;
  const [formDanismanlari, formMuteahhitleri] = modalAcik
    ? await Promise.all([
        db.kullanici.findMany({
          where: { aktif: true, rol: { in: ["ADMIN", "DANISMAN"] } },
          select: { id: true, ad: true },
          orderBy: { ad: "asc" },
        }),
        db.muteahhit.findMany({
          select: { id: true, firmaAdi: true, durum: true },
          orderBy: [{ durum: "asc" }, { firmaAdi: "asc" }],
        }),
      ])
    : [[], []];

  const [kayitliMalikler, portfoyMuteahhitleri] = await Promise.all([
    binayaEklenebilirMalikler(bina.id),
    portfoyMuteahhitleriGetir(),
  ]);

  return (
    <>
      <SayfaBasligi
        ustBaslik={`${bina.kod} · ${bina.ilce} / ${bina.il}`}
        baslik={bina.baslik}
        aciklama={
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <Rozet harita={RISK_DURUMU} deger={bina.riskDurumu} />
            <Rozet harita={BINA_DURUMU} deger={bina.durum} />
            <Rozet harita={SUREC_ADIMI} deger={bina.asama} />
            {bina.oncelik === "YUKSEK" && <RozetDolu harita={ONCELIK} deger={bina.oncelik} />}
          </div>
        }
        aksiyonlar={
          duzenlenebilir ? (
            <>
              <a href={`/binalar/${bina.id}/cizelge`} className="btn">
                <IconDownload size={18} stroke={1.5} className="me-1" />
                Onay Çizelgesi
              </a>
              <Link href={`/binalar/${bina.id}?duzenle=${bina.id}`} scroll={false} className="btn btn-primary">
                <IconEdit size={18} stroke={1.5} className="me-1" />
                Düzenle
              </Link>
              {oturum.rol === "ADMIN" && (
                <SilOnayi
                  eylem={binaSil}
                  alanlar={{ id: bina.id }}
                  baslik="Bina dosyasını sil"
                  mesaj={
                    <>
                      <strong>{bina.baslik}</strong> dosyası; bağlı {sayi(bina.hisseler.length)} malik kaydı,
                      süreç adımları ve görüşme notlarıyla birlikte kalıcı olarak silinecek.
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

      <div className="page-body">
        <div className="container-fluid">
          {modalAcik && (
            <BinaModali bina={bina} danismanlar={formDanismanlari} muteahhitler={formMuteahhitleri} />
          )}

          <BinaGovdesi
            bina={bina}
            belgeler={belgeler}
            kayitliMalikler={kayitliMalikler}
            portfoyMuteahhitleri={portfoyMuteahhitleri}
            duzenlenebilir={duzenlenebilir}
          />
        </div>
      </div>
    </>
  );
}
