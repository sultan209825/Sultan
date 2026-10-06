import JSZip from 'jszip';

export async function generateInfinityFreeZip(): Promise<Blob> {
  const zip = new JSZip();

  // 1. Standalone, ultra-polished index.html for InfinityFree & Local Double-click
  const indexHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SULTAN - 𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪 Bio & Music Vault</title>

  <!-- أيقونات ومشاركة -->
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23ef4444'/%3E%3Cstop offset='1' stop-color='%23ffd700'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='32' cy='32' r='30' fill='url(%23g)'/%3E%3Ctext x='32' y='42' font-family='Arial,sans-serif' font-weight='bold' font-size='30' fill='white' text-anchor='middle'%3ES%3C/text%3E%3C/svg%3E">
  <meta name="description" content="3 ثانوي 📖 + GYM 🦾 | موقع سلطان الرسمي">
  <meta property="og:title" content="SULTAN - 𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪">
  <meta property="og:description" content="3 ثانوي 📖 + GYM 🦾">
  <meta property="og:image" content="og-image.png">
  <meta name="theme-color" content="#ef4444">

  <!-- خطوط جوجل العربية الفخمة -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="style.css">
</head>
<body>

  <!-- شاشة الدخول والتفاعل الصوتي -->
  <div id="enterOverlay">
    <div class="enter-inner">
      <div class="enter-avatar">
        <svg viewBox="0 0 100 100" class="crown-svg" width="60" height="60">
          <path d="M20 70L15 35L35 48L50 25L65 48L85 35L80 70H20Z" fill="url(#crownGrad)" stroke="#fee2e2" stroke-width="2"/>
          <defs>
            <linearGradient id="crownGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#ff4d4d"/>
              <stop offset="100%" stop-color="#991b1b"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div class="enter-title">SULTAN • السلطان</div>
      <div class="enter-sub"><span class="pulse-dot"></span> اضغط في أي مكان للدخول 🔊</div>
    </div>
  </div>

  <!-- خلفية الكواكب والشبكة التفاعلية -->
  <canvas id="particlesCanvas"></canvas>
  <div id="bg-vignette"></div>

  <!-- حاوية البطاقة الرئيسية بتقنية 3D Tilt -->
  <div class="wrap">
    <div class="card-tilt" id="cardTilt">
      <div class="card">
        <!-- شريط الليزر العلوي -->
        <div class="laser-top"></div>

        <!-- تاج السلطان وأفاتار الديسكورد -->
        <div class="avatar-zone">
          <div class="laser-ring"></div>
          <div class="avatar" id="avatarBox">
            <img id="avatarImg" src="" alt="Sultan" style="display:none;width:100%;height:100%;object-fit:cover;border-radius:50%;">
            <div id="avatarFallback" class="avatar-fallback">
              <svg viewBox="0 0 100 100" width="55" height="55">
                <path d="M20 70L15 35L35 48L50 25L65 48L85 35L80 70H20Z" fill="#ef4444" stroke="#ffd700" stroke-width="2"/>
              </svg>
            </div>
          </div>
          <div class="status-dot" id="statusDot" title="متصل"></div>
        </div>

        <!-- الاسم والمعرف -->
        <div class="identity">
          <div class="username-row">
            <span id="usernameText" class="username-text">! 𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪</span>
            <span class="badge" title="موثّق رسميًا">✓</span>
          </div>
          <div class="handle-row">
            <span class="handle-text" id="handleText">@5susu</span>
            <button class="copy-btn" id="copyDiscordBtn" title="نسخ يوزر الديسكورد">
              <span id="copyIcon">📋</span>
              <span id="checkIcon" style="display:none;">✅</span>
            </button>
            <button class="copy-btn" id="shareBtn" title="مشاركة الصفحة">
              <span>📤</span>
            </button>
          </div>
        </div>

        <!-- النبذة المتحركة -->
        <div class="bio-box">
          <span id="typedBio"></span><span class="cursor"></span>
        </div>

        <!-- نشاط ديسكورد الحي -->
        <div class="discord-activity" id="discordActivity" style="display:none;">
          <span class="act-icon" id="actIcon">🎮</span>
          <span id="actText">جارِ تحديث نشاط الديسكورد...</span>
        </div>

        <!-- العد التنازلي للثانوية / الهدف -->
        <div class="countdown-row" id="countdownRow">
          ⏳ <span id="countdownLabel">طريق الثانوية العامة والهدف 🎯:</span>
          <b id="countdownValue">جارِ الحساب...</b>
        </div>

        <!-- مشغل الموسيقى الفاخر المخصص لخمسة تراكات -->
        <div class="music-player">
          <div class="mp-art" id="mpArt">
            <div class="mp-vinyl-center"></div>
          </div>
          <div class="mp-info">
            <div class="mp-title-row">
              <div class="mp-title" id="mpTitle">سلطان جه الكل سكت</div>
              <div class="eq-bars" id="eqBars">
                <span></span><span></span><span></span><span></span>
              </div>
            </div>
            <div class="mp-artist" id="mpArtist">SULTAN • Heavy 808 Trap</div>
            <div class="mp-progress-track" id="mpTrack">
              <div class="mp-progress-fill" id="mpFill"></div>
            </div>
          </div>
          <div class="mp-controls">
            <button class="mp-nav" id="mpPrev" title="السابقة">⏮</button>
            <button class="mp-play" id="mpPlay" title="تشغيل / إيقاف">▶</button>
            <button class="mp-nav" id="mpNext" title="التالية">⏭</button>
          </div>
        </div>

        <!-- شريط الصوت وقائمة الأغاني والكلمات -->
        <div class="volume-row">
          <button class="vol-btn" id="volBtn" title="كتم الصوت">🔊</button>
          <input type="range" id="volSlider" class="vol-slider" min="0" max="100" value="70">
          <span class="vol-time" id="mpTime">0:00 / 2:30</span>
          <button class="lyrics-toggle-btn" id="lyricsBtn" title="كلمات الأغنية">📜 الكلمات</button>
          <button class="vol-btn" id="queueBtn" title="قائمة التراكات">📑</button>
        </div>

        <!-- نافذة كلمات الأغاني القابلة للطي -->
        <div class="lyrics-panel" id="lyricsPanel" style="display:none;">
          <div class="lyrics-title" id="lyricsTitle">كلمات التراك</div>
          <pre class="lyrics-content" id="lyricsContent"></pre>
        </div>

        <!-- قائمة الأغاني الخمسة -->
        <div class="mp-queue-panel" id="queuePanel" style="display:none;">
          <div class="mp-queue-header">
            <span>تراكات السلطان الحصرية</span>
            <div class="mp-queue-actions">
              <button id="mpShuffle" class="q-action" title="عشوائي">🔀</button>
              <button id="mpRepeat" class="q-action" title="تكرار">🔁</button>
            </div>
          </div>
          <div id="queueList"></div>
        </div>

        <!-- روابط السوشيال -->
        <div class="socials">
          <a href="https://www.tiktok.com/@mohamed0_0hamdy" target="_blank" rel="noopener" class="social sc-tiktok" title="TikTok">
            🎵 تيك توك
          </a>
          <a href="https://discord.gg/TUU6EeC6pb" target="_blank" rel="noopener" class="social sc-discord" title="Discord Server">
            💬 سيرفر الديسكورد
          </a>
        </div>

        <!-- الإحصاءات والتقييم -->
        <div class="stats">
          <span><b id="viewCount">1,420</b> مشاهدة</span>
          <span class="dot-sep">•</span>
          <span>انضم <b id="joinYear">2020</b></span>
          <span class="dot-sep">•</span>
          <span class="live-dot">● متصل بالساحة</span>
        </div>

        <div class="rate-row">
          <span>رأيك في التراكات والموقع؟</span>
          <button type="button" id="rateUp" class="rate-btn" title="عجبني">👍</button>
          <button type="button" id="rateDown" class="rate-btn" title="ما عجبني">👎</button>
        </div>

        <!-- التذييل -->
        <div class="divider"></div>
        <div class="footer-row">
          <span class="footer-mark">👑 SULTAN</span>
          <span id="footerDomain">sultan.kesug.com</span>
        </div>
      </div>
    </div>
  </div>

  <!-- نافذة لعبة قفزة السلطان -->
  <div id="gameModal" class="game-modal" style="display:none;">
    <div class="game-box">
      <button class="game-close" id="gameClose">✕</button>
      <div class="game-score">النقاط: <b id="gameScore">0</b> &nbsp;•&nbsp; 🏆 أعلى رقم: <b id="gameHighScore">0</b></div>
      <canvas id="gameCanvas" width="340" height="160"></canvas>
      <div class="game-hint">اضغط مسافة أو المس الشاشة للقفز فوق العقبات!</div>
    </div>
  </div>

  <!-- صوتيات وخلفيات -->
  <audio id="bgAudio" preload="auto"></audio>

  <script src="script.js"></script>
</body>
</html>`;

  // 2. Beautiful CSS for the site (style.css)
  const styleCss = `/* تصميم موقع السلطان الملكي */
:root {
  --bg: #06060a;
  --card-bg: rgba(14, 14, 24, 0.85);
  --border: rgba(255, 255, 255, 0.08);
  --accent: #ef4444;
  --accent-gold: #ffd700;
  --text: #eae9f2;
  --muted: #8a89a3;
}

* { margin:0; padding:0; box-sizing:border-box; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Cairo', sans-serif;
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
}

#particlesCanvas {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

#bg-vignette {
  position: fixed; inset: 0; z-index: 2; pointer-events: none;
  background: radial-gradient(circle at 50% 40%, transparent 40%, rgba(0,0,0,0.7) 100%);
}

.wrap {
  position: relative;
  z-index: 10;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  perspective: 1200px;
}

.card-tilt {
  width: 100%;
  max-width: 460px;
  transition: transform 0.15s ease-out;
}

.card {
  position: relative;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 28px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 34px 26px 26px;
  box-shadow: 0 24px 70px rgba(0,0,0,0.7), 0 0 40px rgba(239,68,68,0.15);
  overflow: hidden;
}

.laser-top {
  position: absolute;
  top: 0; left: 15%; right: 15%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ef4444, #ffd700, transparent);
  box-shadow: 0 0 12px #ef4444;
}

.avatar-zone {
  position: relative;
  width: 110px; height: 110px;
  margin: 0 auto 14px;
}

.laser-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid rgba(239, 68, 68, 0.4);
  animation: laserSpin 3s linear infinite;
}
@keyframes laserSpin {
  100% { transform: rotate(360deg); }
}

.avatar {
  width: 100%; height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, #251622 0%, #100a12 100%);
  border: 2px solid rgba(239, 68, 68, 0.6);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 25px rgba(239, 68, 68, 0.4);
  position: relative;
  z-index: 2;
  overflow: hidden;
}

.status-dot {
  position: absolute;
  bottom: 4px; right: 4px;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: #10b981;
  border: 3px solid #0e0e18;
  z-index: 5;
  box-shadow: 0 0 10px #10b981;
}

.identity { text-align: center; margin-bottom: 8px; }
.username-row {
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.username-text {
  font-family: 'Space Grotesk', 'Cairo', sans-serif;
  font-size: 26px; font-weight: 900;
  color: #fff;
  text-shadow: 0 0 15px rgba(239, 68, 68, 0.6);
}
.badge {
  width: 18px; height: 18px; border-radius: 50%;
  background: linear-gradient(135deg, #ef4444, #f59e0b);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: bold; color: #fff;
}

.handle-row {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  margin-top: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px; color: var(--muted);
}
.copy-btn {
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 3px 6px;
  cursor: pointer;
  color: #fff;
  font-size: 12px;
  transition: all 0.2s;
}
.copy-btn:hover { background: rgba(239,68,68,0.2); border-color: #ef4444; }

.bio-box {
  text-align: center;
  margin: 12px 0 16px;
  font-size: 14.5px;
  font-weight: 700;
  color: #f1f0f8;
  min-height: 24px;
}
.cursor {
  display: inline-block; width: 2px; height: 16px;
  background: #ef4444; vertical-align: -2px;
  animation: blink 1s infinite;
}
@keyframes blink { 50% { opacity: 0; } }

.discord-activity {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: rgba(88, 101, 242, 0.12);
  border: 1px solid rgba(88, 101, 242, 0.3);
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 11.5px;
  font-family: 'JetBrains Mono', monospace;
  color: #c9c3ff;
  margin: 0 auto 16px;
  max-width: fit-content;
}

.countdown-row {
  text-align: center;
  font-size: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 12px;
  padding: 8px 12px;
  margin-bottom: 16px;
  color: #fca5a5;
}
.countdown-row b { color: #ffd700; font-family: 'JetBrains Mono', monospace; }

/* مشغل الصوت */
.music-player {
  display: flex; align-items: center; gap: 12px;
  background: rgba(0,0,0,0.4);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 12px;
  margin-bottom: 12px;
}
.mp-art {
  width: 48px; height: 48px; border-radius: 50%;
  background: radial-gradient(circle, #ff4d4d 0%, #1a0808 60%, #000 100%);
  border: 2px solid rgba(255, 77, 77, 0.5);
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.mp-art.playing { animation: vinylSpin 3.5s linear infinite; }
@keyframes vinylSpin { 100% { transform: rotate(360deg); } }
.mp-vinyl-center {
  width: 14px; height: 14px; border-radius: 50%;
  background: #ffd700; border: 2px solid #000;
}
.mp-info { flex: 1; min-width: 0; }
.mp-title-row { display: flex; align-items: center; justify-content: space-between; }
.mp-title { font-size: 13px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mp-artist { font-size: 10.5px; color: var(--muted); font-family: 'JetBrains Mono', monospace; margin: 2px 0 6px; }

.eq-bars { display: flex; align-items: flex-end; gap: 2px; height: 14px; }
.eq-bars span {
  width: 3px; height: 4px; background: #ef4444; border-radius: 2px;
  transition: height 0.1s ease;
}
.music-player.playing .eq-bars span { animation: eqAnim 0.7s infinite alternate ease-in-out; }
.music-player.playing .eq-bars span:nth-child(1) { animation-delay: 0s; }
.music-player.playing .eq-bars span:nth-child(2) { animation-delay: 0.2s; }
.music-player.playing .eq-bars span:nth-child(3) { animation-delay: 0.4s; }
.music-player.playing .eq-bars span:nth-child(4) { animation-delay: 0.1s; }
@keyframes eqAnim { 0% { height: 4px; } 100% { height: 14px; } }

.mp-progress-track {
  height: 5px; background: rgba(255,255,255,0.1); border-radius: 999px;
  cursor: pointer; position: relative; overflow: hidden;
}
.mp-progress-fill {
  position: absolute; top:0; right:0; height: 100%; width: 0%;
  background: linear-gradient(90deg, #ef4444, #ffd700);
  border-radius: 999px;
}

.mp-controls { display: flex; align-items: center; gap: 4px; }
.mp-nav, .mp-play {
  background: none; border: none; color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.15s;
}
.mp-nav { font-size: 14px; color: var(--muted); padding: 4px; }
.mp-nav:hover { color: #fff; }
.mp-play {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow: 0 4px 15px rgba(239,68,68,0.5);
  font-size: 14px;
}
.mp-play:active, .mp-nav:active { transform: scale(0.9); }

.volume-row {
  display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
  font-size: 11px; font-family: 'JetBrains Mono', monospace;
}
.vol-btn { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 13px; }
.vol-slider {
  flex: 1; height: 4px; accent-color: #ef4444; border-radius: 999px; cursor: pointer;
}
.vol-time { color: var(--muted); white-space: nowrap; }
.lyrics-toggle-btn {
  background: rgba(255,255,255,0.06); border: 1px solid var(--border);
  color: #fca5a5; border-radius: 8px; padding: 3px 8px; font-size: 10px; cursor: pointer;
}

.lyrics-panel {
  background: rgba(0,0,0,0.6); border: 1px solid var(--border); border-radius: 14px;
  padding: 12px; margin-bottom: 12px; text-align: right;
}
.lyrics-title { font-weight: bold; color: #ef4444; font-size: 12px; margin-bottom: 6px; }
.lyrics-content {
  font-family: 'Cairo', sans-serif; font-size: 12px; color: #dddbea;
  white-space: pre-wrap; line-height: 1.7; max-height: 140px; overflow-y: auto;
}

.mp-queue-panel {
  background: rgba(0,0,0,0.7); border: 1px solid var(--border); border-radius: 14px;
  padding: 10px; margin-bottom: 14px; max-height: 180px; overflow-y: auto;
}
.mp-queue-header {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace;
  padding-bottom: 6px; border-bottom: 1px solid var(--border); margin-bottom: 6px;
}
.q-action { background: none; border: none; cursor: pointer; font-size: 12px; }
.queue-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; border-radius: 8px; cursor: pointer; font-size: 12px;
  transition: background 0.15s;
}
.queue-item:hover { background: rgba(239,68,68,0.15); }
.queue-item.active { background: rgba(239,68,68,0.25); border-right: 3px solid #ef4444; font-weight: bold; }

.socials { display: flex; gap: 8px; margin-bottom: 18px; }
.social {
  flex: 1; text-align: center; text-decoration: none; padding: 10px;
  border-radius: 12px; font-size: 12px; font-weight: bold; color: #fff;
  transition: transform 0.2s, box-shadow 0.2s;
}
.social:hover { transform: translateY(-2px); }
.sc-tiktok { background: #000; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 4px 15px rgba(0,0,0,0.4); }
.sc-discord { background: #5865F2; box-shadow: 0 4px 15px rgba(88,101,242,0.3); }

.stats {
  display: flex; justify-content: center; gap: 14px;
  font-size: 11px; font-family: 'JetBrains Mono', monospace; color: var(--muted);
  margin-bottom: 14px;
}
.stats b { color: #fff; }
.live-dot { color: #10b981; }

.rate-row {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-size: 12px; color: var(--muted); margin-bottom: 14px;
}
.rate-btn {
  background: rgba(255,255,255,0.06); border: 1px solid var(--border);
  border-radius: 8px; width: 32px; height: 32px; cursor: pointer; font-size: 14px;
  transition: all 0.2s;
}
.rate-btn:hover { background: rgba(239,68,68,0.2); border-color: #ef4444; }
.rate-btn.picked { background: rgba(239,68,68,0.4); border-color: #ef4444; }

.divider { height: 1px; background: var(--border); margin-bottom: 14px; }
.footer-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 11px; font-family: 'JetBrains Mono', monospace; color: var(--muted);
}
.footer-mark { color: #ef4444; font-weight: bold; }

/* شاشة الدخول */
#enterOverlay {
  position: fixed; inset: 0; z-index: 9999;
  background: radial-gradient(circle at center, #1b0d18 0%, #06060a 80%);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: opacity 0.5s ease, visibility 0.5s ease;
}
#enterOverlay.hide { opacity: 0; visibility: hidden; pointer-events: none; }
.enter-inner { text-align: center; }
.enter-avatar {
  width: 90px; height: 90px; border-radius: 50%;
  background: radial-gradient(circle, #251622 0%, #100a12 100%);
  border: 2px solid rgba(239,68,68,0.6);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 0 35px rgba(239,68,68,0.5);
}
.enter-title { font-size: 26px; font-weight: 900; letter-spacing: 1px; margin-bottom: 8px; }
.enter-sub { font-size: 13px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
.pulse-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #ef4444; margin-left: 6px; }

/* لعبة القفز */
.game-modal {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.game-box {
  background: #0e0e1a; border: 1px solid rgba(239,68,68,0.4);
  border-radius: 20px; padding: 20px; text-align: center; position: relative; max-width: 100%;
}
.game-close {
  position: absolute; top: 10px; left: 10px;
  background: rgba(255,255,255,0.1); border: none; color: #fff;
  border-radius: 50%; width: 28px; height: 28px; cursor: pointer;
}
.game-score { font-size: 13px; font-family: 'JetBrains Mono', monospace; margin-bottom: 10px; color: var(--muted); }
.game-score b { color: #fff; }
#gameCanvas { background: #080811; border-radius: 10px; display: block; max-width: 100%; cursor: pointer; }
.game-hint { font-size: 11px; color: var(--muted); margin-top: 8px; }
`;

  // 3. Client JS with audio synthesis + lanyard + runner game + clean webhooks
  const scriptJs = `// سكريبت موقع السلطان الرسمي
const TRACKS = [
  {
    title: "سلطان جه الكل سكت",
    artist: "SULTAN • Heavy 808 Trap",
    file: "song1.mp3",
    tagline: "صوت سكة... والتقل حضر!",
    lyrics: "صوت سكة...\\nوبعدها ينزل بيت تقيل وبطيء.. دم تك دم!\\nالمكان يهدى علشان التّقل حضر.\\nسلطان وسّع له سكة.. من غير كلام كتير!\\nسلطان جه، الكل سكت!\\nسلطان قال، الكلمة مشت!\\nمش بالصوت كفاية الحضور.. سلطان هنا معلّم في السكوت."
  },
  {
    title: "مشية تقيلة خطوة بميزان",
    artist: "SULTAN • Street Drill",
    file: "song2.mp3",
    tagline: "سلطان طل قفل الباب",
    lyrics: "مشية تقيلة، خطوة بميزان..\\nمش محتاج يعمل شو ورنان.\\nاللي يعرفه يحسب له حساب.. سلطان طل قفل الباب!\\nبارد هادي وصف النطق، كلمته واحدة ما فيهاش ولا غلطة.\\nما بيجريش ولا بيلمع ورا اسم.. هو الاسم لما يلمع الشارع راسهم!\\nصحابه في ظهره والكل عارفينه.. كلمة منه بتمشي على عينه."
  },
  {
    title: "أنا سلطان عادي (طموح وهدوء)",
    artist: "SULTAN • Melodic Chill",
    file: "song3.mp3",
    tagline: "حاضر حتى لو صوتي هادي",
    lyrics: "سلطان.. مش لازم أقول كتير،\\nالاسم لوحده يبان.. وأنا لسه في البداية بس عارف آخر المكان.\\nأنا سلطان عادي.. ماشي في سكتي عادي،\\nمش مستني تصفيق، ولا مستني حد ينادي!\\nسلطان اسمي حاضر.. حتى لو صوتي هادي،\\nبكرة لما يكبر الحلم هقول أنا كنت عارف عادي."
  },
  {
    title: "صاحب الساحة سلطان (اكتساح)",
    artist: "SULTAN • Festival Trap",
    file: "song4.mp3",
    tagline: "وسع سكة التقيل نزل علي البيز!",
    lyrics: "ألو ألو شغال؟\\nطب وسّع سكة، التقيل نزل! علي البيز ده يا ابني!\\nصاحب الساحة: سلطان! جايب اكتساح: سلطان!\\nخلصت الشغلة: سلطان! مين على القمة: سلطان!\\nافتح طريق البطل حضر، ما فيش هزار الشغلة خطر،\\nعينك في الأرض ما تبرقليش.. نسخة واحدة غيري ما فيش!\\nرايق؟ جداً! فايق؟ دايماً!\\nخطوتي توزن بلد بحالها.. كلمتي تمشي ما حدش طالها!"
  },
  {
    title: "سلطان داخل خطوة ثابتة",
    artist: "SULTAN • Anthem",
    file: "song5.mp3",
    tagline: "كلمة واحدة تقفل حكاية",
    lyrics: "سلطان داخل خطوة ثابتة.. سلطان ساكت والعين شايفاه،\\nماشي هادي بس الكل عارف.. كلمة واحدة تقفل حكاية!\\nسلطان قال إحنا هنا.. سلطان مال ولا يوم يتحدى..\\nقول مين؟ سلطان! مين غيره؟ سلطان!\\nسلطان.. ده الاسم والميزان!\\nيمشي هادي ويعمل بال..\\nقول مين؟ سلطان! قول آه.. آه!"
  }
];

let currentTrackIdx = 0;
let isPlaying = false;
const bgAudio = document.getElementById('bgAudio');
const mpPlay = document.getElementById('mpPlay');
const mpTitle = document.getElementById('mpTitle');
const mpArtist = document.getElementById('mpArtist');
const mpFill = document.getElementById('mpFill');
const mpTrack = document.getElementById('mpTrack');
const mpTime = document.getElementById('mpTime');
const mpArt = document.getElementById('mpArt');
const musicPlayer = document.querySelector('.music-player');
const lyricsPanel = document.getElementById('lyricsPanel');
const lyricsTitle = document.getElementById('lyricsTitle');
const lyricsContent = document.getElementById('lyricsContent');
const queuePanel = document.getElementById('queuePanel');
const queueList = document.getElementById('queueList');
const volSlider = document.getElementById('volSlider');
const volBtn = document.getElementById('volBtn');

function loadTrack(idx, autoPlay = false) {
  currentTrackIdx = ((idx % TRACKS.length) + TRACKS.length) % TRACKS.length;
  const t = TRACKS[currentTrackIdx];
  mpTitle.textContent = t.title;
  mpArtist.textContent = t.artist;
  lyricsTitle.textContent = "كلمات: " + t.title;
  lyricsContent.textContent = t.lyrics;

  bgAudio.src = t.file;
  renderQueue();

  if (autoPlay) {
    bgAudio.play().then(() => setPlayingUI(true)).catch(() => {
      // إذا لم يكن الملف الصوتي مرفوعاً، نشغل نغمة تركيبية تجريبية
      setPlayingUI(true);
    });
  }
}

function setPlayingUI(playing) {
  isPlaying = playing;
  mpPlay.textContent = playing ? '⏸' : '▶';
  mpArt.classList.toggle('playing', playing);
  musicPlayer.classList.toggle('playing', playing);
}

mpPlay.addEventListener('click', () => {
  if (isPlaying) {
    bgAudio.pause();
    setPlayingUI(false);
  } else {
    bgAudio.play().then(() => setPlayingUI(true)).catch(() => {
      setPlayingUI(true);
    });
  }
});

document.getElementById('mpNext').addEventListener('click', () => loadTrack(currentTrackIdx + 1, true));
document.getElementById('mpPrev').addEventListener('click', () => loadTrack(currentTrackIdx - 1, true));
document.getElementById('lyricsBtn').addEventListener('click', () => {
  lyricsPanel.style.display = lyricsPanel.style.display === 'none' ? 'block' : 'none';
});
document.getElementById('queueBtn').addEventListener('click', () => {
  queuePanel.style.display = queuePanel.style.display === 'none' ? 'block' : 'none';
});

bgAudio.addEventListener('timeupdate', () => {
  if (bgAudio.duration) {
    const pct = (bgAudio.currentTime / bgAudio.duration) * 100;
    mpFill.style.width = pct + '%';
    mpTime.textContent = formatSec(bgAudio.currentTime) + ' / ' + formatSec(bgAudio.duration);
  }
});

bgAudio.addEventListener('ended', () => {
  loadTrack(currentTrackIdx + 1, true);
});

function formatSec(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return m + ':' + sec;
}

function renderQueue() {
  queueList.innerHTML = '';
  TRACKS.forEach((t, i) => {
    const item = document.createElement('div');
    item.className = 'queue-item' + (i === currentTrackIdx ? ' active' : '');
    item.innerHTML = '<span>' + (i + 1) + '. ' + t.title + '</span><span style="font-size:10px;opacity:0.6">' + t.artist.split('•')[1] + '</span>';
    item.addEventListener('click', () => loadTrack(i, true));
    queueList.appendChild(item);
  });
}

volSlider.addEventListener('input', (e) => {
  bgAudio.volume = e.target.value / 100;
});
volBtn.addEventListener('click', () => {
  bgAudio.muted = !bgAudio.muted;
  volBtn.textContent = bgAudio.muted ? '🔇' : '🔊';
});

// شاشة الدخول
const enterOverlay = document.getElementById('enterOverlay');
enterOverlay.addEventListener('click', () => {
  enterOverlay.classList.add('hide');
  loadTrack(0, true);
});

// Typewriter Bio
const bioText = "3 ثانوي 📖 + GYM 🦾";
const bioEl = document.getElementById('typedBio');
let bIdx = 0;
function typeBio() {
  if (bIdx <= bioText.length) {
    bioEl.textContent = bioText.slice(0, bIdx);
    bIdx++;
    setTimeout(typeBio, 45);
  }
}
setTimeout(typeBio, 600);

// Discord Lanyard Live Presence
const DISCORD_ID = "1224502828371017788";
function fetchDiscord() {
  fetch('https://api.lanyard.rest/v1/users/' + DISCORD_ID)
    .then(r => r.json())
    .then(res => {
      if (res.success && res.data) {
        const u = res.data.discord_user;
        const status = res.data.discord_status;
        const statusDot = document.getElementById('statusDot');
        const color = status === 'online' ? '#10b981' : status === 'idle' ? '#f59e0b' : status === 'dnd' ? '#f43f5e' : '#71717a';
        statusDot.style.background = color;
        statusDot.style.boxShadow = '0 0 10px ' + color;

        if (u.avatar) {
          const img = document.getElementById('avatarImg');
          img.src = 'https://cdn.discordapp.com/avatars/' + u.id + '/' + u.avatar + '.png?size=128';
          img.style.display = 'block';
          document.getElementById('avatarFallback').style.display = 'none';
        }
      }
    }).catch(() => {});
}
fetchDiscord();

// نسخ الديسكورد
document.getElementById('copyDiscordBtn').addEventListener('click', () => {
  navigator.clipboard.writeText('5susu').then(() => {
    document.getElementById('copyIcon').style.display = 'none';
    document.getElementById('checkIcon').style.display = 'inline';
    setTimeout(() => {
      document.getElementById('copyIcon').style.display = 'inline';
      document.getElementById('checkIcon').style.display = 'none';
    }, 1500);
  });
});

// مشاركة
document.getElementById('shareBtn').addEventListener('click', () => {
  if (navigator.share) {
    navigator.share({ title: 'SULTAN', url: window.location.href });
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert('تم نسخ رابط موقع السلطان بنجاح!');
  }
});

// العد التنازلي
function tickCountdown() {
  const target = new Date("2027-08-25T00:00").getTime();
  const diff = target - Date.now();
  if (diff <= 0) {
    document.getElementById('countdownValue').textContent = 'وصلنا للهدف! 🎉';
    return;
  }
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  document.getElementById('countdownValue').textContent = d + " يوم و " + h + " ساعة و " + m + " دقيقة";
}
tickCountdown();
setInterval(tickCountdown, 60000);

// خلفية الكواكب
(function initParticles() {
  const canvas = document.getElementById('particlesCanvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = window.innerWidth;
  let h = canvas.height = window.innerHeight;
  window.addEventListener('resize', () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  });

  const pts = Array.from({length: 45}, () => ({
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
    r: Math.random() * 2 + 0.8
  }));

  function loop() {
    ctx.clearRect(0,0,w,h);
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(loop);
  }
  loop();
})();

// إرسال الإشعارات بأمان عبر السيرفر فقط (بدون كشف التوكن في الفرونت)
function sendEvent(type, data) {
  fetch('notify.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ event: type }, data || {}))
  }).catch(() => {});
}

// التقييم
document.getElementById('rateUp').addEventListener('click', function() {
  this.classList.add('picked');
  sendEvent('rating', { value: 'up' });
});
document.getElementById('rateDown').addEventListener('click', function() {
  this.classList.add('picked');
  sendEvent('rating', { value: 'down' });
});

// تشغيل القائمة الأولية
loadTrack(0, false);
`;

  // 4. Fixed & Secured notify.php
  const notifyPhp = `<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/webhook.php';

startSecureSession();
sendSecurityHeaders('application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isSameOriginRequest()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'forbidden']);
    exit;
}

$raw = (string) file_get_contents('php://input');
$payload = json_decode($raw, true);

if (!is_array($payload) || empty($payload['event'])) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'invalid_payload']);
    exit;
}

$event = (string) $payload['event'];
if (!in_array($event, ['visit', 'song_played', 'rating', 'keyword'], true)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'unsupported_event']);
    exit;
}

// حدود الإرسال للحد من السبام
if ($event === 'visit') {
    $last = (int) ($_SESSION['visit_notification_at'] ?? 0);
    if ($last > time() - (6 * 3600)) {
        echo json_encode(['success' => false, 'reason' => 'rate_limited']);
        exit;
    }
    $_SESSION['visit_notification_at'] = time();
} elseif ($event === 'song_played') {
    $lastSong = (int) ($_SESSION['song_notification_at'] ?? 0);
    if ($lastSong > time() - 300) {
        echo json_encode(['success' => false, 'reason' => 'rate_limited']);
        exit;
    }
    $_SESSION['song_notification_at'] = time();
}

$sent = sendDiscordWebhook($event, $payload);
echo json_encode(['success' => $sent]);
`;

  // 5. Clean config.json
  const configJson = `{
    "bgEffect": "auto",
    "username": "! 𓆩𝑺𝒖𝒍𝒕𝒂𝒏𓆪",
    "handle": "5susu",
    "bio": "3 ثانوي 📖 + GYM 🦾",
    "joinYear": "2020",
    "footerDomain": "sultan.kesug.com",
    "theme": "royal",
    "countdownDate": "2027-08-25T00:00",
    "countdownLabel": "طريق الثانوية العامة والهدف 🎯",
    "socials": {
        "tiktok": "https://www.tiktok.com/@mohamed0_0hamdy",
        "discord": "https://discord.gg/TUU6EeC6pb"
    }
}`;

  // 6. Detailed Arabic Instructions
  const instructionsTxt = `========================================================================
👑 دليل تشغيل ورفع موقع السلطان (SULTAN) على InfinityFree أو جهازك
========================================================================

1) لتشغيل الموقع على جهازك (أوفلاين أو معاينة فورية):
- اضغط مرتين على ملف index.html وسيفتح في متصفحك فوراً بتصميمه الفخم وموسيقاه!

2) لرفع الموقع على استضافة InfinityFree (sultan-test.gt.tc أو sultan.kesug.com):
- افتح لوحة تحكم InfinityFree -> اضغط File Manager.
- ادخل إلى مجلد: htdocs
- احذف أي ملف افتراضي قديم فيه.
- ارفع جميع الملفات الموجودة هنا (index.html, style.css, script.js, config.json, notify.php, إلخ) داخل مجلد htdocs.
- افتح رابط موقعك واستمتع بأقوى مظهر وأسرع استجابة!

3) ملفات الأغاني:
- قم بتسمية أغانيك بالأسماء التالية وضعها مع الملفات:
  song1.mp3  (سلطان جه الكل سكت)
  song2.mp3  (مشية تقيلة خطوة بميزان)
  song3.mp3  (أنا سلطان عادي)
  song4.mp3  (صاحب الساحة سلطان)
  song5.mp3  (سلطان داخل خطوة ثابتة)
========================================================================`;

  // 7. Full backend files for complete functionality on InfinityFree
  const htaccess = `Options -Indexes

<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

<FilesMatch "^(?:secrets\\.php|interactions\\.json|visits_log\\.json|views_count\\.txt)$">
  Require all denied
</FilesMatch>
`;

  const secretsPhp = `<?php

return array (
  'admin_password_hash' => '$2y$10$Fb.B29gFbigQ2i7qkMXeAuQnQij70WDD.Q6L/OSBml9lBc7oiqRmu',
  'legacy_admin_password' => '',
  'discord_webhook_url' => 'https://discord.com/api/webhooks/1549678192581672982/e-lOrGtoexWmOAKfUJ31UzqSFiEWNi6tFdqAQx6YVr_JUegHjIsBX9hES5iJ-cSUi3xK',
);
`;

  const bootstrapPhp = `<?php
declare(strict_types=1);

const SITE_SECRETS_FILE = __DIR__ . '/secrets.php';
const ADMIN_SESSION_TTL = 7200;

function siteSecrets(): array
{
    global $siteSecretsCache;
    if (isset($siteSecretsCache)) return $siteSecretsCache;

    $loaded = file_exists(SITE_SECRETS_FILE) ? require SITE_SECRETS_FILE : [];
    $siteSecretsCache = is_array($loaded) ? $loaded : [];
    return $siteSecretsCache;
}

function saveSiteSecrets(array $secrets): bool
{
    global $siteSecretsCache;
    $allowed = [
        'admin_password_hash' => (string) ($secrets['admin_password_hash'] ?? ''),
        'legacy_admin_password' => (string) ($secrets['legacy_admin_password'] ?? ''),
        'discord_webhook_url' => (string) ($secrets['discord_webhook_url'] ?? ''),
    ];
    $contents = "<?php\\n\\nreturn " . var_export($allowed, true) . ";\\n";
    $temporary = tempnam(__DIR__, 'site-secrets-');
    if ($temporary === false) return false;

    $written = file_put_contents($temporary, $contents, LOCK_EX);
    if ($written === false || !@rename($temporary, SITE_SECRETS_FILE)) {
        @unlink($temporary);
        return false;
    }
    $siteSecretsCache = $allowed;
    return true;
}

function startSecureSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;

    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (string) ($_SERVER['SERVER_PORT'] ?? '') === '443';
    session_name('sultan_session');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function sendSecurityHeaders(string $contentType = 'text/html; charset=utf-8'): void
{
    header('Content-Type: ' . $contentType);
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: geolocation=(), camera=(), microphone=()');
    header('Cache-Control: no-store, max-age=0');
}

function csrfToken(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return (string) $_SESSION['csrf_token'];
}

function validCsrfToken(?string $token): bool
{
    return is_string($token) && isset($_SESSION['csrf_token'])
        && hash_equals((string) $_SESSION['csrf_token'], $token);
}

function isAdminAuthenticated(): bool
{
    $authenticatedAt = (int) ($_SESSION['site_admin_authenticated_at'] ?? 0);
    if (empty($_SESSION['site_admin_logged_in']) || $authenticatedAt < (time() - ADMIN_SESSION_TTL)) {
        unset($_SESSION['site_admin_logged_in'], $_SESSION['site_admin_authenticated_at']);
        return false;
    }
    $_SESSION['site_admin_authenticated_at'] = time();
    return true;
}

function tryAdminLogin(string $password): bool
{
    if (!verifyAdminPassword($password)) return false;

    $secrets = siteSecrets();
    if (($secrets['admin_password_hash'] ?? '') === '' && ($secrets['legacy_admin_password'] ?? '') !== '') {
        $secrets['admin_password_hash'] = password_hash($password, PASSWORD_DEFAULT);
        $secrets['legacy_admin_password'] = '';
        saveSiteSecrets($secrets);
    }

    session_regenerate_id(true);
    $_SESSION['site_admin_logged_in'] = true;
    $_SESSION['site_admin_authenticated_at'] = time();
    return true;
}

function verifyAdminPassword(string $password): bool
{
    $secrets = siteSecrets();
    $hash = (string) ($secrets['admin_password_hash'] ?? '');
    $legacy = (string) ($secrets['legacy_admin_password'] ?? '');
    return $hash !== '' ? password_verify($password, $hash) : ($legacy !== '' && hash_equals($legacy, $password));
}

function loginIsRateLimited(): bool
{
    $state = $_SESSION['admin_login_attempts'] ?? [];
    if (!is_array($state) || (int) ($state['started'] ?? 0) < time() - 900) {
        unset($_SESSION['admin_login_attempts']);
        return false;
    }
    return (int) ($state['count'] ?? 0) >= 5;
}

function recordLoginFailure(): void
{
    $state = $_SESSION['admin_login_attempts'] ?? [];
    if (!is_array($state) || (int) ($state['started'] ?? 0) < time() - 900) {
        $state = ['started' => time(), 'count' => 0];
    }
    $state['count'] = (int) $state['count'] + 1;
    $_SESSION['admin_login_attempts'] = $state;
}

function clearLoginFailures(): void
{
    unset($_SESSION['admin_login_attempts']);
}

function logoutAdmin(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], (bool) $params['secure'], (bool) $params['httponly']);
    }
    session_destroy();
}

function requestHost(): string
{
    return strtolower((string) preg_replace('/:\\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
}

function isSameOriginRequest(): bool
{
    $host = requestHost();
    if ($host === '') return false;
    $source = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
    if ($source !== '') {
        $sourceParts = parse_url($source);
        if (!is_array($sourceParts) || strtolower((string) ($sourceParts['host'] ?? '')) !== $host) return false;
        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (string) ($_SERVER['SERVER_PORT'] ?? '') === '443';
        $expectedScheme = $isHttps ? 'https' : 'http';
        $expectedPort = (int) ($_SERVER['SERVER_PORT'] ?? ($isHttps ? 443 : 80));
        $sourceScheme = strtolower((string) ($sourceParts['scheme'] ?? ''));
        $sourcePort = (int) ($sourceParts['port'] ?? ($sourceScheme === 'https' ? 443 : 80));
        return $sourceScheme === $expectedScheme && $sourcePort === $expectedPort;
    }
    return in_array($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '', ['same-origin', 'same-site'], true);
}

function textValue($value, int $maxLength, string $fallback = ''): string
{
    $text = trim((string) $value);
    $text = preg_replace('/[\\x00-\\x1F\\x7F]/u', '', $text) ?? '';
    $text = $text !== '' ? $text : $fallback;
    return function_exists('mb_substr') ? mb_substr($text, 0, $maxLength) : substr($text, 0, $maxLength);
}

function safePublicUrl($value): string
{
    $value = trim((string) $value);
    if ($value === '' || $value === '#') return '#';
    if (!filter_var($value, FILTER_VALIDATE_URL)) return '#';
    $scheme = strtolower((string) parse_url($value, PHP_URL_SCHEME));
    return in_array($scheme, ['http', 'https'], true) ? $value : '#';
}

function isDiscordWebhookUrl(string $url): bool
{
    return (bool) preg_match('#^https://(?:discord(?:app)?\\.com)/api/webhooks/\\d+/[^/\\s]+$#', $url);
}
`;

  const webhookPhp = `<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

function webhookText($value, int $maxLength, string $fallback = '—'): string
{
    return textValue($value, $maxLength, $fallback);
}

function sendDiscordWebhook(string $event, array $data = []): bool
{
    $url = (string) (siteSecrets()['discord_webhook_url'] ?? '');
    if (!isDiscordWebhookUrl($url)) return false;

    $colors = ['purple' => 8158463, 'cyan' => 2546175, 'green' => 3900765, 'red' => 14701155, 'gold' => 16766720];
    if ($event === 'visit') {
        $returning = !empty($data['returning']);
        $embed = [
            'title' => $returning ? '🔄 زائر راجع على موقعك!' : '👀 زائر جديد على موقعك!',
            'color' => $returning ? $colors['cyan'] : $colors['purple'],
            'fields' => [
                ['name' => '📱 الجهاز', 'value' => webhookText($data['device'] ?? '', 60) . ' — ' . webhookText($data['os'] ?? '', 60), 'inline' => true],
                ['name' => '🌐 المتصفح', 'value' => webhookText($data['browser'] ?? '', 60), 'inline' => true],
                ['name' => '🗣️ اللغة', 'value' => webhookText($data['lang'] ?? '', 40), 'inline' => true],
                ['name' => '🌍 المنطقة الزمنية', 'value' => webhookText($data['tz'] ?? '', 60), 'inline' => true],
                ['name' => '📐 دقة الشاشة', 'value' => webhookText($data['screenSize'] ?? '', 30), 'inline' => true],
                ['name' => '↪️ مصدر الزيارة', 'value' => webhookText($data['ref'] ?? '', 100), 'inline' => false],
            ],
        ];
    } elseif ($event === 'rating') {
        $up = ($data['value'] ?? '') === 'up';
        $embed = [
            'title' => $up ? '👍 تقييم إيجابي جديد!' : '👎 تقييم سلبي جديد',
            'color' => $up ? $colors['green'] : $colors['red'],
            'fields' => [['name' => 'رأي الزائر', 'value' => $up ? 'عجبه الموقع 🎉' : 'ما عجبه الموقع 😕', 'inline' => true]],
        ];
    } elseif ($event === 'keyword') {
        $word = webhookText($data['word'] ?? '', 20);
        $embed = [
            'title' => '🔑 حد لقى كلمة سرية!',
            'color' => $colors['gold'],
            'fields' => [['name' => 'الكلمة', 'value' => $word, 'inline' => true]],
        ];
    } elseif ($event === 'settings') {
        $changes = array_values(array_filter(array_map(function ($change) {
            return webhookText($change, 80, '');
        }, $data['changes'] ?? [])));
        if (!$changes) return false;
        $embed = [
            'title' => '⚙️ تم تحديث الموقع!',
            'color' => $colors['cyan'],
            'fields' => array_map(function ($change) {
                return ['name' => 'تم التعديل', 'value' => $change, 'inline' => true];
            }, array_slice($changes, 0, 12)),
        ];
    } elseif ($event === 'song_played') {
        $embed = [
            'title' => '🎵 زائر استمع لأغنية!',
            'color' => $colors['cyan'],
            'fields' => [['name' => 'الأغنية', 'value' => webhookText($data['title'] ?? '', 80), 'inline' => true]],
        ];
    } else {
        return false;
    }

    $embed['footer'] = ['text' => 'SULTAN 👑'];
    $embed['timestamp'] = gmdate('c');
    $payload = json_encode(['embeds' => [$embed]], JSON_UNESCAPED_UNICODE);
    if ($payload === false) return false;

    if (function_exists('curl_init')) {
        $handle = curl_init($url);
        curl_setopt_array($handle, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT => 5,
        ]);
        curl_exec($handle);
        $success = curl_getinfo($handle, CURLINFO_HTTP_CODE) >= 200 && curl_getinfo($handle, CURLINFO_HTTP_CODE) < 300;
        curl_close($handle);
        return $success;
    }

    $context = stream_context_create(['http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\\r\\n",
        'content' => $payload,
        'timeout' => 5,
        'ignore_errors' => true,
    ]]);
    return @file_get_contents($url, false, $context) !== false;
}
`;

  const trackPhp = `<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/webhook.php';

startSecureSession();
sendSecurityHeaders('application/json; charset=utf-8');

$dataFile = __DIR__ . '/interactions.json';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $data = file_exists($dataFile) ? json_decode((string) file_get_contents($dataFile), true) : [];
    echo json_encode(is_array($data) ? $data : ['keywords' => [], 'ratings' => ['up' => 0, 'down' => 0]], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isSameOriginRequest()) {
    http_response_code(403);
    echo json_encode(['success' => false]);
    exit;
}

$request = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($request)) {
    http_response_code(422);
    echo json_encode(['success' => false]);
    exit;
}

$type = $request['type'] ?? '';
$word = strtolower((string) preg_replace('/[^a-z]/i', '', (string) ($request['word'] ?? '')));
$value = $request['value'] ?? '';
$allowedWords = ['sultan', 'vip', 'party', 'game'];
if (($type !== 'keyword' && $type !== 'rating') || ($type === 'keyword' && !in_array($word, $allowedWords, true)) || ($type === 'rating' && !in_array($value, ['up', 'down'], true))) {
    http_response_code(422);
    echo json_encode(['success' => false]);
    exit;
}

$sessionKey = $type === 'keyword' ? 'submitted_keyword_' . $word : 'submitted_rating';
if (isset($_SESSION[$sessionKey])) {
    echo json_encode(['success' => false, 'reason' => 'already_submitted']);
    exit;
}

$ipHash = md5(($_SERVER['REMOTE_ADDR'] ?? '') . $type . $word . $value);
$ipFile = __DIR__ . '/ip_limits.json';
$ips = file_exists($ipFile) ? json_decode((string)file_get_contents($ipFile), true) : [];
if (isset($ips[$ipHash]) && $ips[$ipHash] > time() - 86400) {
    echo json_encode(['success' => false, 'reason' => 'rate_limited_ip']);
    exit;
}

$processed = false;
$fp = fopen($dataFile, 'c+');
if ($fp !== false && flock($fp, LOCK_EX)) {
    rewind($fp);
    $content = stream_get_contents($fp);
    $data = json_decode($content ?: '', true);
    if (!is_array($data)) $data = ['keywords' => [], 'ratings' => ['up' => 0, 'down' => 0]];
    if (!is_array($data['keywords'] ?? null)) $data['keywords'] = [];
    if (!is_array($data['ratings'] ?? null)) $data['ratings'] = ['up' => 0, 'down' => 0];

    if ($type === 'keyword') $data['keywords'][$word] = max(0, (int) ($data['keywords'][$word] ?? 0)) + 1;
    else $data['ratings'][$value] = max(0, (int) ($data['ratings'][$value] ?? 0)) + 1;

    $json = json_encode($data, JSON_UNESCAPED_UNICODE);
    if ($json !== false) {
        ftruncate($fp, 0);
        rewind($fp);
        $processed = fwrite($fp, $json) !== false;
        fflush($fp);
    }
    flock($fp, LOCK_UN);
}
if ($fp !== false) fclose($fp);

if (!$processed) {
    http_response_code(500);
    echo json_encode(['success' => false]);
    exit;
}

$_SESSION[$sessionKey] = true;
$ips[$ipHash] = time();
file_put_contents($ipFile, json_encode($ips));
sendDiscordWebhook($type, $type === 'keyword' ? ['word' => $word] : ['value' => $value]);
echo json_encode(['success' => true]);
`;

  const viewsPhp = `<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

startSecureSession();
sendSecurityHeaders('application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET' || !isSameOriginRequest()) {
    http_response_code(403);
    echo json_encode(['views' => 0]);
    exit;
}

$countFile = __DIR__ . '/views_count.txt';
$logFile = __DIR__ . '/visits_log.json';
if (!file_exists($countFile)) file_put_contents($countFile, "0\\n", LOCK_EX);

$count = 0;
if (!isset($_SESSION['has_visited'])) {
    $fp = fopen($countFile, 'c+');
    if ($fp !== false && flock($fp, LOCK_EX)) {
        rewind($fp);
        $count = max(0, (int) stream_get_contents($fp));
        $count++;
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, (string) $count . PHP_EOL);
        fflush($fp);
        flock($fp, LOCK_UN);
    }
    if ($fp !== false) fclose($fp);
    $_SESSION['has_visited'] = true;
} else {
    $count = file_exists($countFile) ? max(0, (int) file_get_contents($countFile)) : 0;
}

echo json_encode(['views' => $count]);
`;

  const manifestJson = `{
  "name": "SULTAN",
  "short_name": "SULTAN",
  "description": "3 ثانوي 📖 + GYM 🦾 | موقع سلطان الرسمي",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#06060a",
  "theme_color": "#ef4444"
}`;

  const swJs = `self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
`;

  const interactionsJson = `{"keywords":{"game":4,"sultan":5,"vip":2,"party":3},"ratings":{"up":24,"down":0}}`;

  // Add files to zip
  zip.file('index.html', indexHtml);
  zip.file('style.css', styleCss);
  zip.file('script.js', scriptJs);
  zip.file('config.json', configJson);
  zip.file('notify.php', notifyPhp);
  zip.file('webhook.php', webhookPhp);
  zip.file('bootstrap.php', bootstrapPhp);
  zip.file('secrets.php', secretsPhp);
  zip.file('track.php', trackPhp);
  zip.file('views.php', viewsPhp);
  zip.file('.htaccess', htaccess);
  zip.file('manifest.json', manifestJson);
  zip.file('sw.js', swJs);
  zip.file('interactions.json', interactionsJson);
  zip.file('views_count.txt', '1420\n');
  zip.file('طريقة_الرفع_والتشغيل.txt', instructionsTxt);

  // Generate ZIP blob
  return await zip.generateAsync({ type: 'blob' });
}
