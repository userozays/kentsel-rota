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
  IconUserCircle,
  IconUsers,
} from "@tabler/icons-react";
import { basHarfler, avatarRengi } from "@/lib/yardimcilar";
import { ROL } from "@/lib/sabitler";
import { GlobalArama } from "./global-arama";

type Oturum = { id: string; ad: string; email: string; rol: string };

const MENU = [
  { yol: "/", etiket: "Panel", ikon: IconLayoutDashboard, tam: true },
  { yol: "/binalar", etiket: "Binalar", ikon: IconBuildingCommunity },
  { yol: "/malikler", etiket: "Malikler", ikon: IconUsers },
  { yol: "/muteahhitler", etiket: "Müteahhitler", ikon: IconBriefcase },
  { yol: "/takvim", etiket: "Canlı İş Takvimi", ikon: IconCalendarEvent },
  { yol: "/aktiviteler", etiket: "Aktiviteler", ikon: IconHistory },
  { yol: "/kullanicilar", etiket: "Kullanıcılar", ikon: IconShieldLock, sadeceAdmin: true },
];

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
        {tema === "dark" ? <IconSun size={20} stroke={1.5} /> : <IconMoon size={20} stroke={1.5} />}
      </span>
      <span>{tema === "dark" ? "Aydınlık tema" : "Karanlık tema"}</span>
    </button>
  );
}

/* --------------------------------------------- Giriş yapan kişi (üst çubuk sağ) */

function KullaniciBloku({ oturum, kompakt = false }: { oturum: Oturum; kompakt?: boolean }) {
  const rol = ROL[oturum.rol];
  return (
    <div className="d-flex align-items-center lh-1">
      <span className={`avatar avatar-sm bg-${avatarRengi(oturum.email)}-lt`}>{basHarfler(oturum.ad)}</span>
      {!kompakt && (
        <div className="d-none d-xl-block ps-2">
          <div>{oturum.ad}</div>
          <div className="mt-1 small text-secondary">{rol?.etiket ?? oturum.rol}</div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------- Kabuk */

export function Kabuk({ oturum, children }: { oturum: Oturum; children: React.ReactNode }) {
  const yol = usePathname();
  const [menuAcik, setMenuAcik] = useState(false);

  useEffect(() => {
    setMenuAcik(false);
  }, [yol]);

  const gorunurMenu = MENU.filter((m) => !m.sadeceAdmin || oturum.rol === "ADMIN");

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
            <Link href="/" className="text-decoration-none d-flex align-items-center gap-2">
              <span className="avatar avatar-sm bg-primary text-white">KR</span>
              <span className="d-none d-lg-inline fw-bold">Kentsel Rota</span>
            </Link>
          </div>

          {/* Mobilde üst çubuk gizli olduğu için giriş yapan kişi burada görünür */}
          <div className="d-lg-none">
            <Link href="/profil" className="text-reset" title="Profilim">
              <KullaniciBloku oturum={oturum} kompakt />
            </Link>
          </div>

          <div className={`collapse navbar-collapse${menuAcik ? " show" : ""}`}>
            <ul className="navbar-nav pt-lg-3">
              {gorunurMenu.map((m) => {
                const Ikon = m.ikon;
                const aktif = aktifMi(m.yol, yol, m.tam);
                return (
                  <li key={m.yol} className={`nav-item${aktif ? " active" : ""}`}>
                    <Link className="nav-link" href={m.yol}>
                      <span className="nav-link-icon d-md-none d-lg-inline-block">
                        <Ikon size={20} stroke={1.5} />
                      </span>
                      <span className="nav-link-title">{m.etiket}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Kenar çubuğunun altı: tema ve çıkış.
                Tabler'da .navbar-nav flex-grow:1 taşıdığı için bu blok kendiliğinden en alta oturur. */}
            <div className="krp-kenar-alt">
              <TemaSatiri />
              <form action="/api/cikis" method="post">
                <button type="submit" className="krp-kenar-dugme krp-kenar-cikis">
                  <span className="nav-link-icon">
                    <IconLogout size={20} stroke={1.5} />
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
          <div className="navbar-nav flex-row order-md-last align-items-center gap-2">
            <Link
              href="/profil"
              className={`btn btn-sm${yol === "/profil" ? " active" : ""}`}
              title="Profil bilgilerim ve şifre değiştirme"
            >
              <IconUserCircle size={18} stroke={1.5} className="me-1" />
              Profilim
            </Link>
            <KullaniciBloku oturum={oturum} />
          </div>

          <div className="me-3 flex-fill" style={{ maxWidth: "26rem" }}>
            <GlobalArama />
          </div>
        </div>
      </header>

      <div className="page-wrapper">
        {children}
        <footer className="footer footer-transparent d-print-none">
          <div className="container-fluid">
            <div className="row text-center align-items-center flex-row-reverse">
              <div className="col-12 col-lg-auto mt-3 mt-lg-0">
                <span className="text-secondary small">Kentsel Rota Panel</span>
              </div>
              <div className="col-12 col-lg-auto mt-3 mt-lg-0">
                <span className="text-secondary small">
                  6306 sayılı Kanun kapsamında süreç takibi. Resmî işlemler için ilgili idare kayıtları esastır.
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
