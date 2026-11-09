import type { AppLocale } from './index';

type Row = readonly [string, string, string, string, string, string, string];

const rows = [
  [
    'With your saved birth chart, the daily reading uses your chart and today’s geocentric planetary positions. Your saved residence’s time zone—or your birthplace’s if you have not added a residence—sets the local date; location coordinates do not directly change the stone match. We do not use GPS. You can also choose how you feel today to guide the suggestion. That choice resets at midnight on your device; without a choice, the guide uses the chart alone.',
    'A mentett születési képleted alapján a napi olvasat a képletedet és a bolygók mai geocentrikus helyzetét használja. A megadott lakóhelyed időzónája határozza meg a helyi dátumot; ha nem adtál meg lakóhelyet, a születési helyedé. A koordináták közvetlenül nem befolyásolják a kő kiválasztását. GPS-t nem használunk. A javaslatot azzal is alakíthatod, hogy megadod, hogyan érzed magad. Ez a választás a készülékeden éjfélkor törlődik; választás nélkül a rendszer csak a képletedet veszi figyelembe.',
    'La lettura quotidiana usa il tuo tema natale salvato e le posizioni geocentriche dei pianeti di oggi. Per stabilire la data locale si usa il fuso orario della residenza salvata; se non ne hai indicata una, si usa quello del luogo di nascita. Le coordinate non modificano direttamente la scelta del cristallo. Non usiamo il GPS. Puoi anche indicare come ti senti per orientare il consiglio. La scelta si azzera a mezzanotte sul tuo dispositivo; se non scegli nulla, la guida considera solo il tema natale.',
    'Die Tagesdeutung nutzt dein gespeichertes Geburtshoroskop und die heutigen geozentrischen Planetenpositionen. Für das lokale Datum gilt die Zeitzone deines gespeicherten Wohnorts; wenn du keinen angegeben hast, die deines Geburtsorts. Die Koordinaten verändern die Steinauswahl nicht direkt. Wir verwenden kein GPS. Du kannst auch angeben, wie du dich heute fühlst, um den Vorschlag mitzugestalten. Diese Auswahl wird um Mitternacht auf deinem Gerät zurückgesetzt; ohne Auswahl berücksichtigt die Empfehlung nur dein Horoskop.',
    'La lecture du jour s’appuie sur ton thème natal enregistré et sur les positions géocentriques des planètes. La date locale est déterminée par le fuseau horaire de ta résidence enregistrée ; si tu n’en as pas indiqué, celui de ton lieu de naissance. Les coordonnées ne changent pas directement le choix de la pierre. Nous n’utilisons pas le GPS. Tu peux aussi indiquer comment tu te sens pour orienter la suggestion. Ce choix est réinitialisé à minuit sur ton appareil ; sans choix, le guide s’appuie uniquement sur ton thème natal.',
    'La lectura diaria utiliza tu carta natal guardada y las posiciones geocéntricas de los planetas. La fecha local se determina con la zona horaria de tu residencia guardada; si no has indicado ninguna, con la de tu lugar de nacimiento. Las coordenadas no cambian directamente la elección de la piedra. No usamos GPS. También puedes indicar cómo te sientes para orientar la sugerencia. Esa elección se reinicia a medianoche en tu dispositivo; si no eliges nada, la guía solo tiene en cuenta tu carta.',
    'Ежедневное чтение опирается на сохранённую натальную карту и сегодняшние геоцентрические положения планет. Местную дату задаёт часовой пояс сохранённого места проживания; если оно не указано — место рождения. Координаты напрямую не влияют на выбор камня. Мы не используем GPS. Ты также можешь указать своё настроение, чтобы уточнить рекомендацию. Выбор сбрасывается в полночь по времени устройства; если ничего не выбрать, гид учитывает только натальную карту.',
  ],
  [
    'Today’s main chart link (transiting {transitBody}, {aspect}, natal {natalBody}) matches {themes} in this stone’s catalog profile.',
    'A mai fő képletbeli kapcsolat: tranzitáló bolygó — {transitBody}; fényszög — {aspect}; születési bolygó — {natalBody}. A kő katalógusprofilja ezekhez a témákhoz kapcsolódik: {themes}.',
    'Il principale collegamento astrologico di oggi (transito di {transitBody}, aspetto {aspect}, pianeta natale {natalBody}) coincide con questi temi del profilo del cristallo: {themes}.',
    'Der wichtigste astrologische Zusammenhang heute (Transit von {transitBody}, Aspekt {aspect}, nataler Planet {natalBody}) passt zu diesen Themen im Katalogprofil des Steins: {themes}.',
    'El principal vínculo astrológico de hoy (tránsito de {transitBody}, aspecto {aspect}, planeta natal {natalBody}) coincide con estos temas del perfil de la piedra: {themes}.',
    'Le principal lien astrologique du jour (transit de {transitBody}, aspect {aspect}, planète natale {natalBody}) rejoint ces thèmes associés à la pierre dans le catalogue : {themes}.',
    'Главная астрологическая связь дня: транзитная планета — {transitBody}; аспект — {aspect}; натальная планета — {natalBody}. В каталожном описании камня есть такие темы: {themes}.',
  ],
  [
    'A related supporting chart link (transiting {transitBody}, {aspect}, natal {natalBody}) also matches {themes}.',
    'Egy kapcsolódó kiegészítő kapcsolat is illik hozzá a képletedben: tranzitáló bolygó — {transitBody}; fényszög — {aspect}; születési bolygó — {natalBody}. Közös témák: {themes}.',
    'Anche un collegamento secondario del tema natale (transito di {transitBody}, aspetto {aspect}, pianeta natale {natalBody}) corrisponde a {themes}.',
    'Auch ein passender Zusammenhang im Horoskop (Transit von {transitBody}, Aspekt {aspect}, nataler Planet {natalBody}) greift {themes} auf.',
    'Otro vínculo relacionado de la carta (tránsito de {transitBody}, aspecto {aspect}, planeta natal {natalBody}) también coincide con {themes}.',
    'Un autre lien pertinent du thème natal (transit de {transitBody}, aspect {aspect}, planète natale {natalBody}) rejoint aussi {themes}.',
    'С этим совпадает и дополнительная связь в карте: транзитная планета — {transitBody}; аспект — {aspect}; натальная планета — {natalBody}. Общие темы: {themes}.',
  ],
  [
    'This is also one of your eight birth-chart companions, selected for its connection to {element} themes.',
    'Ez a kő a születési képletedhez ajánlott nyolc kísérőd egyike; a {element} témáihoz kapcsolódik.',
    'È anche uno degli otto cristalli legati al tuo tema natale, scelto per il suo legame con i temi dell’elemento {element}.',
    'Dieser Stein gehört auch zu den acht Begleitsteinen deines Geburtshoroskops und wurde wegen seiner Verbindung zu {element}-Themen ausgewählt.',
    'Cette pierre fait aussi partie des huit compagnons de ton thème natal. Elle a été retenue pour son lien avec les thèmes de l’élément {element}.',
    'Esta piedra también forma parte de tus ocho compañeras de carta natal. Se eligió por su relación con los temas de {element}.',
    'Этот камень также входит в число восьми спутников твоей натальной карты. Он связан с темами стихии «{element}».',
  ],
  [
    'Its themes overlap with those in your birth-chart companions: {themes}.',
    'Témái kapcsolódnak a születési képletedhez ajánlott kövek témáihoz: {themes}.',
    'I suoi temi si ritrovano anche nei cristalli collegati al tuo tema natale: {themes}.',
    'Seine Themen überschneiden sich mit denen deiner Geburtshoroskop-Begleitsteine: {themes}.',
    'Ses thèmes rejoignent ceux de tes pierres liées au thème natal : {themes}.',
    'Sus temas coinciden con los de tus piedras de carta natal: {themes}.',
    'Его темы пересекаются с темами камней из твоего натального набора: {themes}.',
  ],
  [
    'Your selected feeling, “{feeling},” also matches {themes}.',
    'A mai hangulatod („{feeling}”) is kapcsolódik ezekhez a témákhoz: {themes}.',
    'Anche l’umore che hai scelto («{feeling}») si collega a {themes}.',
    'Deine gewählte Stimmung („{feeling}“) passt ebenfalls zu {themes}.',
    'L’humeur que tu as choisie (« {feeling} ») rejoint aussi {themes}.',
    'El estado de ánimo que elegiste («{feeling}») también coincide con {themes}.',
    'Выбранное сегодня настроение («{feeling}») тоже связано с темами: {themes}.',
  ],
  [
    'This also matches your intention: {intentions}.',
    'Ez a választott szándékodhoz is kapcsolódik: {intentions}.',
    'Corrisponde anche alla tua intenzione: {intentions}.',
    'Der Stein passt auch zu deiner Absicht: {intentions}.',
    'La pierre correspond aussi à ton intention : {intentions}.',
    'También coincide con tu intención: {intentions}.',
    'Камень также соответствует твоему намерению: {intentions}.',
  ],
  [
    'Its catalog associations include {themes}.',
    'A katalógusban megadott kapcsolódó témái: {themes}.',
    'Nel catalogo è associato a questi temi: {themes}.',
    'Im Katalog ist der Stein mit diesen Themen verknüpft: {themes}.',
    'Dans le catalogue, cette pierre est associée à : {themes}.',
    'En el catálogo, la piedra se asocia con: {themes}.',
    'В каталоге этот камень связан с темами: {themes}.',
  ],
  [
    'A small action for today: {action}.',
    'Egy apró mai lépés: {action}.',
    'Un piccolo gesto per oggi: {action}.',
    'Ein kleiner Schritt für heute: {action}.',
    'Une petite action pour aujourd’hui : {action}.',
    'Un pequeño paso para hoy: {action}.',
    'Небольшое действие на сегодня: {action}.',
  ],
  [
    'Among suitable stones in your collection, this has the strongest combined fit for today.',
    'A gyűjteményedben lévő megfelelő kövek közül ma ez illik legjobban az összképhez.',
    'Tra i cristalli adatti che possiedi, è quello con la corrispondenza complessiva più forte per oggi.',
    'Unter den passenden Steinen in deiner Sammlung passt dieser heute insgesamt am besten.',
    'Parmi les pierres adaptées de ta collection, c’est celle qui correspond le mieux à l’ensemble du jour.',
    'Entre las piedras adecuadas que ya tienes, esta es la que mejor encaja hoy en conjunto.',
    'Среди подходящих камней из твоей коллекции этот сегодня лучше всего совпадает с общей картиной.',
  ],
  [
    'This has the strongest combined fit among suitable stones outside your collection.',
    'A gyűjteményeden kívüli megfelelő kövek közül ez illik legjobban az összképhez.',
    'Tra i cristalli adatti che non possiedi, è quello con la corrispondenza complessiva più forte.',
    'Unter den passenden Steinen außerhalb deiner Sammlung hat dieser die beste Gesamtübereinstimmung.',
    'Parmi les pierres adaptées que tu ne possèdes pas, c’est celle qui correspond le mieux à l’ensemble.',
    'Entre las piedras adecuadas que no tienes, esta es la que mejor encaja en conjunto.',
    'Среди подходящих камней, которых у тебя пока нет, этот лучше всего совпадает с общей картиной.',
  ],
  [
    'It is one of the next-strongest fits, adding a distinct link to {theme}.',
    'Ez az egyik következő legerősebb választás, és külön kapcsolódást ad ehhez a témához: {theme}.',
    'È una delle alternative più adatte e aggiunge un collegamento distinto con {theme}.',
    'Dieser Stein gehört zu den nächstbesten Alternativen und bringt einen eigenen Bezug zu {theme} ein.',
    'C’est l’une des alternatives les plus adaptées et elle apporte un lien distinct avec {theme}.',
    'Es una de las alternativas con mejor encaje y aporta un vínculo propio con {theme}.',
    'Это один из наиболее подходящих дополнительных вариантов; он отдельно связан с темой «{theme}».',
  ],
  [
    'Daily ranking weights are: main transit themes 35%, your eight birth-chart companions 25%, today’s feeling 20%, relevant supporting aspects 10%, and your stated intention 10%. We score suitability first; hidden stones are excluded, and stones you own are prioritized only when choosing among suitable matches.',
    'A napi rangsorolás súlyai: fő tranzittémák 35%, a születési képleted nyolc kísérőköve 25%, a mai hangulatod 20%, kapcsolódó kiegészítő fényszögek 10%, a megadott szándékod 10%. Először az alkalmasságot pontozzuk; az elrejtett kövek kimaradnak, a saját köveid pedig csak a megfelelő találatok közötti választáskor kapnak elsőbbséget.',
    'Il peso dei fattori nella scelta quotidiana è: temi del transito principale 35%, gli otto cristalli del tuo tema natale 25%, umore del giorno 20%, aspetti secondari pertinenti 10%, intenzione indicata 10%. Prima valutiamo la corrispondenza; i cristalli nascosti sono esclusi e quelli che possiedi hanno priorità solo tra le opzioni adatte.',
    'Die tägliche Rangfolge gewichtet: Hauptthemen des Transits 35 %, deine acht Begleitsteine aus dem Geburtshoroskop 25 %, heutige Stimmung 20 %, passende Neben-Aspekte 10 % und deine angegebene Absicht 10 %. Zuerst bewerten wir die Eignung; ausgeblendete Steine werden ausgeschlossen, und eigene Steine werden erst bei der Auswahl unter passenden Treffern bevorzugt.',
    'La pondération quotidienne est la suivante : thèmes du transit principal 35 %, huit pierres liées à ton thème natal 25 %, humeur du jour 20 %, aspects secondaires pertinents 10 %, intention indiquée 10 %. La pertinence est évaluée d’abord ; les pierres masquées sont exclues et celles de ta collection sont prioritaires uniquement parmi les correspondances adaptées.',
    'La clasificación diaria pondera así: temas del tránsito principal 35 %, tus ocho piedras de carta natal 25 %, estado de ánimo de hoy 20 %, aspectos secundarios relevantes 10 % e intención indicada 10 %. Primero se calcula la idoneidad; se excluyen las piedras ocultas y se da prioridad a las que ya tienes solo entre las opciones adecuadas.',
    'В ежедневном рейтинге учитываются: главные темы транзита — 35%, восемь камней натального набора — 25%, сегодняшнее настроение — 20%, подходящие дополнительные аспекты — 10%, указанное намерение — 10%. Сначала оценивается соответствие; скрытые камни исключаются, а камни из твоей коллекции получают приоритет только среди подходящих вариантов.',
  ],
] as const satisfies readonly Row[];

export const dailyCrystalSourceCopyKeys = rows.map((row) => row[0]);

const locales: readonly Exclude<AppLocale, 'en'>[] = ['hu', 'it', 'de', 'fr', 'es', 'ru'];

export const dailyCrystalTranslations = Object.fromEntries(
  locales.map((locale, localeIndex) => [
    locale,
    Object.fromEntries(rows.map((row) => [row[0], row[localeIndex + 1]])),
  ]),
) as Record<Exclude<AppLocale, 'en'>, Record<string, string>>;
