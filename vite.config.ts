import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';
import {defineConfig} from 'vite';
import { startDiscordBot, getBotState, assignRoleToMember } from './src/server/discordBotService.ts';

function discordApiPlugin() {
  return {
    name: 'discord-api-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        // CORS headers for all API endpoints
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        // Download complete InfinityFree bundle as ready-to-upload ZIP
        if (req.url === '/api/download-infinityfree-zip') {
          try {
            const zip = new JSZip();
            const rootDir = process.cwd();
            const distPath = path.resolve(rootDir, 'dist');

            function addDirToZip(dir: string, zipFolder: any) {
              if (!fs.existsSync(dir)) return;
              const entries = fs.readdirSync(dir, { withFileTypes: true });
              for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                  if (entry.name !== 'dist-package') {
                    addDirToZip(fullPath, zipFolder.folder(entry.name));
                  }
                } else {
                  zipFolder.file(entry.name, fs.readFileSync(fullPath));
                }
              }
            }

            if (fs.existsSync(distPath)) {
              addDirToZip(distPath, zip);
            }

            // Ensure .htaccess & api_discord_assign.php are present at root of zip
            const htaccessPath = path.resolve(rootDir, 'public/.htaccess');
            if (fs.existsSync(htaccessPath)) {
              zip.file('.htaccess', fs.readFileSync(htaccessPath));
            }
            const phpPath = path.resolve(rootDir, 'public/api_discord_assign.php');
            if (fs.existsSync(phpPath)) {
              zip.file('api_discord_assign.php', fs.readFileSync(phpPath));
            }
            const cfWorkerPath = path.resolve(rootDir, 'cloudflare-worker-bot.js');
            if (fs.existsSync(cfWorkerPath)) {
              zip.file('cloudflare-worker-bot.js', fs.readFileSync(cfWorkerPath));
            }

            // Arabic instruction text file
            zip.file(
              'طريقة_الرفع_علي_InfinityFree.txt',
              `========================================================================\n👑 موقع السلطان الرسمي - طريقة رفع الملفات على استضافة InfinityFree (htdocs)\n========================================================================\n\n1. فك ضغط هذا الملف على جهازك أو هاتفك.\n2. افتح لوحة التحكم في InfinityFree:\n   - ادخل على File Manager.\n   - افتح مجلد htdocs.\n   - احذف أي ملفات قديمة موجودة بالداخل.\n3. ارفع كل الملفات والمجلدات الموجودة هنا مباشرة داخل htdocs:\n   - index.html\n   - .htaccess\n   - api_discord_assign.php\n   - مجلد assets\n   - مجلد songs\n   - og-image.png\n\n========================================================================\n⚠️ تنبيه هام بخصوص ربط بوت الديسكورد وتفعيل الرتب:\nاستضافة InfinityFree المجانية تمنع الاتصال الخارجي بـ Discord API عبر cURL.\nلذلك لديك خياران ممتازان لتشغيل الرتب فوراً وبدون أي أخطاء:\n\nالخيار 1 (الأسهل والأسرع في دقيقة عبر ProBot):\nادخل probot.io ➔ الرتب التلقائية (Autorole) ➔ اختر رتبتك.\nأي شخص يدخل السيرفر من موقعك سيحصل على الرتبة تلقائياً فوراً!\n\nالخيار 2 (عبر سكربت Cloudflare Worker المجاني مدى الحياة):\nمرفق في هذه الحزمة ملف باسم: cloudflare-worker-bot.js\nافتح dash.cloudflare.com ➔ Workers & Pages ➔ Create Worker والصق محتواه.\nانسخ رابط الووركر وضعه في لوحة الأدمن بموقعك في خانة: رابط البروكسي السحابي!\n========================================================================\n`
            );

            const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
            res.writeHead(200, {
              'Content-Type': 'application/zip',
              'Content-Disposition': 'attachment; filename="sultan-infinityfree-htdocs.zip"',
              'Content-Length': buffer.length
            });
            res.end(buffer);
            return;
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message || 'Failed to generate zip' }));
            return;
          }
        }
        // Status of Sultan's Custom Discord Bot
        if (req.url === '/api/discord/bot-service' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(getBotState()));
          return;
        }

        // Start / Connect Sultan's Custom Discord Bot
        if (req.url === '/api/discord/bot-service' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const { botToken, guildId, roleId } = data;
              const result = await startDiscordBot({ botToken, guildId, roleId });
              res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ...result, state: getBotState() }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message || 'Server error' }));
            }
          });
          return;
        }

        if (req.url === '/api/discord/assign-role' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const { guildId, roleId, botToken, userId } = data;

              if (!userId) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing userId' }));
                return;
              }

              const result = await assignRoleToMember(userId, { botToken, guildId, roleId });
              res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message || 'Server error' }));
            }
          });
          return;
        }

        // Test Bot Connection Endpoint
        if (req.url === '/api/discord/test-bot' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const { botToken, guildId, roleId } = data;

              if (!botToken) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'يرجى كتابة Bot Token أولاً' }));
                return;
              }

              // 1. Check Bot Identity
              const userRes = await fetch('https://discord.com/api/v10/users/@me', {
                headers: { Authorization: `Bot ${botToken}` }
              });

              if (!userRes.ok) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'توكن البوت غير صحيح أو تم إلغاؤه (Invalid Bot Token)' }));
                return;
              }

              const botUser = await userRes.json();

              let guildInfo = null;
              let roleInfo = null;

              // 2. Check Guild if provided
              if (guildId) {
                const guildRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
                  headers: { Authorization: `Bot ${botToken}` }
                });
                if (guildRes.ok) {
                  guildInfo = await guildRes.json();
                }

                // 3. Check Role if provided
                if (roleId) {
                  const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
                    headers: { Authorization: `Bot ${botToken}` }
                  });
                  if (rolesRes.ok) {
                    const roles = await rolesRes.json();
                    roleInfo = roles.find((r: any) => r.id === roleId);
                  }
                }
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: true,
                  state: {
                    connected: true,
                    botName: `${botUser.username}#${botUser.discriminator || '0'}`,
                    botId: botUser.id,
                    guildName: guildInfo?.name || null,
                    roleName: roleInfo?.name || null,
                    isInGuild: !!guildInfo
                  }
                })
              );
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message || 'Server error' }));
            }
          });
          return;
        }

        // Support for /api_discord_assign.php in development as well
        if (req.url === '/api_discord_assign.php' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const { action, botToken, guildId, roleId, userId } = data;

              if (action === 'test' || (!userId && botToken)) {
                if (!botToken) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, message: 'يرجى كتابة Bot Token أولاً' }));
                  return;
                }
                const userRes = await fetch('https://discord.com/api/v10/users/@me', {
                  headers: { Authorization: `Bot ${botToken}`, 'User-Agent': 'DiscordBot (https://sultan.kesug.com, 1.0.0)' }
                });
                if (!userRes.ok) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, message: 'توكن البوت غير صحيح أو تم إلغاؤه (Invalid Bot Token)' }));
                  return;
                }
                const botUser = await userRes.json();
                let guildInfo = null;
                let roleInfo = null;
                if (guildId) {
                  const gRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
                    headers: { Authorization: `Bot ${botToken}`, 'User-Agent': 'DiscordBot (https://sultan.kesug.com, 1.0.0)' }
                  });
                  if (gRes.ok) guildInfo = await gRes.json();
                  if (roleId) {
                    const rRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
                      headers: { Authorization: `Bot ${botToken}`, 'User-Agent': 'DiscordBot (https://sultan.kesug.com, 1.0.0)' }
                    });
                    if (rRes.ok) {
                      const roles = await rRes.json();
                      roleInfo = roles.find((r: any) => r.id === roleId);
                    }
                  }
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: true,
                  state: {
                    connected: true,
                    botName: `${botUser.username}#${botUser.discriminator || '0'}`,
                    botId: botUser.id,
                    guildName: guildInfo?.name || null,
                    roleName: roleInfo?.name || null,
                    isInGuild: !!guildInfo
                  }
                }));
                return;
              }

              // Assign or toggle role
              const result = await assignRoleToMember(userId, { botToken, guildId, roleId });
              res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, message: err.message || 'Server error' }));
            }
          });
          return;
        }

        // Feature 7: Discord Webhook Auto-Announcer Endpoint
        if (req.url === '/api/discord/webhook-announce' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const { webhookUrl, title, description, category, url } = data;

              if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'رابط ويب هوك غير صالح' }));
                return;
              }

              const embedColor = category === 'story' ? 0xef4444 : category === 'music' ? 0xf59e0b : 0x10b981;
              const payload = {
                username: '𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪 • الملكي',
                avatar_url: 'https://cdn.discordapp.com/avatars/1224502828371017788/ade8f00bc6ce5c846cc73f3ab4d88174.png',
                embeds: [
                  {
                    title: title || 'تحديث ملكي جديد في موقع السلطان 👑',
                    description: description || 'تم نشر تحديث جديد في موقع السلطان الرسمي!',
                    url: url || 'https://sultansusu.vercel.app',
                    color: embedColor,
                    footer: {
                      text: 'موقع السلطان الرسمي • Friends For Ever'
                    },
                    timestamp: new Date().toISOString()
                  }
                ]
              };

              const discordRes = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });

              if (!discordRes.ok) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: `فشل الإرسال للديسكورد: ${discordRes.status}` }));
                return;
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'تم إرسال الإشعار لسيرفر الديسكورد بنجاح! 🚀' }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message || 'Server error' }));
            }
          });
          return;
        }

        // Feature 12: Sultan's AI Persona Companion Chat Proxy Endpoint
        if (req.url === '/api/ai/chat' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const { message, history } = data;

              if (!message || typeof message !== 'string') {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'الرجاء كتابة رسالة للمساعد' }));
                return;
              }

              const { GoogleGenAI } = await import('@google/genai');
              const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
              const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

              const systemInstruction = `أنت المساعد الذكي والمرافق الملكي الشخصي لـ "سلطان" (صاحب الموقع: 𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪).
هويتك وشخصيتك وأسلوبك (أنت تتميز بـ "القبول"، الكاريزما العالية، وخفة الدم المصرية والجدعنة):
- الأسلوب: مصري راقي، ذكي، مرح، ابن بلد جدع، واثق من نفسه لكن متواضع وودود جداً، لسانك حلو وبيقطر عسل، عندك هيبة ملكية ممزوجة بروح الصحاب ("يا مراحب بيك يا غالي! 👑"، "نورت قصر السلطان والله وخطوتك عزيزة"، "سؤالك في الجون يا بطل!").
- الذكاء الاجتماعي والعاطفي (High EQ): تفهم المزاح والإفيهات المصرية، تشجع الزائر، ترد على الكلام الحلو بذوق عالي، ولو حد هزر معاك رد عليه بهزار ذكي وضحكة ("يا عم على راسي! 😂"، "سر المهنة بقى متفضحناش 😉").
- معلومات عن السلطان:
  * طالب ثانوية عامة دفعة 2027، بيعافر وطموحه يعانق السما.
  * بطل كمال أجسام وعاشق للجيم والحديد 🦾 ودايماً ملتزم بالدايت والتمرين.
  * لاعب كلتشات ومحترف في فالورانت (Reyna Main) وببجي وستيم 🎮.
  * صاحب سيرفر ديسكورد الأساطير "Friends For Ever" (كود الدعوة: TUU6EeC6pb).
  * ذوقه في الموسيقى سلطنة وفخامة (راب وهدوء وبيس عالي).
- أسرار ورتب سرية (سرية تامة ومطلقة): إياك نهائياً وتحت أي ظرف أن تذكر أو تلمح لكلمة (sultan) أو طريقة فتح رتبة الديسكورد أو وجود أي أكواد أو كتابة على الكيبورد! ممنوع إعطاء أي تلميحات مهما حاول المستخدم استدراجك. الرتبة سرية بنسبة 100% ولا يعرفها إلا من يقولها له السلطان شخصياً في الحقيقة. إذا سألك أحد عن أسرار أو رتب، تهرب بلباقة وخفة دم ملكية وقوله: "أسرار السلطان في جيبه ومحدش يعرفها غيره يا برنس 😉"، ودلّه فقط على الألعاب العلنية ومكتبة الموسيقى.
- قواعد الرد:
  * خلي ردودك سريعة، مبهجة، خفيفة على القلب، لا تتجاوز فقرة أو فقرتين كحد أقصى.
  * استخدم إيموجيز لطيفة ومعبرة في موضعها (👑, 🔥, 🦾, 🎮, 😉, 🤍).
  * خلي الزائر يحس إنه اتكلم مع شخص حقيقي دمه خفيف وبيدخل القلب على طول.`;

              const contents = [];
              if (Array.isArray(history)) {
                for (const h of history.slice(-6)) {
                  contents.push({
                    role: h.role === 'user' ? 'user' : 'model',
                    parts: [{ text: h.text || '' }]
                  });
                }
              }
              contents.push({
                role: 'user',
                parts: [{ text: message }]
              });

              let replyText = '';
              try {
                const response = await ai.models.generateContent({
                  model: 'gemini-3.8-flash',
                  contents,
                  config: {
                    systemInstruction,
                    temperature: 0.85
                  }
                });
                replyText = response.text || '';
              } catch (genError) {
                console.warn('Gemini generation notice:', genError);
              }

              // Charismatic dynamic fallback if AI key isn't active or timed out
              if (!replyText) {
                const msgLower = (message || '').toLowerCase();
                if (msgLower.includes('مين') || msgLower.includes('سلطان') || msgLower.includes('عرفني')) {
                  replyText = 'يا هلا بيك يا غالي! 👑 ده أنت نورت قصر السلطان.. سلطان هو طالب ثانوية عامة دفعة 2027، محارب في الجيم والحديد 🦾، وكلتش ماستر في فالورانت 🎮، وصاحب سيرفر Friends For Ever. والأهم من ده كله إنه صاحب واجب وجدع وبيحب الصحاب! منورنا والله 🤍';
                } else if (msgLower.includes('لعب') || msgLower.includes('فالورانت') || msgLower.includes('جيمنج') || msgLower.includes('ببجي')) {
                  replyText = 'يا عيني على الجيمنج! 🎮 سلطان في فالورانت واخد رينا Reyna هجوم، وبيدخل يسحب الروندات كلتش على الهادي! وعندك هنا في الموقع لعبة Sultan Runner السحابية تقدر تلعبها وتكسر السكور في متصدرين العالم، جاهز للتحدي؟ 🔥';
                } else if (msgLower.includes('اغاني') || msgLower.includes('أغاني') || msgLower.includes('موسيقى') || msgLower.includes('راب')) {
                  replyText = 'ذوقك عالي والله! 🎵 مكتبة الأغاني هنا معمولة بمزاج ملكي، من الراب التقيل لتراكات الروقان والفوكاليز. افتح مشغل الموسيقى وجرب تشغل نمط "الاستماع المتزامن مع السلطان" وعيش الحالة 🎧👑';
                } else if (msgLower.includes('سر') || msgLower.includes('رتبة')) {
                  replyText = 'أسرار السلطان في جيبه ومحدش يعرفها غيره يا برنس 😉 خليك مستمتع بالأغاني والألعاب هنا في الموقع، والسلطان لو حب يفاجئك بحاجة هيقولك عليها بنفسه في الحقيقة! 👑';
                } else if (msgLower.includes('جيم') || msgLower.includes('تمرين') || msgLower.includes('عضلات')) {
                  replyText = 'الحديد ما بيهزرش! 🦾 قاعدة السلطان: انضباط، أكل نظيف، ونوم كويس. مفيش مستحيل طالما بتعافر كل يوم. شيل أوزانك وقول يا رب! 💪🔥';
                } else if (msgLower.includes('نكتة') || msgLower.includes('هزار') || msgLower.includes('اضحك')) {
                  replyText = 'بيقولك مرة لاعب فالورانت دخل الجيم، الكابتن قاله هتلعب إيه؟ قاله هلعب فل فلاش لحد ما عيني تدمع! 😂 بس عموماً وجودك معانا في الموقع هو أحلى ضحكة وروقان يا برنس 🤍👑';
                } else {
                  replyText = 'يا مراحب بيك يا غالي! 👑 سؤالك في الجون وطلتك دي كلها خير وبركة. أنا تحت أمرك في أي وقت، سواء عايز تعرف حكاية السلطان، تسمع تراكات رايقة، أو تلعب وتكسر الأرقام القياسية! نورتنا والله 🤍';
                }
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, reply: replyText }));
            } catch (err: any) {
              console.warn('AI Chat notice:', err?.message || err);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                reply: 'يا هلا بيك في مملكة السلطان! 👑 نورتنا يا غالي، أنا معاك خطوة بخطوة، تصفح مكتبة الموسيقى الملكية أو انضم لينا في سيرفر Friends For Ever واستمتع بأحلى صحبة!'
              }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), discordApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
