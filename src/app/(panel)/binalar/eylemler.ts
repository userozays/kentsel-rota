"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { oturumGerekli } from "@/lib/oturum";
import { SUREC_SIRASI, yazabilir } from "@/lib/sabitler";
import { bosaNull, sayiyaCevir, tariheCevir, formDegerleri } from "@/lib/yardimcilar";

export type FormDurumu = { hata?: string; basarili?: boolean; kayitId?: string; degerler?: Record<string, string> };

async function yetkiKontrol() {
  const oturum = await oturumGerekli();
  if (!yazabilir(oturum.rol)) throw new Error("Bu işlem için yetkiniz yok.");
  return oturum;
}

async function sonrakiKod() {
  const son = await db.bina.findFirst({ orderBy: { kod: "desc" }, select: { kod: true } });
  const numara = son ? Number(son.kod.replace(/\D/g, "")) + 1 : 1;
  return "BNA-" + String(numara).padStart(4, "0");
}

/* ------------------------------------------------------------- Bina kaydet */

export async function binaKaydet(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const oturum = await oturumGerekli();
  if (!yazabilir(oturum.rol)) return { hata: "Bu işlem için yetkiniz yok.", degerler: formDegerleri(form) };

  const id = bosaNull(form.get("id"));
  const mahalle = bosaNull(form.get("mahalle"));
  const ada = bosaNull(form.get("ada"));
  const parsel = bosaNull(form.get("parsel"));
  const ilce = bosaNull(form.get("ilce"));

  if (!mahalle || !ada || !parsel || !ilce) {
    return { hata: "İlçe, mahalle, ada ve parsel alanları zorunludur.", degerler: formDegerleri(form) };
  }

  const veri = {
    baslik: bosaNull(form.get("baslik")) ?? `${mahalle} ${ada} Ada ${parsel} Parsel`,
    il: bosaNull(form.get("il")) ?? "İstanbul",
    ilce,
    mahalle,
    ada,
    parsel,
    adres: bosaNull(form.get("adres")),
    katSayisi: sayiyaCevir(form.get("katSayisi")),
    bagimsizBolumSayisi: sayiyaCevir(form.get("bagimsizBolumSayisi")) ?? 0,
    yapimYili: sayiyaCevir(form.get("yapimYili")),
    arsaAlani: sayiyaCevir(form.get("arsaAlani")),
    riskDurumu: String(form.get("riskDurumu") ?? "TESPIT_EDILMEDI"),
    asama: String(form.get("asama") ?? "ILK_GORUSME"),
    durum: String(form.get("durum") ?? "AKTIF"),
    oncelik: String(form.get("oncelik") ?? "NORMAL"),
    danismanId: bosaNull(form.get("danismanId")),
    muteahhitId: bosaNull(form.get("muteahhitId")),
    notlar: bosaNull(form.get("notlar")),
  };

  let binaId: string;

  if (id) {
    const eski = await db.bina.findUnique({ where: { id }, select: { asama: true } });
    await db.bina.update({ where: { id }, data: veri });
    binaId = id;

    if (eski && eski.asama !== veri.asama) {
      await asamaSenkronize(binaId, veri.asama, oturum.id);
      await db.aktivite.create({
        data: {
          tur: "SISTEM",
          baslik: "Aşama güncellendi",
          icerik: `Dosya aşaması "${veri.asama}" olarak değiştirildi.`,
          kullaniciId: oturum.id,
          binaId,
        },
      });
    }
  } else {
    const yeni = await db.bina.create({
      data: { ...veri, kod: await sonrakiKod() },
    });
    binaId = yeni.id;

    // Süreç adımlarını oluştur
    await db.surecAdimi.createMany({
      data: SUREC_SIRASI.map((adim, sira) => ({
        binaId,
        adim,
        sira,
        durum: sira < SUREC_SIRASI.indexOf(veri.asama) ? "TAMAMLANDI" : sira === SUREC_SIRASI.indexOf(veri.asama) ? "DEVAM" : "BEKLIYOR",
      })),
    });

    await db.aktivite.create({
      data: {
        tur: "SISTEM",
        baslik: "Bina dosyası oluşturuldu",
        kullaniciId: oturum.id,
        binaId,
      },
    });
  }

  revalidatePath("/binalar");
  revalidatePath(`/binalar/${binaId}`);
  revalidatePath("/surec");
  revalidatePath("/");
  return { basarili: true, kayitId: binaId };
}

/** Bina aşaması değişince süreç adımlarının durumunu hizalar */
async function asamaSenkronize(binaId: string, asama: string, _kullaniciId: string) {
  const hedef = SUREC_SIRASI.indexOf(asama);
  const adimlar = await db.surecAdimi.findMany({ where: { binaId } });
  for (const a of adimlar) {
    const yeniDurum = a.sira < hedef ? "TAMAMLANDI" : a.sira === hedef ? "DEVAM" : "BEKLIYOR";
    if (a.durum === yeniDurum || a.durum === "ATLANDI") continue;
    await db.surecAdimi.update({
      where: { id: a.id },
      data: {
        durum: yeniDurum,
        baslangicTarihi: yeniDurum !== "BEKLIYOR" ? (a.baslangicTarihi ?? new Date()) : null,
        tamamlanmaTarihi: yeniDurum === "TAMAMLANDI" ? (a.tamamlanmaTarihi ?? new Date()) : null,
      },
    });
  }
}

/* ---------------------------------------------------------------- Bina sil */

export async function binaSil(form: FormData) {
  await yetkiKontrol();
  const id = String(form.get("id") ?? "");
  if (!id) return;
  await db.bina.delete({ where: { id } });
  revalidatePath("/binalar");
  revalidatePath("/");
  redirect("/binalar");
}

/* ------------------------------------------------------- Süreç adımı güncelle */

export async function surecAdimiGuncelle(form: FormData) {
  const oturum = await yetkiKontrol();
  const adimId = String(form.get("adimId") ?? "");
  const durum = String(form.get("durum") ?? "");
  if (!adimId || !durum) return;

  const adim = await db.surecAdimi.findUnique({ where: { id: adimId }, include: { bina: true } });
  if (!adim) return;

  await db.surecAdimi.update({
    where: { id: adimId },
    data: {
      durum,
      baslangicTarihi: durum === "BEKLIYOR" ? null : (adim.baslangicTarihi ?? new Date()),
      tamamlanmaTarihi: durum === "TAMAMLANDI" ? new Date() : null,
      sorumluId: durum === "BEKLIYOR" ? null : (adim.sorumluId ?? oturum.id),
    },
  });

  // Binanın güncel aşamasını, tamamlanmış en son adımın bir sonrası olarak belirle
  const adimlar = await db.surecAdimi.findMany({ where: { binaId: adim.binaId }, orderBy: { sira: "asc" } });
  const devam = adimlar.find((a) => a.durum === "DEVAM");
  const sonTamam = [...adimlar].reverse().find((a) => a.durum === "TAMAMLANDI" || a.durum === "ATLANDI");
  const yeniAsama = devam?.adim ?? (sonTamam ? (adimlar[sonTamam.sira + 1]?.adim ?? sonTamam.adim) : SUREC_SIRASI[0]);

  if (yeniAsama !== adim.bina.asama) {
    await db.bina.update({ where: { id: adim.binaId }, data: { asama: yeniAsama } });
  }

  await db.aktivite.create({
    data: {
      tur: "SISTEM",
      baslik: `Süreç adımı güncellendi: ${adim.adim}`,
      icerik: `Yeni durum: ${durum}`,
      kullaniciId: oturum.id,
      binaId: adim.binaId,
    },
  });

  revalidatePath(`/binalar/${adim.binaId}`);
  revalidatePath("/surec");
  revalidatePath("/");
}

/* ----------------------------------------------------------- Hisse işlemleri */

export async function hisseOnayGuncelle(form: FormData) {
  const oturum = await yetkiKontrol();
  const hisseId = String(form.get("hisseId") ?? "");
  const onayDurumu = String(form.get("onayDurumu") ?? "");
  if (!hisseId || !onayDurumu) return;

  const hisse = await db.hisse.update({
    where: { id: hisseId },
    data: {
      onayDurumu,
      onayTarihi: onayDurumu === "OLUMLU" || onayDurumu === "OLUMSUZ" ? new Date() : null,
    },
    include: { malik: { select: { adSoyad: true } } },
  });

  await db.aktivite.create({
    data: {
      tur: "SISTEM",
      baslik: `${hisse.malik.adSoyad} onay durumu: ${onayDurumu}`,
      kullaniciId: oturum.id,
      binaId: hisse.binaId,
    },
  });

  revalidatePath(`/binalar/${hisse.binaId}`);
  revalidatePath("/");
}

export async function hisseNotGuncelle(form: FormData) {
  await yetkiKontrol();
  const hisseId = String(form.get("hisseId") ?? "");
  if (!hisseId) return;
  const hisse = await db.hisse.update({
    where: { id: hisseId },
    data: { notlar: bosaNull(form.get("notlar")) },
  });
  revalidatePath(`/binalar/${hisse.binaId}`);
}

/** Binaya yeni malik + bağımsız bölüm ekler */
export async function malikEkle(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const oturum = await oturumGerekli();
  if (!yazabilir(oturum.rol)) return { hata: "Bu işlem için yetkiniz yok.", degerler: formDegerleri(form) };

  const binaId = String(form.get("binaId") ?? "");
  const mevcutMalikId = bosaNull(form.get("mevcutMalikId"));
  const adSoyad = bosaNull(form.get("adSoyad"));

  if (!binaId) return { hata: "Bina bulunamadı.", degerler: formDegerleri(form) };
  if (!mevcutMalikId && !adSoyad) return { hata: "Malik adı girin veya listeden seçin.", degerler: formDegerleri(form) };

  let malikId = mevcutMalikId;
  if (!malikId) {
    const yeni = await db.malik.create({
      data: {
        adSoyad: adSoyad!,
        tip: String(form.get("tip") ?? "GERCEK"),
        tcKimlik: bosaNull(form.get("tcKimlik")),
        telefon: bosaNull(form.get("telefon")),
        email: bosaNull(form.get("email")),
        adres: bosaNull(form.get("adres")),
      },
    });
    malikId = yeni.id;
  }

  const pay = sayiyaCevir(form.get("arsaPayiPay"));
  const payda = sayiyaCevir(form.get("arsaPayiPayda"));
  const elleOran = sayiyaCevir(form.get("hisseOrani"));
  const oran = elleOran ?? (pay && payda ? Number(((pay / payda) * 100).toFixed(3)) : 0);

  await db.hisse.create({
    data: {
      binaId,
      malikId: malikId!,
      bagimsizBolumNo: bosaNull(form.get("bagimsizBolumNo")),
      kullanimTuru: String(form.get("kullanimTuru") ?? "MESKEN"),
      arsaPayiPay: pay,
      arsaPayiPayda: payda,
      hisseOrani: oran,
      onayDurumu: String(form.get("onayDurumu") ?? "BEKLIYOR"),
      notlar: bosaNull(form.get("hisseNotu")),
    },
  });

  revalidatePath(`/binalar/${binaId}`);
  revalidatePath("/malikler");
  revalidatePath("/");
  return { basarili: true };
}

export async function hisseSil(form: FormData) {
  await yetkiKontrol();
  const hisseId = String(form.get("hisseId") ?? "");
  if (!hisseId) return;
  const hisse = await db.hisse.delete({ where: { id: hisseId } });
  revalidatePath(`/binalar/${hisse.binaId}`);
  revalidatePath("/");
}

/* --------------------------------------------------------------- Aktiviteler */

export async function aktiviteEkle(_onceki: FormDurumu, form: FormData): Promise<FormDurumu> {
  const oturum = await oturumGerekli();
  if (!yazabilir(oturum.rol)) return { hata: "Bu işlem için yetkiniz yok.", degerler: formDegerleri(form) };

  const baslik = bosaNull(form.get("baslik"));
  if (!baslik) return { hata: "Başlık alanı zorunludur.", degerler: formDegerleri(form) };

  const binaId = bosaNull(form.get("binaId"));
  const malikId = bosaNull(form.get("malikId"));
  const muteahhitId = bosaNull(form.get("muteahhitId"));

  await db.aktivite.create({
    data: {
      tur: String(form.get("tur") ?? "NOT"),
      baslik,
      icerik: bosaNull(form.get("icerik")),
      tarih: tariheCevir(form.get("tarih")) ?? new Date(),
      kullaniciId: oturum.id,
      binaId,
      malikId,
      muteahhitId,
    },
  });

  if (binaId) revalidatePath(`/binalar/${binaId}`);
  if (malikId) revalidatePath(`/malikler/${malikId}`);
  if (muteahhitId) revalidatePath(`/muteahhitler/${muteahhitId}`);
  revalidatePath("/aktiviteler");
  revalidatePath("/");
  return { basarili: true };
}
