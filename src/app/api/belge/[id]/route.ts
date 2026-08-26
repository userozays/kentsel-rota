import { readFile } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { gecerliOturum } from "@/lib/oturum";
import { tamYolCoz } from "@/lib/belge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Belge indirme. Dosyalar public/ dışında tutulduğu için tek erişim yolu burasıdır
 * ve her istekte oturum doğrulanır.
 */
export async function GET(istek: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const oturum = await gecerliOturum();
  if (!oturum) {
    /* Tarayıcıdan doğrudan açıldıysa çıkışa yönlendir. `/giris` değil:
       çerez imzası geçerli olduğu sürece middleware kullanıcıyı panele geri
       atar, arada bir tur zıplama olur. Çıkış rotası çerezi düşürüp giriş
       ekranına götürür. */
    return NextResponse.redirect(new URL("/api/cikis", istek.url));
  }

  const { id } = await params;
  const belge = await db.belge.findUnique({ where: { id } });
  if (!belge) return new NextResponse("Belge bulunamadı", { status: 404 });

  const yol = tamYolCoz(belge.dosyaYolu);
  if (!yol) return new NextResponse("Geçersiz dosya yolu", { status: 400 });

  let icerik: Buffer;
  try {
    icerik = await readFile(yol);
  } catch {
    return new NextResponse("Dosya diskte bulunamadı", { status: 404 });
  }

  // Tarayıcıda açmak yerine indirmeye zorlamak için: ?indir=1
  const indir = istek.nextUrl.searchParams.get("indir") === "1";
  const guvenliAd = encodeURIComponent(belge.dosyaAdi);

  return new NextResponse(new Uint8Array(icerik), {
    headers: {
      "Content-Type": belge.mimeTur ?? "application/octet-stream",
      "Content-Length": String(icerik.byteLength),
      "Content-Disposition": `${indir ? "attachment" : "inline"}; filename*=UTF-8''${guvenliAd}`,
      // Belgeler kişisel veri içerebilir; ara sunucular önbelleğe almasın
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
