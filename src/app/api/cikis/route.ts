import { NextResponse, type NextRequest } from "next/server";
import { gecerliOturum, oturumKapat } from "@/lib/oturum";

/** Kullanıcının kendi isteğiyle çıkış (kenar çubuğundaki düğme). */
export async function POST(istek: NextRequest) {
  await oturumKapat();
  return NextResponse.redirect(new URL("/giris", istek.url), { status: 303 });
}

/**
 * Geçersiz kalmış oturumu temizler. `oturumGerekli()` buraya yönlendiriyor:
 * çerez imzası geçerli ama arkasındaki kullanıcı silinmiş ya da pasife
 * alınmışsa çerezi burada düşürüp giriş ekranına götürüyoruz.
 *
 * GET olmasına rağmen güvenli: yalnızca oturum GERÇEKTEN geçersizse çerez
 * siliniyor. Aksi halde dış bir sitenin `<img src=".../api/cikis">` koyarak
 * kullanıcıyı oturumdan atması mümkün olurdu.
 */
export async function GET(istek: NextRequest) {
  const gecerli = await gecerliOturum();
  if (gecerli) {
    return NextResponse.redirect(new URL("/", istek.url), { status: 303 });
  }

  await oturumKapat();
  const hedef = new URL("/giris", istek.url);
  hedef.searchParams.set("sebep", "oturum");
  return NextResponse.redirect(hedef, { status: 303 });
}
