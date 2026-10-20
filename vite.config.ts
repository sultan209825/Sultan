import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';
import { defineConfig, loadEnv } from 'vite';
import { startDiscordBot, getBotState, assignRoleToMember, getLiveVoiceState, syncWidgetData } from './src/server/discordBotService.ts';

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

        const urlPath = req.url ? req.url.split('?')[0] : '';

        // Download complete InfinityFree bundle as ready-to-upload ZIP
        if (urlPath === '/api/download-infinityfree-zip') {
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
            const radarPhpPath = path.resolve(rootDir, 'public/api_discord_radar.php');
            if (fs.existsSync(radarPhpPath)) {
              zip.file('api_discord_radar.php', fs.readFileSync(radarPhpPath));
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
        // Handle CORS preflight for all /api/discord endpoints
        if (urlPath?.startsWith('/api/discord') && req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Pragma, Cache-Control',
            'Access-Control-Max-Age': '86400'
          });
          res.end();
          return;
        }

        // Status of Sultan's Custom Discord Bot & Real-time Live Voice Radar
        if ((urlPath === '/api/discord/bot-service' || urlPath === '/api/discord/bot-status' || urlPath === '/api/discord/live-voice') && req.method === 'GET') {
          try {
            const rawUrl = req.url || '';
            const bypassCache = rawUrl.includes('bypassCache=1') || rawUrl.includes('nocache=1');
            const liveVoice = await getLiveVoiceState('1306240131224571957', bypassCache);
            const currentState = getBotState();
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization, Pragma, Cache-Control',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            });
            res.end(
              JSON.stringify({
                ...currentState,
                isOnline: currentState.isOnline || Boolean(liveVoice?.inVoice),
                sultanVoiceChannel: liveVoice
              })
            );
          } catch {
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify(getBotState()));
          }
          return;
        }

        // Sync client-fetched Discord widget directly to server memory cache
        if (urlPath === '/api/discord/sync-widget' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const synced = syncWidgetData(data);
              const liveVoice = await getLiveVoiceState('1306240131224571957', false);
              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              });
              res.end(JSON.stringify({ success: synced, sultanVoiceChannel: liveVoice }));
            } catch (err: any) {
              res.writeHead(400, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              });
              res.end(JSON.stringify({ error: err.message || 'Invalid JSON' }));
            }
          });
          return;
        }

        // Start / Connect Sultan's Custom Discord Bot
        if (urlPath === '/api/discord/bot-service' && req.method === 'POST') {
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

        if (urlPath === '/api/discord/assign-role' && req.method === 'POST') {
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
        if (urlPath === '/api/discord/test-bot' && req.method === 'POST') {
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
        if (urlPath === '/api_discord_assign.php' && req.method === 'POST') {
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
        if (urlPath === '/api/discord/webhook-announce' && req.method === 'POST') {
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
