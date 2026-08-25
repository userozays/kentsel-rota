import { MUTEAHHIT_DURUMLARI, YMBN_GRUPLARI } from "@/lib/sabitler";

type Deger = {
  unvan?: string;
  yetkili?: string;
  tel?: string;
  eposta?: string;
  vergiNo?: string;
  ymbn?: string;
  referans?: string;
  durum?: string;
  nda?: boolean;
  ndaTarih?: string;
  taahhut?: boolean;
  not?: string;
};

export function MuteahhitAlanlari({ deger = {} }: { deger?: Deger }) {
  return (
    <div className="form-grid">
      <div className="field full">
        <label htmlFor="unvan">Ünvan</label>
        <input id="unvan" name="unvan" defaultValue={deger.unvan ?? ""} required />
      </div>

      <div className="field">
        <label htmlFor="yetkili">Yetkili kişi</label>
        <input id="yetkili" name="yetkili" defaultValue={deger.yetkili ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="tel">Telefon</label>
        <input id="tel" name="tel" defaultValue={deger.tel ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="eposta">E-posta</label>
        <input id="eposta" name="eposta" type="email" defaultValue={deger.eposta ?? ""} />
      </div>
      <div className="field">
        <label htmlFor="vergiNo">Vergi no</label>
        <input id="vergiNo" name="vergiNo" defaultValue={deger.vergiNo ?? ""} />
      </div>

      <div className="field">
        <label htmlFor="ymbn">YMBN grubu</label>
        <select id="ymbn" name="ymbn" defaultValue={deger.ymbn ?? "B"}>
          {YMBN_GRUPLARI.map((g) => (
            <option key={g} value={g}>
              Grup {g}
            </option>
          ))}
        </select>
        <span className="hint">Grup, üstlenebileceği iş büyüklüğünü sınırlar.</span>
      </div>

      <div className="field">
        <label htmlFor="durum">Durum</label>
        <select id="durum" name="durum" defaultValue={deger.durum ?? "degerlendirmede"}>
          {MUTEAHHIT_DURUMLARI.map((d) => (
            <option key={d.kod} value={d.kod}>
              {d.ad}
            </option>
          ))}
        </select>
      </div>

      <div className="field full">
        <label htmlFor="referans">Referans projeler</label>
        <input
          id="referans"
          name="referans"
          defaultValue={deger.referans ?? ""}
          placeholder="ör. 3 proje / Kadıköy"
        />
      </div>

      <div className="field">
        <label>Gizlilik sözleşmesi</label>
        <label className="onay">
          <input type="checkbox" name="nda" defaultChecked={!!deger.nda} />
          NDA imzalandı
        </label>
      </div>

      <div className="field">
        <label>Devre dışı bırakmama</label>
        <label className="onay">
          <input type="checkbox" name="taahhut" defaultChecked={!!deger.taahhut} />
          Taahhütname imzalandı
        </label>
      </div>

      <div className="field">
        <label htmlFor="ndaTarih">İfşa / imza tarihi</label>
        <input id="ndaTarih" name="ndaTarih" type="date" defaultValue={deger.ndaTarih ?? ""} />
        <span className="hint">Kuyruk süresi bu tarihten işlemeye başlar.</span>
      </div>

      <div className="field full">
        <label htmlFor="not">Not</label>
        <textarea id="not" name="not" defaultValue={deger.not ?? ""} />
      </div>
    </div>
  );
}
