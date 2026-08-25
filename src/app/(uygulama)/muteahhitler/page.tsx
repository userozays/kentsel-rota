import Link from "next/link";
import { redirect } from "next/navigation";
import { oturumGerekli } from "@/lib/auth";
import { yetkiVar } from "@/lib/roller";
import { db } from "@/lib/db";
import { muteahhitSil } from "@/actions/muteahhit";
import { MUTEAHHIT_DURUM_AD } from "@/lib/sabitler";
import { OnayliDugme } from "@/components/Form";

export const metadata = { title: "Müteahhitler — Kentsel Rota" };

export default async function MuteahhitlerSayfasi() {
  const kullanici = await oturumGerekli();
  if (!yetkiVar(kullanici.rol, "tumBinalar")) redirect("/");

  const yazabilir = yetkiVar(kullanici.rol, "muteahhitYaz");
  const muteahhitler = await db.muteahhit.findMany({
    include: { _count: { select: { teklifler: true } } },
    orderBy: { unvan: "asc" },
  });

  const taahhutsuz = muteahhitler.filter((c) => !c.taahhut).length;

  return (
    <>
      <div className="head">
        <div>
          <h1>Müteahhit Havuzu</h1>
          <div className="sub">
            İhale dosyası açılmadan önce her yüklenici <b>NDA + devre dışı bırakmama taahhüdü</b>{" "}
            imzalamalı. İmzasız yükleniciye ada/parsel bilgisi verme — teaser yeterli.
          </div>
        </div>
        {yazabilir && (
          <div className="acts">
            <Link href="/muteahhitler/yeni" className="btn pri">
              + Müteahhit ekle
            </Link>
          </div>
        )}
      </div>

      {taahhutsuz > 0 && (
        <div className="callout warn" style={{ marginBottom: 16 }}>
          <b>{taahhutsuz} yüklenicide devre dışı bırakmama taahhüdü yok.</b> Tam dosyayı
          paylaşmadan önce imzalat; imzasız paylaşımda ihlali ispat edemezsin.
        </div>
      )}

      <div className="panel">
        <div className="pbody flush">
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Yüklenici</th>
                  <th>YMBN</th>
                  <th>Referans</th>
                  <th>Gizlilik</th>
                  <th>Devre dışı bırakmama</th>
                  <th className="num">Teklif</th>
                  <th>Durum</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {muteahhitler.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty">
                        <h3>Havuz boş</h3>
                        <p>
                          Teklif toplayacağın yüklenicileri ekle; her biri için YMBN grubunu ve
                          imzalı belgeleri takip et.
                        </p>
                        {yazabilir && (
                          <Link href="/muteahhitler/yeni" className="btn pri">
                            + Müteahhit ekle
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  muteahhitler.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{c.unvan}</div>
                        <div style={{ fontSize: 11.5, color: "var(--faint)" }}>
                          {c.yetkili || "—"}
                          {c.tel ? ` · ${c.tel}` : ""}
                        </div>
                      </td>
                      <td>
                        <span className={`pill ${["A", "B"].includes(c.ymbn) ? "acc" : "neutral"}`}>
                          Grup {c.ymbn}
                        </span>
                      </td>
                      <td style={{ fontSize: 12.5, color: "var(--muted)" }}>{c.referans || "—"}</td>
                      <td>
                        {c.nda ? (
                          <span className="pill olumlu">NDA ✓</span>
                        ) : (
                          <span className="pill olumsuz">NDA yok</span>
                        )}
                      </td>
                      <td>
                        {c.taahhut ? (
                          <span className="pill olumlu">Taahhüt ✓</span>
                        ) : (
                          <span className="pill kararsiz">İmzasız</span>
                        )}
                      </td>
                      <td className="num">{c._count.teklifler}</td>
                      <td>
                        <span
                          className={`pill ${
                            c.durum === "aktif" ? "acc" : c.durum === "kara" ? "olumsuz" : "neutral"
                          }`}
                        >
                          {MUTEAHHIT_DURUM_AD[c.durum] ?? c.durum}
                        </span>
                      </td>
                      <td>
                        {yazabilir && (
                          <div className="rowact">
                            <Link href={`/muteahhitler/${c.id}`} className="btn sm ghost">
                              Düzenle
                            </Link>
                            {c._count.teklifler === 0 && (
                              <OnayliDugme
                                eylem={muteahhitSil.bind(null, c.id)}
                                soru={`${c.unvan} kaydı silinsin mi?`}
                                etiket="×"
                              />
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
