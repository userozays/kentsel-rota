"use client";

export function TemaDugmesi() {
  function degistir() {
    const kok = document.documentElement;
    const simdi = kok.getAttribute("data-theme");
    const sistemKoyu = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const yeni = simdi ? (simdi === "dark" ? "light" : "dark") : sistemKoyu ? "light" : "dark";
    kok.setAttribute("data-theme", yeni);
    try {
      localStorage.setItem("kr-tema", yeni);
    } catch {
      /* özel sekmede yazamayabilir — sorun değil */
    }
  }
  return (
    <button type="button" className="navbtn" onClick={degistir} style={{ fontSize: 12.5 }}>
      <span className="ic" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z" />
        </svg>
      </span>
      Tema
    </button>
  );
}
