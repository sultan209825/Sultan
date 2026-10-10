import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Bot,
  Sparkles,
  Crown,
  User,
  RotateCcw,
  MessageSquare,
  Zap,
  Music,
  Gamepad2,
  Smile,
  Copy,
  Check
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import { checkSpamShield } from '../utils/spamShield';

interface ChatMessage {
  id: string;
  sender: 'user' | 'sultan_ai';
  text: string;
  time: string;
}

interface SultanAICompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMusicModal?: () => void;
  onOpenGameModal?: () => void;
}

const QUICK_PROMPTS = [
  'مين هو سلطان؟ احكيلي عنه 👑',
  'ألعاب السلطان وفالورانت 🎮',
  'روتين السلطان في الجيم 🦾',
  'رشحلي تراك راب ملكي 🎵',
  'سيرفر الديسكورد Friends For Ever 💬',
  'نكتة رايقة على السريع 😂'
];

export const SultanAICompanionModal: React.FC<SultanAICompanionModalProps> = ({
  isOpen,
  onClose,
  onOpenMusicModal,
  onOpenGameModal
}) => {
  const getInitialWelcome = () => {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'صباح الروقان والسلطنة' : 'مساء الفخامة والجمال';
    return `${timeGreeting} يا غالي! 👑 نورت مملكة السلطان وخطوتك عزيزة علينا والله 🤍\n\nأنا رفيق السلطان ومساعده الشخصي.. دمي خفيف ولساني حلو ومعاك في أي حاجة: حكاية السلطان، الجيم والتمرين 🦾، كلتشات فالورانت 🎮، سيرفر الديسكورد، أو أحسن تراك تسمعه بمزاج!\n\nتحب نبدأ بإيه يا كبير؟ ✨`;
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'sultan_ai',
      text: getInitialWelcome(),
      time: 'الآن'
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, isLoading]);

  if (!isOpen) return null;

  const handleResetChat = () => {
    audioEngine.playClickSound();
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        sender: 'sultan_ai',
        text: getInitialWelcome(),
        time: 'الآن'
      }
    ]);
  };

  const handleCopyMessage = async (msgId: string, text: string) => {
    audioEngine.playClickSound();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch {}
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const shield = checkSpamShield('ai_chat', 2, 2);
    if (!shield.allowed) {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'sultan_ai',
          text: shield.message || 'على مهلك يا بطل! 🛡️ اديني ثانية أتنفس وأرد عليك بروقان 😉',
          time: 'الآن'
        }
      ]);
      return;
    }

    audioEngine.playClickSound();
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Map history for backend
      const history = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history })
      });

      const data = await res.json();
      const reply = data.reply || 'يا مراحب بيك يا غالي! 👑 نورت مملكة السلطان ودايماً منورنا 🤍';

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'sultan_ai',
          text: reply,
          time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      audioEngine.playNotificationPing();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'sultan_ai',
          text: 'يا هلا بيك يا برنس! 👑 النت يمكن غمز شوية، بس أنا في ضهرك دايماً.. تصفح الأغاني براحتك أو انضم لسيرفر الديسكورد Friends For Ever عشان تلاقينا هناك لايف! 🔥',
          time: 'الآن'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    audioEngine.playClickSound();
    onClose();
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-[9995] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#0c0d16] border border-amber-500/40 rounded-3xl shadow-2xl shadow-amber-500/20 text-white flex flex-col h-[620px] max-h-[92vh] overflow-hidden animate-modal-slide-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-amber-950/40 via-purple-950/20 to-black">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/30">
                <Crown size={22} className="text-amber-100 animate-bounce-subtle" />
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0c0d16] absolute -top-0.5 -right-0.5 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-sm text-white font-display-custom">
                  مساعد السلطان الشخصي (Sultan's Companion)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 font-bold border border-amber-500/30">
                  كاريزما وقبول 👑
                </span>
              </div>
              <p className="text-[10px] text-zinc-400">
                ذكي، دمه خفيف، وبيرد عليك بروقان ملكي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleResetChat}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="بدء محادثة جديدة"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((m) => {
            const isAi = m.sender === 'sultan_ai';
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${isAi ? 'justify-start' : 'justify-end'} group`}
              >
                {isAi && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shrink-0 shadow-md">
                    <Crown size={15} />
                  </div>
                )}

                <div
                  className={`relative max-w-[84%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    isAi
                      ? 'bg-gradient-to-br from-amber-950/30 via-zinc-900 to-zinc-950 border border-amber-500/30 text-zinc-100 shadow-md'
                      : 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-medium shadow-md shadow-red-600/20'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  
                  <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-white/5 text-[9px] font-mono">
                    <span className={isAi ? 'text-zinc-500' : 'text-red-200'}>
                      {m.time}
                    </span>
                    {isAi && (
                      <button
                        onClick={() => handleCopyMessage(m.id, m.text)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                        title="نسخ الرد"
                      >
                        {copiedMsgId === m.id ? (
                          <>
                            <Check size={11} className="text-emerald-400" />
                            <span className="text-emerald-400">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {!isAi && (
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-zinc-300 shrink-0">
                    <User size={15} />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-amber-300/90 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 w-fit">
              <Bot size={15} className="animate-spin text-amber-400" />
              <span className="font-mono">السلطان يكتب لك رداً كاريزماتياً... 👑</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-2 border-t border-white/5 bg-white/[0.02] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {QUICK_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-amber-500/20 hover:border-amber-500/40 border border-white/10 text-[10px] text-zinc-300 hover:text-amber-200 shrink-0 transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-white/10 bg-black/60 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="اسأل رفيق السلطان أي حاجة.. دمه خفيف وبيرد عليك بروقان! 💬"
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/70 transition-colors"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 hover:from-amber-400 hover:to-rose-400 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-amber-500/20 cursor-pointer active:scale-95"
            aria-label="إرسال"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
