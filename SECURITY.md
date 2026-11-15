# Güvenlik notları

- Uygulama istemci tarafında çalışır; NASA Image and Video Library araması ve NASA'nın indirilebilir 3D modelleri için API anahtarı gerekmez.
- `.env`, `.env.*` ve Vercel yerel ayarları Git dışında kalmalıdır. `.env.example` oluşturulacaksa yalnızca boş örnek değişken adları içermeli, gerçek değer içermemelidir.
- Bir token istemci koduna veya herkese açık Git deposuna girdiyse, dosyadan/commit'ten kaldırmanın ötesinde sağlayıcının panelinden hemen iptal edilmelidir. Git geçmişinde kalan kopyalar da kullanılabilir.
- Gelecekte sunucu tarafı gizli anahtar gerekirse, sadece sunucu işlevinde, en az izinli kapsamla ve sağlayıcının ortam değişkeni deposunda tutulmalıdır. Tarayıcıya gönderilen `PUBLIC_`, `NEXT_PUBLIC_` benzeri değişkenler gizli değildir.
- Kullanıcıdan tokenı sohbet, ekran görüntüsü, issue veya log ile paylaşması istenmemelidir. Gizli değer içeren yerel ayar dosyaları paylaşılmamalıdır.
