import type { NextRequest } from "next/server";
import { gecerliOturum } from "@/lib/oturum";
import { canliDinle } from "@/lib/canli";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Bağlantının proxy tarafından kapatılmaması için düzenli aralıkla yorum satırı gönderilir */
const KALP_ATISI_MS = 25000;

export async function GET(istek: NextRequest) {
  const oturum = await gecerliOturum();
  if (!oturum) return new Response("Oturum gerekli", { status: 401 });

  const kodlayici = new TextEncoder();

  const akis = new ReadableStream({
    start(kontrolcu) {
      const gonder = (veri: string) => {
        try {
          kontrolcu.enqueue(kodlayici.encode(veri));
        } catch {
          /* akış kapanmış */
        }
      };

      gonder(": baglandi\n\n");

      const birak = canliDinle((olayTuru) => {
        gonder(`event: degisiklik\ndata: ${JSON.stringify({ tur: olayTuru })}\n\n`);
      });

      let kalp: ReturnType<typeof setInterval> | undefined;

      const kapat = () => {
        if (kalp) clearInterval(kalp);
        birak();
        try {
          kontrolcu.close();
        } catch {
          /* zaten kapalı */
        }
      };

      /* Kalp atışı hem bağlantıyı canlı tutuyor hem hesabın hâlâ aktif
         olduğunu denetliyor. Akış uzun ömürlü: yalnızca bağlanırken
         doğrulasaydık, sonradan pasife alınan kullanıcı sekmesini kapatana
         kadar değişiklik bildirimlerini almaya devam ederdi.

         Burada `gecerliOturum()` değil doğrudan veritabanı kullanılıyor:
         o işlev çerez okuyor, çerezler ise istek kapsamına bağlı ve bu geri
         çağrı yanıt başladıktan dakikalar sonra çalışıyor. */
      kalp = setInterval(() => {
        void (async () => {
          try {
            const k = await db.kullanici.findUnique({
              where: { id: oturum.id },
              select: { aktif: true },
            });
            if (!k?.aktif) {
              kapat();
              return;
            }
            gonder(": kalp\n\n");
          } catch {
            /* veritabanı geçici olarak erişilemezse bağlantıyı düşürmüyoruz;
               bir sonraki atışta yeniden denenir */
            gonder(": kalp\n\n");
          }
        })();
      }, KALP_ATISI_MS);

      istek.signal.addEventListener("abort", kapat);
    },
  });

  return new Response(akis, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // nginx arkasında tamponlama SSE'yi bozar
      "X-Accel-Buffering": "no",
    },
  });
}
