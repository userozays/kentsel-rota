type Deger = {
  muteahhitId?: string;
  malikPayi?: number;
  sureAy?: number;
  kiraAy?: number;
  kiraTutar?: number;
  nakdi?: number;
  teminat?: number;
  teknik?: number;
  tarih?: string;
  not?: string;
};

export function TeklifAlanlari({
  deger = {},
  muteahhitler,
}: {
  deger?: Deger;
  muteahhitler: { id: string; unvan: string; ymbn: string; durum: string }[];
}) {
  const bugun = new Date().toISOString().slice(0, 10);

  return (
    <div className="form-grid">
      <div className="field full">
        <label htmlFor="muteahhitId">Yüklenici</label>
        <select id="muteahhitId" name="muteahhitId" defaultValue={deger.muteahhitId ?? ""} required>
          <option value="">— seç —</option>
          {muteahhitler
            .filter((m) => m.durum !== "kara" || m.id === deger.muteahhitId)
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.unvan} (Grup {m.ymbn}){m.durum === "kara" ? " — kara liste" : ""}
              </option>
            ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="malikPayi">Maliklere verilen pay (%)</label>
        <input
          id="malikPayi"
          name="malikPayi"
          type="number"
          step="0.1"
          min="0"
          max="100"
          required
          defaultValue={deger.malikPayi ?? ""}
        />
      </div>
      <div className="field">
        <label htmlFor="sureAy">Teslim süresi (ay)</label>
        <input id="sureAy" name="sureAy" type="number" min="0" defaultValue={deger.sureAy ?? ""} />
      </div>

      <div className="field">
        <label htmlFor="kiraAy">Kira yardımı (ay)</label>
        <input id="kiraAy" name="kiraAy" type="number" min="0" defaultValue={deger.kiraAy ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="kiraTutar">Aylık kira yardımı (TL)</label>
        <input
          id="kiraTutar"
          name="kiraTutar"
          type="number"
          min="0"
          defaultValue={deger.kiraTutar ?? ""}
        />
      </div>

      <div className="field">
        <label htmlFor="nakdi">Nakdi destek / peşinat (TL)</label>
        <input id="nakdi" name="nakdi" type="number" min="0" defaultValue={deger.nakdi ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="teminat">Teminat mektubu (TL)</label>
        <input id="teminat" name="teminat" type="number" min="0" defaultValue={deger.teminat ?? ""} />
      </div>

      <div className="field">
        <label htmlFor="teknik">Teknik &amp; referans puanı</label>
        <input
          id="teknik"
          name="teknik"
          type="number"
          min="0"
          max="100"
          defaultValue={deger.teknik ?? 70}
        />
        <span className="hint">0–100 arası kendi değerlendirmen</span>
      </div>
      <div className="field">
        <label htmlFor="tarih">Teklif tarihi</label>
        <input id="tarih" name="tarih" type="date" defaultValue={deger.tarih || bugun} />
      </div>

      <div className="field full">
        <label htmlFor="not">Not</label>
        <textarea id="not" name="not" defaultValue={deger.not ?? ""} />
      </div>
    </div>
  );
}
