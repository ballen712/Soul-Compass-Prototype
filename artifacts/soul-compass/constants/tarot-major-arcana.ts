/**
 * Original Soul Compass reflection copy for a first 22-card Major Arcana set.
 * The tags support a future, explicit chart-linking rule; they do not calculate
 * a personalized connection by themselves. No card artwork is included here.
 */
export const TAROT_CHART_THEMES = [
  'adaptability',
  'attention',
  'balance',
  'boundaries',
  'calm',
  'change',
  'clarity',
  'communication',
  'connection',
  'confidence',
  'courage',
  'creativity',
  'curiosity',
  'direction',
  'ease',
  'empathy',
  'energy',
  'expression',
  'focus',
  'freedom',
  'growth',
  'grounding',
  'hope',
  'imagination',
  'initiative',
  'intuition',
  'joy',
  'learning',
  'opportunity',
  'optimism',
  'patience',
  'perspective',
  'play',
  'presence',
  'reflection',
  'resilience',
  'rest',
  'renewal',
  'self-trust',
  'structure',
  'values',
] as const;

export type TarotChartTheme = (typeof TAROT_CHART_THEMES)[number];
export type TarotTextLocale = 'en' | 'ru';

export type MajorArcanaCard = {
  id: string;
  number: number;
  themes: readonly TarotChartTheme[];
  copy: Record<TarotTextLocale, {
    title: string;
    meaning: string;
    everydayExample: string;
    chartPrompt: string;
    reflectionQuestion: string;
  }>;
};

export const majorArcanaContent: readonly MajorArcanaCard[] = [
  {
    id: 'fool',
    number: 0,
    themes: ['curiosity', 'initiative', 'self-trust', 'adaptability'],
    copy: {
      en: {
        title: 'The Fool',
        meaning: 'A beginning does not require every detail to be settled. This card invites curiosity and a thoughtful first step, not a leap without looking.',
        everydayExample: 'You might try a new class or idea on a small scale before deciding whether to commit.',
        chartPrompt: 'Which part of your chart speaks to curiosity or taking initiative? How could that part help you begin while still caring for your own limits?',
        reflectionQuestion: 'What small beginning feels worth exploring, even if you do not know the whole route yet?',
      },
      ru: {
        title: 'Шут',
        meaning: 'Чтобы начать, не обязательно заранее решить всё до мелочей. Эта карта предлагает проявить любопытство и сделать обдуманный первый шаг — не бросаться вперёд с закрытыми глазами.',
        everydayExample: 'Можно сначала попробовать новое занятие или идею в небольшом масштабе, а потом решить, хочется ли продолжать.',
        chartPrompt: 'Какая часть твоей карты связана с любопытством или инициативой? Как она может помочь начать, не забывая о своих границах?',
        reflectionQuestion: 'Какое небольшое начало тебе интересно, даже если весь путь пока неясен?',
      },
    },
  },
  {
    id: 'magician',
    number: 1,
    themes: ['initiative', 'focus', 'expression', 'confidence'],
    copy: {
      en: {
        title: 'The Magician',
        meaning: 'You may already have a useful skill, tool, or conversation within reach. This card asks you to bring what you have together and choose one clear next step.',
        everydayExample: 'Instead of waiting for a perfect plan, you could use the notes, time, and experience you already have to make a first draft.',
        chartPrompt: 'Which reliable placement in your chart relates to communication, skill, or initiative? What could you do with that strength in a practical way?',
        reflectionQuestion: 'What do you already have that could help you make progress today?',
      },
      ru: {
        title: 'Маг',
        meaning: 'Возможно, нужный навык, инструмент или разговор уже рядом. Карта предлагает соединить то, что у тебя есть, и выбрать один понятный следующий шаг.',
        everydayExample: 'Вместо ожидания идеального плана можно использовать свои заметки, время и опыт, чтобы сделать первый черновик.',
        chartPrompt: 'Какое достоверное положение в твоей карте связано с общением, умением или инициативой? Как применить эту сильную сторону на практике?',
        reflectionQuestion: 'Что у тебя уже есть, чтобы сегодня немного продвинуться?',
      },
    },
  },
  {
    id: 'high-priestess',
    number: 2,
    themes: ['intuition', 'reflection', 'calm', 'self-trust'],
    copy: {
      en: {
        title: 'The High Priestess',
        meaning: 'Some answers become clearer when you make room for quiet. Listen to your first impression, then check it against what you know before deciding.',
        everydayExample: 'You might wait until you are calm before replying to a message that stirred a strong reaction.',
        chartPrompt: 'Which part of your chart is associated with reflection, feeling, or inner listening? How can you pair that sensitivity with clear information?',
        reflectionQuestion: 'What might you notice if you gave yourself a little more quiet before answering?',
      },
      ru: {
        title: 'Верховная Жрица',
        meaning: 'Некоторые ответы становятся яснее, когда вокруг немного тише. Прислушайся к первому впечатлению, а потом сверь его с тем, что тебе действительно известно.',
        everydayExample: 'Можно подождать, пока эмоции улягутся, и только потом отвечать на сообщение, которое тебя задело.',
        chartPrompt: 'Какая часть твоей карты связана с чувствами, размышлением или внутренним вниманием? Как соединить эту чуткость с проверенными фактами?',
        reflectionQuestion: 'Что ты заметишь, если дашь себе немного тишины перед ответом?',
      },
    },
  },
  {
    id: 'empress',
    number: 3,
    themes: ['creativity', 'empathy', 'growth', 'ease'],
    copy: {
      en: {
        title: 'The Empress',
        meaning: 'Give attention to something that can grow: a relationship, a creative idea, or your own needs. Care is more sustainable when you include yourself in it.',
        everydayExample: 'You could protect a little time for a project you enjoy instead of giving every spare minute away.',
        chartPrompt: 'Where does your chart point to care, creativity, or growth? What would nurturing that area look like without overextending yourself?',
        reflectionQuestion: 'What deserves patient care from you, including your own well-being?',
      },
      ru: {
        title: 'Императрица',
        meaning: 'Удели внимание тому, что может расти: отношениям, творческой идее или собственным потребностям. Забота устойчивее, когда в ней есть место и для тебя.',
        everydayExample: 'Можно оставить немного времени на дело, которое тебе нравится, а не отдавать каждую свободную минуту другим.',
        chartPrompt: 'На какую заботу, творчество или развитие указывает твоя карта? Как поддержать эту сферу, не забывая о себе?',
        reflectionQuestion: 'Что сейчас заслуживает твоей терпеливой заботы — включая тебя самого?',
      },
    },
  },
  {
    id: 'emperor',
    number: 4,
    themes: ['structure', 'boundaries', 'direction', 'grounding'],
    copy: {
      en: {
        title: 'The Emperor',
        meaning: 'A clear plan or boundary can make life feel more manageable. Use structure to support what matters, while leaving room to adjust when circumstances change.',
        everydayExample: 'You might set a finish time for work so the rest of the evening has a boundary too.',
        chartPrompt: 'Which part of your chart connects with structure, responsibility, or personal limits? Where would a firm but flexible plan help?',
        reflectionQuestion: 'What boundary or simple plan would make this situation easier to handle?',
      },
      ru: {
        title: 'Император',
        meaning: 'Понятный план или граница могут облегчить ситуацию. Пусть порядок поддерживает важное, но оставляет место для изменений.',
        everydayExample: 'Можно заранее решить, во сколько закончить работу, чтобы у вечера тоже были свои границы.',
        chartPrompt: 'Какая часть твоей карты связана со структурой, ответственностью или личными границами? Где поможет твёрдый, но гибкий план?',
        reflectionQuestion: 'Какая граница или простой план облегчили бы эту ситуацию?',
      },
    },
  },
  {
    id: 'hierophant',
    number: 5,
    themes: ['learning', 'values', 'connection', 'structure'],
    copy: {
      en: {
        title: 'The Hierophant',
        meaning: 'A shared practice, trusted teacher, or familiar tradition can offer a useful starting point. Keep what fits your values, and allow yourself to question the rest.',
        everydayExample: 'You might ask someone experienced how they approach a challenge, then adapt the advice to your own situation.',
        chartPrompt: 'Which chart themes relate to learning, community, or values? Which beliefs feel genuinely yours, and which might deserve a fresh look?',
        reflectionQuestion: 'What guidance is useful to you, and what do you want to decide for yourself?',
      },
      ru: {
        title: 'Иерофант',
        meaning: 'Общая практика, опытный наставник или знакомая традиция могут стать хорошей отправной точкой. Оставь то, что совпадает с твоими ценностями, а остальное разреши себе пересмотреть.',
        everydayExample: 'Можно спросить у опытного человека, как он решает похожую задачу, а затем подстроить совет под свою жизнь.',
        chartPrompt: 'Какие темы в твоей карте связаны с обучением, сообществом или ценностями? Какие убеждения действительно твои, а какие пора проверить заново?',
        reflectionQuestion: 'Какой совет тебе полезен, а что ты хочешь решить сам?',
      },
    },
  },
  {
    id: 'lovers',
    number: 6,
    themes: ['connection', 'values', 'communication', 'balance'],
    copy: {
      en: {
        title: 'The Lovers',
        meaning: 'This card is about meaningful choice as much as closeness. Notice whether a decision reflects your values, and make room for honest conversation with the people it affects.',
        everydayExample: 'You could say what you need clearly instead of agreeing just to keep the peace.',
        chartPrompt: 'Which chart themes touch relationships, communication, or values? How might they help you choose with care for both yourself and others?',
        reflectionQuestion: 'Which choice feels most honest about what matters to you?',
      },
      ru: {
        title: 'Влюблённые',
        meaning: 'Эта карта — не только о близости, но и о важном выборе. Подумай, отражает ли решение твои ценности, и поговори честно с теми, кого оно затрагивает.',
        everydayExample: 'Можно прямо сказать о своей потребности, а не соглашаться только ради спокойствия.',
        chartPrompt: 'Какие темы твоей карты связаны с отношениями, общением или ценностями? Как они могут помочь выбрать бережно и к себе, и к другим?',
        reflectionQuestion: 'Какой выбор честнее всего отражает то, что для тебя важно?',
      },
    },
  },
  {
    id: 'chariot',
    number: 7,
    themes: ['direction', 'focus', 'resilience', 'confidence'],
    copy: {
      en: {
        title: 'The Chariot',
        meaning: 'When several wants pull in different directions, choose a destination for now. Progress comes from guiding your effort, not from controlling every detail.',
        everydayExample: 'You might decide which one of two competing tasks matters most this morning and give it your attention first.',
        chartPrompt: 'Which chart themes help you find direction or stay focused? How can you use that strength without treating rest as failure?',
        reflectionQuestion: 'What is the most useful direction to choose for the next step?',
      },
      ru: {
        title: 'Колесница',
        meaning: 'Если тебя тянут в разные стороны, выбери направление хотя бы на сейчас. Движение вперёд начинается с внимания, а не с попытки всё контролировать.',
        everydayExample: 'Можно решить, какая из двух срочных задач сегодня важнее, и сначала заняться именно ею.',
        chartPrompt: 'Какие темы твоей карты помогают найти направление и сосредоточиться? Как использовать эту силу, не считая отдых поражением?',
        reflectionQuestion: 'Какое направление сейчас полезнее выбрать для следующего шага?',
      },
    },
  },
  {
    id: 'strength',
    number: 8,
    themes: ['courage', 'patience', 'empathy', 'self-trust'],
    copy: {
      en: {
        title: 'Strength',
        meaning: 'Steady courage is different from forcing yourself. Meet a difficult moment with patience, and include kindness in the way you handle it.',
        everydayExample: 'You might ask for help with a hard conversation instead of expecting yourself to manage it perfectly alone.',
        chartPrompt: 'Where does your chart speak to resilience or courage? What would that strength look like if it included gentleness?',
        reflectionQuestion: 'How can you be brave here without being harsh with yourself?',
      },
      ru: {
        title: 'Сила',
        meaning: 'Спокойная смелость — не то же самое, что заставлять себя. В трудный момент попробуй соединить терпение с добротой к себе.',
        everydayExample: 'Можно попросить о поддержке перед непростым разговором, а не требовать от себя справиться идеально в одиночку.',
        chartPrompt: 'Где в твоей карте видны стойкость или смелость? Как могла бы выглядеть эта сила, если добавить к ней мягкость?',
        reflectionQuestion: 'Как пройти через это смело, но не быть жестоким к себе?',
      },
    },
  },
  {
    id: 'hermit',
    number: 9,
    themes: ['reflection', 'focus', 'self-trust', 'calm'],
    copy: {
      en: {
        title: 'The Hermit',
        meaning: 'A little distance from the noise can help you hear your own priorities. Take a pause to think, then return with one clear thing you want to do.',
        everydayExample: 'You might take a short walk without your phone before deciding how to spend the evening.',
        chartPrompt: 'Which chart themes connect with reflection, focus, or time alone? How can a pause help you reconnect rather than withdraw indefinitely?',
        reflectionQuestion: 'What do you hear when you step back from everyone else’s opinions?',
      },
      ru: {
        title: 'Отшельник',
        meaning: 'Немного тишины помогает услышать собственные приоритеты. Сделай паузу, чтобы подумать, а потом выбери одно ясное действие.',
        everydayExample: 'Можно ненадолго выйти прогуляться без телефона, прежде чем решать, как провести вечер.',
        chartPrompt: 'Какие темы твоей карты связаны с размышлением, концентрацией или временем наедине? Как сделать паузу полезной, а не бесконечным уходом от дел?',
        reflectionQuestion: 'Что ты слышишь, когда отступаешь от чужих мнений?',
      },
    },
  },
  {
    id: 'wheel-of-fortune',
    number: 10,
    themes: ['change', 'adaptability', 'perspective', 'opportunity'],
    copy: {
      en: {
        title: 'Wheel of Fortune',
        meaning: 'Some conditions change beyond your control. Notice what is shifting, what remains steady, and where your next choice can still make a difference.',
        everydayExample: 'If a plan changes at the last minute, you could keep its main purpose and adjust the route.',
        chartPrompt: 'Which chart themes help you adapt to change? What can you influence, and what is better met with flexibility?',
        reflectionQuestion: 'What is changing around you, and what choice still belongs to you?',
      },
      ru: {
        title: 'Колесо Фортуны',
        meaning: 'Некоторые обстоятельства меняются не по твоей воле. Заметь, что сдвинулось, что осталось устойчивым и где твой следующий выбор всё ещё имеет значение.',
        everydayExample: 'Если планы внезапно изменились, можно сохранить главную цель и выбрать другой путь.',
        chartPrompt: 'Какие темы твоей карты помогают приспосабливаться к переменам? На что ты можешь повлиять, а где полезнее проявить гибкость?',
        reflectionQuestion: 'Что вокруг меняется, а что всё ещё зависит от твоего выбора?',
      },
    },
  },
  {
    id: 'justice',
    number: 11,
    themes: ['balance', 'clarity', 'values', 'communication'],
    copy: {
      en: {
        title: 'Justice',
        meaning: 'Look carefully at the facts and your part in the situation. A fair choice may ask for honesty, proportion, and a willingness to correct course.',
        everydayExample: 'You might revisit an agreement and make sure the expectations are clear for everyone involved.',
        chartPrompt: 'Which chart themes relate to fairness, clarity, or responsibility? How can you be honest about your needs while considering other people?',
        reflectionQuestion: 'What would a fair and honest next step look like here?',
      },
      ru: {
        title: 'Справедливость',
        meaning: 'Внимательно посмотри на факты и на свою роль в ситуации. Справедливое решение требует честности, меры и готовности скорректировать курс.',
        everydayExample: 'Можно ещё раз обсудить договорённость и убедиться, что всем понятны ожидания.',
        chartPrompt: 'Какие темы твоей карты связаны со справедливостью, ясностью или ответственностью? Как учитывать чужие интересы, не скрывая собственные потребности?',
        reflectionQuestion: 'Какой следующий шаг здесь был бы честным и справедливым?',
      },
    },
  },
  {
    id: 'hanged-one',
    number: 12,
    themes: ['patience', 'perspective', 'reflection', 'ease'],
    copy: {
      en: {
        title: 'The Hanged One',
        meaning: 'You may be looking at a situation from only one angle. A pause or a different viewpoint can help; waiting is useful when it brings clarity, not when it becomes avoidance.',
        everydayExample: 'Before sending a frustrated reply, you could reread the message later and see whether you understand it differently.',
        chartPrompt: 'Which chart themes help you pause or see another point of view? What would make this pause purposeful rather than endless?',
        reflectionQuestion: 'What might change if you looked at this from another side?',
      },
      ru: {
        title: 'Повешенный',
        meaning: 'Возможно, ты видишь ситуацию только с одной стороны. Пауза или новый взгляд могут помочь, если ожидание проясняет мысли, а не превращается в избегание.',
        everydayExample: 'Перед тем как отправить резкий ответ, можно перечитать сообщение позже и проверить, изменилось ли твоё понимание.',
        chartPrompt: 'Какие темы твоей карты помогают остановиться или увидеть другую сторону? Что сделает эту паузу полезной, а не бесконечной?',
        reflectionQuestion: 'Что может измениться, если посмотреть на это с другой стороны?',
      },
    },
  },
  {
    id: 'death',
    number: 13,
    themes: ['change', 'renewal', 'adaptability', 'self-trust'],
    copy: {
      en: {
        title: 'Death',
        meaning: 'An ending can make room for a new arrangement. This card is about change and release; it is not a literal prediction of death or loss.',
        everydayExample: 'You might let go of a routine that no longer works and choose one small replacement that fits your life now.',
        chartPrompt: 'Where does your chart connect with change or renewal? What are you ready to stop carrying, and what would you like to make room for?',
        reflectionQuestion: 'What could you release so that something more fitting has room to grow?',
      },
      ru: {
        title: 'Смерть',
        meaning: 'Завершение может освободить место для нового. Эта карта о переменах и отпускании, а не о буквальном предсказании смерти или потери.',
        everydayExample: 'Можно отказаться от привычного распорядка, который больше не помогает, и выбрать небольшую замену.',
        chartPrompt: 'Где в твоей карте проявляются перемены или обновление? Что ты готов перестать нести с собой и чему хочешь освободить место?',
        reflectionQuestion: 'Что можно отпустить, чтобы дать вырасти чему-то более подходящему?',
      },
    },
  },
  {
    id: 'temperance',
    number: 14,
    themes: ['balance', 'patience', 'adaptability', 'ease'],
    copy: {
      en: {
        title: 'Temperance',
        meaning: 'A workable pace may help more than an all-or-nothing push. Bring together what is useful, make small adjustments, and give the result time.',
        everydayExample: 'You could divide a large task into two short sessions with a real break between them.',
        chartPrompt: 'Which chart themes help you find balance or adjust your pace? Where could combining two needs work better than choosing only one?',
        reflectionQuestion: 'What would a steadier, more sustainable pace look like today?',
      },
      ru: {
        title: 'Умеренность',
        meaning: 'Посильный темп часто полезнее рывка на пределе. Соедини то, что работает, внеси небольшие изменения и дай результату время.',
        everydayExample: 'Большую задачу можно разделить на два коротких подхода с настоящим отдыхом между ними.',
        chartPrompt: 'Какие темы твоей карты помогают сохранять равновесие и выбирать темп? Где лучше соединить две потребности, а не выбирать только одну?',
        reflectionQuestion: 'Какой темп сегодня будет для тебя устойчивым и посильным?',
      },
    },
  },
  {
    id: 'devil',
    number: 15,
    themes: ['boundaries', 'self-trust', 'grounding', 'freedom'],
    copy: {
      en: {
        title: 'The Devil',
        meaning: 'Notice a habit, obligation, or story that is taking more choice away than you want. Name it without shame and look for one small boundary you can set.',
        everydayExample: 'You might turn off one notification that keeps pulling you away from the time you meant to protect.',
        chartPrompt: 'Which chart themes touch boundaries, freedom, or self-trust? Where could a small, realistic choice give you more room?',
        reflectionQuestion: 'Where would one clear boundary give you more choice?',
      },
      ru: {
        title: 'Дьявол',
        meaning: 'Заметь привычку, обязанность или мысль, которая отнимает больше свободы выбора, чем тебе хотелось бы. Назови её без стыда и подумай об одной небольшой границе.',
        everydayExample: 'Можно отключить одно уведомление, которое постоянно отвлекает от времени, которое ты хотел сохранить для себя.',
        chartPrompt: 'Какие темы твоей карты связаны с границами, свободой или доверием к себе? Какой небольшой реальный выбор вернул бы тебе больше пространства?',
        reflectionQuestion: 'Где ясная граница вернула бы тебе возможность выбирать?',
      },
    },
  },
  {
    id: 'tower',
    number: 16,
    themes: ['change', 'clarity', 'resilience', 'grounding'],
    copy: {
      en: {
        title: 'The Tower',
        meaning: 'A plan or assumption may need an honest review. If something no longer holds, first notice what is safe and steady enough to build from; this card does not predict disaster.',
        everydayExample: 'You might update a plan after learning a key detail has changed, rather than keep working from an old assumption.',
        chartPrompt: 'Which chart themes help you face change directly and stay grounded? What remains reliable while you revise the part that no longer fits?',
        reflectionQuestion: 'What needs an honest update, and what can you still rely on?',
      },
      ru: {
        title: 'Башня',
        meaning: 'План или предположение могут потребовать честного пересмотра. Если что-то больше не держится, сначала найди опору, от которой можно оттолкнуться; карта не предсказывает катастрофу.',
        everydayExample: 'Узнав важную новую деталь, можно обновить план, а не продолжать действовать исходя из старого предположения.',
        chartPrompt: 'Какие темы твоей карты помогают встречать перемены прямо и сохранять опору? На что можно положиться, пока ты пересматриваешь то, что больше не подходит?',
        reflectionQuestion: 'Что пора честно обновить, а на что ты всё ещё можешь опереться?',
      },
    },
  },
  {
    id: 'star',
    number: 17,
    themes: ['hope', 'renewal', 'self-trust', 'ease'],
    copy: {
      en: {
        title: 'The Star',
        meaning: 'Hope can be quiet: a reason to keep going, ask for support, or try again. Let it connect to one real step rather than pressure to feel positive.',
        everydayExample: 'You might message someone you trust and make a modest plan for the part of the week ahead.',
        chartPrompt: 'Which chart themes help you find hope or begin again? What small, practical action could support that part of you?',
        reflectionQuestion: 'What small thing gives you a reason to keep going?',
      },
      ru: {
        title: 'Звезда',
        meaning: 'Надежда бывает тихой: она помогает продолжать, просить о поддержке или пробовать ещё раз. Пусть она приведёт к одному реальному шагу, а не к требованию всегда думать позитивно.',
        everydayExample: 'Можно написать человеку, которому доверяешь, и составить небольшой план на ближайшие дни.',
        chartPrompt: 'Какие темы твоей карты помогают находить надежду или начинать заново? Какое небольшое действие поддержит эту твою часть?',
        reflectionQuestion: 'Что небольшое помогает тебе продолжать?',
      },
    },
  },
  {
    id: 'moon',
    number: 18,
    themes: ['intuition', 'calm', 'reflection', 'clarity'],
    copy: {
      en: {
        title: 'The Moon',
        meaning: 'When details are unclear, feelings and assumptions can get mixed together. Move carefully, check what you know, and let uncertainty be present without filling it with fear.',
        everydayExample: 'Before deciding what someone meant by a brief message, you could ask a simple follow-up question.',
        chartPrompt: 'Which chart themes help you notice feelings and sort through uncertainty? What facts would help balance your first impression?',
        reflectionQuestion: 'What do you know for sure, and what are you still guessing?',
      },
      ru: {
        title: 'Луна',
        meaning: 'Когда многое неясно, чувства легко перепутать с предположениями. Двигайся осторожно, проверяй известные факты и не заполняй неопределённость страхом.',
        everydayExample: 'Прежде чем решать, что человек имел в виду в коротком сообщении, можно просто уточнить.',
        chartPrompt: 'Какие темы твоей карты помогают замечать чувства и разбираться в неопределённости? Какие факты уравновесят первое впечатление?',
        reflectionQuestion: 'Что ты знаешь точно, а о чём пока только догадываешься?',
      },
    },
  },
  {
    id: 'sun',
    number: 19,
    themes: ['joy', 'energy', 'clarity', 'confidence'],
    copy: {
      en: {
        title: 'The Sun',
        meaning: 'Notice what feels clear, lively, and worth sharing. Enjoyment counts too; you do not have to turn every good moment into a project.',
        everydayExample: 'You could take a proper lunch break with someone you enjoy, without checking work messages.',
        chartPrompt: 'Which chart themes point to what gives you energy or confidence? How can you enjoy that without turning it into another expectation?',
        reflectionQuestion: 'What is bringing a little more lightness or energy into your day?',
      },
      ru: {
        title: 'Солнце',
        meaning: 'Заметь, что сейчас кажется ясным, живым и достойным разделить с другими. Радость тоже важна — не каждое хорошее мгновение нужно превращать в задачу.',
        everydayExample: 'Можно спокойно пообедать с приятным человеком и не проверять рабочие сообщения.',
        chartPrompt: 'Какие темы твоей карты указывают на то, что придаёт тебе сил или уверенности? Как наслаждаться этим, не превращая удовольствие в очередное требование?',
        reflectionQuestion: 'Что сегодня приносит немного больше лёгкости или энергии?',
      },
    },
  },
  {
    id: 'judgement',
    number: 20,
    themes: ['reflection', 'renewal', 'values', 'direction'],
    copy: {
      en: {
        title: 'Judgement',
        meaning: 'A past choice may be ready for an honest review. Keep what you learned, repair what you can, and decide what you want to do next without reducing yourself to one mistake.',
        everydayExample: 'You might apologize for a specific action and make a clear plan to handle the same situation differently.',
        chartPrompt: 'Which chart themes help you learn from experience and choose a direction? What can you acknowledge without letting it define your whole story?',
        reflectionQuestion: 'What have you learned that you are ready to use now?',
      },
      ru: {
        title: 'Суд',
        meaning: 'К прежнему решению можно вернуться и посмотреть на него честно. Сохрани урок, исправь то, что можешь, и выбери дальнейший шаг — одна ошибка не описывает тебя целиком.',
        everydayExample: 'Можно извиниться за конкретный поступок и решить, как действовать иначе в похожей ситуации.',
        chartPrompt: 'Какие темы твоей карты помогают учиться на опыте и выбирать направление? Что ты можешь признать, не сводя к этому всю свою историю?',
        reflectionQuestion: 'Какой опыт ты готов применить теперь?',
      },
    },
  },
  {
    id: 'world',
    number: 21,
    themes: ['growth', 'balance', 'perspective'],
    copy: {
      en: {
        title: 'The World',
        meaning: 'A chapter may be coming together. Recognize what you have finished, let the experience count, and carry its lesson into whatever you choose next.',
        everydayExample: 'You could mark the end of a long task by writing down what worked before moving to the next one.',
        chartPrompt: 'Which chart themes help you recognize growth or completion? What lesson from this chapter would you like to bring forward?',
        reflectionQuestion: 'What can you acknowledge as complete before beginning something new?',
      },
      ru: {
        title: 'Мир',
        meaning: 'Один из этапов может складываться в целое. Заметь, что ты завершил, признай ценность этого опыта и возьми его урок с собой дальше.',
        everydayExample: 'После долгой задачи можно отметить её завершение и записать, что помогло, прежде чем переходить к следующей.',
        chartPrompt: 'Какие темы твоей карты помогают замечать рост и завершение? Какой урок из этого этапа ты хочешь взять с собой?',
        reflectionQuestion: 'Что можно признать завершённым, прежде чем начинать новое?',
      },
    },
  },
] as const satisfies readonly MajorArcanaCard[];
