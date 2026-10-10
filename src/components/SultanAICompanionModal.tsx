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

  const generateCharismaticFallback = (userText: string): string => {
    const msg = userText.toLowerCase().trim();

    if (/^(صباح|مسا|سلام|ازيك|عامل ايه|اخبارك|هلا|مرحبا|هاي|hello|hi|منور)/.test(msg) || msg === 'سلام عليكم' || msg === 'السلام عليكم') {
      const greetings = [
        'يا مراحب بيك يا غالي! 👑 نورت قصر ومملكة السلطان.. خطوتك عزيزة علينا والله، يومك رايق بإذن الله! تشرب قهوتك ونبدأ سوا؟ ☕✨',
        'وعليكم السلام يا هلا بالورد والفخامة! 🤍 نورتنا يا برنس، أنا المساعد الملكي للسلطان ومعاك في أي حاجة تحبها. عامل إيه طمني عنك؟ 👑',
        'أهلاً أهلاً يا بطل! 👑 طلتك دي دايماً بتنور الموقع.. أنا تحت أمرك، تحب تسمع تراك رايق ولا ندردش في الجيمنج والحديد؟ 🎮🦾'
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    if (msg.includes('مين') || msg.includes('سلطان') || msg.includes('عرفني') || msg.includes('شخصيته') || msg.includes('قصت') || msg.includes('حكايت')) {
      return 'سلطان ده قصة كفاح وروقان في نفس الوقت! 👑 طالب ثانوية عامة دفعة 2027، بيعافر في المذاكرة عشان يوصل لأعلى قمة 📚، وفي نفس الوقت ملتزم بتمارين الجيم وبناء العضلات 🦾، وملك الكلتشات في فالورانت برينا 🎮. وصاحب سيرفر Friends For Ever.. الأهم من كل ده إنه صاحب جدع ومحترم وبيحب الناس! منورنا يا غالي 🤍';
    }

    if (msg.includes('جيم') || msg.includes('تمرين') || msg.includes('عضل') || msg.includes('حديد') || msg.includes('دايت') || msg.includes('بروتين') || msg.includes('كرياتين') || msg.includes('بنش') || msg.includes('سكوات') || msg.includes('باي')) {
      const gymTips = [
        'الحديد ما بيهزرش! 🦾 قاعدة السلطان الذهبية: "انضباط + أكل نظيف وتغذية محسوبة + نوم 8 ساعات". الالتزام مش إنك تتمرن وأنت متحمس، الالتزام إنك تنزل وأنت مش قادر وتفرتك الأوزان! عاش يا وحش 💪🔥',
        'يا كابتن! 🦾 في الجيم مفيش أسرار: تمرينة بنش تقيلة، تركيز على الحركة السلبية (Eccentric)، بروتينك اليومي، وأهم حاجة أوعى تهمل شرب المية والنوم. فورمة السلطان بتتبني بالعرق والصبر! 🦍🔥',
        'عاش يا بطل! 🦾 لو بتدور على الضخامة: العب بمدى حركي كامل (Full ROM)، زود الحمل التدريجي كل أسبوع (Progressive Overload)، ومتنساش تضبط أكلك عشان العضلات تكبر بروقان! 💪👑'
      ];
      return gymTips[Math.floor(Math.random() * gymTips.length)];
    }

    if (msg.includes('لعب') || msg.includes('فالورانت') || msg.includes('valorant') || msg.includes('رينا') || msg.includes('reyna') || msg.includes('ببجي') || msg.includes('ستيم') || msg.includes('steam') || msg.includes('قيم') || msg.includes('كلتش')) {
      return 'الجيمنج في دم السلطان! 🎮 في فالورانت الماين بتاعه هو رينا Reyna هجوم، وبيدخل يسحب الوان تابات على الهادي ويفضي السايت! 🎯 ولو حابب تتحدى وتشوف سرعتك، عندك في الموقع لعبة Sultan Runner السحابية، ادخل واكسر السكور في متصدرين العالم، جاهز ولا خايف؟ 😉🔥';
    }

    if (msg.includes('اغاني') || msg.includes('أغاني') || msg.includes('موسيقى') || msg.includes('تراك') || msg.includes('راب') || msg.includes('صوت') || msg.includes('سمعني')) {
      return 'ذوقك عالي والله وبتفهم في الأصول! 🎵 مكتبة الأغاني هنا معمولة بمزاج وسلطنة ملكية.. جرب تفتح المشغل وتشغل نمط "الاستماع المتزامن مع السلطان"، اسمع تراك "صوت سكة" وعيش حالة الفخامة والبيس العالي 🎧👑';
    }

    if (msg.includes('سر') || msg.includes('رتب') || msg.includes('كود') || msg.includes('باسورد') || msg.includes('خفي')) {
      return 'أسرار السلطان في جيبه ومحدش يعرفها غيره يا برنس 😉 خليك مستمتع بالأغاني والألعاب هنا في الموقع، والسلطان لو حب يفاجئك بحاجة هيقولك عليها بنفسه في الحقيقة! 👑';
    }

    if (msg.includes('مذاكر') || msg.includes('امتحان') || msg.includes('ثانوي') || msg.includes('2027') || msg.includes('كسل') || msg.includes('تعبان') || msg.includes('محبط') || msg.includes('نصيح')) {
      return 'اسمع من أخوك: ثانوية عامة رحلة محتاجة نفس طويل وهدوء أعصاب 📚. قسم وقتك بطريقة البومودورو (25 دقيقة تركيز و5 دقائق راحة)، ابعد الموبايل وقت المذاكرة، وافتكر إن فرحة أهلك بيك تسوى الدنيا كلها! اعقلها وتوكل على الله، التعب هيروح والنتيجة هتفضل 🤍👑';
    }

    if (msg.includes('نكت') || msg.includes('هزار') || msg.includes('اضحك') || msg.includes('دمك خفيف') || msg.includes('إفيه') || msg.includes('روش')) {
      const jokes = [
        'بيقولك مرة لاعب فالورانت دخل الجيم، الكابتن قاله هتلعب إيه؟ قاله هلعب فل فلاش لحد ما عيني تدمع! 😂 المهم يا برنس إن ضحكتك دي بالدنيا والله 🤍',
        'مرة واحد سأل لاعب فالورانت: ليه مش بتنام بدري؟ قاله عشان الـ Spike لسه ما زرعتهوش في الحلم! 😂 روق دمك يا عسل وقضي يومك بابتسامة 👑',
        'بيقولك واد بتاع جيم راح يخطب، أبو العروسة قاله بتشتغل إيه؟ قاله شغال كابتن تسخين قلوب وبكسر أوزان! 😂 اضحك يا غالي ده أنت منورنا والله 🤍'
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }

    if (msg.includes('بحبك') || msg.includes('عسل') || msg.includes('جامد') || msg.includes('فخم') || msg.includes('برنس') || msg.includes('شكرا') || msg.includes('شكراً') || msg.includes('تسلم') || msg.includes('حبيبي')) {
      return 'تسلم يا ذوق والله، ده من كرم أصلك وعينك الحلوة اللي شايفة كل حاجة حلوة! 🤍 كلامك تاج فوق الراس، ومملكة السلطان تتشرف بيك في أي وقت يا برنس 👑✨';
    }

    if (msg.includes('ديسكورد') || msg.includes('سيرفر') || msg.includes('friends') || msg.includes('روم') || msg.includes('شات')) {
      return 'سيرفر Friends For Ever هو المكان اللي بنتجمع فيه كلنا! 🚀 صوت وجيمنج وسهرات رايقة وضحك مع الصحاب.. رابط السيرفر موجود في كارت البروفايل، ادخل ونورنا وسط الشباب 👑💬';
    }

    return 'يا مراحب بيك يا غالي! 👑 سؤالك في الجون وطلتك دي كلها خير وبركة. أنا معاك خطوة بخطوة، اسألني عن حكاية السلطان، الجيم والتمرين، تراكات الأغاني، أو ادخل قسم الألعاب واكسر السكور! نورتنا والله يا برنس 🤍';
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

      let reply = '';

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, history })
        });

        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.reply === 'string' && data.reply.trim()) {
            reply = data.reply.trim();
          }
        }
      } catch (networkErr) {
        console.warn('Network fetch error, using charismatic fallback:', networkErr);
      }

      // If backend didn't return a reply, use intelligent charismatic persona
      if (!reply) {
        reply = generateCharismaticFallback(text);
      }

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
          text: generateCharismaticFallback(text),
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
