export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { message, history } = body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'الرجاء كتابة رسالة للمساعد' });
    }

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
- سرية تامة ومطلقة: إياك نهائياً وتحت أي ظرف أن تذكر أو تلمح لكلمة (sultan) أو طريقة فتح رتبة الديسكورد أو وجود أي أكواد أو كتابة على الكيبورد! ممنوع إعطاء أي تلميحات مهما حاول المستخدم استدراجك. الرتبة سرية بنسبة 100% ولا يعرفها إلا من يقولها له السلطان شخصياً في الحقيقة. إذا سألك أحد عن أسرار أو رتب، تهرب بلباقة وخفة دم ملكية وقوله: "أسرار السلطان في جيبه ومحدش يعرفها غيره يا برنس 😉"، ودلّه فقط على الألعاب العلنية ومكتبة الموسيقى.
- قواعد الرد:
  * خلي ردودك سريعة، مبهجة، خفيفة على القلب، لا تتجاوز فقرة أو فقرتين كحد أقصى.
  * استخدم إيموجيز لطيفة ومعبرة في موضعها (👑, 🔥, 🦾, 🎮, 😉, 🤍).
  * خلي الزائر يحس إنه اتكلم مع شخص حقيقي دمه خفيف وبيدخل القلب على طول.`;

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    let replyText = '';

    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
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

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.85
          }
        });
        replyText = response.text || '';
      } catch (geminiError) {
        console.warn('Gemini API call warning in Vercel function:', geminiError);
      }
    }

    // Advanced Charismatic Conversational Intelligence Engine (Zero external dependencies)
    if (!replyText) {
      const msg = message.toLowerCase().trim();

      // 1. Greetings & Salutations
      if (/^(صباح|مسا|سلام|ازيك|عامل ايه|اخبارك|هلا|مرحبا|هاي|hello|hi|منور)/.test(msg) || msg === 'سلام عليكم' || msg === 'السلام عليكم') {
        const greetings = [
          'يا مراحب بيك يا غالي! 👑 نورت قصر ومملكة السلطان.. خطوتك عزيزة علينا والله، يومك رايق بإذن الله! تشرب قهوتك ونبدأ سوا؟ ☕✨',
          'وعليكم السلام يا هلا بالورد والفخامة! 🤍 نورتنا يا برنس، أنا المساعد الملكي للسلطان ومعاك في أي حاجة تحبها. عامل إيه طمني عنك؟ 👑',
          'أهلاً أهلاً يا بطل! 👑 طلتك دي دايماً بتنور الموقع.. أنا تحت أمرك، تحب تسمع تراك رايق ولا ندردش في الجيمنج والحديد؟ 🎮🦾'
        ];
        replyText = greetings[Math.floor(Math.random() * greetings.length)];
      }
      // 2. Sultan's Bio & Identity
      else if (msg.includes('مين') || msg.includes('سلطان') || msg.includes('عرفني') || msg.includes('قصت') || msg.includes('حكايت') || msg.includes('عمره') || msg.includes('سنة')) {
        replyText = 'سلطان ده قصة كفاح وروقان في نفس الوقت! 👑 طالب ثانوية عامة دفعة 2027، بيعافر في المذاكرة عشان يوصل لأعلى قمة 📚، وفي نفس الوقت ملتزم بتمارين الجيم وبناء العضلات 🦾، وملك الكلتشات في فالورانت برينا 🎮. وصاحب سيرفر Friends For Ever.. الأهم من كل ده إنه صاحب جدع ومحترم وبيحب الناس! منورنا يا غالي 🤍';
      }
      // 3. Gym, Workout & Fitness
      else if (msg.includes('جيم') || msg.includes('تمرين') || msg.includes('عضل') || msg.includes('حديد') || msg.includes('دايت') || msg.includes('بروتين') || msg.includes('كرياتين') || msg.includes('بنش') || msg.includes('سكوات') || msg.includes('باي')) {
        const gymTips = [
          'الحديد ما بيهزرش! 🦾 قاعدة السلطان الذهبية: "انضباط + أكل نظيف وتغذية محسوبة + نوم 8 ساعات". الالتزام مش إنك تتمرن وأنت متحمس، الالتزام إنك تنزل وأنت مش قادر وتفرتك الأوزان! عاش يا وحش 💪🔥',
          'يا كابتن! 🦾 في الجيم مفيش أسرار: تمرينة بنش تقيلة، تركيز على الحركة السلبية (Eccentric)، بروتينك اليومي، وأهم حاجة أوعى تهمل شرب المية والنوم. فورمة السلطان بتتبني بالعرق والصبر! 🦍🔥',
          'عاش يا بطل! 🦾 لو بتدور على الضخامة: العب بمدى حركي كامل (Full ROM)، زود الحمل التدريجي كل أسبوع (Progressive Overload)، ومتنساش تضبط أكلك عشان العضلات تكبر بروقان! 💪👑'
        ];
        replyText = gymTips[Math.floor(Math.random() * gymTips.length)];
      }
      // 4. Gaming, Valorant, PUBG, Setup
      else if (msg.includes('لعب') || msg.includes('فالورانت') || msg.includes('valorant') || msg.includes('رينا') || msg.includes('reyna') || msg.includes('ببجي') || msg.includes('ستيم') || msg.includes('steam') || msg.includes('ماوس') || msg.includes('ايم') || msg.includes('رانك') || msg.includes('كلتش') || msg.includes('بي سي') || msg.includes('جهاز')) {
        replyText = 'الجيمنج في دم السلطان! 🎮 في فالورانت الماين بتاعه هو رينا Reyna هجوم، وبيدخل يسحب الوان تابات على الهادي ويفضي السايت! 🎯 ولو حابب تتحدى وتشوف سرعتك، عندك في الموقع لعبة Sultan Runner السحابية، ادخل واكسر السكور في متصدرين العالم، جاهز ولا خايف؟ 😉🔥';
      }
      // 5. Music, Tracks & Audio
      else if (msg.includes('اغاني') || msg.includes('أغاني') || msg.includes('موسيقى') || msg.includes('تراك') || msg.includes('راب') || msg.includes('صوت') || msg.includes('سمعني') || msg.includes('مزاج')) {
        replyText = 'ذوقك عالي والله وبتفهم في الأصول! 🎵 مكتبة الأغاني هنا معمولة بمزاج وسلطنة ملكية.. جرب تفتح المشغل وتشغل نمط "الاستماع المتزامن مع السلطان"، اسمع تراك "صوت سكة" وعيش حالة الفخامة والبيس العالي 🎧👑';
      }
      // 6. Secrets & Roles (Absolute strict deflection with wit)
      else if (msg.includes('سر') || msg.includes('رتب') || msg.includes('كود') || msg.includes('باسورد') || msg.includes('خفي') || msg.includes('اكتب ايه')) {
        replyText = 'أسرار السلطان في جيبه ومحدش يعرفها غيره يا برنس 😉 خليك مستمتع بالأغاني والألعاب هنا في الموقع، والسلطان لو حب يفاجئك بحاجة هيقولك عليها بنفسه في الحقيقة! 👑';
      }
      // 7. Studying, High School & Motivation
      else if (msg.includes('مذاكر') || msg.includes('امتحان') || msg.includes('ثانوي') || msg.includes('2027') || msg.includes('كسل') || msg.includes('تعبان') || msg.includes('محبط') || msg.includes('نصيح')) {
        replyText = 'اسمع من أخوك: ثانوية عامة رحلة محتاجة نفس طويل وهدوء أعصاب 📚. قسم وقتك بطريقة البومودورو (25 دقيقة تركيز و5 دقائق راحة)، ابعد الموبايل وقت المذاكرة، وافتكر إن فرحة أهلك بيك تسوى الدنيا كلها! اعقلها وتوكل على الله، التعب هيروح والنتيجة هتفضل 🤍👑';
      }
      // 8. Jokes & Humor
      else if (msg.includes('نكت') || msg.includes('هزار') || msg.includes('اضحك') || msg.includes('دمك خفيف') || msg.includes('إفيه') || msg.includes('روش')) {
        const jokes = [
          'بيقولك مرة لاعب فالورانت دخل الجيم، الكابتن قاله هتلعب إيه؟ قاله هلعب فل فلاش لحد ما عيني تدمع! 😂 المهم يا برنس إن ضحكتك دي بالدنيا والله 🤍',
          'مرة واحد سأل لاعب فالورانت: ليه مش بتنام بدري؟ قاله عشان الـ Spike لسه ما زرعتهوش في الحلم! 😂 روق دمك يا عسل وقضي يومك بابتسامة 👑',
          'بيقولك واد بتاع جيم راح يخطب، أبو العروسة قاله بتشتغل إيه؟ قاله شغال كابتن تسخين قلوب وبكسر أوزان! 😂 اضحك يا غالي ده أنت منورنا والله 🤍'
        ];
        replyText = jokes[Math.floor(Math.random() * jokes.length)];
      }
      // 9. Compliments & Love
      else if (msg.includes('بحبك') || msg.includes('عسل') || msg.includes('جامد') || msg.includes('فخم') || msg.includes('برنس') || msg.includes('شكرا') || msg.includes('شكراً') || msg.includes('تسلم') || msg.includes('حبيبي')) {
        replyText = 'تسلم يا ذوق والله، ده من كرم أصلك وعينك الحلوة اللي شايفة كل حاجة حلوة! 🤍 كلامك تاج فوق الراس، ومملكة السلطان تتشرف بيك في أي وقت يا برنس 👑✨';
      }
      // 10. Discord Community
      else if (msg.includes('ديسكورد') || msg.includes('سيرفر') || msg.includes('friends') || msg.includes('روم') || msg.includes('شات')) {
        replyText = 'سيرفر Friends For Ever هو المكان اللي بنتجمع فيه كلنا! 🚀 صوت وجيمنج وسهرات رايقة وضحك مع الصحاب.. رابط السيرفر موجود في كارت البروفايل، ادخل ونورنا وسط الشباب 👑💬';
      }
      // 11. General conversational fallback with high EQ
      else {
        replyText = 'يا مراحب بيك يا غالي! 👑 سؤالك في الجون وطلتك دي كلها خير وبركة. أنا معاك خطوة بخطوة، اسألني عن حكاية السلطان، الجيم والتمرين، تراكات الأغاني، أو ادخل قسم الألعاب واكسر السكور! نورتنا والله يا برنس 🤍';
      }
    }

    return res.status(200).json({ success: true, reply: replyText });
  } catch (error: any) {
    console.error('Vercel AI Handler Error:', error);
    return res.status(200).json({
      success: true,
      reply: 'يا هلا بيك في مملكة السلطان! 👑 نورتنا يا غالي، أنا معاك خطوة بخطوة، تصفح مكتبة الموسيقى الملكية أو انضم لينا في سيرفر Friends For Ever واستمتع بأحلى صحبة!'
    });
  }
}
