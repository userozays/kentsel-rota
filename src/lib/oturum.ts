import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";

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

export async function oturumAl(): Promise<OturumBilgisi | null> {
  const kutu = await cookies();
  const token = kutu.get(COOKIE_ADI)?.value;
  if (!token) return null;
  return tokenCoz(token);
}

/** Oturum yoksa giris sayfasina yonlendirir. */
export async function oturumGerekli(): Promise<OturumBilgisi> {
  const oturum = await oturumAl();
  if (!oturum) redirect("/giris");
  return oturum;
}

/** Sadece yoneticilerin erisebilecegi sayfalar icin. */
export async function yoneticiGerekli(): Promise<OturumBilgisi> {
  const oturum = await oturumGerekli();
  if (oturum.rol !== "ADMIN") redirect("/");
  return oturum;
}

export const OTURUM_COOKIE = COOKIE_ADI;
