import { ROLLER } from "@/lib/roller";

type Deger = {
  ad?: string;
  eposta?: string;
  rol?: string;
  telefon?: string;
  not?: string;
  aktif?: boolean;
};

export function KullaniciAlanlari({
  deger = {},
  kendisi = false,
}: {
  deger?: Deger;
  /** Yönetici kendi kaydını düzenliyorsa rol ve etkinlik alanları kilitlenir. */
  kendisi?: boolean;
}) {
  return (
    <div className="form-grid">
      <div className="field">
        <label htmlFor="ad">Ad soyad</label>
        <input id="ad" name="ad" defaultValue={deger.ad ?? ""} required />
      </div>
      <div className="field">
        <label htmlFor="eposta">E-posta</label>
        <input
          id="eposta"
          name="eposta"
          type="email"
          defaultValue={deger.eposta ?? ""}
          required
          autoComplete="off"
        />
        <span className="hint">Giriş bu adresle yapılır.</span>
      </div>

      <div className="field">
        <label htmlFor="rol">Rol</label>
        <select id="rol" name="rol" defaultValue={deger.rol ?? "OKUYUCU"} disabled={kendisi}>
          {ROLLER.map((r) => (
            <option key={r.kod} value={r.kod}>
              {r.ad}
            </option>
          ))}
        </select>
        {kendisi ? (
          <span className="hint">Kendi rolünü değiştiremezsin — başka bir yönetici yapmalı.</span>
        ) : (
          <span className="hint">
            {ROLLER.find((r) => r.kod === (deger.rol ?? "OKUYUCU"))?.aciklama}
          </span>
        )}
        {kendisi && <input type="hidden" name="rol" value={deger.rol ?? "ADMIN"} />}
      </div>

      <div className="field">
        <label htmlFor="telefon">Telefon</label>
        <input id="telefon" name="telefon" defaultValue={deger.telefon ?? ""} />
      </div>

      <div className="field">
        <label>Hesap durumu</label>
        <label className="onay">
          <input
            type="checkbox"
            name="aktif"
            defaultChecked={deger.aktif ?? true}
            disabled={kendisi}
          />
          Hesap etkin — giriş yapabilir
        </label>
        {kendisi && <input type="hidden" name="aktif" value="on" />}
      </div>

      <div className="field full">
        <label htmlFor="not">Not</label>
        <textarea id="not" name="not" defaultValue={deger.not ?? ""} />
      </div>
    </div>
  );
}
