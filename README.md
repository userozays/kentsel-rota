# Kentsel Rota Panel

Kentsel dönüşüm danışmanlığı için bina dosyası, malik onay ve müteahhit portföyü takip paneli.
Tasarım [Tabler](https://tabler.io) (MIT) üzerine kurulu.

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

> Demo veri 18 bina, 256 malik ve 8 müteahhit içerir. Canlıya geçmeden önce
> **mutlaka** `npm run db:temizle` ile silin (aşağıya bakın).

---

## Neler var

| Sayfa | İçerik |
|---|---|
| **Panel** | Aktif dosya, riskli yapı, çoğunluk sağlanan dosya sayıları; çoğunluğa en yakın dosyalar; aşama dağılımı; müteahhit portföyü; son hareketler |
| **Binalar** | Ada/parsel bazlı dosya listesi, arama + durum/risk/aşama/ilçe/danışman filtreleri |
| **Bina detayı** | Malik onay oranı (arsa payı bazlı), bağımsız bölüm tablosu, 16 adımlık süreç zaman çizelgesi, müteahhit kartı, görüşme notları |
| **Malikler** | Kişi kayıtları, hangi binada hangi bölüme sahip, onay durumu |
| **Müteahhitler** | Firma portföyü, puan, referans proje/daire sayısı, çalışma bölgeleri, kara liste |
| **Süreç Takibi** | 16 aşamalı kanban panosu + tüm dosyaları tek ekranda gösteren matris tablosu |
| **Aktiviteler** | Tüm görüşme/telefon/toplantı/sistem kayıtlarının ortak akışı |
| **Kullanıcılar** | Hesap açma, rol atama, aktif/pasif (sadece yönetici) |

### Roller

- **Yönetici** — her şey; kullanıcı yönetimi ve kayıt silme.
- **Danışman** — bina/malik/müteahhit ekler ve düzenler, silemez.
- **İzleyici** — sadece görüntüler.

---

## Çoğunluk hesabı

Onay oranı **kişi sayısına göre değil, arsa payına göre** hesaplanır.
Eşik değeri tek bir yerde tanımlıdır:

```ts
// src/lib/sabitler.ts
export const COGUNLUK_ESIGI = 50;   // yüzde
```

6306 sayılı Kanun'da 2023 değişikliği sonrası salt çoğunluk arandığı için varsayılan `50`
bırakıldı. Kendi uygulamanıza göre (örn. `66.67`) değiştirebilirsiniz — panel, listeler ve
grafikler otomatik olarak yeni eşiğe göre çalışır.

> Panel bir takip aracıdır; resmî işlemlerde ilgili idare ve tapu kayıtları esastır.

## Süreç adımları

16 adımlık akış aynı dosyada tanımlı:

```ts
// src/lib/sabitler.ts
export const SUREC_ADIMLARI = [
  { deger: "ILK_GORUSME", etiket: "İlk Görüşme & Bilgilendirme", ... },
  ...
];
```

Adım ekler, çıkarır veya sırasını değiştirirseniz **yeni** bina dosyaları buna göre oluşur.
Mevcut dosyaların adımlarını da hizalamak için binayı düzenleyip aşamasını kaydetmeniz yeterli.

---

## Proje yapısı

```
prisma/
  schema.prisma      Veri modeli
  seed.ts            Demo veri
  temizle.ts         Canlıya geçiş için veri temizleme
src/
  app/
    giris/           Giriş ekranı
    (panel)/         Oturum gerektiren tüm sayfalar
      binalar/  malikler/  muteahhitler/  surec/  aktiviteler/  kullanicilar/  profil/
    api/cikis/       Çıkış (POST)
  components/
    kabuk.tsx        Sidebar + üst çubuk + tema anahtarı
    ortak.tsx        Rozet, kart, avatar, onay çubuğu vb.
  lib/
    sabitler.ts      Tüm durum tanımları, etiketler, renkler, süreç akışı
    yardimcilar.ts   Tarih/sayı biçimleme, onay oranı hesabı
    oturum.ts        JWT tabanlı oturum
  middleware.ts      Sayfa erişim koruması
```

Her modülün yazma işlemleri kendi `eylemler.ts` dosyasındadır (Next.js server actions).

---

## Canlıya alma (VPS)

4 çekirdek / 8 GB RAM sınıfı bir bulut sunucu bu panel için fazlasıyla yeterlidir.

### 1. Sunucuda Node.js kurun

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
npm run kurulum               # ilk kurulumda: veritabanı + demo veri
```

`AUTH_SECRET` üretmek için:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. PM2 ile çalıştırın

```bash
pm2 start npm --name kentsel-rota -- start
pm2 save
pm2 startup                   # sunucu yeniden başlarsa otomatik kalksın
```

Uygulama `localhost:3000` dinler.

### 4. Web sunucusunu bağlayın

**cPanel kuruluysa:** ilgili domain için bir reverse proxy kuralı ekleyin
(Apache include dosyası, `/usr/local/apache/conf/userdata/...`):

```apache
ProxyPreserveHost On
ProxyPass / http://127.0.0.1:3000/
ProxyPassReverse / http://127.0.0.1:3000/
```

**cPanel yoksa (önerilen):** nginx

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
}
```

Sonra SSL:

```bash
sudo certbot --nginx -d panel.alanadiniz.com
```

> **Önemli:** Oturum çerezi üretimde `secure` işaretlidir, yani panel **HTTPS üzerinden**
> çalışmalıdır. SSL kurmadan giriş yapılamaz.

### 5. Demo veriyi silin

```bash
ADMIN_EMAIL="siz@alanadiniz.com" ADMIN_SIFRE="kendi-guclu-sifreniz" npm run db:temizle
```

Bu komut tüm demo kayıtları siler ve verdiğiniz adresle tek bir yönetici hesabı bırakır.
Ekibin geri kalanını panel içindeki **Kullanıcılar → Yeni Kullanıcı** ekranından eklersiniz.

### Güncelleme

```bash
git pull                # veya dosyaları yükleyin
npm ci
npm run build
pm2 reload kentsel-rota
```

---

## Yedekleme

Veritabanı tek bir dosyadır: `prisma/veritabani.db`

```bash
# Günlük yedek (crontab -e)
0 2 * * * sqlite3 /var/www/kentsel-rota-panel/prisma/veritabani.db ".backup '/yedek/krp-$(date +\%F).db'"
```

`sqlite3` yoksa uygulamayı durdurup dosyayı kopyalamak da yeterlidir.
`public/yuklemeler/` klasörünü de yedeğe dahil edin.

## PostgreSQL'e geçiş

Kayıt sayısı büyürse veya eşzamanlı yazma artarsa:

1. `prisma/schema.prisma` içinde `provider = "sqlite"` → `"postgresql"`
2. `.env` içinde `DATABASE_URL="postgresql://kullanici:sifre@localhost:5432/kentselrota"`
3. `npx prisma db push`
4. Mevcut veriyi taşımak için `npx prisma db pull` / `pgloader` ya da bir kerelik aktarım betiği

Şema PostgreSQL uyumlu yazıldı; enum yerine `String` alanlar kullanıldığı için ek değişiklik gerekmez.

---

## Notlar

- Tabler CSS `@tabler/core` paketinden gelir; Bootstrap JS kullanılmaz, açılır menüler ve
  modallar React ile yazıldı. Bu yüzden hidrasyon sorunu yaşanmaz.
- Karanlık/aydınlık tema tercihi tarayıcıda (`localStorage`) saklanır.
- Şifreler `bcrypt` ile saklanır, oturum `httpOnly` çerezdeki JWT ile yürür (7 gün).
