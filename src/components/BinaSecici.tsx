"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/** Teklif sayfasındaki bina seçici — seçim URL'ye yazılır ki bağlantı paylaşılabilsin. */
export function BinaSecici({
  binalar,
  secili,
}: {
  binalar: { id: string; ad: string }[];
  secili: string;
}) {
  const router = useRouter();
  const [bekliyor, gecis] = useTransition();

  return (
    <select
      aria-label="Bina seç"
      value={secili}
      disabled={bekliyor}
      onChange={(e) => {
        const id = e.target.value;
        gecis(() => router.push(`/teklifler?bina=${id}`));
      }}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--r-sm)",
        padding: "7px 9px",
        maxWidth: 260,
      }}
    >
      {binalar.map((b) => (
        <option key={b.id} value={b.id}>
          {b.ad}
        </option>
      ))}
    </select>
  );
}
