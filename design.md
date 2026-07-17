# Luupi Design System ve Product UI Vizyonu

## 1. Amaç ve Tasarım Vizyonu

Luupi, kişinin alışkanlıklarını ve disiplinini artırmak üzerine yapılmış bir uygulamadır. Ürünün ana karakteri oyunlaştırma ve görsellik üzerinden güçlenir; ancak bu oyunlaştırma ucuz veya çocukça değil, premium hissettiren bir kalitede sunulur.

Luupi'nin hedef hissi:

- premium
- enerjik
- oyunlaştırılmış
- akıcı
- karakterli
- tek parça bir ürün gibi çalışan

Luupi sakin bir minimalizm ürünü değildir. Tema duyarlı güçlü yüzeyleri, kritik noktalarda kullandığı renkleri ve görünür, hissedilir etkileşimleri olan bir deneyim sunar.

Tek cümlelik ürün tanımı:

> Luupi, alışkanlık ve disiplin gelişimini premium, enerjik ve oyunlaştırılmış bir görsel dil ile sunan kişisel ritim uygulamasıdır.

## 2. Temel Tasarım Prensipleri

### 2.1 Bütünlük

Uygulamadaki tüm sayfalar aynı ürün ailesine ait görünmelidir. Yeni yapılan hiçbir ekran ayrı bir ürün gibi durmamalıdır.

- Buton dili ortak olmalıdır.
- Kart dili ortak olmalıdır.
- Motion dili ortak olmalıdır.
- Karanlık tema ortak temel olmalıdır.
- Renk kullanımı farklılaşsa bile sistem mantığı korunmalıdır.

### 2.2 Premium ama Enerjik

Luupi'nin tasarımı ne aşırı ciddi ne de fazla oyuncu olmalıdır.

- Premium his yüzey kalitesi, tipografi, hareket ve boşluk kullanımıyla verilir.
- Enerji hissi renk, oyunlaştırma, outline ikonlar ve etkileşimli geçişlerle verilir.
- Ürün “kurumsal” görünmemelidir.
- Ürün “çocuk uygulaması” gibi de görünmemelidir.

### 2.3 Overview Before Detail

Kullanıcı çoğu durumda önce genel durumu görmeli, detay isterse içeri girmelidir.

- Dashboard: bugünün aksiyonu
- Habits: genel performans görünümü
- Habit detail: derin istatistik
- Streak: ritim ve ödül görünümü

### 2.4 Action Through Gesture

Luupi’de görünür buton kalabalığı yerine gesture önceliklidir.

- onaylama: swipe
- reddetme / atlama: swipe
- yönetim aksiyonları: long press
- detay görünümü: tap
- ikincil içerik: bottom sheet

### 2.5 Feedback Always Matters

Başarılı veya başarısız her önemli etkileşim görünür ve hissedilir geri bildirim vermelidir.

- toast
- animasyon
- renk değişimi
- haptic

## 3. Bilgi Mimarisi ve Ekran Rolleri

### Dashboard

Dashboard bugünün aksiyon ekranıdır. Liste gibi değil, canlı ve fiziksel hisli habit kartlarıyla çalışır.

Odak:

- bugünün habitleri
- swipe ile tamamla / atla
- sonuçların aynı gün içindeki akışını izleme

### Habits

Habits sayfası yönetim listesi değildir. Alışkanlık portföyü ve genel ritim görünümüdür.

Odak:

- her habitin dışarıdan genel performansını görmek
- son 30 günün tamamlanan ve atlanan günlerini ayırt etmek
- detay istatistiğe içeri girerek ulaşmak

### Habit Detail

Bu ekran derin istatistik ekranıdır.

Odak:

- aylık görünüm
- başarı yüzdesi
- tamamlanan / kaçırılan günler
- uzun vadeli performans

### Geçmiş

Geçmiş, yalnızca tamamlanan habitleri sıralayan bir liste değil; kullanıcının günlük ritmini kararlar, hedefler ve araç sonuçlarıyla birlikte saklayan arşiv ekranıdır.

Odak:

- aylık ritmi ve tamamlanan / atlanan / kaçırılan günleri ayırt etmek
- habit, odak, su, uyanma ve araç sonuçlarını aynı gün altında birleştirmek
- overview takviminden gün detayına bottom sheet ile inmek
- anlamlı günleri kronolojik bir kayıt akışında yeniden bulmak

### Streak

Streak ekranı bilgi listesi değil, insight ve ödül ekranıdır.

Odak:

- büyük alev ve streak sayısı
- kullanıcının ritmini görsel olarak hissettirmek
- seri dondurma hakkını değerli göstermek

### Tools

Tools uygulamanın yan özelliği değildir. Habit tracker’ın hedefini destekleyen ikinci ana sütundur.

Luupi, yalnızca tek başına habit tracker olmak istemez. Kullanıcının ritmini destekleyen araçlar ürünün çekirdeğine dahildir. Bu yüzden Araçlar sekmesi navigasyonda featured davranır.

## 4. Navigasyon Sistemi

Alt navigasyon klasik statik tab bar gibi davranmamalıdır. Aktif sekmeye göre şekil değiştiren canlı bir yüzey olmalıdır.

### Navigasyon Kuralları

- Alt bar tek parça tema duyarlı fiziksel kapsül yüzeydir.
- Aktif sekmenin altında oyuk oluşur.
- Aktif ikon, bu oyuğun içine oturan belirgin bir orb olarak görünür.
- Sekme değişiminde orb ve oyuk birlikte animasyonla yeni konuma kayar.
- Pasif ikonlar sessiz ve ince kalır.
- Navigasyonun genel yapısı akışkan ve fiziksel hisli görünmelidir.

### Araçlar Sekmesi

- Araçlar sekmesi tam ortada yer alır.
- Araçlar sekmesi featured destination’dır.
- Araçlar için vurgu rengi lime olur.
- Aktifken diğer sekmelerden daha güçlü görünür.
- Aktif değilken bile merkez konumu nedeniyle daha stratejik okunur.

## 5. Görsel Sistem

### 5.1 Tema Yapısı

Luupi açık ve koyu temayı aynı ürün ailesinin iki eşdeğer görünümü olarak destekler.

- Açık tema sıcak kırık beyaz yüzeyler, koyu metin, kontrollü cam etkisi ve yumuşak gölgeler kullanır.
- Koyu tema sinematik nötr yüzeyler, açık metin ve güçlü ama kontrollü highlight kullanır.
- Bileşen anatomisi, hiyerarşi ve featured renk rolleri tema değişiminde korunur.
- Önemli bölgelerde renk mutlaka kullanılır; açık tema soluk, koyu tema tekdüze siyah/gri görünmemelidir.
- Tema uyarlaması sabit renk yamalarıyla değil semantik token çiftleriyle yapılır.

### 5.2 Renk Kullanımı

Renk, dekor değil yönlendirme aracıdır.

Rengin kullanılacağı yerler:

- featured CTA'lar
- aktif sekmeler
- habit kartları
- streak hero alanı
- başarı / red durumları
- önemli sayaçlar
- insight yüzeyleri

### 5.3 Habit Renk Sistemi

Habitler ayırt edilebilir olmalıdır; ancak renk kullanımı rastgele olmamalıdır.

Seçilen sistem:

- kategori + ton varyasyonu

Kurallar:

- Her kategori bir ana renk ailesi alır.
- Her habit o aile içinden farklı bir ton varyasyonu kullanır.
- Aynı kategori içindeki habitler akraba görünür.
- Aynı sayfadaki kartlar birbirine yapışmaz.
- Görsel çeşitlilik korunur ama kaos oluşmaz.

Örnek aile mantığı:

- sağlık: green / mint / lime varyasyonları
- eğitim: blue / sky / indigo varyasyonları
- zihin: violet / lavender varyasyonları
- üretkenlik: amber / orange varyasyonları
- sosyal: cyan varyasyonları
- finans: emerald varyasyonları

### 5.4 Sistemsel Durum Renkleri

Durum renkleri habit kartı renginden bağımsız, sistem seviyesinde okunur.

- tamamlandı: yeşil sistem feedback'i
- bugün atlandı: kırmızı / sıcak sistem feedback'i
- aktif / featured tools: lime
- streak enerji alanı: sıcak amber / orange aileleri

### 5.5 Tipografi

Font sistemi premium ve doğal kalmalıdır. Aşırı ciddi ya da oyuncu bir font tercih edilmeyecektir.

Seçim:

- genel metin: SF Pro Text
- başlıklar ve büyük sayılar: SF Pro Display
- fallback: -apple-system, BlinkMacSystemFont, Helvetica Neue, Inter, Arial, sans-serif

Tipografi tavrı:

- başlıklar ciddi ama hafif enerjik
- büyük sayılar güçlü ve net
- metinler okunabilir ve temiz
- ne “Arial gibi düz” ne de fazla eğlenceli

### 5.6 İkon Sistemi

İkonlar Luupi’de önemli bilgi taşıyıcıları ve habit kimliğinin ana parçalarıdır.

- Uygulama arayüzünde Unicode emoji kullanılmaz.
- Ortak kaynak `Tabler Outline`, ortak renderer `LuupiIcon` ve veri kimliği `IconName` olur.
- İkonlar illüstratif, dolgulu, çok renkli veya raster olmaz; varsayılan stroke `1.8–2px` aralığındadır.
- Ortak ölçüler `16`, `20`, `24`, `32` ve `48px`; renk kaynağı `currentColor` ve tema token'larıdır.
- Habit, kategori, preset ve rozet ikonları merkezi küratörlü registry'den seçilir.
- Dekoratif ikonlar `aria-hidden`; tek başına anlam taşıyan ikonlar erişilebilir ad veya görünür metin taşır.
- Native bildirimler SVG gösteremediği için emoji öneki kullanmaz; başlık temiz metindir.

## 6. Etkileşim Sistemi

### 6.1 Swipe

Swipe, Luupi’de birincil aksiyon sistemidir.

- sağa swipe: tamamlandı
- sola swipe: bugün atlandı
- onay / red süreçlerinde görünür buton yerine mümkünse swipe kullanılmalıdır

Swipe davranışı görünür olmalıdır:

- sürükleme boyunca renk akışı
- eşik yaklaşırken ikon görünümü
- tamamlanınca güçlü motion
- mutlaka haptic
- hareket ekseni ilk `8px` içinde kararlaştırılmaz; yatay niyet baskınsa swipe, dikey niyet baskınsa sayfa scroll'u devam eder
- karar eşiğine ilk giriş yalnızca bir `medium` haptic üretir; eşik çevresinde gidip gelmek yeni haptic üretmez
- eşik altında bırakılan kart `220ms` fiziksel spring ile yerine döner ve veri değişmez
- karar sonucu `420ms` içinde yüzeyden çıkar; sonuç toast'ı eşik haptic'i çalıştıysa `haptic: none` kullanır

### 6.2 Pointer Sahipliği ve Eksen Kilidi

Dokunma ile başlayan her gesture, pointer bırakılana veya gerçek bir sistem iptali oluşana kadar başlangıç yüzeyine aittir.

- gesture yüzeyi `pointerdown` anında aktif `pointerId` için pointer capture alır; parmağın buton veya kart sınırından çıkması etkileşimi kesmez
- hareket ilk `8px` boyunca `pending` kalır; belirgin yatay niyet swipe'a, belirgin dikey niyet doğal sayfa scroll'una sahiplik verir
- yatay eksen bir kez kilitlendiğinde gesture sonuna kadar değişmez; parmak aşağı veya yukarı sapıtsa bile sayfa scroll'u hareketi devralamaz
- dikey niyet kilitlendiğinde özel gesture capture'ı bırakır, long press iptal edilir ve sayfanın doğal scroll davranışı devam eder
- swipe ve long press aynı pointer için bağımsız state makineleri olarak yarışmaz; pointer oturumu tek sahibin koordinasyonunda yürür
- `pointerup`, `pointercancel`, `lostpointercapture`, görünürlük kaybı ve unmount aynı güvenli cleanup sözleşmesini kullanır
- gerçek bir sistem iptali sonucu veri değiştirmez; hareketli yüzey kısa snap-back ile başlangıç konumuna döner
- çoklu dokunmada yalnızca primary pointer kabul edilir; ikinci pointer mevcut gesture'ın sahibini değiştirmez
- `touch-action`, yatay swipe ve sayfa scroll'unu paylaşan yüzeylerde `pan-y`; drag indicator ve tam ekran gesture yüzeylerinde `none` olur

### 6.3 Long Press

Luupi’de düzenle / sil / yönet gibi yönetimsel işler doğrudan görünür butonlarla yüzeye taşınmamalıdır.

- yönetim aksiyonları long press ile açılmalıdır
- kart üstü gereksiz aksiyon butonları azaltılmalıdır
- kullanıcıyı esas akıştan koparmayan bir kontrol modeli kurulmalıdır
- aktivasyon süresi tüm uygulamada `450ms`, hareket iptal toleransı `10px` olmalıdır
- basılı tutma sırasında yüzey hafifçe sıkışır ve ilerleme görünür olur; haptic yalnızca long press gerçekten aktive olduğunda verilir
- sağ tık, `Shift+F10` ve klavye Context Menu tuşu aynı yönetim yüzeyini açabilmelidir
- görünür düzenle / sil kontrolleri ana içerik yüzeyinde bulunmaz; kullanıcı yönetim sheet'ine girdikten sonra aksiyonlar açık ve metinli butonlar olarak gösterilir
- yönetim sheet'i nesne kimliği, normal aksiyonlar, durum aksiyonları ve en altta ayrılmış destructive aksiyon sırasını kullanır
- kalıcı veri kaybı üreten destructive aksiyon ortak, aşağı çekilebilir bir onay sheet'inden geçer; güvenli `Vazgeç` aksiyonu ilk focus'u alır
- normal tap nesnenin birincil işini korur; Dashboard gibi swipe ağırlıklı karar yüzeylerine ikinci bir long press yönetim katmanı eklenmez
- Todo kartında swipe tamamlamayı, long press düzenle / sabitle / sil yönetimini üstlenir; normal pointer tap edit modunu başlatmaz
- uyanma kaydı long press'i önce `Saati Düzenle / Kaydı Sil` yönetim sheet'ini açar; su kaydı tek destructive aksiyonu olduğu için doğrudan ortak onay sheet'ine ilerleyebilir
- ekran okuyucu aynı yönetim aksiyonuna erişebilir; sağ tık ve klavye alternatifleri pointer long press ile aynı sheet'i açar
- reduced-motion aktifken `450ms` güvenli aktivasyon süresi değişmez; yalnızca dekoratif hold progress gizlenir

### 6.4 Bottom Sheet

İkincil içerikler ve detay açılımları için bottom sheet tercih edilir.

Bottom sheet kullanım alanları:

- sonuç kart destesi
- long press sonrası yönetim seçenekleri
- ikincil seçim yüzeyleri

Bottom sheet karakteri:

- premium
- ağır olmayan
- akıcı
- ana sayfayla bağını koparmayan

Bottom sheet drag indicator sözleşmesi:

- drag indicator dekoratif değil, doğrudan etkileşimli bir kapatma kontrolüdür
- kullanıcı indicator'ı tutup aşağı çekerek açık sheet'i kapatabilir
- gesture yalnızca indicator üzerinden başlar; sheet içeriğinin dikey scroll davranışı ele geçirilmez
- `92px` aşağı çekme veya en az `24px` mesafeden sonra bilinçli hızlı aşağı flick kapatmayı tetikler
- eşik altında bırakılan sheet fiziksel, kısa bir snap-back hareketiyle yerine döner
- kapatma eşiğine ilk geçişte tek bir medium haptic verilir; aynı gesture içinde tekrar haptic üretilmez
- indicator klavye ile odaklanabilir; `Enter` veya `Space` aynı kapatma davranışını çalıştırır
- indicator'ın erişilebilir adı `Aşağı çekerek kapat` olur
- reduced motion açıkken kapanma ve geri dönüş anlık gerçekleşir, davranış değişmez

### 6.5 Motion

Motion dili Luupi’nin imzasıdır.

Ortak süre katmanları:

- touch feedback: `120ms`
- standart durum değişimi ve snap-back: `220ms`
- navigasyon ve yönlü sayfa geçişi: `300ms`
- sheet girişi: `360ms`; sheet çıkışı: `240ms`
- normal başarı / red sonucu: `420ms`
- gerçek ödül ve kutlama: `520ms`

Kurallar:

- akıcı olmalı
- premium hisli olmalı
- eğlenceli olmalı
- aşırı zıplayan veya çocukça olmamalı
- fiziksel his vermeli
- enter hareketi `--ease-enter`, exit hareketi daha kısa `--ease-exit` kullanır; spring yalnızca fiziksel nesne, snap-back ve nav orb için kullanılır
- route geçişi uygulama kabuğunda bir kez çalışır; sayfa bileşeni aynı anda ikinci bir genel `page-enter` başlatmaz
- sıradan tamamlamada confetti kullanılmaz; lime bloom ve yönlü çıkış yeterlidir
- atlama kırmızı yönlü çıkış kullanır, bounce veya kutlama üretmez
- hata en fazla `2–3px`, `220ms` kısa shake kullanır
- aynı viewport'ta en fazla bir sürekli ambient loop çalışır; sheet açıkken, yüzey görünmezken ve uygulama arka plandayken durur
- reduced-motion yalnızca CSS sürelerini değil JavaScript zamanlayıcılarını da anlık hale getirir; renk, ikon ve durum geri bildirimi korunur

### 6.6 Haptic

Önemli her aksiyonda haptic zorunludur.

Haptic gereken durumlar:

- swipe ile tamamlandı
- swipe ile atlandı
- başarı
- red
- toast ile onaylanan kritik aksiyon
- streak kazanımı / kaybı / freeze kullanımı gibi önemli olaylar

Haptic sahipliği:

- normal seçim ve sekme: `selection`
- küçük kontrol sonucu: `light`
- featured Araçlar ve bilinçli odak başlangıcı: `medium`
- long press ve gesture eşiği: `medium`
- tamamlandı: `success`; bugün atlandı: `warning`; kritik hata: `error`; gerçek ödül: `success`
- tek kullanıcı aksiyonunda gesture, başlatıcı kontrol veya toast'tan yalnızca biri terminal haptic'in sahibi olur

### 6.7 Scroll Yüzeyleri

Luupi'de scrollbar görsel bir arayüz öğesi değildir; ana uygulama akışı ve tüm nested scroll yüzeylerinde görünmez kalır.

- scrollbar'ı gizlemek scroll davranışını kapatmaz veya taşan içeriği kırpmaz
- touch, mouse wheel, trackpad, klavye ve programatik scroll davranışları native biçimde korunur
- yatay rail'lerde mevcut momentum, gesture sahipliği ve `scroll-snap` kuralları değişmez
- dikey sheet ve modal içeriklerinde `overscroll-behavior`, safe area ve sticky alan ilişkisi korunur
- yatay taşma; komşu kartın görünmesi, kesilen rail devamlılığı veya mevcut gesture ipucuyla anlaşılır kalmalıdır
- scrollbar için ayrı layout boşluğu ayrılmaz; light ve dark mode aynı görünmez scrollbar sözleşmesini kullanır

### 6.8 Geri Navigasyonu

Alt sayfalardaki geri kontrolü, kullanıcı içerikte ne kadar ilerlerse ilerlesin anında erişilebilir kalır.

- ortak geri yüzeyi ana scroll container içinde kompakt bir sticky kapsül olarak çalışır
- mobilde safe area'nın altında, geniş ekranda sayfanın mevcut container hizasında kalır
- geri butonunun dokunma alanı en az `44 × 44px` olur; ikon, metin, light haptic ve erişilebilir ad birlikte korunur
- varsa `Araçlar`, `Profil` veya `Alışkanlıklar` gibi kısa bağlam etiketi aynı kapsülde kalır; tam genişlikte header oluşturulmaz
- yüzey tema token'ları, blur, ince border ve hafif shadow ile altından kayan içerikten ayrılır
- katman seviyesi sayfa içeriğinin üstünde; toast, modal, sheet, focus mode, safe-area şeridi ve navigasyonun altında kalır
- modal veya sheet açıldığında sayfa geri kontrolü bu geçici yüzeylerin üzerine çıkmaz
- normal geçmiş varsa bir önceki rotaya dönülür; doğrudan açılan alt sayfada güvenli ana rota fallback'i korunur

### 6.9 Interactive Edge-Back

Luupi'de bütün route sayfaları iOS benzeri, uygulama içi interactive geri gesture'ını destekler.

- gesture yalnızca primary touch veya pen pointer ile ekranın sol ilk `24px` alanından sağa doğru başlar
- ana sekmeler, araçlar ve detay sayfaları aynı uygulama içi route geçmişine dahildir; gesture kullanıcıyı Luupi dışındaki tarayıcı geçmişine çıkarmaz
- ilk `8px` ortak eksen kilidi korunur; dikey niyet native scroll'a bırakılır, yatay niyet kilitlenince pointer sayfa sahnesine ait kalır
- geçerli sayfa parmakla birebir `translateX` ilerler; önceki gerçek route altta inert biçimde render edilir ve `-24%` konumdan sıfıra yaklaşır
- geri kararı ekran genişliğinin `%33`'ü veya en az `56px` hareket sonrası `0.55px/ms` sağ yönlü hız ile verilir
- eşik altında bırakma `220ms` spring ile yerine döner; başarılı geri en fazla `300ms` sürer ve tek `selection` haptic üretir
- uygulama içi geçmiş yoksa sayfa doğrusal olmayan dirençle en fazla `28px` hareket eder, veri veya route değiştirmeden geri oturur
- modal, bottom sheet, Araçlar hub, Welcome, Story veya Focus Mode açıkken sayfa edge-back gesture'ı başlamaz; üst katman otomatik kapatılmaz
- önceki route `inert`, `aria-hidden` ve pointer etkileşimi kapalıdır; kendi kayıtlı scroll konumunda yalnızca görsel önizleme olarak yaşar
- Nav, toast ve Pomodoro mini player route sahnesinin dışında sabit kalır
- `pointercancel`, `lostpointercapture`, orientation değişimi, route değişimi ve unmount güvenli snap-back ve cleanup uygular
- reduced-motion doğrudan parmak takibini korur; parallax, scrim ve dekoratif geçişleri kaldırır

## 7. Dashboard Tasarım Kararları

Dashboard artık klasik habit listesi olmayacaktır.

### Dashboard Habit Yüzeyi

- habitler büyük kartlara dönüşür
- kartlar fiziksel yüzey gibi görünür
- aşağı kaydırıldıkça diğer kartlar görülür
- yapı bir kart destesi hissi verir

### Kart Yoğunluğu

- büyük kartlar kullanılır
- bütün bekleyen kartlar sayfanın doğal dikey akışında bulunur
- kartlar hafifçe üst üste biner; isim ve ana içerikleri okunabilir kalır
- kullanıcı desteyi dikey kaydırarak aradan istediği kartı seçebilir

### Kart Ruhu

- kartlar birbirinden renk ve yüzey diliyle ayrışır
- kartlar oyuncu ama premium olur
- outline ikon + şekil tabanlı bir yüzey kurgusu kullanılır
- bilgi yoğunluğu orta seviyede tutulur

### Swipe Sonrası Akış

- sağa swipe: tamamlandı
- sola swipe: bugün atlandı
- işlem gören kart ana desteden çıkar
- alt bölümdeki sonuç alanına iner

### Sonuç Alanı

- altta sönük mini bir kart destesi görünür
- burada tamamlanan ve atlanan kartlar tutulur
- en son işlenen kart ilk sırada görünür
- bu mini desteye dokununca bottom sheet açılır
- bottom sheet içinde kartlar büyür
- kullanıcı sağa sola scroll yaparak sonuç kartlarını inceler

## 8. Alışkanlıklar Sayfası Tasarım Kararları

Alışkanlıklar sayfası doğrudan overview ekranıdır. Ekstra üst özet alanıyla başlamaz.

### Sayfa Yapısı

- sayfa direkt kartlarla başlar
- üstte büyük ayrı bir streak veya summary hero yoktur
- liste görünümü yerine galeri / grid yaklaşımı vardır

### Grid Yapısı

- 2 sütun grid kullanılır

### Habit Overview Kartı

Her kartta:

- habit ikonu
- habit adı
- son 30 gün mini kare takip grid'i
- kısa özet satırı

Özet satırı formatı:

- `18 tamamlandı · 4 atlandı`

### Grid Anlamı

- kartın ana odağı mini kare takip grid'idir
- grid tamamlanan ve atlanan günleri dışarıdan belirgin gösterir
- dışarıdan bile “iyi gidiyor / aksıyor” bilgisi alınabilir
- detaylı istatistik için kart içine girilir

### Kart Aksiyonları

- düzenle / sil / istatistik butonları dış görünümde yer almaz
- long press ile yönetim aksiyonları açılır
- normal tap, detay ekranına giriş içindir

## 9. Streak Ekranı Tasarım Kararları

Streak ekranı bir insight ve ödül ekranıdır.

### Genel Ton

- koyu
- sinematik
- glow'lu
- premium
- etkileyici

### Hiyerarşi

- merkezde büyük alev
- hemen altında streak sayısı
- sayı ana kahramandır
- diğer bilgiler destekleyici seviyede kalır

### Dondurma Hakkı

- seri dondurma alanı korunur
- ayrı premium kart olarak görünür
- ikincil değil, değerli bir feature gibi sunulur

### Korunacak Veri Katmanları

- streak sayısı
- son 7 gün
- aylık görünüm
- mini istatistikler
- freeze hakları

Ama bunlar artık düz bilgi listesi gibi değil, tek bir sahnenin parçaları gibi görünmelidir.

## 10. Bileşen Anatomileri

### 10.1 Dashboard Habit Stack Card

İçerik:

- üst alan: outline ikon / hafif meta
- orta alan: isim
- görsel yüzey: şekil / derinlik / ton
- swipe ile renksel geri bildirim

### 10.2 Habit Overview Card

İçerik:

- sol üst: habit ikonu
- orta: habit adı
- ana alan: 30 günlük mini grid
- alt satır: kısa özet

### 10.3 Adaptive Navigation Bar

İçerik:

- tema duyarlı sıcak cam / grafit kapsül yüzey
- aktif sekme altında oyuk
- oyuğa oturan aktif orb
- featured center tools item

### 10.4 Result Deck

İçerik:

- en yeni sonucu önde tutan sönük mini Totem kartları
- tek tap alanı olarak çalışan Result Shelf
- öndeki karttan büyüyerek açılan bottom sheet
- sheet içinde merkez snap ile yatay gezilen büyük kartlar

### 10.5 Toast Feedback

İçerik:

- ekran üstünde görünür
- kısa süreli
- başarı / hata / kritik durumlarda kullanılır
- renk ve ikon ile anlam taşır

## 11. Durumlar ve Geri Bildirim

Luupi’de durumlar sürekli hissedilmelidir.

### Görünür Feedback Kanalları

- üst toast
- renk değişimi
- micro motion
- haptic
- ikon değişimi

### Görsel Durumlar

- tamamlandı
- bugün atlandı
- aktif
- featured
- disabled
- empty
- loading
- error

Bu durumlar aynı sistem mantığıyla çözülmelidir; sayfadan sayfaya değişen keyfi tasarımlar olmamalıdır.

## 12. Guardrail'ler

Luupi’de yapılmaması gerekenler:

- sayfalarda kopuk tasarım dili kullanmak
- farklı buton aileleri üretmek
- her ekranda başka bir interaction modeli kullanmak
- yüzeyleri sadece siyah / gri bırakmak
- yönetim aksiyonlarını her kart üstünde görünür butonlara boğmak
- rastgele bağımsız renk sistemi kullanmak
- tools sekmesini sıradan bir yan sekme gibi ele almak
- streak ekranını düz bilgi sayfasına çevirmek
- dashboard’ı tekrar sade listeye döndürmek

## 13. Uygulama Notları

- Tasarım sistemi mevcut tema token yapısıyla uyumlu büyümelidir.
- Dark mode tüm yeni işlerde varsayılan kalite çıtasıdır.
- Açık tema ikinci sınıf deneyim olmamalıdır; ancak ürün karakteri karanlık yüzey üstünde tanımlanır.
- Yeni UI parçaları tasarlanırken önce bu dokümandaki prensiplere uyum aranmalıdır.
- Bir bileşen farklı görünmek zorundaysa bile aynı ürün ailesinden geldiği hissedilmelidir.

## 14. Core Design System Uygulama Standardı

Bu bölüm yalnızca görsel yönü değil, yeni ekranların uyması gereken teknik sözleşmeyi tanımlar. Ortak kurallar `src/styles/design-system.css` ve `src/components/ui/` altında yaşar.

### 14.1 Renk Rolleri

- `brand-lime`: Luupi markası, ana CTA, featured Araçlar ve genel olumlu feedback
- `status-success`: tamamlanan alışkanlık ve kesin başarı durumu
- `status-skip`: bugün atlandı, red ve destructive durum
- `energy-amber`: streak, XP, ödül ve motivasyon
- `status-info`: bilgi veren nötr sistem mesajları
- habit renkleri: kategori kimliği; sistem durum renklerinin yerine kullanılmaz

Dark mode renk dengesi yaklaşık yüzde 70 nötr karanlık yüzey, yüzde 20 renk tonlu yüzey ve yüzde 10 güçlü highlight olarak kurulmalıdır. Aynı görünümde birden fazla birincil CTA yarışmamalıdır.

### 14.2 Tipografi Rolleri

- `type-display-xl`: büyük ödül anları ve hero sayıları
- `type-page-title`: sayfa başlığı
- `type-section-title`: bölüm başlığı
- `type-body`: ana okuma metni
- `type-label`: kontroller ve kısa vurgular
- `type-caption`: meta bilgi
- `type-metric`: tabular sayı kullanan sayaçlar

Yeni ekranlarda keyfi font-size ve font-weight değerleri üretmek yerine bu roller kullanılmalıdır. Metin için SF Pro Text, başlık ve büyük sayılar için SF Pro Display esastır.

### 14.3 Ortak Bileşen Sözleşmesi

- Butonlar `AppButton` üzerinden üretilir: `primary`, `secondary`, `tonal`, `quiet`, `destructive`.
- Kartlar `SurfaceCard` üzerinden üretilir: `base`, `raised`, `tinted`, `hero`; tıklanabilir kart otomatik olarak interactive davranır.
- Primary buton lime zemin ve koyu metin kullanır. Success rengi primary CTA yerine yalnızca sonuç durumunu anlatır.
- Ham `<button>` ve doğrudan `.glass` kullanımı yalnızca ortak primitive veya özel gesture yüzeyi için kabul edilir.
- Yeni sayfa ve bileşenlerde sabit hex renk yerine semantic token kullanılmalıdır.

### 14.4 Toast Feedback

- Tüm uygulama `ToastProvider` içindeki tek kuyruğu kullanır.
- Toast ekranın üstünde, safe area altında görünür.
- Standart olumlu toast lime olur; `skip`, `info`, `reward` ve `error` aynı anatomiyi paylaşır.
- Toast en fazla başlık ve tek kısa açıklama taşır; dokunularak erken kapatılabilir.
- Kritik toast, anlamına uygun haptic ile birlikte çalışır.

### 14.5 Motion ve Haptic

- hızlı press feedback: `120ms`
- standart UI geçişi: `220ms`
- navigasyon geçişi: `300ms`
- sheet ve toast girişi: `360ms`; sheet çıkışı: `240ms`
- normal sonuç hareketi: `420ms`
- kutlama hareketi: `520ms`
- giriş hareketi yumuşak ve fiziksel, çıkış hareketi daha kısa olmalıdır
- reduced-motion tercihinde loop ve dekoratif hareket durmalıdır

Haptic eşlemesi:

- seçim ve küçük değer değişimi: selection/light
- long press ve gesture eşiği: medium
- tamamlandı ve ödül: success
- bugün atlandı: warning
- başarısız kritik işlem: error

Tek aksiyon için birden fazla haptic tetiklenmemelidir. Web ortamında haptic servisi sessizce no-op çalışır.

## 15. Adaptive Navigation Uygulama Standardı

Luupi navigasyonu tüm ekran genişliklerinde alt tarafta yaşayan tek parça tema duyarlı kapsüldür. Açık temada sıcak kırık beyaz cam, koyu temada grafit yüzey kullanır; ayrı mobil, masaüstü veya tema anatomileri oluşturulmaz.

### 15.1 Ana Hedefler

Navigasyon sırası sabittir:

1. Bugün
2. Alışkanlıklar
3. Araçlar
4. Özet
5. Profil

Habit detayları Alışkanlıklar sekmesine; Ayarlar Profil sekmesine; Pomodoro, Just Start, Acele Yok, To-do, Uyandım, Su Takibi ve İstatistikler Araçlar sekmesine aittir. Alt sayfalarda da ilgili ana sekmenin orb'u aktif kalır.

### 15.2 Fiziksel Davranış

- Aktif sekmenin konumunda kapsül yüzeyden dairesel bir oyuk açılır.
- Lime aktif orb ve oyuk aynı motion eğrisiyle birlikte yatay hareket eder.
- Aktif orb'un arkasındaki büyük daire, orb ile aynı lime rengin tema duyarlı düşük opaklıklı halo katmanıdır; açık temada yaklaşık `%16`, koyu temada yaklaşık `%12` tint kullanır.
- Aktif ikon yukarı yükselir; pasif ikonlar tema yüzeyi üzerinde sessiz ama okunabilir kalır.
- Sekme değişiminde içerik geçiş yönü orb hareket yönüyle aynı olmalıdır.
- Aktif sekmeye yeniden dokunmak sayfayı yumuşak biçimde en üste taşır.

### 15.3 Featured Araçlar

- Araçlar her zaman üçüncü ve merkez hedeftir.
- Pasifken bile diğer ikonlardan biraz daha büyük, yükseltilmiş ve lime tonlu görünür.
- Aktifken standart aktif orb sistemine katılır; ayrı bir FAB veya farklı renk ailesi kullanmaz.
- Dokununca sayfadan kopuk yeni rota yerine nav'ın üzerinde yaşayan araç sheet'i açılır.
- Bir araç sayfasına girildiğinde sheet kapanır ancak merkez Araçlar orb'u aktif kalır.

### 15.4 Navigasyon ve Araçlar Tema Sözleşmesi

- Navigasyon ve Araçlar hub'ı aynı `--nav-*` ve `--tools-*` semantik token ailelerini kullanır; sabit koyu yüzey yazılmaz.
- Açık temada nav sıcak yarı saydam kapsül, hub sıcak cam sheet ve araç kartları beyaz taban üzerinde hafif accent tint kullanır.
- Koyu temada nav grafit kapsül, hub sinematik koyu sheet ve araç kartları renk tonlu koyu yüzey kullanır.
- Lime aktif orb, featured Araçlar kimliği ve araç accent renkleri iki temada da korunur; açık temada lime metin kontrastı koyu varyantla sağlanır.
- Scrim açık temada hafif, koyu temada güçlü karartma uygular; sheet, nav ve sayfa arasındaki katman ilişkisi değişmez.
- Selected, hover, pressed ve keyboard focus durumları brightness filtresine dayanmaz; border, tint, ring ve fiziksel scale kullanır.

### 15.5 Katman ve Güvenli Alan

- İçerik, alt bar ve cihaz safe area yüksekliği kadar otomatik boşluk taşır.
- Araç sheet'i barın üstünde biter; bar sheet açıkken görünür ve çalışır kalır.
- Toast navigasyondan, focus mode ise tüm app kabuğundan üst katmandadır.
- Pomodoro mini player gösterildiği durumlarda navigasyonun üstünde konumlanır ve onunla çakışmaz.

### 15.6 Feedback

- Normal sekme değişimi selection haptic kullanır.
- Featured Araçlar açma/kapama medium/light impact kullanır.
- Orb ve oyuk hareketi `300ms` spring eğrisiyle, sayfa geçişi aynı anda `300ms` enter eğrisiyle çalışır.
- Reduced-motion tercihinde konumlar animasyonsuz güncellenir.

## 16. Dashboard Uygulama Standardı

Dashboard klasik bir takip listesi değil, kullanıcının bugünkü alışkanlıkları hakkında istediği sırada karar verdiği fiziksel bir kart akışıdır. Ekranın birincil işi bütün bekleyen alışkanlıkları okunabilir bir deste içinde sunmaktır.

### 16.1 Günlük Durum Modeli

Her planlı alışkanlık gün içinde birbirini dışlayan üç durumdan birindedir:

- `pending`: ana destede karar bekler
- `completed`: sağa swipe ile tamamlanır
- `skipped`: sola swipe ile yalnızca bugün için atlanır

Tamamlanan veya atlanan kart ana desteden çıkar ve sonuç destesine iner. Sonucu geri almak kartı `pending` durumuna döndürür. Atlamak XP veya streak kazandırmaz; tamamlamak mevcut XP ve streak kurallarını işletir.

### 16.2 Ekran Hiyerarşisi

- Üstte `Bugün` başlığı ve alışkanlık ekleme aksiyonu bulunur.
- Seri, seviye ve işlenen kart sayısı küçük bir pulse rail içinde ikincil bilgi olarak kalır.
- Ekranın baskın alanı, bütün bekleyen kartların hafifçe üst üste bindiği dikey ve serbest destedir.
- Deste ayrı bir scroll alanı oluşturmaz; ana sayfanın doğal dikey akışıyla gezilir.
- İşlenen kartlar uzun listelere ayrılmaz; ana destenin altında tek bir sönük mini sonuç destesinde birleşir.
- Tüm kartlar işlendiğinde sayaç yerine kısa bir tamamlanma sahnesi görünür.

### 16.3 Kart Anatomisi

- üst satır: kategori ve bugünkü zaman durumu
- üst içerik: ikonun üzerinde alışkanlık adı ve tek satırlık meta bilgi
- merkez: görünür güvenli alanda büyük Luupi Totem yüzeyi
- alt örtüşme alanı: önemli bilgi veya kalıcı gesture metni taşımayan dekoratif güvenli bölge
- kategori rengi: kartın kimliği ve yüzey tonu
- success yeşili ve skip kırmızısı: yalnızca swipe kararının anlık durum geri bildirimi

Kart tek elle rahat kullanılacak kadar büyük, fakat alt navigasyonu veya sonuç destesini gereksiz yere itmeyecek kadar kontrollü olmalıdır. Uzun isimler en fazla iki satırda güvenli biçimde kısaltılır.

Luupi Totem sistemi beş ortak silüetten oluşur: `pebble`, `arch`, `capsule`, `wedge`, `bloom`. Silüet habit kimliğinden deterministik seçilir; outline habit ikonu şeklin önünde yükselen karakter katmanı olarak görünür. Kart yüzeyi kategori renginden türeyen taban, üst ışık ve fiziksel alt kenar katmanlarını birlikte kullanır.

### 16.4 Swipe Sözleşmesi

- sağa sürükleme miktarı kadar success katmanı görünür ve kart yeşile yaklaşır
- sola sürükleme miktarı kadar skip katmanı görünür ve kart kırmızıya yaklaşır
- status ikonu hareket eden kartın içinde değil, kartın arkasındaki sabit aksiyon zemininde kalır
- eşik kart genişliğine göre hesaplanır; hızlı ve niyetli flick hareketi velocity ile tamamlanabilir
- karar eşiği geçildiğinde yalnızca bir kez medium haptic verilir
- eşik altında bırakılan kart yaylı hareketle yerine döner ve veri değişmez
- destedeki her kart bağımsız swipe edilebilir; dokunma, focus ve sürükleme kartın deste katmanını değiştirmez
- arkadaki bir kart sürüklendiğinde önündeki kartların altından geçmeye devam eder
- kartlar alt kenarları desteye oturan, üst kenarları kullanıcıya yaklaşan ortak bir `-7deg` 3D eğim taşır
- işlem gören kart yatay çıkarken kendi dikey slotu kapanır ve deste boşluğu akıcı biçimde doldurur
- kart işlendikten sonra sayfa kullanıcının mevcut scroll konumunu korur; başka karta otomatik odaklanmaz
- kart üzerinde başlayan belirgin dikey niyet sayfa scroll'unu sürdürür; yatay niyet kilitlendikten sonra scroll gesture'ı devralmaz
- klavye ve yardımcı teknoloji için sağ/sol ok eşdeğerleri korunur

### 16.5 Sonuç Destesi ve Sheet

- mini destede en son işlenen kart önde görünür
- mini deste yatay liste satırları değil, en fazla üç katmanlı `Result Shelf` yüzeyidir
- arka kartların yüzeyi sönükleşir; status damgası, habit adı ve `✓` / `×` keskin kalır
- completed kartta `✓`, skipped kartta `×` açıkça okunur
- mini desteye dokunmak sonuç bottom sheet'ini açar
- öndeki mini kart FLIP geçişiyle sheet içindeki ilk büyük kartın konumuna büyür
- sheet içindeki büyük kartlar yatay scroll ve snap ile gezilir
- aktif kart merkezde tam ölçekte; komşular daha küçük ve daha düşük doygunlukta görünür
- aktif sonuç `n / toplam` göstergesi, page indicator ve selection haptic ile takip edilir
- her sonuç kartı durumunu, karar saatini ve `Ana desteye geri al` aksiyonunu taşır
- undo sonrası aktif kart kimliği korunur ve en yakın kalan karta geçilir
- geri alma tek bir info toast ve tek bir light haptic ile onaylanır
- sheet focus trap, sağ/sol klavye navigasyonu ve tetikleyiciye focus dönüşü sağlar

### 16.6 Durumlar ve Erişilebilirlik

- hiç alışkanlık yok, bugün planlı alışkanlık yok ve tüm kartlar işlendi durumları ayrı sahneler kullanır
- kart gesture'ı metinsel `aria-label` ile açıklanır; sonuç sheet'i modal semantiği ve Escape ile kapatmayı destekler
- light ve dark mode kart paletleri kategori renginden türetilir; sabit açık tema yüzeyleri kullanılmaz
- reduced-motion tercihinde swipe sonucu korunur ancak dekoratif geçişler anlık hale gelir

## 17. Alışkanlıklar Overview Uygulama Standardı

Alışkanlıklar sayfası yönetim listesi değil, kullanıcının bütün habitlerini ve yakın dönem ritmini tek bakışta gördüğü portföy ekranıdır. Sayfa başlığından sonra ayrı bir summary hero kullanmadan doğrudan kart galerisine geçilir.

### 17.1 Grid ve Kart Anatomisi

- kartlar telefon dahil iki sütunlu grid içinde gösterilir
- kart üstünde habit kimliğini taşıyan outline ikonlu Totem, en fazla iki satırlık isim ve kategori bulunur
- kartın ana alanı soldan sağa ve yukarıdan aşağıya ilerleyen `6 × 5` son 30 gün grid'idir
- kart altında `n tamamlandı · n atlandı` özeti yer alır
- habit rengi kart yüzeyini ayırır; günlük durum renklerinin yerine geçmez

### 17.2 Günlük Durumlar

- `completed`: success yeşiliyle dolu kare
- `skipped`: skip kırmızısıyla dolu kare
- `pending`: bugünü gösteren amber çerçeveli nötr kare
- `off`: recurrence gereği planlı olmayan sessiz kare
- `before-created`: habit oluşturulmadan önceki boş kare

Geçmişte planlanmış ve mantıksal gün kapanana kadar tamamlanmamış günler overview performansında `skipped` sayılır. Bugün, kullanıcının gün bitiş saati dolmadan başarısız sayılmaz. Plan dışı ve oluşturulma öncesi günler özete dahil edilmez.

### 17.3 Etkileşim

- normal tap Habit Detail ekranını açar
- `450ms` long press kartı hafifçe sıkıştırır, hold progress'i tamamlar, medium haptic verir ve yönetim sheet'ini açar
- parmak `10px` üzerinde hareket ederse long press iptal edilir ve dikey scroll korunur
- masaüstünde sağ tık; klavyede `Shift+F10` ve context-menu tuşu aynı sheet'i açar
- düzenle ve sil aksiyonları kart yüzeyinde görünmez; yalnızca yönetim sheet'inde bulunur

### 17.4 Yönetim ve Erişilebilirlik

- silme işlemi semantic destructive buton kullanan ortak onay sheet'inden geçer; güvenli `Vazgeç` aksiyonu ilk focus'u alır
- özel kategori yönetimi habit grid'inin altında ikinci bir liste oluşturmaz; başlık menüsünden açılan sheet'te yaşar
- kart grid'i 30 ayrı focus hedefi üretmez; ekran okuyucu kart adını ve performans özetini tek cümlede okur
- sheet ve dialog başlangıç focus'u, focus trap, Escape ile kapatma ve tetikleyiciye focus dönüşünü destekler
- reduced-motion tercihinde kart girişleri ve sheet hareketleri anlık hale gelir

## 18. Profil Uygulama Standardı

Profil bir hesap ayarları formu veya ikinci bir İstatistikler ekranı değildir. Kullanıcının disiplin kimliğini, oyunlaştırma ilerlemesini ve kazandığı başarımları tek bakışta gösteren kişisel vitrindir.

### 18.1 Ekran Hiyerarşisi

- üstte kompakt `Profil` başlığı ve ikincil Ayarlar aksiyonu bulunur
- ana hero, kullanıcının seviyeye göre gelişen Luupi Totem'ini, seviyesini ve mevcut XP ilerlemesini taşır
- kullanıcı özel bir isim belirlemediyse jenerik `Luupi Kullanıcısı` metni gösterilmez; `Luupi yolculuğu` kimliği kullanılır
- güncel seri, en uzun seri ve aktif gün sayısı tek momentum yüzeyinde birleşir
- başarımlar; öne çıkan rozet, yatay kazanılmış rozet rafı ve en yakın üç hedef sırasıyla sunulur
- tüm zamanlar alanı yalnızca tamamlanan habit, odak süresi, Pomodoro ve aktif gün metriklerini taşır
- ayrıntılı analiz İstatistikler'e; tema, isim, bildirim ve veri yönetimi Ayarlar'a bırakılır

### 18.2 Oyunlaştırma ve Renk

- XP, seviye, seri ve rozetler aynı anda eşit ağırlıkta yarışmaz; birincil ilerleme göstergesi seviye hero'sudur
- amber/orange enerji ve ödül alanlarını, lime güncel ilerlemeyi ve ana vurguyu temsil eder
- profil genel dark-mode dengesini korur: yaklaşık `%70` nötr, `%20` renk tonlu yüzey, `%10` güçlü highlight
- sabit tema renkleri veya sayfaya özel rastgele hex değerler kullanılmaz
- seviye Totem'i `1–4`, `5–9`, `10–19` ve `20+` bantlarında görsel olarak gelişir

### 18.3 Başarım Sistemi

- kazanılan rozetler kilitli rozetlerden görsel ve anlamsal olarak ayrılır
- ana sayfada bütün rozetlerin uzun listesi gösterilmez
- sıradaki hedefler ölçülebilir mevcut/ hedef değeri ve progress bar taşır
- rozet dokunuşu detay bottom sheet'ini açar; sheet kazanılan ve hedef rozetlerini filtreler
- ölçülemeyen özel olay rozetleri koşul metniyle gösterilir, sahte yüzde üretilmez
- mevcut rozet ID'leri ve storage modeli korunur

### 18.4 Veri ve Etkileşim

- tüm zamanlar odak süresi ve Pomodoro sayısı hem habit bağlantılı hem serbest seansları içerir
- aktif gün, en az bir habit tamamlanan veya odak seansı yapılan benzersiz gün sayısıdır
- seviye hero'suna dokunmak seviye detayını, momentum yüzeyine dokunmak Seri Merkezi'ni açar
- rozet, hedef ve yönlendirme dokunuşları selection/light haptic kullanır
- rozet sheet'i focus trap, Escape, tetikleyiciye focus dönüşü ve indicator üzerinden aşağı çekerek kapatmayı destekler
- reduced-motion tercihinde ring sweep, sheet ve kart geçişleri anlık hale gelir; veri davranışı değişmez

## 19. Ayarlar Uygulama Standardı

Ayarlar, Profil sekmesine ait sistem ekranıdır. Luupi'nin karakterini korur ancak oyunlaştırma vitrini veya araç dashboard'u gibi davranmaz; temiz, güvenilir ve hızlı anlaşılır olmalıdır.

### 19.1 Bilgi Mimarisi

- ekran gerçek bir `Ayarlar` başlığı ve kısa açıklamayla başlar
- ayarlar beş grupta toplanır: Kişiselleştirme, Günlük Ritim, Bildirimler, Araç Tercihleri, Veri ve Gizlilik
- her ayar ayrı cam karta dönüşmez; bölüm başına tek yüzey ve divider'lı ortak satırlar kullanılır
- profil adı formu ana sayfada sürekli açık kalmaz, dokunmayla açılan düzenleme sheet'inde yaşar
- Pomodoro ve Su Takibi ayrıntıları tekrar edilmez; özet satırı ilgili aracın bağlamsal ayarını açar

### 19.2 Kontrol ve Feedback

- toggle, segmented selector, disclosure row ve destructive row bütün sayfalarda ortak anatomi kullanır
- tema, ses, bildirim ve gün kapanışı tercihleri anında kaydedilir; ayrı genel `Kaydet` butonu kullanılmaz
- küçük seçimler selection/light haptic ve anlamına uygun üst toast ile onaylanır
- seçili kontrol lime; günlük ritim amber; izin durumu info; destructive işlem yalnızca skip kırmızısı kullanır
- bildirim toggle'ları izin yokken pasif kalır ve kullanıcıya nedenini açıklayan izin yüzeyi gösterilir
- günlük özet metni sabit `00:00` yazmaz, seçilen gün kapanış saatini yansıtır

### 19.3 Veri Güvenliği

- yedek dosyası mevcut veriye yazılmadan önce uygulama kimliği, tarih, şema ve bilinen veri tipleri açısından doğrulanır
- geçerli yedek önce tarih, sürüm ve bölüm sayısı gösteren confirmation sheet'inde özetlenir
- içe aktarma ve tam sıfırlama bekleyen native bildirimleri temizler
- tam sıfırlama alışkanlık, XP, araç geçmişi, tema ve diğer Luupi tercihlerini kapsar
- destructive sıfırlama inline genişlemez; ayrı confirmation sheet ve semantic destructive CTA kullanır
- yedek ve reset sheet'leri focus trap, Escape, focus dönüşü ve indicator üzerinden aşağı çekerek kapatmayı destekler

### 19.4 Görsel Denge ve Erişilebilirlik

- ayarlar ekranı nötr yüzey ağırlıklı kalır; yalnızca bölüm kimliği ve seçimlerde kontrollü renk kullanılır
- ham hex renk, eski `glass` kart veya bağımsız buton ailesi kullanılmaz
- bütün kontroller erişilebilir isim, switch/radio semantiği ve yeterli dokunma alanı taşır
- import hataları ve ayar sonuçları `ToastProvider` üzerinden `status` veya `alert` olarak duyurulur
- reduced-motion tercihinde segmented, toggle ve sheet hareketleri anlık hale gelir; ayar sonucu değişmez

## 20. Alışkanlık Oluşturma ve Düzenleme Standardı

Alışkanlık oluşturma, hazır kart seçme ve mevcut kartı düzenleme ayrı ürünler gibi davranmaz. Bütün yollar aynı Habit Composer'a ulaşır; preset yalnızca düzenlenebilir bir başlangıç verisidir.

### 20.1 Akış ve Bilgi Mimarisi

- `+ Ekle`, çalışan drag indicator'a sahip `Yeni alışkanlık` bottom sheet'ini açar
- ayrı chooser kullanılmaz; `Kendin oluştur` aksiyonu ve kategori filtreli hazır kartlar aynı kütüphanede bulunur
- hazır karta tek dokunuş ortak Composer'ı açar; ikinci bir `Seç` onayı istenmez
- preset kimliği kilitlenmez; ad, ikon, kategori, ritim, hedef, zaman ve kart tonu tamamen düzenlenebilir
- Composer sırası `Kimlik`, `Ritim`, `Tamamlama`, `Zaman`, `Kart tonu` olarak sabittir
- habit kartının normal dokunuşu detaya, `450ms` long press'i yönetim sheet'ine gider; düzenleme yalnızca bu sheet'ten açılır

### 20.2 Composer Davranışı

- sheet üstünde ad, ikon, recurrence ve kategori tonuyla canlı güncellenen kompakt kart önizlemesi bulunur
- ana kaydetme CTA'sı scroll'dan bağımsız sticky footer'da kalır; aynı görünümde ikinci primary CTA yarışmaz
- haftalık recurrence tek ve açıkça seçilen bir gün; belirli günler recurrence'ı bir veya daha fazla gün gerektirir
- saat aralığı kapalı başlar; açıldığında başlangıç bitşten önce olmalıdır ve kapatılması mevcut bildirimi gerçekten temizler
- Pomodoro uyumsuz kategori seçiminde mod sessizce değiştirilmez; neden açıklanır ve kaydetmeden önce kullanıcıdan düzeltme istenir
- kart rengi rastgele seçilmez; kategori ailesinden türetilen kontrollü tonlardan gelir
- değiştirilmiş taslak kapatılırken kayıp açıkça onaylatılır; kütüphane ile Composer arasında dönüşte taslak korunur

### 20.3 Feedback ve Erişilebilirlik

- küçük seçimler selection/light haptic; başarılı oluşturma ve düzenleme tek success toast + success haptic kullanır
- form hataları ilgili kontrolün yakınında inline ve Türkçe olarak açıklanır; geçersiz form kaydedilemez
- sheet focus trap, Escape, tetikleyiciye focus dönüşü ve indicator üzerinden aşağı çekerek kapatmayı destekler
- aramalı ve gruplu ikon seçici yalnızca küratörlü registry'yi gösterir; ikon ve renk seçenekleri erişilebilir ad ve seçili durum taşır
- reduced-motion tercihinde sheet, disclosure ve seçim geçişleri anlık hale gelir; veri davranışı değişmez

## 21. Toast ve Feedback Standardı

Luupi feedback sistemi aksiyonun sonucunu gecikmeden, ekranı kapatmadan ve aynı olaya ikinci bir haptic eklemeden anlatır. Uygulamanın tamamı safe area altında yaşayan tek `ToastProvider` kuyruğunu kullanır.

### 21.1 Semantik Dil

- `success`: tamamlama, başarıyla kaydetme ve hedefe ulaşma; lime
- `info`: kalıcı fakat nötr durum veya ayar değişikliği; mavi/cyan
- `warning`: bugün atlama, bilinçli bırakma ve destructive sonuç; sıcak amber/coral
- `error`: işlemin gerçekleşmemesi veya verinin okunamaması; sistem kırmızısı
- `reward`: XP, rozet, seri dondurma ve gerçek ödül anı; amber/orange
- başlık sonucu doğrudan söyler, açıklama başlığı tekrar etmez; hata metni mümkünse sonraki adımı belirtir

### 21.2 Anatomi ve Motion

- aynı anda yalnızca bir feedback kapsülü gösterilir; kapsül maksimum `420px` genişliktedir
- semantik sistem ikonu her zaman korunur; habit veya araç bağlamı gerekiyorsa ilgili outline ikon küçük context badge olarak gösterilir
- tone etiketi, tek güçlü başlık, en fazla iki satır açıklama, opsiyonel action ve erişilebilir kapatma kontrolü ortak anatomiyi oluşturur
- alt accent çizgisi kalan süreyi gösterir; hover, klavye focus'u ve dokunma sırasında süre durur
- nötr gövdeye dokunmak veya yukarı swipe toast'ı kapatır; action dokunuşu dismiss gesture'ına dönüşmez
- giriş `360ms` kısa mesafe + hafif scale, çıkış `200ms` yukarı fade kullanır; reduced-motion modunda hareket anık olur

### 21.3 Süre, Kuyruk ve Haptic

- kısa sonuç `2800ms`, açıklamalı sonuç `3800ms`, hata/ödül `4500ms`, action taşıyan feedback en az `6000ms` görünür
- aktif toast sırasını tamamlar; bekleyenler `error`, `reward`, `warning`, `success`, `info` önceliğiyle dizilir
- kuyruk en fazla dört kayıt tutar, aynı `dedupeKey` tekrar eklenmez ve bayat bekleyen mesajlar gösterilmez
- terminal haptic'in sahibi varsayılan olarak provider'dır: success/reward `success`, warning `warning`, error `error`, info `light`
- gesture eşiği veya başlatıcı kontrol zaten haptic verdiyse ilgili toast `haptic: none` kullanır; aynı aksiyon iki haptic üretmez
- geri alınabilir habit, görev ve su kararları standart `Geri Al` action'ı kullanır; alan validasyonu toast yerine ilgili kontrolün yanında gösterilir

### 21.4 Erişilebilirlik

- error `alert/assertive`, diğer tone'lar `status/polite` olarak duyurulur ve focus zorla toast'a taşınmaz
- metin yalnızca parent `aria-label` içine düzleştirilmez; başlık, açıklama ve action gerçek semantiklerini korur
- kapatma kontrolü görsel olarak sakin olsa da en az `44px` dokunma alanı taşır
- action focus aldığı sürece otomatik kapanma durur; klavye kullanıcısı aksiyonu zaman baskısı olmadan çalıştırabilir
