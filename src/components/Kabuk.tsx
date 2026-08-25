"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TemaDugmesi } from "./Tema";
import { ROL_AD } from "@/lib/roller";

export type NavOgesi = {
  yol: string;
  ad: string;
  ikon: IkonAd;
  sayi?: number;
  /** Yan menüde bu öğeden önce yazılacak grup başlığı. */
  grup?: string;
};

export type IkonAd =
  | "panel"
  | "fizibilite"
  | "muteahhit"
  | "teklif"
  | "yonetim"
  | "cikis";

/* Çizgi ikonlar — 24'lük ızgara, currentColor ile boyanır. */
const IKON: Record<IkonAd, React.ReactNode> = {
  panel: (
    <>
      <path d="M3 17.5 8 12l3.5 3.5L16 9.5l5 5.5" />
      <path d="M16 9.5h4.5V14" />
    </>
  ),
  fizibilite: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <path d="M8 7.5h8M8 12h3M8 16h3M15 12v4M13 14h4" />
    </>
  ),
  muteahhit: (
    <>
      <path d="M4 20V6.5L11 4v16" />
      <path d="M11 9.5l8 2.5V20" />
      <path d="M2.5 20h19M7 9h1M7 13h1M15 15h1" />
    </>
  ),
  teklif: (
    <>
      <path d="M3.5 8.5h13l-3-3M20.5 15.5h-13l3 3" />
    </>
  ),
  yonetim: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-2.87 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 2.7 15H2.6a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 7a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 2.7h.1a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 17 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 21.3 9v.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.8 1.9z" />
    </>
  ),
  cikis: (
    <>
      <path d="M9.5 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3.5" />
      <path d="M15.5 8.5 19 12l-3.5 3.5M19 12H9" />
    </>
  ),
};

function Ikon({ ad }: { ad: IkonAd }) {
  return (
    <span className="ic" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {IKON[ad]}
      </svg>
    </span>
  );
}

function bashar(ad: string) {
  const p = ad.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? (p[p.length - 1][0] ?? "") : "")).toLocaleUpperCase(
    "tr-TR",
  );
}

export function Kabuk({
  sirketAd,
  ogeler,
  kullanici,
  cikis,
  children,
}: {
  sirketAd: string;
  ogeler: NavOgesi[];
  kullanici: { ad: string; eposta: string; rol: string };
  cikis: () => Promise<void>;
  children: React.ReactNode;
}) {
  const yol = usePathname();

  const aktifMi = (hedef: string) =>
    hedef === "/" ? yol === "/" || yol.startsWith("/bina/") : yol.startsWith(hedef);

  return (
    <div className="shell">
      <nav className="rail">
        <Link href="/" className="brand">
          <span className="mark" aria-hidden="true">
            {bashar(sirketAd)}
          </span>
          <span className="ad">
            <b>{sirketAd}</b>
            <span>Proje Yönetimi</span>
          </span>
        </Link>

        {ogeler.map((o) => (
          <div key={o.yol} style={{ display: "contents" }}>
            {o.grup && <div className="navlbl">{o.grup}</div>}
            <Link
              href={o.yol}
              className="navbtn"
              aria-current={aktifMi(o.yol) ? "true" : undefined}
            >
              <Ikon ad={o.ikon} />
              {o.ad}
              {o.sayi ? <span className="cnt">{o.sayi}</span> : null}
            </Link>
          </div>
        ))}

        <div className="railfoot">
          <Link
            href="/hesap"
            className="kullanici"
            title={`${kullanici.eposta} · ${ROL_AD[kullanici.rol] ?? kullanici.rol} — hesabım`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <span className="avatar">{bashar(kullanici.ad)}</span>
            <span className="kim">
              <b>{kullanici.ad}</b>
              <span>{ROL_AD[kullanici.rol] ?? kullanici.rol}</span>
            </span>
          </Link>
          <TemaDugmesi />
          <form action={cikis}>
            <button type="submit" className="navbtn" style={{ fontSize: 12.5 }}>
              <Ikon ad="cikis" />
              Çıkış
            </button>
          </form>
        </div>
      </nav>
      <main className="main">{children}</main>
    </div>
  );
}
