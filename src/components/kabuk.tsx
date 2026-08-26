"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconBriefcase,
  IconBuildingCommunity,
  IconCalendarEvent,
  IconHistory,
  IconLayoutDashboard,
  IconLogout,
  IconMenu2,
  IconMoon,
  IconShieldLock,
  IconSun,
  IconUsers,
} from "@tabler/icons-react";
import { basHarfler, avatarRengi } from "@/lib/yardimcilar";
import { ROL } from "@/lib/sabitler";
import { GlobalArama } from "./global-arama";

type Oturum = { id: string; ad: string; email: string; rol: string };

/* Menü, bölüm başlıklarıyla gruplanıyor: yedi düz madde yerine
   "takip ettiğim kayıtlar" / "günlük iş" / "yönetim" ayrımı. */
const MENU: { bolum?: string; ogeler: MenuOgesi[] }[] = [
  {
    ogeler: [{ yol: "/", etiket: "Panel", ikon: IconLayoutDashboard, tam: true }],
  },
  {
    bolum: "Kayıtlar",
    ogeler: [
      { yol: "/binalar", etiket: "Binalar", ikon: IconBuildingCommunity },
      { yol: "/malikler", etiket: "Malikler", ikon: IconUsers },
      { yol: "/muteahhitler", etiket: "Müteahhitler", ikon: IconBriefcase },
    ],
  },
  {
    bolum: "İş akışı",
    ogeler: [
      { yol: "/takvim", etiket: "Canlı İş Takvimi", ikon: IconCalendarEvent },
      { yol: "/aktiviteler", etiket: "Aktiviteler", ikon: IconHistory },
    ],
  },
  {
    bolum: "Yönetim",
    ogeler: [
      { yol: "/kullanicilar", etiket: "Kullanıcılar", ikon: IconShieldLock, sadeceAdmin: true },
    ],
  },
];

type MenuOgesi = {
  yol: string;
  etiket: string;
  ikon: typeof IconLayoutDashboard;
  tam?: boolean;
  sadeceAdmin?: boolean;
};

function aktifMi(yol: string, mevcut: string, tam?: boolean) {
  if (tam) return mevcut === yol;
  return mevcut === yol || mevcut.startsWith(yol + "/");
}

/* --------------------------------------------- Tema düğmesi (kenar çubuğu altı) */

function TemaSatiri() {
  const [tema, setTema] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTema((document.documentElement.getAttribute("data-bs-theme") as "light" | "dark") ?? "light");
  }, []);

  const degistir = () => {
    const yeni = tema === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-bs-theme", yeni);
    try {
      localStorage.setItem("krp-tema", yeni);
    } catch {
      /* localStorage kapalı olabilir */
    }
    setTema(yeni);
  };

  return (
    <button type="button" className="krp-kenar-dugme" onClick={degistir} aria-label="Tema değiştir">
      <span className="nav-link-icon">
        {tema === "dark" ? <IconSun size={18} stroke={1.6} /> : <IconMoon size={18} stroke={1.6} />}
      </span>
      <span>{tema === "dark" ? "Aydınlık tema" : "Karanlık tema"}</span>
    </button>
  );
}

/* --------------------------------------------- Giriş yapan kişi (üst çubuk sağ) */

function KullaniciBloku({ oturum, kompakt = false }: { oturum: Oturum; kompakt?: boolean }) {
  const rol = ROL[oturum.rol];
  return (
    <>
      <span className={`avatar avatar-sm bg-${avatarRengi(oturum.email)}-lt`}>
        {basHarfler(oturum.ad)}
      </span>
      {!kompakt && (
        <span className="d-none d-xl-block">
          <span className="krp-kisi-ad d-block">{oturum.ad}</span>
          <span className="krp-kisi-rol d-block">{rol?.etiket ?? oturum.rol}</span>
        </span>
      )}
    </>
  );
}

/* --------------------------------------------------------------------- Kabuk */

export function Kabuk({ oturum, children }: { oturum: Oturum; children: React.ReactNode }) {
  const yol = usePathname();
  const [menuAcik, setMenuAcik] = useState(false);

  useEffect(() => {
    setMenuAcik(false);
  }, [yol]);

  const gorunurBolumler = MENU.map((b) => ({
    ...b,
    ogeler: b.ogeler.filter((o) => !o.sadeceAdmin || oturum.rol === "ADMIN"),
  })).filter((b) => b.ogeler.length > 0);

  return (
    <div className="page">
      <aside className="navbar navbar-vertical navbar-expand-lg d-print-none">
        <div className="container-fluid">
          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setMenuAcik((a) => !a)}
            aria-label="Menüyü aç/kapat"
            aria-expanded={menuAcik}
          >
            <IconMenu2 size={22} stroke={1.5} />
          </button>

          <div className="navbar-brand navbar-brand-autodark">
            <Link href="/" className="krp-marka">
              <span className="krp-marka-isaret" aria-hidden="true">
                KR
              </span>
              <span className="d-none d-lg-block">
                <span className="krp-marka-ad">Kentsel Rota</span>
                <span className="krp-marka-alt">Süreç Paneli</span>
              </span>
            </Link>
          </div>

          {/* Mobilde üst çubuk gizli olduğu için giriş yapan kişi burada görünür */}
          <div className="d-lg-none pe-3">
            <Link href="/profil" className="krp-kisi-cip" title="Profilim">
              <KullaniciBloku oturum={oturum} kompakt />
            </Link>
          </div>

          <div className={`collapse navbar-collapse${menuAcik ? " show" : ""}`}>
            <ul className="navbar-nav">
              {gorunurBolumler.map((bolum, i) => (
                <li key={bolum.bolum ?? `bolum-${i}`} className="nav-item krp-menu-bolum">
                  {bolum.bolum && <span className="krp-menu-bolum-baslik">{bolum.bolum}</span>}
                  <ul className="krp-menu-liste">
                    {bolum.ogeler.map((m) => {
                      const Ikon = m.ikon;
                      const aktif = aktifMi(m.yol, yol, m.tam);
                      return (
                        <li key={m.yol} className={`nav-item${aktif ? " active" : ""}`}>
                          <Link
                            className="nav-link"
                            href={m.yol}
                            aria-current={aktif ? "page" : undefined}
                          >
                            <span className="nav-link-icon">
                              <Ikon size={18} stroke={1.6} />
                            </span>
                            <span className="nav-link-title">{m.etiket}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>

            {/* Kenar çubuğunun altı: tema ve çıkış.
                Tabler'da .navbar-nav flex-grow:1 taşıdığı için bu blok kendiliğinden en alta oturur. */}
            <div className="krp-kenar-alt">
              <TemaSatiri />
              <form action="/api/cikis" method="post">
                <button type="submit" className="krp-kenar-dugme krp-kenar-cikis">
                  <span className="nav-link-icon">
                    <IconLogout size={18} stroke={1.6} />
                  </span>
                  <span>Çıkış Yap</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      <header className="navbar navbar-expand-md d-none d-lg-flex d-print-none">
        <div className="container-fluid">
          <div className="flex-fill" style={{ maxWidth: "26rem" }}>
            <GlobalArama />
          </div>

          {/* Profile tek giriş noktası: kişi çipinin kendisi.
              Yanında ayrı bir "Profilim" düğmesi vardı, aynı yere gidiyordu —
              kaldırıldı. */}
          <div className="ms-auto">
            <Link
              href="/profil"
              className="krp-kisi-cip"
              title="Profil bilgilerim ve şifre değiştirme"
              aria-current={yol === "/profil" ? "page" : undefined}
            >
              <KullaniciBloku oturum={oturum} />
            </Link>
          </div>
        </div>
      </header>

      <div className="page-wrapper">
        {children}
        <footer className="footer footer-transparent d-print-none">
          <div className="container-fluid">
            <div className="d-flex flex-column flex-lg-row align-items-center justify-content-between gap-2 text-center text-lg-start">
              <span className="text-secondary">
                6306 sayılı Kanun kapsamında süreç takibi. Resmî işlemler için ilgili idare kayıtları
                esastır.
              </span>
              <span className="text-secondary">Kentsel Rota Panel</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
