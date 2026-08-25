import { RISKLI } from "@/lib/sabitler";

type Deger = {
  ad?: string;
  il?: string;
  ilce?: string;
  mahalle?: string;
  adres?: string;
  ada?: string;
  parsel?: string;
  arsaM2?: number;
  emsal?: number;
  taks?: number;
  mevcutKat?: number;
  riskli?: string;
  asamaKod?: string;
  payda?: number;
  notlar?: string;
};

export function BinaAlanlari({
  deger = {},
  asamalar,
}: {
  deger?: Deger;
  asamalar: { kod: string; ad: string }[];
}) {
  return (
    <div className="form-grid">
      <div className="field full">
        <label htmlFor="ad">Bina adı / kısa isim</label>
        <input
          id="ad"
          name="ad"
          defaultValue={deger.ad ?? ""}
          required
          placeholder="ör. Bahariye Apartmanı"
        />
      </div>

      <div className="field">
        <label htmlFor="il">İl</label>
        <input id="il" name="il" defaultValue={deger.il ?? "İstanbul"} />
      </div>
      <div className="field">
        <label htmlFor="ilce">İlçe</label>
        <input id="ilce" name="ilce" defaultValue={deger.ilce ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="mahalle">Mahalle</label>
        <input id="mahalle" name="mahalle" defaultValue={deger.mahalle ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="adres">Adres</label>
        <input id="adres" name="adres" defaultValue={deger.adres ?? ""} />
      </div>

      <div className="field">
        <label htmlFor="ada">Ada</label>
        <input id="ada" name="ada" defaultValue={deger.ada ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="parsel">Parsel</label>
        <input id="parsel" name="parsel" defaultValue={deger.parsel ?? ""} />
      </div>

      <div className="field">
        <label htmlFor="arsaM2">Arsa alanı (m²)</label>
        <input
          id="arsaM2"
          name="arsaM2"
          type="number"
          step="0.01"
          min="0"
          defaultValue={deger.arsaM2 ?? ""}
        />
      </div>
      <div className="field">
        <label htmlFor="emsal">Emsal / KAKS</label>
        <input
          id="emsal"
          name="emsal"
          type="number"
          step="0.01"
          min="0"
          defaultValue={deger.emsal ?? ""}
        />
      </div>
      <div className="field">
        <label htmlFor="taks">TAKS</label>
        <input
          id="taks"
          name="taks"
          type="number"
          step="0.01"
          min="0"
          defaultValue={deger.taks ?? ""}
        />
      </div>
      <div className="field">
        <label htmlFor="mevcutKat">Mevcut kat sayısı</label>
        <input
          id="mevcutKat"
          name="mevcutKat"
          type="number"
          min="0"
          defaultValue={deger.mevcutKat ?? ""}
        />
      </div>

      <div className="field">
        <label htmlFor="payda">Toplam arsa payı (payda)</label>
        <input
          id="payda"
          name="payda"
          type="number"
          step="0.01"
          min="1"
          required
          defaultValue={deger.payda ?? 1000}
        />
        <span className="hint">
          Tapudaki ortak payda — ör. 1000. Çoğunluk eşiği bunun yarısıdır.
        </span>
      </div>

      <div className="field">
        <label htmlFor="riskli">Riskli yapı statüsü</label>
        <select id="riskli" name="riskli" defaultValue={deger.riskli ?? "yok"}>
          {RISKLI.map((r) => (
            <option key={r.kod} value={r.kod}>
              {r.ad}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="asamaKod">Aşama</label>
        <select id="asamaKod" name="asamaKod" defaultValue={deger.asamaKod ?? asamalar[0]?.kod}>
          {asamalar.map((a) => (
            <option key={a.kod} value={a.kod}>
              {a.ad}
            </option>
          ))}
        </select>
      </div>

      <div className="field full">
        <label htmlFor="notlar">Notlar</label>
        <textarea id="notlar" name="notlar" defaultValue={deger.notlar ?? ""} />
      </div>
    </div>
  );
}
