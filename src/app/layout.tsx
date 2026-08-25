import type { Metadata, Viewport } from "next";
import "@tabler/core/dist/css/tabler.min.css";
import "./globals.css";

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
  themeColor: "#066fd1",
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
    <html lang="tr" data-bs-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
