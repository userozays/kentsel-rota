"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  IconBriefcase,
  IconBuildingCommunity,
  IconChecklist,
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

type Oturum = { id: string; ad: string; email: string; rol: string };

const MENU = [
  { yol: "/", etiket: "Panel", ikon: IconLayoutDashboard, tam: true },
  { yol: "/binalar", etiket: "Binalar", ikon: IconBuildingCommunity },
  { yol: "/malikler", etiket: "Malikler", ikon: IconUsers },
  { yol: "/muteahhitler", etiket: "Müteahhitler", ikon: IconBriefcase },
  { yol: "/surec", etiket: "Süreç Takibi", ikon: IconChecklist },
  { yol: "/aktiviteler", etiket: "Aktiviteler", ikon: IconHistory },
  { yol: "/kullanicilar", etiket: "Kullanıcılar", ikon: IconShieldLock, sadeceAdmin: true },
];

function aktifMi(yol: string, mevcut: string, tam?: boolean) {
  if (tam) return mevcut === yol;
  return mevcut === yol || mevcut.startsWith(yol + "/");
}

/* ------------------------------------------------------------- Tema düğmesi */

function TemaDugmesi() {
  const [tema, setTema] = useState<"light" | "dark">("light");

  useEffect(() => {
    const mevcut = (document.documentElement.getAttribute("data-bs-theme") as "light" | "dark") ?? "light";
    setTema(mevcut);
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
    <button
      type="button"
      onClick={degistir}
      className="nav-link px-0 btn btn-ghost-secondary border-0"
      title={tema === "dark" ? "Aydınlık temaya geç" : "Karanlık temaya geç"}
      aria-label="Tema değiştir"
    >
      {tema === "dark" ? <IconSun size={20} stroke={1.5} /> : <IconMoon size={20} stroke={1.5} />}
    </button>
  );
}

/* ------------------------------------------------------------ Kullanıcı menüsü */

function KullaniciMenusu({ oturum }: { oturum: Oturum }) {
  const [acik, setAcik] = useState(false);
  const kutu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const disariTiklama = (e: MouseEvent) => {
      if (kutu.current && !kutu.current.contains(e.target as Node)) setAcik(false);
    };
    document.addEventListener("mousedown", disariTiklama);
    return () => document.removeEventListener("mousedown", disariTiklama);
  }, []);

  const rol = ROL[oturum.rol];

  return (
    <div className="nav-item dropdown" ref={kutu}>
      <button
        type="button"
        className="nav-link d-flex lh-1 p-0 px-2 border-0 bg-transparent"
        onClick={() => setAcik((a) => !a)}
        aria-expanded={acik}
      >
        <span className={`avatar avatar-sm bg-${avatarRengi(oturum.email)}-lt`}>{basHarfler(oturum.ad)}</span>
        <div className="d-none d-xl-block ps-2 text-start">
          <div>{oturum.ad}</div>
          <div className="mt-1 small text-secondary">{rol?.etiket ?? oturum.rol}</div>
        </div>
      </button>
      <div className={`dropdown-menu dropdown-menu-end dropdown-menu-arrow${acik ? " show" : ""}`}>
        <div className="dropdown-header d-xl-none">
          <div>{oturum.ad}</div>
          <div className="small text-secondary">{oturum.email}</div>
        </div>
        <Link href="/profil" className="dropdown-item" onClick={() => setAcik(false)}>
          <IconUserCircle size={18} stroke={1.5} className="me-2" />
          Profilim
        </Link>
        <div className="dropdown-divider" />
        <form action="/api/cikis" method="post">
          <button type="submit" className="dropdown-item text-red">
            <IconLogout size={18} stroke={1.5} className="me-2" />
            Çıkış Yap
          </button>
        </form>
      </div>
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

          <div className="navbar-nav flex-row d-lg-none">
            <KullaniciMenusu oturum={oturum} />
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
          </div>
        </div>
      </aside>

      <header className="navbar navbar-expand-md d-none d-lg-flex d-print-none">
        <div className="container-xl">
          <div className="navbar-nav flex-row order-md-last">
            <div className="d-none d-md-flex align-items-center me-2">
              <TemaDugmesi />
            </div>
            <KullaniciMenusu oturum={oturum} />
          </div>
        </div>
      </header>

      <div className="page-wrapper">
        {children}
        <footer className="footer footer-transparent d-print-none">
          <div className="container-xl">
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
