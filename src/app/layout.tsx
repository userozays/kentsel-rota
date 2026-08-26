import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "@tabler/core/dist/css/tabler.min.css";
import "./globals.css";

/* Tipografi
   ----------
   Başlık: Bricolage Grotesque — değişken eksenli, karakterli bir grotesk.
     Yalnızca sayfa başlıkları, marka ve büyük sayılarda kullanılır.
   Gövde:  Instrument Sans — küçük punto ve yoğun tablolarda okunaklı.
   Sayı:   IBM Plex Mono — ada/parsel kodları ve oranlar için sabit genişlik.
   Üçünde de latin-ext var; ş/ğ/ı/İ/ç/ö/ü eksiksiz. */

const baslikFont = Bricolage_Grotesque({
  subsets: ["latin-ext"],
  display: "swap",
  weight: ["500", "600", "700"],
  variable: "--krp-font-baslik",
});

const govdeFont = Instrument_Sans({
  subsets: ["latin-ext"],
  display: "swap",
  variable: "--krp-font-govde",
});

const sayiFont = IBM_Plex_Mono({
  subsets: ["latin-ext"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--krp-font-sayi",
});

export const metadata: Metadata = {
  title: {
    default: "Kentsel Rota Panel",
    template: "%s · Kentsel Rota Panel",
  },
  description: "Kentsel dönüşüm süreç takip ve müteahhit portföy yönetim paneli",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0e12" },
  ],
};

// Tema tercihini sayfa boyanmadan uygular (karanlık modda beyaz parlama olmasın diye)
const TEMA_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem("krp-tema");
    if (!t) t = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.setAttribute("data-bs-theme", t);
  } catch (e) {
    document.documentElement.setAttribute("data-bs-theme", "light");
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="tr"
      data-bs-theme="light"
      className={`${baslikFont.variable} ${govdeFont.variable} ${sayiFont.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
