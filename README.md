# Kentsel Rota

Kat karşılığı kentsel dönüşümde **maliklerin danışmanı** olarak çalışan proje geliştirme
ve süreç yönetimi iş modeli — strateji dokümanı, saha takip uygulaması ve yönetim paneli.

## İçerik

| Yol | Ne |
| :-- | :-- |
| `kentsel-rota-yeni.md` | İş modeli: değer önermesi, operasyonel süreç haritası, gelir modeli, risk yönetimi, ölçeklenme stratejisi |
| `src/`, `prisma/` | **Web uygulaması** — giriş, roller, saha takibi, ihale ve yönetim paneli (Next.js + Prisma) |

## Modelin özeti

- **Kim kimin danışmanı:** kat maliklerinin. Münhasır (özel) temsil yetkisiyle çalışılır.
- **Ücret kimden:** kazanan yükleniciden. Bedel ihale şartnamesinde ilan edilir, **tüm teklif
  verenler için aynıdır** ve kazananla pazarlık edilmez — böylece ücret, hangi müteahhidin
  kazandığından bağımsız kalır ve menfaat çatışması yapısal olarak ortadan kalkar.
- **Ne zaman:** tamamı, noter onaylı sözleşme **ve** teminat mektubunun teslimi anında.
- **Sonrası:** şantiye takibi ve denetim ayrı bir üründür, ayrı sözleşme ve ayrı bedelle.

Ücretin kaynağı, formülü ve tutarı üç yerde birden yazılı olarak açıklanır: münhasır yetki
sözleşmesinde, malikler kurulu karar tutanağında ve ihale şartnamesinde.

> **Not — çözülmesi gereken çelişki:** `kentsel-rota-yeni.md` §6'daki gelir tablosu, yukarıdaki
> anlatıma ek olarak *maliklerden dosya ücreti* ve *çözüm ortaklarından yönlendirme payı* sayıyor.
> Yönlendirme payı, "menfaat çatışması yapısal olarak yok" iddiasını zayıflatır. İki metinden
> hangisinin geçerli olduğuna karar verilip diğeri güncellenmeli.

---

## Kurulum

Gereksinim: Node.js 20+.

```bash
npm install
cp .env.example .env      # ILK_ADMIN_* değerlerini kendine göre düzenle
npm run kur               # veritabanını oluşturur + ilk yöneticiyi açar
npm run dev               # http://localhost:3000
```

`npm run kur`, `prisma db push` ve kurulum betiğini birlikte çalıştırır. Betik:

- süreç aşamalarını ve hukuki engel türlerini oluşturur,
- varsayılan sistem ayarlarını yazar,
- `.env` içindeki `ILK_ADMIN_EPOSTA` / `ILK_ADMIN_SIFRE` ile **ilk yönetici hesabını** açar,
- örnek veri aktarmaz; veri içe aktarmak için `--yedek` seçeneğini kullan.

Seçenekler:

```bash
node prisma/seed.mjs --yedek yedek.json # JSON yedeğini içe aktar
```

Kurulum betiği yeniden çalıştırılabilir — mevcut kayıtların üzerine yazmaz.

**İlk girişten sonra ilk iş:** Hesabım → Şifre değiştir. `.env` içindeki başlangıç şifresi
düz metindir.

### Örnek kayıtları silme

Kurulumda gelen "Örnek —" ile başlayan iki bina ve üç müteahhit gerçek veri değildir.
Kendi verini girmeden önce Panel'den binaları, Müteahhitler'den yüklenicileri sil.

---

## Roller

Rol, kullanıcının neyi görüp değiştirebileceğini belirler. Yetki kontrolü **sunucu tarafında**
yapılır — arayüzdeki gizli veya devre dışı düğmeler ikincil bir önlemdir, tek başına
güvenlik sağlamaz.

| Rol | Görebildiği | Değiştirebildiği |
| :-- | :-- | :-- |
| **Admin** | her şey | her şey + kullanıcılar, sistem ayarları, portföy raporu |
| **Proje Yöneticisi** | tüm binalar, teklifler, müteahhitler | bina, malik, teklif, ağırlık kilidi |
| **Saha Personeli** | yalnız kendisine **atanan** binalar | malik tavrı, notlar, malik ekleme |
| **Okuyucu** | binalar, fizibilite, müteahhitler | hiçbir şey |

İki tasarım kararı:

- **Saha personeli teklifleri göremez.** Kapalı zarf gizliliği bu ayrımla korunur; saha
  ekibindeki biri hangi yüklenicinin ne teklif ettiğini bilirse maliklerle görüşmede
  tarafsızlık iddiası zayıflar.
- **Saha personeli malik kaydı silemez.** Tavır ve not güncellemek onun işi; kayıt silmek ve
  toplu bölüm açmak yapısal işlemdir, bina yazma yetkisi ister.

Saha personeline bina atama: Yönetim → Kullanıcılar → kullanıcı → *Bina erişimi*.

İşten ayrılan kişi için hesabı **kapat** (silme). Hesap kapandığı anda açık oturumları düşer.
Silmek, geçmiş bina atamalarını da kaldırır.

---

## Yönetim paneli

- **Portföy raporu** — aşama hunisi, bina bazında çoğunluk ilerlemesi, toplam emsal alanı ve
  *müdahale gereken başlıklar*: eşiği matematiksel olarak kapalı binalar, riskli yapı dayanağı
  olmayanlar, payı eksik girilenler, taahhütsüz yükleniciler.
- **Kullanıcılar ve roller** — hesap açma, rol verme, şifre belirleme, oturum kapatma, bina
  atama. Sistemde her zaman en az bir etkin yönetici kalır; kendi yetkini kaldıramazsın.
- **Sistem ayarları** — şirket bilgileri, danışmanlık bedeli metni, **çoğunluk eşiği**,
  varsayılan kriter ağırlıkları, süreç aşamaları ve hukuki engel türleri. Mevzuat değişirse
  koda dokunmadan güncellenir.

---

## Çoğunluk hesabı

6306 sayılı Kanun'da çoğunluk **arsa payı** üzerinden hesaplanır, kişi sayısı üzerinden değil.
24 malikten 14'ü olumlu olabilir ama payları küçükse toplam %41'de kalır — anlaşma yoktur.
Uygulama iki sayıyı da yan yana gösterir ve asıl kararı arsa payına göre verir.

**Pay şeridi:** her bağımsız bölüm, arsa payı kadar genişlikte bir şerit parçası; rengi malikin
tavrı (olumlu / kararsız / ulaşılamadı / olumsuz), üzerinden geçen kesikli çizgi eşik.
Segmentler olumludan olumsuza doğru dizilir; çizgi böylece doğrudan olumlu payın nerede
bittiğini gösterir.

Uygulama ayrıca şunu hesaplar: **eşiği geçmek için hangi malikleri ikna etmek gerekiyor** —
kararsız ve ulaşılamayan malikler arsa payına göre sıralanır, eşiği geçmeye yetecek en kısa
liste çıkarılır. Kararsızların tamamı olumluya dönse bile eşik geçilmiyorsa bu, hem bina
sayfasında hem portföy raporunda uyarı olarak çıkar.

Hesap saf fonksiyon olarak `src/lib/hesap.ts` içindedir; veritabanına da arayüze de bağlı
değildir.

### Riskli yapı statüsü

Riskli yapı raporu onaylanmamış binada yıkım kararı Kat Mülkiyeti Kanunu'na tabidir ve pratikte
oybirliği gerekir — %50+1 mimarisi ancak rapor onaylandıktan sonra dayanak bulur. Bu yüzden
dayanağı olmayan binalar hem bina sayfasında hem fizibilite ve portföy raporunda uyarı ile
işaretlenir.

---

## Teklif değerlendirme

Ağırlıklar teklifler açılmadan önce belirlenip **kilitlenebilir**; kilit tarihi kaydedilir.
Yanında ihale etiği kontrol listesi çalışır: en az 3 teklif, kilitli ağırlık, tüm teklif
verenlerde NDA ve devre dışı bırakmama taahhüdü, çoğunluğun sağlanmış olması.

**Puanlama görelidir.** Her kriter, o anki teklif kümesinin en iyi ve en kötüsüne göre 0–100
arasına yerleştirilir (min-max normalizasyon). Bunun iki sonucu var: iki teklif varsa kötü olan
her kriterde 0 alır, ve bir teklif eklenip çıkarıldığında diğerlerinin puanı da değişir.
Şartnamede puanın göreli olduğu **yazılı olarak** belirtilmeli. Mutlak bir ölçek isteniyorsa
kriter başına aralık şartnamede önceden ilan edilmeli.

---

## Teknik

- **Next.js 15** (App Router) + React 19, sunucu bileşenleri ve sunucu eylemleri (`src/actions/`).
- **Prisma + SQLite.** Postgres'e geçiş: `prisma/schema.prisma` içindeki `provider`'ı
  `postgresql` yapıp `DATABASE_URL`'i değiştirmek yeterli. SQLite'ta enum ve Json tipi
  desteklenmediği için sabit kümeler `String` tutulur ve `src/lib/sabitler.ts` içinde doğrulanır.
- **Kimlik doğrulama** el yazımı: Node'un `scrypt`'i ile şifre türetme, veritabanında oturum
  kaydı, `HttpOnly` çerez, 14 gün geçerlilik. Ek paket yok. Şifre değişince veya hesap
  kapanınca kullanıcının tüm oturumları düşer.
- **Doğrulama** zod ile; her sunucu eylemi kendi yetki kontrolünü yapar (`yetkiGerekli`).
- **Tasarım sistemi** `src/app/globals.css` içinde tek dosyada: CSS değişkenleri, açık/koyu
  tema, pay şeridi. Ayrı bir CSS çatısı kullanılmıyor.

```bash
npm run dev        # geliştirme sunucusu
npm run build      # üretim derlemesi
npm run db:studio  # veritabanını görsel olarak incele
```

---

## Kişisel veri (KVKK)

Uygulama malik ad-soyad, telefon ve tapu bilgisi işler — hepsi kişisel veridir. TC kimlik
numarası ve tapu görüntüsü gibi veriler bilinçli olarak toplanmaz.

- **Veri minimizasyonu:** iş için gerekmeyen alanı hiç toplama.
- **Aydınlatma:** ilk görüşmede maliklere aydınlatma metni imzalat; münhasır yetki
  sözleşmesinin eki olsun.
- **Erişim:** her kullanıcıya kendi hesabını aç, hesap paylaştırma. Saha personelini yalnız
  çalıştığı binalara ata.
- **Yer:** veritabanı `prisma/dev.db` dosyasıdır ve `.gitignore` ile depo dışında tutulur.
  Sunucuya taşırken barındırmanın nerede olduğuna dikkat — yurt dışına aktarım açık rıza
  veya uygun ülke kararı gerektirir.

---

## Sonraki adımlar

- **Denetim kaydı (audit log).** Şu an "kim neyi ne zaman değiştirdi" tutulmuyor; yalnız son
  giriş zamanları görülüyor. İhale itirazında en çok işe yarayacak kayıt budur — özellikle
  malik tavrı ve teklif ağırlığı değişiklikleri için.
- **Yedekleme.** SQLite dosyasının düzenli kopyası alınmalı; uygulama içi JSON dışa aktarma yok.
- **Şifre sıfırlama akışı.** Şu an şifreyi yalnız yönetici belirleyebiliyor (e-posta gönderimi yok).
