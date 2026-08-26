import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import { MALIK_TIPI, yazabilir } from "@/lib/sabitler";
import { sayi } from "@/lib/yardimcilar";
import { Rozet, SayfaBasligi } from "@/components/ortak";
import { SilOnayi } from "@/components/modal";
import { belgeleriGetir } from "@/lib/belge-listesi";
import { MalikModali } from "../malik-modali";
import { malikDetayiGetir } from "../malik-verisi";
import { MalikGovdesi } from "../malik-govdesi";
import { malikSil } from "../eylemler";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const malik = await db.malik.findUnique({ where: { id }, select: { adSoyad: true } });
  return { title: malik?.adSoyad ?? "Malik" };
}

export default async function MalikDetaySayfasi({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const oturum = await oturumGerekli();
  const { id } = await params;
  const p = await searchParams;

  const malik = await malikDetayiGetir(id);
  if (!malik) notFound();

  const duzenlenebilir = yazabilir(oturum.rol);
  const belgeler = await belgeleriGetir({ malikId: malik.id }, oturum);

  return (
    <>
      <SayfaBasligi
        ustBaslik="Malik"
        baslik={malik.adSoyad}
        aciklama={
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <Rozet harita={MALIK_TIPI} deger={malik.tip} />
            <span className="text-secondary">
              {sayi(malik.hisseler.length)} bağımsız bölüm ·{" "}
              {sayi(new Set(malik.hisseler.map((h) => h.bina.id)).size)} bina
            </span>
          </div>
        }
        aksiyonlar={
          duzenlenebilir ? (
            <>
              <Link
                href={`/malikler/${malik.id}?duzenle=${malik.id}`}
                scroll={false}
                className="btn btn-primary"
              >
                <IconEdit size={18} stroke={1.5} className="me-1" />
                Düzenle
              </Link>
              {oturum.rol === "ADMIN" && (
                <SilOnayi
                  eylem={malikSil}
                  alanlar={{ id: malik.id }}
                  baslik="Malik kaydını sil"
                  mesaj={
                    <>
                      <strong>{malik.adSoyad}</strong> kaydı ve bu kişinin{" "}
                      {sayi(malik.hisseler.length)} bina bağlantısı kalıcı olarak silinecek.
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

      {duzenlenebilir && p.duzenle === malik.id && <MalikModali malik={malik} />}

      <div className="page-body">
        <div className="container-fluid">
          <MalikGovdesi malik={malik} belgeler={belgeler} duzenlenebilir={duzenlenebilir} />
        </div>
      </div>
    </>
  );
}
