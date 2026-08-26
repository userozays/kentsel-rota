import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";

const COOKIE_ADI = "krp_oturum";
const SURE_SANIYE = 60 * 60 * 24 * 7; // 7 gun

export type OturumBilgisi = {
  id: string;
  ad: string;
  email: string;
  rol: string;
};

function anahtar() {
  const gizli = process.env.AUTH_SECRET;
  if (!gizli) throw new Error("AUTH_SECRET tanimli degil (.env dosyasini kontrol edin)");
  return new TextEncoder().encode(gizli);
}

export async function tokenUret(bilgi: OturumBilgisi) {
  return new SignJWT({ ...bilgi })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SURE_SANIYE}s`)
    .sign(anahtar());
}

export async function tokenCoz(token: string): Promise<OturumBilgisi | null> {
  try {
    const { payload } = await jwtVerify(token, anahtar());
    const { id, ad, email, rol } = payload as Record<string, string>;
    if (!id || !email) return null;
    return { id, ad, email, rol };
  } catch {
    return null;
  }
}

export async function oturumBaslat(bilgi: OturumBilgisi) {
  const token = await tokenUret(bilgi);
  const kutu = await cookies();
  kutu.set(COOKIE_ADI, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SURE_SANIYE,
  });
}

export async function oturumKapat() {
  const kutu = await cookies();
  kutu.delete(COOKIE_ADI);
}

/**
 * Yalnızca çerezi çözer, veritabanına bakmaz.
 *
 * Doğrulama gerektiren her yerde `gecerliOturum()` kullanılmalı. Bu işlev
 * çerezin kendisiyle ilgilenen düşük seviyeli yerler için duruyor.
 */
export async function oturumAl(): Promise<OturumBilgisi | null> {
  const kutu = await cookies();
  const token = kutu.get(COOKIE_ADI)?.value;
  if (!token) return null;
  return tokenCoz(token);
}

/**
 * Çerezi çözer VE kullanıcının hâlâ var olduğunu ve aktif olduğunu doğrular.
 *
 * NEDEN: `middleware.ts` yalnızca JWT imzasını doğrulayabiliyor (Prisma
 * middleware çalışma ortamında yok). İmza 7 gün geçerli olduğu için, bir
 * kullanıcı pasife alınsa ya da silinse elindeki çerezle 7 gün daha panele
 * girebiliyordu. Doğrulama bu tek noktaya alındı.
 *
 * Rol de veritabanından okunuyor: çerezdeki rol token üretildiği andan kalma.
 * Yöneticiliği alınan biri, çerezi yenilenmediği sürece eski yetkisiyle
 * çalışmaya devam ederdi — yetki düşürme anında etkili olmalı.
 *
 * Maliyet: istek başına birincil anahtar üzerinden tek satır okuma.
 */
export async function gecerliOturum(): Promise<OturumBilgisi | null> {
  const oturum = await oturumAl();
  if (!oturum) return null;

  const kullanici = await db.kullanici.findUnique({
    where: { id: oturum.id },
    select: { id: true, ad: true, email: true, rol: true, aktif: true },
  });
  if (!kullanici || !kullanici.aktif) return null;

  return {
    id: kullanici.id,
    ad: kullanici.ad,
    email: kullanici.email,
    rol: kullanici.rol,
  };
}

/**
 * Oturum yoksa ya da artık geçerli değilse çıkışa yönlendirir.
 *
 * `/api/cikis` çerezi temizleyip `/giris?sebep=oturum` adresine götürür.
 * Doğrudan `/giris`'e yönlendirmek işe yaramıyor: middleware imzası geçerli
 * çerezi görüp kullanıcıyı panele geri atardı, sonsuz gidiş geliş olurdu.
 */
export async function oturumGerekli(): Promise<OturumBilgisi> {
  const oturum = await gecerliOturum();
  if (!oturum) redirect("/api/cikis");
  return oturum;
}

/** Sadece yoneticilerin erisebilecegi sayfalar icin. */
export async function yoneticiGerekli(): Promise<OturumBilgisi> {
  const oturum = await oturumGerekli();
  if (oturum.rol !== "ADMIN") redirect("/");
  return oturum;
}

export const OTURUM_COOKIE = COOKIE_ADI;
