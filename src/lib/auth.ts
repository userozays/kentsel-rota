import "server-only";
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "./db";
import { yetkiVar, type Yetki } from "./roller";

const scrypt = promisify(_scrypt) as (
  sifre: string | Buffer,
  tuz: string | Buffer,
  uzunluk: number,
) => Promise<Buffer>;

const COOKIE = "kr_oturum";
const OTURUM_GUN = 14;

/* ---------- şifre ---------- */

export async function sifreHashle(sifre: string): Promise<string> {
  const tuz = randomBytes(16).toString("hex");
  const turev = await scrypt(sifre.normalize("NFKC"), tuz, 64);
  return `scrypt$${tuz}$${turev.toString("hex")}`;
}

export async function sifreDogrula(sifre: string, hash: string): Promise<boolean> {
  const parcalar = hash.split("$");
  if (parcalar.length !== 3 || parcalar[0] !== "scrypt") return false;
  const [, tuz, beklenen] = parcalar;
  const beklenenBuf = Buffer.from(beklenen, "hex");
  const turev = await scrypt(sifre.normalize("NFKC"), tuz, beklenenBuf.length);
  return turev.length === beklenenBuf.length && timingSafeEqual(turev, beklenenBuf);
}

/* ---------- oturum ---------- */

export async function oturumAc(kullaniciId: string) {
  const id = randomBytes(32).toString("base64url");
  const bitis = new Date(Date.now() + OTURUM_GUN * 24 * 60 * 60 * 1000);
  const h = await headers();
  await db.oturum.create({
    data: {
      id,
      kullaniciId,
      bitis,
      tarayici: (h.get("user-agent") ?? "").slice(0, 200),
    },
  });
  const c = await cookies();
  c.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: bitis,
  });
  // Süresi geçmiş oturumları fırsat buldukça temizle
  db.oturum.deleteMany({ where: { bitis: { lt: new Date() } } }).catch(() => {});
}

export async function oturumKapat() {
  const c = await cookies();
  const id = c.get(COOKIE)?.value;
  if (id) await db.oturum.delete({ where: { id } }).catch(() => {});
  c.delete(COOKIE);
}

export type OturumKullanici = {
  id: string;
  ad: string;
  eposta: string;
  rol: string;
};

/** İstek başına tek sorgu — React cache ile tekilleştirilir. */
export const oturumOku = cache(async (): Promise<OturumKullanici | null> => {
  const c = await cookies();
  const id = c.get(COOKIE)?.value;
  if (!id) return null;

  const o = await db.oturum.findUnique({
    where: { id },
    include: { kullanici: true },
  });
  if (!o || o.bitis < new Date() || !o.kullanici.aktif) return null;

  return {
    id: o.kullanici.id,
    ad: o.kullanici.ad,
    eposta: o.kullanici.eposta,
    rol: o.kullanici.rol,
  };
});

/** Oturum yoksa /giris'e yönlendirir. Korumalı her sayfa/eylem bunu çağırır. */
export async function oturumGerekli(): Promise<OturumKullanici> {
  const k = await oturumOku();
  if (!k) redirect("/giris");
  return k;
}

/** Belirli bir yetki yoksa hata fırlatır (sunucu eylemleri için). */
export async function yetkiGerekli(yetki: Yetki): Promise<OturumKullanici> {
  const k = await oturumGerekli();
  if (!yetkiVar(k.rol, yetki)) {
    throw new Error("Bu işlem için yetkin yok.");
  }
  return k;
}

/** SAHA rolü için bina bazlı erişim kontrolü. */
export async function binaErisimiVar(k: OturumKullanici, binaId: string): Promise<boolean> {
  if (yetkiVar(k.rol, "tumBinalar")) return true;
  const e = await db.binaErisim.findUnique({
    where: { kullaniciId_binaId: { kullaniciId: k.id, binaId } },
  });
  return !!e;
}

/** Kullanıcının görebileceği bina id'leri; null = kısıt yok (hepsi). */
export async function gorunurBinaIdleri(k: OturumKullanici): Promise<string[] | null> {
  if (yetkiVar(k.rol, "tumBinalar")) return null;
  const e = await db.binaErisim.findMany({
    where: { kullaniciId: k.id },
    select: { binaId: true },
  });
  return e.map((x) => x.binaId);
}
