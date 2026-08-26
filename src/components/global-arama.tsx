"use client";

/**
 * Üst çubuktaki global arama.
 *
 * Kenar durumları (UI'ın takılı kalmasını önleyen kısım):
 * - 300 ms debounce: her tuş vuruşunda istek atılmaz
 * - AbortController: yeni istek başlarken öncekini iptal eder, böylece geç dönen
 *   eski yanıt yeni sonucu ezemez (yarış durumu)
 * - istekSayaci: iptal edilemeyen durumlarda bile yalnızca en son isteğin
 *   yanıtı ekrana yazılır
 * - terim temizlenince bekleyen istek iptal edilir ve panel kapanır
 * - ağ hatasında sonsuz "yükleniyor" yerine hata + tekrar dene
 * - 2 karakter altında sorgu çalıştırılmaz
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconAlertTriangle, IconLoader2, IconSearch, IconX } from "@tabler/icons-react";
import type { AramaGrubu, AramaYaniti } from "@/app/api/arama/route";

const GECIKME_MS = 300;
const EN_AZ_KARAKTER = 2;

type Durum = "bos" | "yaziliyor" | "yukleniyor" | "hazir" | "hata";

export function GlobalArama() {
  const router = useRouter();
  const [terim, setTerim] = useState("");
  const [gruplar, setGruplar] = useState<AramaGrubu[]>([]);
  const [durum, setDurum] = useState<Durum>("bos");
  const [acik, setAcik] = useState(false);
  const [secili, setSecili] = useState(0);

  const kutu = useRef<HTMLDivElement>(null);
  const girdi = useRef<HTMLInputElement>(null);
  const iptal = useRef<AbortController | null>(null);
  const istekSayaci = useRef(0);

  /* Düz liste: klavye ile gezinme için grupları tek diziye indirger */
  const duzListe = gruplar.flatMap((g) => g.sonuclar);

  const aramayiCalistir = useCallback(async (q: string) => {
    iptal.current?.abort();
    const kontrolcu = new AbortController();
    iptal.current = kontrolcu;
    const sayac = ++istekSayaci.current;

    setDurum("yukleniyor");
    try {
      const yanit = await fetch(`/api/arama?q=${encodeURIComponent(q)}`, {
        signal: kontrolcu.signal,
        headers: { accept: "application/json" },
      });
      if (!yanit.ok) throw new Error(`Sunucu ${yanit.status}`);
      const veri = (await yanit.json()) as AramaYaniti;

      // Yalnızca en son isteğin sonucu ekrana yazılır
      if (sayac !== istekSayaci.current) return;
      setGruplar(veri.gruplar);
      setSecili(0);
      setDurum("hazir");
    } catch (e) {
      if ((e as Error).name === "AbortError") return; // iptal edilen istek hata değildir
      if (sayac !== istekSayaci.current) return;
      setGruplar([]);
      setDurum("hata");
    }
  }, []);

  /* Debounce */
  useEffect(() => {
    const q = terim.trim();

    if (q.length < EN_AZ_KARAKTER) {
      iptal.current?.abort();
      istekSayaci.current++; // uçuştaki yanıtlar yok sayılsın
      setGruplar([]);
      setDurum(q.length === 0 ? "bos" : "yaziliyor");
      return;
    }

    setDurum("yaziliyor");
    const zamanlayici = setTimeout(() => void aramayiCalistir(q), GECIKME_MS);
    return () => clearTimeout(zamanlayici);
  }, [terim, aramayiCalistir]);

  /* Bileşen kaldırılırken uçuştaki isteği iptal et */
  useEffect(() => () => iptal.current?.abort(), []);

  /* Dışarı tıklama */
  useEffect(() => {
    const disari = (e: MouseEvent) => {
      if (kutu.current && !kutu.current.contains(e.target as Node)) setAcik(false);
    };
    document.addEventListener("mousedown", disari);
    return () => document.removeEventListener("mousedown", disari);
  }, []);

  /* Ctrl+K / Cmd+K */
  useEffect(() => {
    const kisayol = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        girdi.current?.focus();
        girdi.current?.select();
        setAcik(true);
      }
    };
    document.addEventListener("keydown", kisayol);
    return () => document.removeEventListener("keydown", kisayol);
  }, []);

  const temizle = () => {
    iptal.current?.abort();
    istekSayaci.current++;
    setTerim("");
    setGruplar([]);
    setDurum("bos");
    setAcik(false);
    girdi.current?.focus();
  };

  const git = (yol: string) => {
    setAcik(false);
    setTerim("");
    setGruplar([]);
    setDurum("bos");
    router.push(yol);
  };

  const klavye = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (terim) temizle();
      else setAcik(false);
      return;
    }
    if (!acik || duzListe.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSecili((s) => (s + 1) % duzListe.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSecili((s) => (s - 1 + duzListe.length) % duzListe.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hedef = duzListe[secili];
      if (hedef) git(hedef.yol);
    }
  };

  const panelAcik = acik && terim.trim().length > 0;
  let sirano = -1;

  return (
    <div className="position-relative w-100 krp-arama" ref={kutu} style={{ maxWidth: "26rem" }}>
      <div className="input-icon">
        <span className="input-icon-addon">
          {durum === "yukleniyor" || durum === "yaziliyor" ? (
            <IconLoader2 size={18} stroke={1.5} className="krp-doner" />
          ) : (
            <IconSearch size={18} stroke={1.5} />
          )}
        </span>
        <input
          ref={girdi}
          type="text"
          className="form-control"
          placeholder="Bina, malik veya müteahhit ara…"
          value={terim}
          onChange={(e) => {
            setTerim(e.target.value);
            setAcik(true);
          }}
          onFocus={() => setAcik(true)}
          onKeyDown={klavye}
          aria-label="Genel arama"
          aria-expanded={panelAcik}
          aria-autocomplete="list"
          role="combobox"
          aria-controls="krp-arama-sonuclari"
        />
        {terim ? (
          <span className="input-icon-addon" style={{ left: "auto", right: 0, pointerEvents: "all" }}>
            <button
              type="button"
              className="btn btn-ghost-secondary btn-icon btn-sm border-0"
              onClick={temizle}
              aria-label="Aramayı temizle"
              title="Temizle (Esc)"
            >
              <IconX size={16} stroke={1.5} />
            </button>
          </span>
        ) : (
          /* Girdi boşken kısayol ipucu; yazmaya başlayınca yerini temizle
             düğmesine bırakır. aria-hidden — ekran okuyucuya gürültü olmasın. */
          <span className="krp-arama-kisayol" aria-hidden="true">
            <kbd>Ctrl</kbd>
            <kbd>K</kbd>
          </span>
        )}
      </div>

      {panelAcik && (
        <div className="krp-arama-paneli card" id="krp-arama-sonuclari" role="listbox">
          {durum === "hata" ? (
            <div className="card-body text-center py-4">
              <IconAlertTriangle size={28} stroke={1.5} className="text-red mb-2" />
              <div className="fw-medium">Arama yapılamadı</div>
              <div className="text-secondary small mb-3">
                Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.
              </div>
              <button type="button" className="btn btn-sm" onClick={() => void aramayiCalistir(terim.trim())}>
                Tekrar dene
              </button>
            </div>
          ) : terim.trim().length < EN_AZ_KARAKTER ? (
            <div className="card-body text-secondary small text-center py-3">
              Aramak için en az {EN_AZ_KARAKTER} karakter yazın.
            </div>
          ) : durum === "yukleniyor" || durum === "yaziliyor" ? (
            <div className="card-body text-secondary small text-center py-3">Aranıyor…</div>
          ) : gruplar.length === 0 ? (
            <div className="card-body text-center py-4">
              <div className="fw-medium">Sonuç bulunamadı</div>
              <div className="text-secondary small">
                &ldquo;{terim.trim()}&rdquo; için kayıt yok. Farklı bir kelime deneyin.
              </div>
            </div>
          ) : (
            <div className="krp-arama-liste">
              {gruplar.map((g) => (
                <div key={g.tur}>
                  <div className="krp-arama-baslik">
                    {g.etiket}
                    {g.toplam > g.sonuclar.length && (
                      <span className="text-secondary ms-2">
                        {g.sonuclar.length} / {g.toplam}
                      </span>
                    )}
                  </div>
                  {g.sonuclar.map((s) => {
                    sirano++;
                    const bu = sirano;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        role="option"
                        aria-selected={bu === secili}
                        className={`krp-arama-satir${bu === secili ? " secili" : ""}`}
                        onMouseEnter={() => setSecili(bu)}
                        onClick={() => git(s.yol)}
                      >
                        <span className="flex-fill text-truncate">
                          <span className="d-block text-truncate">{s.baslik}</span>
                          <span className="d-block text-secondary small text-truncate">{s.altBilgi}</span>
                        </span>
                        {s.rozet && <span className={`badge bg-${s.rozet.renk}-lt flex-shrink-0`}>{s.rozet.etiket}</span>}
                      </button>
                    );
                  })}
                </div>
              ))}

              <div className="krp-arama-alt">
                <span className="text-secondary small">
                  <kbd>↑</kbd> <kbd>↓</kbd> gezin · <kbd>Enter</kbd> aç · <kbd>Esc</kbd> kapat
                </span>
                <Link
                  href={`/binalar?q=${encodeURIComponent(terim.trim())}`}
                  className="btn btn-sm"
                  onClick={() => setAcik(false)}
                >
                  Binalarda ara
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
