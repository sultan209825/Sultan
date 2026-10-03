import JSZip from 'jszip';

export async function generateFullApplicationSourceZip(): Promise<Blob> {
  // 1. First attempt: fetch pristine build archive directly from backend
  try {
    const apiRes = await fetch('/api/download-infinityfree-zip');
    if (apiRes.ok) {
      const blob = await apiRes.blob();
      if (blob.size > 1000) {
        return blob;
      }
    }
  } catch (err) {
    console.warn('Backend ZIP endpoint unreachable, using client-side generator', err);
  }

  // 2. Client-side generator fallback
  const zip = new JSZip();

  // Try fetching index.html
  let indexHtml = '';
  try {
    const resHtml = await fetch('/index.html');
    indexHtml = await resHtml.text();
  } catch {
    indexHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Sultan Site</title></head><body><div id="root"></div></body></html>';
  }

  // Ensure relative paths for any directory on InfinityFree
  const cleanIndexHtml = indexHtml
    .replace(/src="\/assets\//g, 'src="./assets/')
    .replace(/href="\/assets\//g, 'href="./assets/')
    .replace(/src="\/songs\//g, 'src="./songs/')
    .replace(/src="\/og-image\.png"/g, 'src="./og-image.png"');

  zip.file('index.html', cleanIndexHtml);

  // Add InfinityFree PHP Bot API endpoint
  try {
    const phpRes = await fetch('/api_discord_assign.php');
    if (phpRes.ok) {
      zip.file('api_discord_assign.php', await phpRes.text());
    }
  } catch {}

  // Add .htaccess for InfinityFree
  const htaccess = `# ========================================================================
# 👑 ملف ضبط استضافة InfinityFree لسيرفر وموقع السلطان (htdocs)
# ========================================================================
Options -Indexes
DirectoryIndex index.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ index.html [L]
</IfModule>

<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/png "access plus 1 month"
  ExpiresByType image/jpeg "access plus 1 month"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType audio/mpeg "access plus 1 month"
</IfModule>
`;
  zip.file('.htaccess', htaccess);

  // Add Songs from public/songs
  const songFiles = ['sultan-1.mp3', 'sultan-2.mp3', 'sultan-3.mp3', 'sultan-4.mp3', 'sultan-5.mp3'];
  for (const sf of songFiles) {
    try {
      const sRes = await fetch(`/songs/${sf}`);
      if (sRes.ok) {
        zip.file(`songs/${sf}`, await sRes.blob());
      }
    } catch {}
  }

  // Add og-image.png
  try {
    const imgRes = await fetch('/og-image.png');
    if (imgRes.ok) {
      zip.file('og-image.png', await imgRes.blob());
    }
  } catch {}

  // Add Clear instructions in Arabic for InfinityFree
  const instructions = `========================================================================
👑 موقع السلطان الرسمي - طريقة رفع الملفات على استضافة InfinityFree
========================================================================

الخطوات البسيطة جداً لتشغيل موقعك 100%:

1. فك الضغط عن هذا الملف (sultan-exact-studio-app.zip) على جهازك أو هاتفك.
2. ادخل على لوحة تحكم InfinityFree الخاصة بك:
   - افتح File Manager (مدير الملفات).
   - ادخل إلى مجلد: htdocs
   - احذف أي ملف افتراضي قديم بالداخل (مثل default2.html إن وجد).
3. ارفع جميع محتويات هذا المجلد مباشرة داخل htdocs:
   - index.html
   - .htaccess
   - مجلد assets
   - مجلد songs
   - og-image.png
   - api_discord_assign.php (يقوم بتفعيل رتب الديسكورد تلقائياً على InfinityFree!)

4. مبروك! افتح رابط موقعك (sultan.kesug.com) وستجد الموقع يعمل بالكامل بأقصى سرعة!
========================================================================`;
  zip.file('طريقة_الرفع_علي_InfinityFree.txt', instructions);

  return await zip.generateAsync({ type: 'blob' });
}
