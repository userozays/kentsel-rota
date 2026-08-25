import { DURUMLAR, engelOku } from "@/lib/sabitler";

type Deger = {
  ad?: string;
  bb?: string;
  kat?: string;
  pay?: number;
  durum?: string;
  tel?: string;
  not?: string;
  kiraci?: boolean;
  engel?: string;
};

export function MalikAlanlari({
  deger = {},
  engelTurleri,
}: {
  deger?: Deger;
  engelTurleri: { kod: string; ad: string }[];
}) {
  const secili = engelOku(deger.engel);

  return (
    <div className="form-grid">
      <div className="field full">
        <label htmlFor="ad">Malik adı</label>
        <input id="ad" name="ad" defaultValue={deger.ad ?? ""} required />
      </div>

      <div className="field">
        <label htmlFor="bb">Bağımsız bölüm no</label>
        <input id="bb" name="bb" defaultValue={deger.bb ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="kat">Kat</label>
        <input id="kat" name="kat" defaultValue={deger.kat ?? ""} />
      </div>

      <div className="field">
        <label htmlFor="pay">Arsa payı</label>
        <input
          id="pay"
          name="pay"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={deger.pay ?? ""}
        />
        <span className="hint">Paydaya göre pay — ör. 84</span>
      </div>

      <div className="field">
        <label htmlFor="durum">Tavır</label>
        <select id="durum" name="durum" defaultValue={deger.durum ?? "ulasilamadi"}>
          {DURUMLAR.map((d) => (
            <option key={d.kod} value={d.kod}>
              {d.ad}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="tel">Telefon</label>
        <input id="tel" name="tel" defaultValue={deger.tel ?? ""} />
      </div>

      <div className="field">
        <label htmlFor="kiraci">Kiracı</label>
        <label className="onay">
          <input id="kiraci" type="checkbox" name="kiraci" defaultChecked={!!deger.kiraci} />
          Bölümde kiracı oturuyor
        </label>
      </div>

      <div className="field full">
        <label>Hukuki engel</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9, paddingTop: 2 }}>
          {engelTurleri.map((e) => (
            <label className="onay" key={e.kod} style={{ fontSize: 12.5 }}>
              <input
                type="checkbox"
                name="engel[]"
                value={e.kod}
                defaultChecked={secili.includes(e.kod)}
              />
              {e.ad}
            </label>
          ))}
        </div>
      </div>

      <div className="field full">
        <label htmlFor="not">Not / son görüşme</label>
        <textarea id="not" name="not" defaultValue={deger.not ?? ""} />
      </div>
    </div>
  );
}
