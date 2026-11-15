# Offworld Archive

NASA Space Apps 2026 için Ay ve Mars yüzeyinde bırakılmış insan yapımı izleri araştıran etkileşimli dijital arşiv. Arayüz, koyu görev-kontrol panellerini gerçek bir 3B gezegen küresiyle birleştirir.

## MVP

- Ay ve Mars arasında geçiş yapılan küre haritası: fareyle sürükle/döndür, tekerlekle yakınlaştır, `+ / −` ile ölçeği değiştir.
- Uzak görünümde gerçek NASA LRO WAC Ay mozaiği ve Viking Mars renk mozaiği kullanılır; yakınlaşınca izohips görünümü yumuşakça öne çıkar. Harita başlangıçta Ay'ın yakın yüzünü/Mars'ı tanınabilir biçimde gösterir.
- Yakınlaştırma `0.72×–16×` aralığındadır. Yakın planda NASA Trek'ten yalnızca ekranın merkezindeki 6×4 karo bölgesi alınır; harita sürüklenince veya ayrıntı seviyesi değişince yeni bölge yüklenir. Karo istekleri tarayıcı belleğinde sınırlı tutulur. Ağ/kaynak hatasında yerel küresel harita çalışmaya devam eder.
- Ay'daki büyük maria ve krater adları ile Mars'taki Olympus Mons, Valles Marineris ve önemli krater/sahalar yeterince yaklaşınca ince holografik etiket olarak görünür.
- Yüzey yüksekliği NASA Trek DEM verisinden türetilen gezegene özgü renkler, rölyef gölgesi ve ince/kalın izohipslerle gösterilir. Mesh satırları güvenli 16-bit parçalara bölünür; önceki yatay bant aralığı giderilmiştir. Gölgeleme yer şekillerini belirginleştirir; enlem-boylam ızgarası kullanılmaz.
- Sol sabit menü kaldırıldı; üstteki **Arşiv** düğmesi arama, tür filtresi ve tüm kayıtları gerektiğinde açar. Ay/Mars geçişi ve TR/EN arayüz seçimi harita üzerinde bulunur.
- NASA'nın tarihî Ay kayıtları ile Mars yüzeyine ulaşan araçlar listelenir. Faal araçlar yeşil, görevi tamamlananlar kırmızı gösterilir; koordinat güveni ayrı olarak bilgi kartında belirtilir. Rover pinleri son araç konumu değil, aksi doğrulanmadıkça görev/iniş sahasıdır.
- Koordinatı bilinmeyen kayıtlar katalogda yer alır fakat haritada pin üretilmez; yaklaşık konumlar bilgi kartında açıkça işaretlenir.
- Sunucu tarafı yoktur. NASA Image and Video Library'den seçilen kayıt için görsel istenir; NASA'nın yayımladığı web 3D modelleri uygun kayıtlarda bilgi kartında açılır. Uygulama için API anahtarı kullanılmaz.
- Uzay katmanında HYG v4.1 kataloğundan 5.071 yıldız gerçek gökyüzü konumlarına göre çizilir. İmleç alanında eklenen daha sönük yoğun yıldız dokusu görsel amaçlı prosedürel bir katmandır; katalog koordinatı olarak sunulmaz. JPL Horizons'tan alınmış tarih damgalı vektörler Mars sahnesi için Phobos/Deimos'u ve Ay/Mars çevresinden görülen Güneş ile sekiz gezegeni sahneye yerleştirir. Gökcisimleri normal boyutlarına göre çok küçük oldukları için görünürlük amacıyla yalnızca adları yazılır; veri dosyasında mesafe ve konum ölçeği korunur. Ay görünümünde arka plan gökyüzü 40° kompozisyon açısıyla sunulur.
- Arka plan gökcisimleri fiziksel doğrultularına göre küreyle örtüşür; yüzeyin arkasında kalan cisim çizilmez. Görünen gezegen ve uydu adları küçük, soluk yazıyla verilir; ikon/parlama kullanılmaz.
- İmleç yıldız alanına geldiğinde 18.000 noktalı sönük yıldız dokusu yumuşakça belirir; görünür halka, renkli hale veya yoğun ışık patlaması yoktur. Nokta rengi ve ince parıltı yıldız tayfına benzer biçimde değişir.
- Ay yüzey ağında LOLA/MOLA yükselti örnekleri 5×5 Gauss filtresiyle yumuşatılır ve Ay relief derinliği azaltılır; Mars yükselti renk rampası yeniden doygun kızıl-turuncu tonlara çekilmiştir. Harita pinleri topoğrafik yüzey yarıçapına oturur ve kürenin arka tarafında gizlenir.
- Yakınlaştırma 4,3× seviyesini geçince sağ bilgi kartında gerçek renk mozaiğinden türetilen küçük yön küresi ve merkez koordinatı belirir. Tekerlek yakınlaştırması imleç altındaki yüzeyi sabitler; `+ / −` ekran merkezine odaklanır.
- Bilgi kartı, NASA'nın açık görsel arşivinden kayıtla eşleşen fotoğrafı getirir. NASA'nın web için yayımladığı Apollo Lunar Module, Perseverance, InSight ve Ingenuity 3D modelleri seçilen kayıt kartında sürüklenebilir olarak açılır; diğer kayıtlar NASA fotoğrafı gösterir. Modeller ana küreye ayrı bir WebGL sahnesi ekleyerek yüzeyle örtüşme ve performans sorunları yaratacağından konum işaretçilerinin yerine konmaz.
- Sayfa ilk açılırken özel nokta-yörünge amblemi kısa süre görünür. Alt banttaki özgün Offworld Archive amblemi NASA Space Apps atfıyla birlikte kullanılır; NASA logosu değildir.

İzohipsler Ay için LOLA 128 ppd, Mars için MOLA 463 m/piksel sayısal yükseklik modellerinden hesaplanır. Yükselti atlasları 4096×2048 pikseldir ve küre geometrisi 0,5° aralıkla örneklenir. Yakın plandaki renkli görüntü NASA Trek WMTS karolarından gelir; topoğrafik kontur çizgilerinin çözünürlüğü yerel LOLA/MOLA atlasıyla sınırlıdır. Arayüz yakınlaştırması kaynak çözünürlüğünü yapay olarak artırmaz.

## Yerelde çalıştırma

Gizli yerel dosyaları (ör. `.env.local`) web üzerinden açmayan sunucuyu proje klasöründe başlat:

```bash
python3 scripts/serve-local.py --port 4173
```

Sonra `http://localhost:4173` adresini aç. Diğer portu tercih edersen `--port 3000` kullan. Sunucu yalnızca bu bilgisayarda dinler, gizli dosya yollarını reddeder ve klasör listelemesini kapatır. Sayfayı `file://` ile açma; görsel varlıklar sunucu üzerinden yüklenir. Küresel başlangıç görüntüleri ve DEM'ler projeyle gelir. Yakın plan görüntü karoları tarayıcıdan herkese açık NASA Trek servisine istek gönderir; herhangi bir token kullanılmaz.

## Vercel

1. Değişiklikleri gözden geçirip GitHub'a gönder.
2. Vercel'de **Add New → Project** ile `uygaryildirim/offworld-archive` deposunu içe aktar.
3. Framework preset'i **Other** seç; Build Command ve Output Directory boş kalsın.
4. Deploy et. Uygulama için gizli API anahtarı veya ortam değişkeni gerekmez.
5. Alan adı bağlamak istersen Vercel proje ayarlarından ekleyebilirsin. Alan adı satın alma ayrı bir işlemdir.

## NASA Space Apps challenge kaynakları

Challenge'ın [Resources sekmesi](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/?tab=resources), NSSDCA'yı ana katalog olarak gösteriyor; Apollo iniş aşamaları, Lunar Roving Vehicles, ALSEP ve Surveyor görevleri için Ay kayıtlarını; Sojourner, Spirit & Opportunity, Viking 1 & 2, Phoenix & InSight ve Ingenuity için Mars kaynaklarını veriyor. Ay kataloğu, NASA NSSDCA'nın koordinatlı ve koordinatsız bilinen iniş/çarpma kayıtlarıyla genişletildi. Mars listesinde tarihî yüzey araçları ve görev donanımına ek olarak Pathfinder/rover iniş platformu, Mars Polar Lander, Deep Space 2 penetratörleri ve güncel Curiosity/Perseverance yer alıyor. Katalogda pin bulunmaması kaydın çıkarıldığı anlamına gelmez; doğrulanmış konum bulunmadığında kasıtlı olarak pin gösterilmez.

## Veri kaynakları ve atıf

- [NASA Space Apps 2026 — challenge Resources](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/?tab=resources)
- [NASA NSSDCA — Ay'daki antropojenik etkiler ve iniş koordinatları](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html)
- [NASA NSSDCA — Apollo Lunar Modules](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C), [Lunar Roving Vehicles](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C) ve [ALSEP](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C)
- [NASA Moon Trek](https://trek.nasa.gov/moon/) — LOLA küresel DEM, 128 ppd
- [NASA Mars Trek](https://trek.nasa.gov/mars/) — MOLA küresel DEM, 463 m/piksel
- [NASA Moon Trek — LRO WAC Global Mosaic v02](https://trek.nasa.gov/moon/) — Ay'ın optik yüzey mozaiği
- [NASA Mars Trek — Viking MDIM21 Color Mosaic](https://trek.nasa.gov/mars/) — Mars'ın küresel renkli yüzey mozaiği
- [NASA Trek WMTS katman kataloğu ve erişim biçimi](https://trek.nasa.gov/tiles/apidoc/trekAPI.html)
- [JPL Horizons — konum/velocity vector API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) — `assets/space-ephemeris.js` için anlık görüntü verisi
- [JPL Horizons — koordinat çerçeveleri ve vektör referansı](https://ssd.jpl.nasa.gov/horizons/manual.html)
- [NASA Image and Video Library API](https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf) — karttaki görev görselleri; istemci tarafı arama, anahtarsız erişim ve NASA görsel atfı.
- [NASA 3D Resources](https://science.nasa.gov/3d-resources/) — kartta açılan [Apollo Lunar Module](https://science.nasa.gov/3d-resources/apollo-lunar-module/), [Perseverance](https://science.nasa.gov/3d-resources/mars-2020-perseverance-rover/), [InSight](https://science.nasa.gov/3d-resources/insight-cruise-lander/) ve [Ingenuity](https://science.nasa.gov/3d-resources/ingenuity-mars-helicopter/) modelleri.
- [HYG Database v4.1](https://github.com/astronexus/HYG-Database) — yıldız koordinatları, parlaklık ve renk verisi; [CC BY-SA 4.0](https://github.com/astronexus/HYG-Database/blob/master/LICENSE) lisanslı türetilmiş katalog (`assets/stars.js`). Atıf ve dönüşüm notu: [assets/stars-ATTRIBUTION.txt](./assets/stars-ATTRIBUTION.txt).
- [NASA — Mars iniş sahaları](https://science.nasa.gov/planetary-science/programs/mars-exploration/mission-timeline/how-we-land-on-mars/)

Harita varlıkları `assets/maps/` altında statik kopya olarak tutulur. Başlangıç mozaiklerini yeniden indirmek/oluşturmak için Node.js, ImageMagick, `curl` ve NASA Trek'e internet erişimi gerekir; `node scripts/build-imagery.mjs` çalıştır. DEM atlasını `node scripts/build-basemaps.mjs` ile oluştur. Yıldız kataloğunu güncellemek için `python3 scripts/build-star-catalog.py`, JPL konumlarını yenilemek için `python3 scripts/build-space-ephemeris.py` çalıştır; iki betik de herkese açık kaynakları kullanır, token istemez ve yerel `assets/` çıktısını yeniler. JPL gök cismi konumları dosyanın oluşturulduğu saate ait anlık görüntüdür; yıldızlar J2000 kataloğundan gelir. Yakın plan karoları uygulama açıkken NASA Trek WMTS'den gelir. Kaynak katman kimlikleri ve karo adresleri uygulama kodunda/betikte bulunur. Kaynak veriler NASA/JPL ve ilgili bilim ekiplerine aittir; proje NASA tarafından onaylanmamıştır.

## Güvenlik

Bu MVP hiçbir gizli anahtar kullanmaz. NASA'nın görsel arama servisi ve indirilebilir 3D içerikleri herkese açık kaynaklardır. `.env.local`, `.env` veya gerçek anahtar içeren başka bir dosyayı Git'e ekleme. Bir anahtar yanlışlıkla yayımlanırsa dosyadan ve commit'ten kaldırmaya ek olarak sağlayıcı panelinden iptal et; Git geçmişindeki kopyalar da kullanılabilir. Ayrıntı: [SECURITY.md](./SECURITY.md).
