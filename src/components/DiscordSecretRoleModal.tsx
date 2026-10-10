import React, { useState } from 'react';
import { Crown, Sparkles, Check, ExternalLink, ShieldCheck, Zap, User, AlertCircle, HelpCircle, Clock, Trash2, UserX } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../utils/audioEngine';
import { recordSiteLog } from '../utils/siteLogger';
import { sendEmailNotification } from '../utils/emailNotifier';

export function getRoleClaimStatus(): { isClaimed: boolean; remainingMinutes: number; detail: string; claimedUser: string } {
  try {
    const isClaimedStr = localStorage.getItem('sultan_discord_role_claimed');
    if (isClaimedStr !== 'true') {
      return { isClaimed: false, remainingMinutes: 0, detail: '', claimedUser: '' };
    }

    const claimedAtStr = localStorage.getItem('sultan_discord_role_claimed_at');
    const ONE_HOUR_MS = 60 * 60 * 1000; // 1 hour = 3600000ms

    if (claimedAtStr) {
      const claimedAt = parseInt(claimedAtStr, 10);
      const diff = Date.now() - claimedAt;

      // If 1 hour or more has passed: automatically reset!
      if (diff >= ONE_HOUR_MS) {
        localStorage.removeItem('sultan_discord_role_claimed');
        localStorage.removeItem('sultan_discord_role_claimed_detail');
        localStorage.removeItem('sultan_discord_claimed_user');
        localStorage.removeItem('sultan_discord_role_claimed_at');
        return { isClaimed: false, remainingMinutes: 0, detail: '', claimedUser: '' };
      }

      const remainingMinutes = Math.max(1, Math.ceil((ONE_HOUR_MS - diff) / 60000));
      const detail = localStorage.getItem('sultan_discord_role_claimed_detail') || '';
      const claimedUser = localStorage.getItem('sultan_discord_claimed_user') || '';
      return { isClaimed: true, remainingMinutes, detail, claimedUser };
    }

    // Default to 1 hour if timestamp was missing
    localStorage.setItem('sultan_discord_role_claimed_at', Date.now().toString());
    return { isClaimed: true, remainingMinutes: 60, detail: '', claimedUser: '' };
  } catch {
    return { isClaimed: false, remainingMinutes: 0, detail: '', claimedUser: '' };
  }
}

interface DiscordSecretRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  discordUrl?: string;
  roleName?: string;
  isRoleClaimed?: boolean;
  onRoleClaimed?: () => void;
}

export const DiscordSecretRoleModal: React.FC<DiscordSecretRoleModalProps> = ({
  isOpen,
  onClose,
  discordUrl = 'https://discord.gg/TUU6EeC6pb',
  roleName = '𓆩𝑺𝒖𝒍𝒕𝒂𝒏 VIP𓆪',
  isRoleClaimed = false,
  onRoleClaimed
}) => {
  const [discordIdentifier, setDiscordIdentifier] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'assigning' | 'ready' | 'error'>('idle');
  const [roleAction, setRoleAction] = useState<'added' | 'removed'>('added');
  const [isNotInServer, setIsNotInServer] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successDetail, setSuccessDetail] = useState<string>('');
  const [remainingMins, setRemainingMins] = useState<number>(60);

  // Check localStorage on open with 1-hour auto-reset check
  React.useEffect(() => {
    if (isOpen) {
      const claimInfo = getRoleClaimStatus();

      if (claimInfo.isClaimed) {
        setStatus('ready');
        setRoleAction('added');
        setRemainingMins(claimInfo.remainingMinutes);
        setSuccessDetail(
          claimInfo.detail ||
            (claimInfo.claimedUser
              ? `تم تفعيل رتبة ${roleName} لحسابك (${claimInfo.claimedUser}) بنجاح! 👑`
              : `تم تفعيل رتبة ${roleName} بنجاح مسبقاً في حسابك! 👑`)
        );
      } else {
        setStatus('idle');
        setSuccessDetail('');
      }
      setErrorMessage('');
      setIsNotInServer(false);
    }
  }, [isOpen, roleName]);

  if (!isOpen) return null;

  // Read saved config
  const configStr = localStorage.getItem('sultan_site_config');
  const config = configStr ? JSON.parse(configStr) : {};
  const autoRoleCfg = config.discordAutoRole || {};

  const handleAssignRoleAndJoin = async () => {
    setErrorMessage('');
    setIsNotInServer(false);

    const identifier = discordIdentifier.trim();

    if (!identifier) {
      setStatus('error');
      setErrorMessage('يرجى كتابة الآيدي الرقمي لحسابك (User ID) أو يوزرك بالديسكورد أولاً!');
      return;
    }

    setStatus('assigning');

    // Direct Discord REST API Call via api_discord_assign.php (InfinityFree native) or dev server
    try {
      const payload = {
        userId: identifier,
        guildId: autoRoleCfg.guildId,
        roleId: autoRoleCfg.roleId,
        botToken: autoRoleCfg.botToken
      };

      let resText = '';
      let isSuccessJson = false;
      let resData: any = null;

      // 1. First attempt: Vercel Serverless / dev server endpoint (/api/discord/assign-role)
      try {
        const devResponse = await fetch('/api/discord/assign-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        resText = await devResponse.text();
        if (resText.trim().startsWith('{') || resText.trim().startsWith('[')) {
          resData = JSON.parse(resText);
          isSuccessJson = true;
        }
      } catch (e) {}

      // 2. Second attempt: call api_discord_assign.php (works on InfinityFree)
      if (!isSuccessJson || resData?.message?.includes('Could not resolve host') || resData?.error?.includes('Could not resolve host')) {
        try {
          const phpResponse = await fetch('/api_discord_assign.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const phpText = await phpResponse.text();
          if (phpText.trim().startsWith('{') || phpText.trim().startsWith('[')) {
            resData = JSON.parse(phpText);
            isSuccessJson = true;
          }
        } catch (e) {}
      }

      // 3. Third attempt: If local hosting blocks outgoing connections (InfinityFree Could not resolve host error):
      if (!isSuccessJson || resData?.message?.includes('Could not resolve host') || resData?.error?.includes('Could not resolve host')) {
        const cloudProxy = autoRoleCfg.apiProxyUrl?.trim() || 'https://ais-pre-knb6cnmdjserbwyeurhsdn-925476069651.europe-west2.run.app';
        try {
          const proxyResponse = await fetch(`${cloudProxy.replace(/\/+$/, '')}/api_discord_assign.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const proxyText = await proxyResponse.text();
          if (proxyText.trim().startsWith('{') || proxyText.trim().startsWith('[')) {
            resData = JSON.parse(proxyText);
            isSuccessJson = true;
          }
        } catch (e) {}
      }

      if (!isSuccessJson) {
        throw new Error('لم يتم العثور على سكربت البوت (api_discord_assign.php). يرجى التأكد من رفع ملف "api_discord_assign.php" داخل مجلد htdocs على الاستضافة.');
      }

      if (resData.success) {
        if (resData.action === 'removed') {
          // Role was already attached and has now been removed!
          setRoleAction('removed');
          const detail = resData.message || 'الرتبة كانت مضافة لحسابك بالفعل، وتمت إزالتها بنجاح الآن! 🗑️';
          setSuccessDetail(detail);
          setStatus('ready');
          try {
            localStorage.removeItem('sultan_discord_role_claimed');
            localStorage.removeItem('sultan_discord_role_claimed_detail');
            localStorage.removeItem('sultan_discord_role_claimed_at');
            localStorage.removeItem('sultan_discord_claimed_user');
          } catch {}
          recordSiteLog('إزالة رتبة عبر البوت 🗑️', `تمت إزالة رتبة ${roleName} من العضو: ${identifier || 'المستخدم'}`);
          return;
        } else {
          // Role was not attached and has now been added!
          setRoleAction('added');
          const detail = resData.message || `تم منح رتبة ${roleName} لحسابك بنجاح تام! 👑`;
          setSuccessDetail(detail);
          setStatus('ready');
          audioEngine.playRoyalFanfare();
          confetti({
            particleCount: 110,
            spread: 90,
            origin: { y: 0.5 }
          });
          try {
            localStorage.setItem('sultan_discord_role_claimed', 'true');
            localStorage.setItem('sultan_discord_role_claimed_detail', detail);
            localStorage.setItem('sultan_discord_role_claimed_at', Date.now().toString());
            if (identifier) {
              localStorage.setItem('sultan_discord_claimed_user', identifier);
            }
          } catch {}
          onRoleClaimed?.();
          recordSiteLog('منح رتبة تلقائية عبر البوت 👑', `تم منح رتبة ${roleName} للعضو: ${identifier || 'المستخدم'}`);
          return;
        }
      } else {
        // Error handling: check if user is not in the server
        const notInServer =
          Boolean(resData.notInServer) ||
          (resData.message && resData.message.includes('ليس عضواً')) ||
          (resData.message && resData.message.includes('ليس موجوداً')) ||
          (resData.message && resData.message.includes('تعذر العثور'));

        setIsNotInServer(notInServer);
        setErrorMessage(
          resData.message ||
            (notInServer
              ? 'هذا الحساب ليس عضواً في السيرفر! يجب دخول السيرفر أولاً.'
              : 'حدث خطأ أثناء الاتصال بالديسكورد.')
        );
        setStatus('error');
        return;
      }
    } catch (err: any) {
      console.warn('API role assign network issue:', err);
      setStatus('error');
      setIsNotInServer(false);
      setErrorMessage(err?.message || 'تعذر الاتصال بسيرفر الديسكورد. تأكد من اتصال الإنترنت وصلاحيات البوت.');
    }
  };

  const handleOpenDiscord = () => {
    recordSiteLog('دخول الديسكورد بالرتبة 🚀', 'فتح رابط سيرفر الديسكورد');
    window.open(discordUrl, '_blank', 'noopener,noreferrer');
  };

  const handleClose = () => {
    window.dispatchEvent(new CustomEvent('sultan-clear-hover-state'));
    window.dispatchEvent(new CustomEvent('hide-custom-tooltip'));
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    audioEngine.playClickSound();
    onClose();
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-[#0e0e15] border border-amber-500/30 p-6 shadow-2xl shadow-amber-500/20 space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
              <Crown size={24} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white font-display-custom flex items-center gap-1.5">
                <span>مفاجأة السلطان الملكية!</span>
                <Sparkles size={16} className="text-amber-400" />
              </h2>
              <p className="text-xs text-amber-300 font-bold">
                رتبة تلقائية فورية في سيرفر الديسكورد 👑
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        {/* Role Highlight Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-950/30 to-red-950/20 border border-amber-500/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block">الرتبة في السيرفر:</span>
                <span className="text-sm font-black text-amber-300 font-display-custom">
                  {roleName}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300 font-mono">
              Auto Role ⚡
            </span>
          </div>

          <p className="text-xs text-zinc-300 mt-2.5 leading-relaxed">
            إذا لم تكن الرتبة لديك ستتم إضافتها فوراً، وإذا كانت مضافة مسبقاً فسيتم إزالتها تلقائياً!
          </p>
        </div>

        {status === 'idle' && (
          <div className="space-y-4">
            {/* Input for Discord User ID or Username */}
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User size={13} className="text-amber-400" />
                  <span>آيدي حسابك أو يوزرك بالديسكورد:</span>
                </span>
                <span className="text-[10px] text-zinc-400">User ID / Username</span>
              </label>
              <input
                type="text"
                value={discordIdentifier}
                onChange={(e) => setDiscordIdentifier(e.target.value)}
                placeholder="مثال: 925476069651 أو @username"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-amber-500 focus:outline-none text-white text-xs placeholder:text-zinc-500 font-mono"
              />
              <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
                <HelpCircle size={11} className="text-amber-400/80" />
                <span>كيف تنسخ الآيدي؟ كليك يمين على اسمك في الديسكورد ➔ Copy User ID</span>
              </p>
            </div>

            {/* Instant Role Activation / Toggle Button */}
            <button
              onClick={handleAssignRoleAndJoin}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:opacity-95 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <Zap size={20} className="text-yellow-200 animate-bounce" />
              <span>تفعيل / تبديل رتبة {roleName} ⚡</span>
            </button>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-zinc-300 leading-relaxed space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                <span>👑 تحكم ذكي بالرتبة:</span>
              </div>
              <p>
                اكتب آيدي أو يوزر حسابك ثم اضغط على زر التفعيل: إذا كنت عضواً بالسيرفر سيتم إضافة الرتبة (أو إزالتها إن كانت معك)، وإن لم تكن بالسيرفر سيطلب منك الدخول أولاً!
              </p>
            </div>
          </div>
        )}

        {status === 'assigning' && (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto" />
            <h3 className="text-sm font-bold text-white">جارٍ فحص العضوية وتحديث رتبة {roleName}...</h3>
            <p className="text-xs text-zinc-400">ثانية واحدة وسيتم تأكيد العملية...</p>
          </div>
        )}

        {status === 'ready' && (
          <div className="space-y-4 animate-in zoom-in-95 duration-200">
            {roleAction === 'removed' ? (
              /* Case 1: Role Was Removed */
              <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-950/60 to-red-950/40 border border-amber-500/50 text-center space-y-3 shadow-lg shadow-amber-500/10">
                <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 mx-auto flex items-center justify-center shadow-inner">
                  <Trash2 size={28} className="stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white">
                    تمت إزالة الرتبة بنجاح! 🗑️
                  </h3>
                  <span className="inline-block px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">
                    {roleName} • تمت إزالتها من حسابك
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed pt-1">
                  {successDetail}
                </p>
              </div>
            ) : (
              /* Case 2: Role Was Added */
              <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-950/60 to-emerald-900/30 border border-emerald-500/50 text-center space-y-3 shadow-lg shadow-emerald-500/10">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto flex items-center justify-center shadow-inner">
                  <Check size={30} className="stroke-[3]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white">
                    تم التفعيل بنجاح! 👑
                  </h3>
                  <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                    {roleName} • مفعّلة في حسابك
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed pt-1">
                  {successDetail}
                </p>
                <div className="pt-2 border-t border-emerald-500/20 text-[11px] text-emerald-200/90 flex items-center justify-center gap-1.5 font-mono-custom">
                  <Clock size={13} className="text-emerald-400" />
                  <span>إعادة التعيين التلقائية بعد: <strong className="text-white">{remainingMins} دقيقة</strong> (تتجدد كل ساعة)</span>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              <button
                onClick={handleOpenDiscord}
                className="w-full py-4 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#5865F2]/40 transition-all active:scale-95 cursor-pointer"
              >
                <span>🚀 دخول سيرفر الديسكورد</span>
                <ExternalLink size={18} />
              </button>

              <button
                onClick={() => setStatus('idle')}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer border border-white/5 font-medium"
              >
                {roleAction === 'removed' ? 'إعادة إضافة الرتبة لحسابي 👑' : 'تعديل أو إزالة الرتبة ⚡'}
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 animate-in zoom-in-95 duration-200">
            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 mx-auto flex items-center justify-center">
                {isNotInServer ? <UserX size={26} /> : <AlertCircle size={26} />}
              </div>
              <h3 className="text-sm font-black text-white">
                {isNotInServer ? 'الحساب ليس في السيرفر! ⚠️' : 'تنبيه في تفعيل الرتبة'}
              </h3>
              <p className="text-xs text-red-200/90 leading-relaxed font-bold">
                {errorMessage}
              </p>
              {isNotInServer && (
                <p className="text-[11px] text-zinc-300 pt-1">
                  يجب عليك الدخول إلى السيرفر أولاً حتى يستطيع البوت إعطاءك أو إزالة الرتبة من حسابك!
                </p>
              )}
            </div>

            <div className="space-y-2">
              {/* Helpful tip box */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-zinc-300 space-y-1 text-right">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <HelpCircle size={13} />
                  <span>إذا كنت داخل السيرفر بالفعل:</span>
                </span>
                <p className="leading-relaxed text-zinc-200">
                  استخدم <strong>الآيدي الرقمي لحسابك (User ID)</strong> المكون من 18-19 رقماً بدلاً من الاسم، حيث يتعرف عليه البوت مباشرة بنسبة 100%.
                </p>
                <p className="text-[10px] text-amber-200/90 font-mono">
                  (كليك يمين على صورتك أو اسمك في الديسكورد ➔ Copy User ID)
                </p>
              </div>

              <button
                onClick={handleOpenDiscord}
                className="w-full py-3.5 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#5865F2]/30 transition-all active:scale-95 cursor-pointer"
              >
                <span>{isNotInServer ? '🚀 دخول سيرفر الديسكورد أولاً' : 'دخول السيرفر بالديسكورد 💬'}</span>
                <ExternalLink size={16} />
              </button>

              <button
                onClick={() => setStatus('idle')}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-amber-300 hover:text-white transition-colors cursor-pointer border border-white/5 font-bold"
              >
                🔄 محاولة أخرى وكتابة الآيدي الرقمي (User ID)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
