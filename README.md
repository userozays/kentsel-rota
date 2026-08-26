# Kentsel Rota Panel

Kentsel dönüşüm danışmanlığı için bina dosyası, malik onay, müteahhit portföyü ve iş takvimi paneli.
Tasarım [Tabler](https://tabler.io) (MIT) üzerine kurulu, üstüne projeye özel bir tema
katmanı biniyor — bkz. [Tasarım](#tasarım).

---

## Hızlı başlangıç

```bash
npm install
npm run kurulum        # veritabanını oluşturur + demo veri yükler
npm run dev            # http://localhost:3000
```

**Demo giriş bilgileri**

| E-posta | Şifre | Rol |
|---|---|---|
| admin@kentselrota.com | `Deneme1234` | Yönetici |
| selin@kentselrota.com | `Deneme1234` | Danışman |
| cemal@kentselrota.com | `Deneme1234` | İzleyici |

> Demo veri 18 bina, 256 malik, 8 müteahhit ve 12 randevu içerir. Canlıya geçmeden
> önce **mutlaka** `npm run db:temizle` ile silin (aşağıya bakın).

---

## Neler var

| Sayfa | İçerik |
|---|---|
| **Panel** | Aktif dosya, riskli yapı, çoğunluk sağlanan dosya sayıları; çoğunluğa en yakın dosyalar; aşama dağılımı; müteahhit portföyü; son hareketler |
| **Binalar** | Ada/parsel bazlı dosya listesi, arama + durum/risk/aşama/ilçe/danışman filtreleri, CSV dışa aktarma |
| **Bina detayı** | Malik onay oranı (arsa payı bazlı), bağımsız bölüm tablosu, 16 adımlık süreç zaman çizelgesi, müteahhit kartı, belgeler, görüşme notları |
| **Malikler** | Kişi kayıtları, hangi binada hangi bölüme sahip, onay durumu, belgeler |
| **Müteahhitler** | Firma portföyü, puan, referans proje/daire, çalışma bölgeleri, kara liste, belgeler |
| **Canlı İş Takvimi** | Ay / hafta / gün görünümü; randevu ve toplantılar; süreç hedef tarihleri otomatik düşer; değişiklikler açık ekranlara anında yansır |
| **Aktiviteler** | Tüm görüşme/telefon/toplantı/sistem kayıtlarının ortak akışı |
| **Kullanıcılar** | Hesap açma, rol atama, aktif/pasif (sadece yönetici) |

### Roller

- **Yönetici** — her şey; kullanıcı yönetimi ve kayıt silme.
- **Danışman** — bina/malik/müteahhit/randevu ekler ve düzenler, belge yükler; kayıt silemez.
- **İzleyici** — sadece görüntüler ve dışa aktarır.

### Modal akışı

"Yeni Ekle", "Düzenle" ve müteahhit profili tam sayfaya gitmez, modal açar. Modal durumu
adres çubuğunda tutulur: geri tuşu modalı kapatır, sayfa yenilenince modal açık kalır,
bağlantı paylaşılabilir ve ekrandaki filtreler korunur.

| Parametre | Ne açar |
|---|---|
| `?yeni=1` | Yeni kayıt formu |
| `?duzenle=<id>` | Düzenleme formu |
| `?profil=<id>` | Kaydın profili (bina, malik, müteahhit) |

Parametre listesi `src/components/modal.tsx` içindeki `MODAL_PARAMETRELERI` dizisinde;
modal kapatılırken hepsi adresten temizlenir. Yeni bir modal türü eklerken bu diziye de
eklemek gerekir, yoksa modal kapanmaz.

### Profil modalları

Bina, malik ve müteahhit listelerinde kayda tıklamak profili modal olarak açar.
**Modal detay sayfasının tamamını taşır** — bina profilinde 16 adımlık süreç çizelgesi ve
malik onay tablosu dahil; belge yükleme ve görüşme notu formları modal içinde çalışır.
Kaydettikten sonra `?profil=<id>` adreste durduğu için `router.refresh()` modalı kapatmaz,
yalnızca içeriği tazeler. İzleyici rolü de profilleri görebilir, yazma düğmeleri çıkmaz.

**Tek kaynak.** Detay sayfası ile modal aynı bileşeni kullanır; iki kopya tutulsaydı biri
güncellenip diğeri unutulurdu. Her varlık için bir sorgu ve bir gövde dosyası var:

```
binalar/bina-verisi.ts        bina-govdesi.tsx
malikler/malik-verisi.ts      malik-govdesi.tsx
muteahhitler/muteahhit-verisi.ts  muteahhit-govdesi.tsx
```

Gövdeler sunucu bileşenidir; modal kabuğuna (`components/profil-modali.tsx`, istemci)
`children` olarak geçirilir. Bu sayede detay sayfası 518 → 126 satıra indi.

**Tetikleyici.** Müteahhit kartlarında kartı kaplayan görünmez bir `.stretched-link`
katmanı var; karttaki Ara / E-posta / Site düğmeleri `.krp-kart-eylem` ile bu katmanın
üstünde durur, yoksa tıklanamaz olurlardı. Bina ve malik tablolarında satırın tamamı
`components/tiklanir-satir.tsx` ile tıklanabilir — satır içindeki bağlantı, düğme ve form
öğelerine yapılan tıklamalar hariç tutulur. Klavye erişimi satırdan değil, ad hücresindeki
gerçek bağlantıdan sağlanır.

**Düzenle → Geri akışı.** Profildeki "Düzenle" adrese `duzenle` parametresini ekler ama
`profil` yerinde kalır. `duzenle` varken düzenleme modalı önceliklidir; `profil` de
adreste olduğu için formun alt köşesindeki düğme "Vazgeç" yerine **"Geri"** olur ve
profile döner. Kaydedildiğinde de profile dönülür, değişiklik hemen görünür. ESC / çarpı
ikisini birden kapatır. Liste satırlarındaki düzenleme düğmeleri kaldırıldı — düzenleme
profilin içinden yapılıyor.

Profil modalları `boyut="genis"` kullanır (`max-width: min(1600px, 94vw)`); Tabler'ın en
genişi `modal-xl` bile bina profilindeki yedi sütunlu malik tablosuna dar geliyordu.

Eski `/yeni` ve `/[id]/duzenle` rotaları yer imi kırılmasın diye çalışmaya devam eder.

---

## Arama

Üst çubuktaki arama bina, malik ve müteahhitte birden arar. `Ctrl+K` ile odaklanır,
300 ms gecikmeyle sorgu atar, ok tuşlarıyla gezinilir.

**Türkçe karakter sorunu ve çözümü:** SQLite'ın `LIKE` operatörü yalnızca ASCII
harflerde büyük/küçük harf duyarsızdır — "Şimşek" kaydı küçük harfle "şimşek" aranınca
bulunamıyordu. Bu yüzden her kayıtta normalize edilmiş bir `aramaMetni` sütunu tutulur
(küçük harf + aksan sadeleştirmesi). Ek fayda: **"sirinevler" yazınca "Şirinevler"
bulunur**, klavyede Türkçe karakter aramaya gerek kalmaz.

Arama mantığı değişirse veya toplu veri içe aktarılırsa sütunları yeniden hesaplayın:

```bash
npm run db:arama
```

---

## Çoğunluk hesabı

Onay oranı **kişi sayısına göre değil, arsa payına göre** hesaplanır.
Eşik değeri tek bir yerde tanımlıdır:

```ts
// src/lib/sabitler.ts
export const COGUNLUK_ESIGI = 50;   // yüzde
```

6306 sayılı Kanun'da 2023 değişikliği sonrası salt çoğunluk arandığı için varsayılan `50`
bırakıldı. Kendi uygulamanıza göre (örn. `66.67`) değiştirebilirsiniz — panel, listeler,
çizelgeler ve CSV çıktıları otomatik olarak yeni eşiğe göre çalışır.

> Panel bir takip aracıdır; resmî işlemlerde ilgili idare ve tapu kayıtları esastır.

## Süreç adımları

16 adımlık akış `src/lib/sabitler.ts` içindeki `SUREC_ADIMLARI` dizisinde tanımlı.
Adım ekler, çıkarır veya sırasını değiştirirseniz **yeni** bina dosyaları buna göre oluşur.
Mevcut dosyaları hizalamak için binayı düzenleyip aşamasını kaydetmek yeterli.

---

## Belgeler

Bina, malik ve müteahhit kayıtlarına belge yüklenebilir (PDF, resim, Word, Excel — en fazla 15 MB).

**Dosyalar `public/` altında tutulmaz.** `public/` içindeki her şey Next tarafından oturum
kontrolü olmadan servis edilir; tapu ve kimlik belgeleri için bu kabul edilemez. Dosyalar
proje kökündeki `veri/belgeler/` klasörüne yazılır ve yalnızca `/api/belge/[id]` üzerinden,
oturum doğrulandıktan sonra indirilebilir. Diskteki adlar rastgele (UUID) verilir.

- Yükleme: yönetici + danışman
- Silme: yönetici, ya da belgeyi kendi yükleyen kişi
- İndirme: oturumu olan herkes

## Dışa aktarma (CSV)

| Nereden | Ne çıkar |
|---|---|
| Bina detayı → **Onay Çizelgesi** | Maliklerin arsa payları, onay durumları ve dosya özeti — toplantı/imza takibi için |
| Binalar → **Dışa Aktar** | Ekrandaki filtreler uygulanmış bina listesi |
| Malikler → **Dışa Aktar** | Her satır bir bağımsız bölüm bağlantısı |
| Müteahhitler → **Dışa Aktar** | Portföy listesi |

Çıktılar UTF-8 BOM + noktalı virgül ayırıcıyla üretilir; Türkçe Windows Excel'de çift
tıklamayla düzgün açılır. Hücreler formül olarak yorumlanmasın diye kaçışlanır.

---

## Proje yapısı

```
prisma/
  schema.prisma      Veri modeli
  seed.ts            Demo veri
  temizle.ts         Canlıya geçiş için veri temizleme
  arama-doldur.ts    Arama sütunlarını yeniden hesaplar
src/
  app/
    globals.css      Tasarım katmanı: tokenlar, tipografi, bileşen düzeltmeleri
    layout.tsx       Fontlar ve tema betiği
    giris/           Giriş ekranı
    (panel)/         Oturum gerektiren tüm sayfalar
      binalar/  malikler/  muteahhitler/  takvim/  aktiviteler/  kullanicilar/  profil/
    api/
      arama/         Global arama
      belge/[id]/    Oturum korumalı belge indirme
      canli/         Canlı güncelleme (SSE)
      cikis/         Çıkış
  components/
    kabuk.tsx        Sidebar + üst çubuk + tema anahtarı
    modal.tsx        <dialog> tabanlı modal ve silme onayı
    global-arama.tsx Üst çubuk araması
    belgeler-karti.tsx
    canli-tazele.tsx SSE dinleyicisi
    ortak.tsx        Rozet, kart, avatar, onay çubuğu vb.
  lib/
    sabitler.ts      Tüm durum tanımları, etiketler, renkler, süreç akışı
    arama.ts         Türkçe normalizasyon
    takvim.ts        Takvim ızgarası ve tarih yardımcıları
    belge.ts         Dosya deposu (sunucu)
    disa-aktar.ts    CSV üretimi
    canli.ts         SSE yayını
    oturum.ts        JWT tabanlı oturum
  middleware.ts      Sayfa erişim koruması
veri/belgeler/       Yüklenen belgeler (git dışı)
```

Her modülün yazma işlemleri kendi `eylemler.ts` dosyasındadır (Next.js server actions).

---

## Canlıya alma (VPS)

4 çekirdek / 8 GB RAM sınıfı bir bulut sunucu bu panel için fazlasıyla yeterlidir.

### 1. Node.js kurun

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -   # Ubuntu/Debian
sudo apt install -y nodejs
# AlmaLinux/Rocky için: sudo dnf module install nodejs:22
sudo npm install -g pm2
```

### 2. Projeyi yükleyin ve derleyin

```bash
cd /var/www/kentsel-rota-panel
npm ci
cp .env.example .env
nano .env                     # AUTH_SECRET'i uzun ve rastgele bir değerle doldurun
npm run build
npm run kurulum
```

`AUTH_SECRET` üretmek için:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. PM2 ile çalıştırın

```bash
pm2 start npm --name kentsel-rota -- start
pm2 save
pm2 startup
```

> **Tek instance şart.** Canlı güncelleme (takvimin kendiliğinden tazelenmesi) değişiklikleri
> süreç belleğinde yayınlar. PM2'yi cluster moduna alırsanız (`-i max`) bir süreçteki değişiklik
> diğerine ulaşmaz ve canlı güncelleme sessizce bozulur. Yukarıdaki komut tek instance açar;
> öyle kalsın.

### 4. Nginx

```nginx
server {
    listen 80;
    server_name panel.alanadiniz.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Canlı güncelleme (SSE) tamponlanırsa takılır
    location /api/canli {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 24h;
    }
}
```

Sonra SSL:

```bash
sudo certbot --nginx -d panel.alanadiniz.com
```

> **Önemli:** Oturum çerezi üretimde `secure` işaretlidir, yani panel **HTTPS üzerinden**
> çalışmalıdır. SSL kurmadan giriş yapılamaz.

**cPanel kullanıyorsanız:** aynı reverse proxy'yi Apache tarafında kurun; `/api/canli` için
`flushpackets=on` ekleyin, aksi halde canlı güncelleme çalışmaz.

### 5. Demo veriyi silin

```bash
ADMIN_EMAIL="siz@alanadiniz.com" ADMIN_SIFRE="kendi-guclu-sifreniz" npm run db:temizle
```

Tüm demo kayıtları siler, verdiğiniz adresle tek bir yönetici hesabı bırakır. Ekibin
geri kalanını panel içindeki **Kullanıcılar → Yeni Kullanıcı** ekranından eklersiniz.

### Güncelleme

```bash
git pull
npm ci
npm run build
pm2 reload kentsel-rota
```

---

## Yedekleme

İki şeyi yedekleyin:

```bash
# Veritabanı (tek dosya)
sqlite3 prisma/veritabani.db ".backup '/yedek/krp-$(date +%F).db'"

# Yüklenen belgeler
tar czf /yedek/belgeler-$(date +%F).tar.gz veri/belgeler
```

`sqlite3` yoksa uygulamayı durdurup `prisma/veritabani.db` dosyasını kopyalamak da yeterlidir.

## PostgreSQL'e geçiş

1. `prisma/schema.prisma` içinde `provider = "sqlite"` → `"postgresql"`
2. `.env` içinde `DATABASE_URL="postgresql://kullanici:sifre@localhost:5432/kentselrota"`
3. `npx prisma db push && npm run db:arama`

Şema PostgreSQL uyumlu yazıldı; enum yerine `String` alanlar kullanıldığı için ek değişiklik
gerekmez. PostgreSQL'de Prisma'nın `mode: "insensitive"` seçeneği de çalışır, ama normalize
sütun aksan sadeleştirmesi sağladığı için yerinde bırakılması önerilir.

---

## Tasarım

Tabler'ın üstüne tek bir tasarım katmanı biniyor: `src/app/globals.css`. Sayfa kodlarına
dokunmadan tüm paneli yeniden giydirebilmek için Tabler'ın kendi CSS değişkenleri eziliyor.
Tabler 1.4 tonlu varyantları (`bg-green-lt` gibi) `color-mix` ile temel renkten türettiği için
tek bir `--tblr-green` tanımı yeterli oluyor.

Dosyanın başındaki `--krp-*` blokları tek doğruluk kaynağı: zeminler, çizgiler, metin
tonları, vurgu ve anlam renkleri. Aydınlık/karanlık iki blok var, aralarında yalnızca bu
değişkenler farklı.

**Renk bilgidir, süs değildir.** Arayüz mürekkep ve gri tonlarında yürür; renk yalnızca
anlam taşıdığı yerde çıkar:

| Renk | Anlamı |
|---|---|
| Yeşil | Olumlu onay |
| Kırmızı | Olumsuz onay |
| Kehribar | Bekleyen / çoğunluk eşiği |
| Mavi | Bağlantı, odak halkası, aktif menü — "tesisat rengi" |
| Mürekkep | Birincil eylem düğmeleri |

Birincil düğmeler bilinçli olarak mavi değil mürekkep siyahı; böylece malik onay çubuğu
ekranın en renkli, dolayısıyla en dikkat çeken öğesi kalıyor. Çoğunluk eşiği onay çubuğu
üzerinde kehribar kesikli çizgiyle işaretlenir — panelin tek "sıcak" renkli işareti.

Süreç paletindeki yedi ek ton (`--krp-h-*`) 16 adımlık akışın rozetleri için: benzer
parlaklık ve doygunlukta seçildiler, yan yana dizildiklerinde biri diğerini bastırmıyor.

Derinlik gölge yerine 1 px çizgiyle veriliyor; gölge yalnızca üste binen katmanlarda
(modal, arama paneli, açılır menü) kullanılıyor.

**Tipografi** `next/font` ile self-host edilir, üçünde de `latin-ext` var (ş/ğ/ı/İ/ç/ö/ü
eksiksiz):

| Font | Nerede |
|---|---|
| Bricolage Grotesque | Sayfa başlıkları, marka, büyük sayılar |
| Instrument Sans | Gövde ve arayüz metni |
| IBM Plex Mono | Ada/parsel kodları, sabit genişlik gereken sayılar |

Başlık fontu gövde metninde kullanılmaz; yoğun tablolarda yorucu olur. Sayısal veri her
yerde `tabular-nums` ile hizalanır, yoksa oranlar alt alta kayıyor.

---

## Notlar

- Tabler CSS `@tabler/core` paketinden gelir; **Bootstrap JS kullanılmaz**. Modallar native
  `<dialog>` üzerine, açılır menüler React ile yazıldı — hidrasyon sorunu yaşanmaz.
- Karanlık/aydınlık tema tercihi tarayıcıda (`localStorage`) saklanır.
- Şifreler `bcrypt` ile saklanır, oturum `httpOnly` çerezdeki JWT ile yürür (7 gün).
