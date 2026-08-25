import type { NextRequest } from "next/server";
import { oturumAl } from "@/lib/oturum";
import { canliDinle } from "@/lib/canli";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Bağlantının proxy tarafından kapatılmaması için düzenli aralıkla yorum satırı gönderilir */
const KALP_ATISI_MS = 25000;

export async function GET(istek: NextRequest) {
  const oturum = await oturumAl();
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

      const kalp = setInterval(() => gonder(": kalp\n\n"), KALP_ATISI_MS);

      const kapat = () => {
        clearInterval(kalp);
        birak();
        try {
          kontrolcu.close();
        } catch {
          /* zaten kapalı */
        }
      };

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
