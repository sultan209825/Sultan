import JSZip from 'jszip';

export async function generateFullApplicationSourceZip(): Promise<Blob> {
  const zip = new JSZip();

  // 1. Fetch exact built index.html from dist-package
  const resHtml = await fetch('/dist-package/index.html');
  let rawHtml = await resHtml.text();

  // Adjust asset paths to be local relative so they open on any domain or subdirectory
  const indexHtml = rawHtml
    .replace(/src="\/assets\//g, 'src="./assets/')
    .replace(/href="\/assets\//g, 'href="./assets/');

  zip.file('index.html', indexHtml);

  // 2. Fetch the compiled JS and CSS from public/dist-package
  try {
    const jsRes = await fetch('/dist-package/assets/index-DzFKD-Ao.js');
    const jsData = await jsRes.text();
    zip.file('assets/index-DzFKD-Ao.js', jsData);
  } catch (err) {
    console.error('Failed to load bundle js', err);
  }

  try {
    const cssRes = await fetch('/dist-package/assets/index-CpvqZQ8D.css');
    const cssData = await cssRes.text();
    zip.file('assets/index-CpvqZQ8D.css', cssData);
  } catch (err) {
    console.error('Failed to load bundle css', err);
  }

  // 3. Add og-image.png so the emblem renders offline and everywhere
  try {
    const imgRes = await fetch('/og-image.png');
    const imgBlob = await imgRes.blob();
    zip.file('og-image.png', imgBlob);
  } catch (err) {
    console.error('Failed to bundle og-image.png', err);
  }

  // 4. .htaccess routing for InfinityFree so all routes, modals, and assets load properly
  const htaccess = `Options -Indexes

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
`;
  zip.file('.htaccess', htaccess);

  // 5. Instructions
  const readme = `========================================================================
👑 موقع السلطان الرسمي والشخصي - دليل تشغيل ملفات الـ MP3 الخاصة بك
========================================================================

كيف تضع الأغاني الحقيقية بصوتك على الموقع؟
يوجد طريقتان سهلتان جداً:

الطريقة 1 (من داخل الموقع مباشرة في أي وقت):
- افتح الموقع واضغط على زر "إضافة أغاني 📂" الموجود في شريط مشغل الموسيقى بجانب قائمة التراكات.
- يمكنك رفع أي ملف صوتي MP3 مباشرة من جهازك أو هاتفك وسيشتغل فوراً!
- أو يمكنك وضع رابط مباشر للملف الصوتي لكل تراك وسيتم حفظه تلقائياً في جهازك.

الطريقة 2 (عند الرفع على استضافة InfinityFree):
1. داخل مجلد htdocs، أنشئ مجلداً جديداً اسمه songs
2. ضع فيه ملفات الـ MP3 الخاصة بك بالأسماء التالية:
   - sultan-1.mp3
   - sultan-2.mp3
   - sultan-3.mp3
   - sultan-4.mp3
   - sultan-5.mp3
3. من داخل نافذة "إضافة أغاني" بالموقع، اكتب الرابط أمام الأغنية: /songs/sultan-1.mp3 وهكذا!

========================================================================`;
  zip.file('طريقة_تشغيل_الأغاني.txt', readme);

  return await zip.generateAsync({ type: 'blob' });
}
