import { tl } from "@/lib/bicim";
import type { Ozet } from "@/lib/hesap";

/**
 * "Eşiği geçmek için kimi ikna etmek gerekiyor" kutusu.
 * Kararsız ve ulaşılamayan malikler arsa payına göre sıralanır; eşiği geçmeye
 * yetecek en kısa liste çıkarılır (bkz. lib/hesap.ts → ozetle).
 */
export function Hedef({ ozet }: { ozet: Ozet }) {
  if (ozet.gecti) {
    return (
      <div className="callout">
        <b>Çoğunluk sağlandı.</b> Olumlu arsa payı {tl(ozet.olumlu)}/{tl(ozet.payda)} — eşiğin{" "}
        {tl(Math.floor(ozet.olumlu - ozet.esik))} pay üzerinde. Sıradaki adım: münhasır yetki
        sözleşmesi ve şartname.
      </div>
    );
  }

  if (ozet.hedef.length === 0) {
    return (
      <div className="callout bad">
        <b>Aday kalmadı.</b> Kararsız veya ulaşılamayan malik yok; eşiği geçmek için olumsuz görüş
        bildirenlerden en az <b>{tl(ozet.olumsuzdanGerekli || ozet.eksikPay)} pay</b> kazanılmalı.
      </div>
    );
  }

  return (
    <>
      <div className="callout">
        <b>En kısa yol — {ozet.hedef.length} malik.</b> Arsa payı en büyük adaylar; bu{" "}
        {ozet.hedef.length} kişi olumluya dönerse eşik geçilir.
        <div className="target" style={{ marginTop: 9 }}>
          {ozet.hedef.map((m, i) => (
            <span className="tchip" key={m.id}>
              <span className="rk">{i + 1}</span>
              {m.ad}
              <span className="pv">
                D.{m.bb} · {tl(m.pay)}
              </span>
            </span>
          ))}
        </div>
      </div>

      {!ozet.hedefYeter && (
        <div className="callout bad" style={{ marginTop: 10 }}>
          <b>Dikkat:</b> kararsız ve ulaşılamayan maliklerin <em>tamamı</em> olumluya dönse bile
          eşik geçilmiyor. Olumsuz görüş bildirenlerden en az{" "}
          <b>{tl(ozet.olumsuzdanGerekli)} pay</b> gerekiyor.
        </div>
      )}
    </>
  );
}
