import { DURUM_AD } from "@/lib/sabitler";
import { tl, yuzde } from "@/lib/bicim";
import type { MalikGirdi, Ozet } from "@/lib/hesap";

const SIRA: Record<string, number> = { olumlu: 0, kararsiz: 1, ulasilamadi: 2, olumsuz: 3 };

/**
 * Pay şeridi: her bağımsız bölüm arsa payı kadar genişlikte bir parça.
 * Segmentler olumlu → kararsız → ulaşılamadı → olumsuz sırasıyla dizilir ki
 * eşik çizgisi doğrudan olumlu payın nerede bittiğini göstersin.
 */
export function PayScridi({
  malikler,
  ozet,
  boy = "md",
  esikYuzde = 50,
}: {
  malikler: MalikGirdi[];
  ozet: Ozet;
  boy?: "sm" | "md" | "lg";
  esikYuzde?: number;
}) {
  const sirali = malikler
    .slice()
    .sort((a, b) => (SIRA[a.durum] ?? 9) - (SIRA[b.durum] ?? 9) || b.pay - a.pay);

  const bosPay = Math.max(0, ozet.payda - ozet.girilen);

  return (
    <div className="strip-wrap">
      <div className={`strip${boy === "lg" ? " lg" : boy === "sm" ? " sm" : ""}`}>
        {sirali.map((m) => (
          <div
            key={m.id}
            className={`seg ${m.durum}`}
            style={{ width: `${((m.pay / ozet.payda) * 100).toFixed(3)}%` }}
            title={`${m.ad} · D.${m.bb} · ${tl(m.pay)}/${tl(ozet.payda)} pay · ${DURUM_AD[m.durum] ?? m.durum}`}
          />
        ))}
        {bosPay > 0 && (
          <div
            className="seg"
            style={{
              width: `${((bosPay / ozet.payda) * 100).toFixed(3)}%`,
              background: "var(--surface-3)",
            }}
            title={`Girilmemiş pay: ${tl(bosPay)}`}
          />
        )}
      </div>
      <div className="thresh" style={{ left: `${esikYuzde}%` }} data-esik={`%${esikYuzde}`} />
    </div>
  );
}

export function Okuma({ ozet }: { ozet: Ozet }) {
  return (
    <div className="readout">
      <span className={`big ${ozet.gecti ? "pass" : "fail"}`}>%{yuzde(ozet.oran)}</span>
      <span className="lbl">arsa payı</span>
      <span className="kisi">
        · {ozet.kisiOlumlu}/{ozet.kisi} kişi
      </span>
      <span className={`verdict ${ozet.gecti ? "pass" : "fail"}`}>
        {ozet.gecti ? "✓ Çoğunluk var" : `${tl(ozet.eksikPay)} pay eksik`}
      </span>
    </div>
  );
}

export function Efsane() {
  return (
    <div className="legend">
      <span><i style={{ background: "var(--ok-line)" }} />Olumlu</span>
      <span><i style={{ background: "var(--warn-line)" }} />Kararsız</span>
      <span><i style={{ background: "var(--idle-line)" }} />Ulaşılamadı</span>
      <span><i style={{ background: "var(--bad-line)" }} />Olumsuz</span>
      <span><i style={{ background: "var(--surface-3)", border: "1px solid var(--border-strong)" }} />Girilmemiş pay</span>
    </div>
  );
}
