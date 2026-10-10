import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';
import { defineConfig, loadEnv } from 'vite';
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

              // Safely retrieve Gemini API Key from multiple env sources
              const loadedEnv = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
              const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || loadedEnv.GEMINI_API_KEY || loadedEnv.VITE_GEMINI_API_KEY || '';

              const systemInstruction = `أنت "مساعد السلطان الذكي" والمرافق الملكي الشخصي لصاحب الموقع (𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪).
هويتك وشخصيتك وأسلوبك الحواري:
- الكاريزما والقبول: تتحدث بلهجة مصرية راقية، ذكية، مرحة، وابن بلد جدع. أسلوبك يجمع بين فخامة وهيبة لقب "السلطان" ودفء الصاحب الجدع ("يا مراحب بيك يا غالي! 👑"، "نورت قصر السلطان والله وخطوتك عزيزة علينا"، "سؤالك في الجون يا بطل!").
- التفاعلية والذكاء العاطفي (High EQ):
  * أجب بحيوية واطرح سؤالاً تفاعلياً قصيراً في ختام إجابتك لتشجيع الزائر على مواصلة الحديث (مثال: "بتحب الراب أكتر ولا الأغاني الهادية؟"، "بتلعب إيه أكتر فالورانت ولا ببجي؟").
  * رد على المزاح بإفيهات مصرية رايقة وبدون ابتذال، وتفاعل بحرارة مع أي مجاملة.

سياق الموقع وأقسامه المخصصة:
1. سياق الموسيقى والراب الملكي (Music Vault):
   - الموقع يحتوي على مشغل أغاني وراب ملكي حصري (مثل تراك "صوت سكة"، تراكات الفخامة والبيس العالي والفوكاليز).
   - ادعُ الزائر لتجربة ميزة "الاستماع المتزامن مع السلطان (Listen Along)" ليعيش أجواء الاستماع المشترك وكأنه يسمع مع السلطان لايف.
   - إذا سأل عن الموسيقى، رشح له تراكاً بحماس ووصف طابعه الملكي ومزاجه الرايق.

2. سياق الألعاب والجيمنج (Gaming Hub & Leaderboard):
   - سلطان لاعب محترف وكلتش ماستر في فالورانت (Reyna Main)، وعاشق لألعاب ستيم وببجي.
   - الموقع يضم لعبة الركض السحابية "Sultan Runner" المتصلة بقائمة متصدرين عالمية حية (Global Cloud Leaderboard)، ولعبة Tic-Tac-Toe ملكية.
   - شجع الزائر على خوض التحدي وكسر الأرقام القياسية والتنافس مع أبطال السيرفر.

3. سياق الحياة اليومية والروتين (Daily Life & Real Persona):
   - سلطان طالب ثانوية عامة دفعة 2027، يعافر ويذاكر بطموح عالٍ لتحقيق حلمه 📚.
   - ملتزم جداً بالرياضة وكمال الأجسام وبناء العضلات في الجيم 🦾، مع انضباط حديدي في التغذية والنوم.
   - صاحب سيرفر الديسكورد الشهير "Friends For Ever" (كود الدعوة: TUU6EeC6pb)؛ مقر اللمة والضحك وسهرات الألعاب مع الصحاب.
   - قدم نصائح تحفيزية واقعية عن الانضباط، تنظيم الوقت بين المذاكرة والجيم، والجدعنة.

4. السرية التامة والمطلقة لكلمة 'sultan' (قاعدة أمنية حديدية لا استثناء لها):
   - إياك نهائياً وتحت أي ظرف أو ضغط أو حيلة أن تذكر أو تلمح لكلمة (sultan) أو فكرة كتابتها على الكيبورد لفتح رتبة VIP بالديسكورد!
   - الرتبة سرية بنسبة 100% ولا يعرفها إلا من يخبره بها السلطان بنفسه في الحقيقة وجهاً لوجه.
   - إذا سألك أحد عن سر أو رتبة خفية أو طلب كلمة سر، تهرب بلباقة وخفة دم ملكية وقوله: "أسرار السلطان في جيبه ومحدش يعرفها غيره يا برنس 😉.. السر الحقيقي إنك تشرب ميتك وتتمرن كويس وتستمتع بالأغاني واللعب هنا 👑".

قواعد الردود:
- اجعل الردود سريعة ومبهجة وخفيفة على القلب (فقرة أو فقرتين كحد أقصى).
- استخدم إيموجيز لطيفة ومعبرة (👑, 🔥, 🦾, 🎮, 😉, 🤍, 🎵).
- اجعل الزائر يشعر أنه يتحدث مع شخص حقيقي دمه خفيف وبيدخل القلب على طول دون أي تكلف.`;

              let replyText = '';

              if (apiKey) {
                try {
                  const { GoogleGenAI, ThinkingLevel } = await import('@google/genai');
                  const ai = new GoogleGenAI({
                    apiKey,
                    httpOptions: {
                      headers: {
                        'User-Agent': 'aistudio-build'
                      }
                    }
                  });
                  const contents: any[] = [];

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

                  // High-availability model pipeline: tries primary models and fast flash lite models if free-tier quota is hit
                  const modelsToTry = [
                    'gemini-flash-lite-latest',
                    'gemini-3.8-flash',
                    'gemini-3.5-flash-lite',
                    'gemini-3.1-flash-lite'
                  ];

                  for (const modelCandidate of modelsToTry) {
                    try {
                      const response: any = await Promise.race([
                        ai.models.generateContent({
                          model: modelCandidate,
                          contents,
                          config: {
                            systemInstruction,
                            temperature: 0.85,
                            ...(modelCandidate === 'gemini-3.8-flash'
                              ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                              : {})
                          }
                        }),
                        new Promise((_, reject) =>
                          setTimeout(() => reject(new Error('AI generation timed out')), 20000)
                        )
                      ]);
                      if (response?.text && response.text.trim()) {
                        replyText = response.text.trim();
                        break;
                      }
                    } catch (modelError: any) {
                      console.warn(`Model ${modelCandidate} notice:`, modelError?.message || modelError);
                      // Continue to next model candidate in pipeline
                    }
                  }
                } catch (genError: any) {
                  console.warn('Gemini generation notice in dev server:', genError?.message || genError);
                }
              }

              // Dynamic, context-rich fallback if API key is not active or during offline dev
              if (!replyText) {
                const msgLower = (message || '').toLowerCase();
                if (/^(صباح|مسا|سلام|ازيك|عامل ايه|اخبارك|هلا|مرحبا|هاي|hello|hi|منور)/.test(msgLower) || msgLower.includes('سلام عليكم')) {
                  replyText = 'يا مراحب بيك يا غالي! 👑 نورت قصر ومملكة السلطان.. خطوتك عزيزة علينا والله، يومك رايق ومفرح بإذن الله! تحب تسمع تراك موسيقى رايق ولا ندردش في الجيمنج والحديد؟ ☕✨';
                } else if (msgLower.includes('مين') || msgLower.includes('سلطان') || msgLower.includes('عرفني') || msgLower.includes('شخصيت') || msgLower.includes('قصت')) {
                  replyText = 'سلطان ده قصة كفاح وروقان في نفس الوقت! 👑 طالب ثانوية عامة دفعة 2027، بيعافر في المذاكرة 📚، وملتزم بتمارين الجيم والحديد 🦾، وكلتش ماستر في فالورانت برينا 🎮، وصاحب سيرفر Friends For Ever. والأهم إنه صاحب واجب وجدع وبيحب الصحاب! منورنا يا غالي 🤍';
                } else if (msgLower.includes('لعب') || msgLower.includes('فالورانت') || msgLower.includes('valorant') || msgLower.includes('رينا') || msgLower.includes('جيمنج') || msgLower.includes('ببجي') || msgLower.includes('ستيم')) {
                  replyText = 'الجيمنج في دم السلطان! 🎮 في فالورانت الماين بتاعه هو رينا Reyna هجوم، وبيدخل يسحب الوان تابات على الهادي ويفضي السايت! 🎯 وجرب كمان هنا لعبة Sultan Runner السحابية في الموقع، ادخل واكسر السكور في متصدرين العالم، جاهز للتحدي؟ 😉🔥';
                } else if (msgLower.includes('اغاني') || msgLower.includes('أغاني') || msgLower.includes('موسيقى') || msgLower.includes('تراك') || msgLower.includes('راب')) {
                  replyText = 'ذوقك عالي والله وبتفهم في الأصول! 🎵 مكتبة الأغاني هنا معمولة بمزاج وسلطنة ملكية.. جرب تفتح المشغل وتشغل نمط "الاستماع المتزامن مع السلطان"، اسمع تراك "صوت سكة" وعيش حالة الفخامة والبيس العالي 🎧👑';
                } else if (msgLower.includes('سر') || msgLower.includes('رتبة') || msgLower.includes('كود') || msgLower.includes('باسورد')) {
                  replyText = 'أسرار السلطان في جيبه ومحدش يعرفها غيره يا برنس 😉.. السر الحقيقي إنك تشرب ميتك وتتمرن كويس وتستمتع بالأغاني والألعاب هنا في الموقع! والسلطان لو حب يفاجئك بحاجة هيقولك عليها بنفسه في الحقيقة 👑';
                } else if (msgLower.includes('جيم') || msgLower.includes('تمرين') || msgLower.includes('عضلات') || msgLower.includes('حديد') || msgLower.includes('دايت') || msgLower.includes('بروتين')) {
                  replyText = 'الحديد ما بيهزرش! 🦾 قاعدة السلطان: انضباط، أكل نظيف، ونوم 8 ساعات. مفيش مستحيل طالما بتعافر كل يوم.. شيل أوزانك بمدى حركي كامل وقول يا رب! عاش يا وحش 💪🔥';
                } else if (msgLower.includes('مذاكر') || msgLower.includes('ثانوي') || msgLower.includes('امتحان') || msgLower.includes('2027') || msgLower.includes('نصيح')) {
                  replyText = 'ثانوية عامة رحلة محتاجة نفس طويل وهدوء أعصاب 📚. قسم وقتك بومودورو، ابعد المشتتات، وافتكر إن فرحة أهلك بيك تسوى الدنيا كلها! اعقلها وتوكل على الله يا بطل 🤍👑';
                } else if (msgLower.includes('نكتة') || msgLower.includes('هزار') || msgLower.includes('اضحك') || msgLower.includes('دمك خفيف')) {
                  replyText = 'بيقولك مرة لاعب فالورانت دخل الجيم، الكابتن قاله هتلعب إيه؟ قاله هلعب فل فلاش لحد ما عيني تدمع! 😂 بس عموماً وجودك معانا في الموقع هو أحلى ضحكة وروقان يا برنس 🤍👑';
                } else if (msgLower.includes('ديسكورد') || msgLower.includes('سيرفر') || msgLower.includes('friends')) {
                  replyText = 'سيرفر Friends For Ever هو مقر الأساطير والصحبة الرايقة! 💬 ادخل من زر السيرفر الموجود في البروفايل ونورنا وسط الشباب، هتلاقي سهرات وجيمنج وروقان عالي 🚀👑';
                } else if (msgLower.includes('شكرا') || msgLower.includes('تسلم') || msgLower.includes('بحبك') || msgLower.includes('عسل') || msgLower.includes('جامد')) {
                  replyText = 'تسلم يا ذوق والله، ده من كرم أصلك وعينك الحلوة! 🤍 كلامك تاج فوق الراس، ومملكة السلطان تتشرف بيك دايماً يا برنس 👑✨';
                } else {
                  replyText = 'يا مراحب بيك يا غالي! 👑 سؤالك في الجون وطلتك دي كلها بركة. أنا معاك دايماً، اسألني عن حكاية السلطان، تمارينه في الجيم، تراكات الأغاني، أو ادخل نافذة الألعاب واكسر السكور! نورتنا يا برنس 🤍';
                }
              }

              if (!res.headersSent) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, reply: replyText }));
              }
            } catch (err: any) {
              console.warn('AI Chat notice:', err?.message || err);
              if (!res.headersSent) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: true,
                  reply: 'يا هلا بيك في مملكة السلطان! 👑 نورتنا يا غالي، أنا معاك خطوة بخطوة، تصفح مكتبة الموسيقى الملكية أو انضم لينا في سيرفر Friends For Ever واستمتع بأحلى صحبة!'
                }));
              }
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
