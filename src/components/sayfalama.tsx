import Link from "next/link";
import { sayi } from "@/lib/yardimcilar";

export function Sayfalama({
  toplam,
  sayfa,
  adet,
  temelYol,
  parametreler,
}: {
  toplam: number;
  sayfa: number;
  adet: number;
  temelYol: string;
  parametreler: Record<string, string | undefined>;
}) {
  const sonSayfa = Math.max(1, Math.ceil(toplam / adet));
  if (toplam === 0) return null;

  const baglanti = (s: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(parametreler)) if (v) p.set(k, v);
    if (s > 1) p.set("sayfa", String(s));
    const q = p.toString();
    return q ? `${temelYol}?${q}` : temelYol;
  };

  const ilk = (sayfa - 1) * adet + 1;
  const son = Math.min(toplam, sayfa * adet);

  const sayfalar: number[] = [];
  for (let s = Math.max(1, sayfa - 2); s <= Math.min(sonSayfa, sayfa + 2); s++) sayfalar.push(s);

  return (
    <div className="card-footer d-flex align-items-center flex-wrap gap-2">
      <p className="m-0 text-secondary">
        Toplam <strong>{sayi(toplam)}</strong> kayıttan <strong>{sayi(ilk)}</strong>–<strong>{sayi(son)}</strong> arası
      </p>
      {sonSayfa > 1 && (
        <ul className="pagination m-0 ms-auto">
          <li className={`page-item${sayfa <= 1 ? " disabled" : ""}`}>
            <Link className="page-link" href={baglanti(Math.max(1, sayfa - 1))} aria-label="Önceki">
              Önceki
            </Link>
          </li>
          {sayfalar.map((s) => (
            <li key={s} className={`page-item${s === sayfa ? " active" : ""}`}>
              <Link className="page-link" href={baglanti(s)}>
                {s}
              </Link>
            </li>
          ))}
          <li className={`page-item${sayfa >= sonSayfa ? " disabled" : ""}`}>
            <Link className="page-link" href={baglanti(Math.min(sonSayfa, sayfa + 1))} aria-label="Sonraki">
              Sonraki
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}
