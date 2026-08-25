"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconDownload,
  IconFile,
  IconFileText,
  IconPaperclip,
  IconPhoto,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { belgeSil, belgeYukle, type BelgeDurumu } from "@/app/(panel)/belgeler/eylemler";
import { BELGE_KATEGORILERI, BELGE_KATEGORISI, etiketBul } from "@/lib/sabitler";
import { EN_BUYUK_BOYUT, KABUL_LISTESI, boyutMetni } from "@/lib/belge-ortak";
import { SilOnayi } from "./modal";

export type BelgeSatiri = {
  id: string;
  ad: string;
  dosyaAdi: string;
  mimeTur: string | null;
  boyut: number;
  kategori: string;
  tarih: string;
  yukleyenAdi: string;
  silebilir: boolean;
};

function DosyaIkonu({ mimeTur }: { mimeTur: string | null }) {
  if (mimeTur?.startsWith("image/")) return <IconPhoto size={20} stroke={1.5} />;
  if (mimeTur === "application/pdf") return <IconFileText size={20} stroke={1.5} />;
  return <IconFile size={20} stroke={1.5} />;
}

export function BelgelerKarti({
  belgeler,
  binaId,
  malikId,
  muteahhitId,
  duzenlenebilir,
}: {
  belgeler: BelgeSatiri[];
  binaId?: string;
  malikId?: string;
  muteahhitId?: string;
  duzenlenebilir: boolean;
}) {
  const [acik, setAcik] = useState(false);
  const [secilen, setSecilen] = useState<File | null>(null);
  const [onHata, setOnHata] = useState<string | null>(null);
  const [durum, eylem, bekliyor] = useActionState<BelgeDurumu, FormData>(belgeYukle, {});
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (durum.basarili) {
      form.current?.reset();
      setSecilen(null);
      setOnHata(null);
      setAcik(false);
      router.refresh();
    }
  }, [durum, router]);

  /* Sunucuya gitmeden önce boyut kontrolü: büyük dosyada boşuna bekletmeyelim */
  const dosyaSecildi = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.files?.[0] ?? null;
    if (d && d.size > EN_BUYUK_BOYUT) {
      setOnHata(`"${d.name}" çok büyük (${boyutMetni(d.size)}). En fazla ${boyutMetni(EN_BUYUK_BOYUT)} yükleyebilirsiniz.`);
      setSecilen(null);
      e.target.value = "";
      return;
    }
    setOnHata(null);
    setSecilen(d);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <IconPaperclip size={18} stroke={1.5} className="me-2" />
          Belgeler
          {belgeler.length > 0 && <span className="badge bg-secondary-lt ms-2">{belgeler.length}</span>}
        </h3>
        {duzenlenebilir && (
          <div className="card-actions">
            <button type="button" className="btn btn-sm" onClick={() => setAcik((a) => !a)}>
              {acik ? (
                <>
                  <IconX size={16} stroke={1.5} className="me-1" />
                  Kapat
                </>
              ) : (
                <>
                  <IconUpload size={16} stroke={1.5} className="me-1" />
                  Belge Yükle
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {duzenlenebilir && acik && (
        <div className="card-body border-bottom bg-surface-secondary">
          <form action={eylem} ref={form}>
            {binaId && <input type="hidden" name="binaId" value={binaId} />}
            {malikId && <input type="hidden" name="malikId" value={malikId} />}
            {muteahhitId && <input type="hidden" name="muteahhitId" value={muteahhitId} />}

            {(durum.hata || onHata) && <div className="alert alert-danger">{onHata ?? durum.hata}</div>}

            <div className="row g-2">
              <div className="col-12">
                <label className="form-label required" htmlFor="dosya">
                  Dosya
                </label>
                <input
                  id="dosya"
                  name="dosya"
                  type="file"
                  className="form-control"
                  accept={KABUL_LISTESI}
                  onChange={dosyaSecildi}
                  required
                />
                <small className="form-hint">
                  En fazla {boyutMetni(EN_BUYUK_BOYUT)} · PDF, resim, Word ve Excel dosyaları
                  {secilen && <span className="text-green"> · seçildi: {boyutMetni(secilen.size)}</span>}
                </small>
              </div>

              <div className="col-md-5">
                <label className="form-label" htmlFor="kategori">
                  Kategori
                </label>
                <select id="kategori" name="kategori" className="form-select" defaultValue="DIGER">
                  {BELGE_KATEGORILERI.map((k) => (
                    <option key={k.deger} value={k.deger}>
                      {k.etiket}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-7">
                <label className="form-label" htmlFor="ad">
                  Görünen ad
                </label>
                <input id="ad" name="ad" className="form-control" placeholder="Boş bırakılırsa dosya adı kullanılır" />
              </div>

              <div className="col-12">
                <button type="submit" className="btn btn-primary" disabled={bekliyor || !!onHata}>
                  <IconUpload size={18} stroke={1.5} className="me-1" />
                  {bekliyor ? "Yükleniyor…" : "Yükle"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {belgeler.length === 0 ? (
        <div className="card-body text-secondary small text-center py-4">
          Henüz belge yüklenmemiş.
          {duzenlenebilir && " Yukarıdaki düğmeyle tapu, rapor veya sözleşme ekleyebilirsiniz."}
        </div>
      ) : (
        <div className="list-group list-group-flush">
          {belgeler.map((b) => {
            const k = etiketBul(BELGE_KATEGORISI, b.kategori);
            return (
              <div key={b.id} className="list-group-item">
                <div className="row align-items-center g-2">
                  <div className="col-auto text-secondary">
                    <DosyaIkonu mimeTur={b.mimeTur} />
                  </div>
                  <div className="col text-truncate">
                    <Link href={`/api/belge/${b.id}`} target="_blank" className="text-reset d-block text-truncate">
                      {b.ad}
                    </Link>
                    <div className="text-secondary small text-truncate">
                      {boyutMetni(b.boyut)} · {b.tarih} · {b.yukleyenAdi}
                    </div>
                  </div>
                  <div className="col-auto">
                    <span className={`badge bg-${k.renk}-lt`}>{k.etiket}</span>
                  </div>
                  <div className="col-auto">
                    <div className="btn-list flex-nowrap">
                      <Link
                        href={`/api/belge/${b.id}?indir=1`}
                        className="btn btn-sm btn-icon"
                        title="İndir"
                        aria-label={`${b.ad} dosyasını indir`}
                      >
                        <IconDownload size={16} stroke={1.5} />
                      </Link>
                      {b.silebilir && (
                        <SilOnayi
                          eylem={belgeSil}
                          alanlar={{ id: b.id }}
                          baslik="Belgeyi sil"
                          mesaj={
                            <>
                              <strong>{b.ad}</strong> kalıcı olarak silinecek; dosya sunucudan da kaldırılır.
                              <div className="text-secondary small mt-2">Bu işlem geri alınamaz.</div>
                            </>
                          }
                          tetikleyici={<IconTrash size={16} stroke={1.5} />}
                          tetikleyiciSinif="btn btn-sm btn-icon btn-ghost-danger"
                          tetikleyiciBaslik="Sil"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
