"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const OGELER = [
  { yol: "/yonetim", ad: "Portföy raporu" },
  { yol: "/yonetim/kullanicilar", ad: "Kullanıcılar ve roller" },
  { yol: "/yonetim/ayarlar", ad: "Sistem ayarları" },
];

export function YonetimNav() {
  const yol = usePathname();
  return (
    <nav className="altnav">
      {OGELER.map((o) => (
        <Link
          key={o.yol}
          href={o.yol}
          aria-current={
            o.yol === "/yonetim" ? (yol === "/yonetim" ? "page" : undefined)
            : yol.startsWith(o.yol) ? "page"
            : undefined
          }
        >
          {o.ad}
        </Link>
      ))}
    </nav>
  );
}
