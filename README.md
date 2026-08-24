# Kentsel Rota

Kat karşılığı kentsel dönüşümde **maliklerin danışmanı** olarak çalışan proje geliştirme
ve süreç yönetimi iş modeli — strateji dokümanı ve saha takip panosu.

## İçerik

| Yol | Ne |
| :-- | :-- |
| `kentsel-rota-yeni.md` | İş modeli: değer önermesi, operasyonel süreç haritası, gelir modeli, risk yönetimi, ölçeklenme stratejisi |
| `panel/index.html` | Saha takip panosu — bina/malik onay takibi, arsa payı çoğunluk göstergesi, fizibilite, müteahhit havuzu, ağırlıklı teklif karşılaştırma |

## Modelin özeti

- **Kim kimin danışmanı:** kat maliklerinin. Münhasır (özel) temsil yetkisiyle çalışılır.
- **Ücret kimden:** kazanan yükleniciden. Bedel ihale şartnamesinde ilan edilir, **tüm teklif
  verenler için aynıdır** ve kazananla pazarlık edilmez — böylece ücret, hangi müteahhidin
  kazandığından bağımsız kalır ve menfaat çatışması yapısal olarak ortadan kalkar.
- **Ne zaman:** tamamı, noter onaylı sözleşme **ve** teminat mektubunun teslimi anında.
- **Sonrası:** şantiye takibi ve denetim ayrı bir üründür, ayrı sözleşme ve ayrı bedelle.

Ücretin kaynağı, formülü ve tutarı üç yerde birden yazılı olarak açıklanır: münhasır yetki
sözleşmesinde, malikler kurulu karar tutanağında ve ihale şartnamesinde.

## Panel

Panonun ana fikri **pay şeridi**: her bağımsız bölüm, arsa payı kadar genişlikte bir şerit
parçası; rengi malikin tavrı (olumlu / kararsız / ulaşılamadı / olumsuz), üzerinden geçen
kesikli çizgi %50 eşiği.

6306 sayılı Kanun'da çoğunluk **arsa payı** üzerinden hesaplanır, kişi sayısı üzerinden değil.
24 malikten 14'ü olumlu olabilir ama payları küçükse toplam %41'de kalır — anlaşma yoktur.
Panel iki sayıyı da yan yana gösterir ve asıl kararı arsa payına göre verir.

Panel ayrıca şunu hesaplar: **eşiği geçmek için hangi malikleri ikna etmek gerekiyor** —
kararsız ve ulaşılamayan malikler arsa payına göre sıralanır, eşiği geçmeye yetecek en kısa
liste çıkarılır. Kararsızların tamamı olumluya dönse bile eşik geçilmiyorsa panel bunu uyarı
olarak gösterir.

### Bölümler

- **Panel** — binalar aşamalara göre kartlar hâlinde (Tespit → Görüşme → Yetki → Şartname → İhale → Sözleşme → İnşaat → İskan)
- **Fizibilite** — arsa m², emsal/KAKS, TAKS, emsal alanı, riskli yapı statüsü. Riskli yapı
  başvurusu olmayan binalar uyarı ile işaretlenir: o statü olmadan %50+1 mimarisinin hukuki
  dayanağı yoktur.
- **Müteahhitler** — YMBN grubu, referans, NDA ve devre dışı bırakmama taahhüdü takibi
- **Teklifler** — ağırlıklı karşılaştırma matrisi. Ağırlıklar teklifler açılmadan önce
  **kilitlenebilir**; kilit tarihi kaydedilir. Yanında ihale etiği kontrol listesi çalışır
  (en az 3 teklif, kilitli ağırlık, tüm teklif verenlerde NDA ve taahhüt, çoğunluk sağlandı mı).
- **Yedek** — JSON yedek indirme / geri yükleme ve KVKK notları

### Çalıştırma

`panel/index.html` bir Claude Artifact olarak yayınlanmak üzere yazıldı; `<!doctype html>`,
`<html>`, `<head>` ve `<body>` sarmalayıcıları yayınlama sırasında ekleniyor.

Yayınlanan panelde veri bulutta tutulur ve ekipteki herkes aynı kaydı görür. Dosya doğrudan
tarayıcıda açılırsa panel **salt önizleme** modunda çalışır: `window.claude` bulunmadığı için
kayıt yapılmaz, örnek veriyle görüntülenir.

### Kişisel veri

Panel malik ad-soyad, telefon ve tapu bilgisi işler — hepsi kişisel veridir. TC kimlik numarası
ve tapu görüntüsü gibi veriler bilinçli olarak toplanmaz. Maliklere aydınlatma metni imzalatılmalı
ve panel bağlantısı yalnız ekiple paylaşılmalıdır.
