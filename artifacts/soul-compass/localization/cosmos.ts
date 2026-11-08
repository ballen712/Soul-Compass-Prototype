import { dailyRituals } from '@/constants/daily-rituals';

type Locale = 'hu' | 'it' | 'de' | 'fr' | 'es' | 'ru';

const ritualTranslations: Record<Locale, string[]> = {
  hu: [
    'A következő feladat előtt vegyél három kényelmes levegőt, és engedd le a vállad.',
    'Írd le, minek szeretnéd ma a figyelmedet szentelni.',
    'Menj ki, és figyelj meg egy részletet az égen, a levegőben vagy a környező hangokban.',
    'Nyújtsd meg a kezed és a vállad, mielőtt a következő feladatra térsz.',
    'Igyál néhány korty vizet úgy, hogy közben nem nézel képernyőt.',
    'Nevezd meg, mit érzel ebben a pillanatban, anélkül hogy megpróbálnád megváltoztatni.',
    'Válassz egy apró feladatot, amelyet tíz perc alatt be tudsz fejezni.',
    'Figyelj meg öt dolgot magad körül, aztán térj vissza ahhoz, amit csináltál.',
    'Írj egy rövid üzenetet valakinek, akinek értékeled a társaságát.',
    'Tegyél vissza egy tárgyat a helyére, és mára ennyi rendrakás is elég.',
    'Mielőtt megnyitod a következő alkalmazást, kérdezd meg magadtól, miért nyúlsz hozzá.',
    'Sétálj egy kicsit, és figyeld meg, ahogy a talpad a földhöz ér.',
    'Készíts egy meleg italt, és figyelj az illatára meg a hőmérsékletére.',
    'Írj egy mondatot valamiről, ami a vártnál egy kicsit jobban sikerült.',
    'Nézz el a képernyőről, és pihentesd a szemed egy távoli ponton.',
    'Válaszadás előtt olvasd el még egyszer az üzenetet, és válaszd meg a hangnemet.',
    'Most szándékosan hagyj félbe egy dolgot.',
    'Nyiss ablakot, és figyeld meg, milyen érzés a levegő.',
    'Tegyél be egy dalt, és figyelj egy olyan részletre, amelyet máskor nem veszel észre.',
    'Lazítsd el az állkapcsod, és engedd el a feszültséget a kezedből.',
    'Írd le a kérdést, amely most foglalkoztat; még nem kell válaszolnod rá.',
    'Tegyél rendet egy kis felületen, és állj meg, amikor az a rész szabaddá válik.',
    'Figyelj meg egy színt, formát vagy felületet, amelyet ma még nem vettél észre.',
    'A következő beszélgetés elején figyelj teljesen a másikra.',
    'Válassz egy egyszerű szándékot a következő órára, például türelmet vagy kíváncsiságot.',
    'Állj fel, körözz a válladdal, és nyújtózz egy kényelmeset.',
    'Evés előtt állj meg egy pillanatra, és figyeld meg az étel színét és illatát.',
    'Írd le, miben kérhetnél segítséget.',
    'Tarts egy nyugodt percet a nap két része között ahelyett, hogy rohannál tovább.',
    'Mielőtt újabb feladatot írnál a listádra, vedd észre, mi készült már el.',
    'Tedd elérhetetlen helyre a telefonod öt percre, amíg egy dologgal foglalkozol.',
    'A feladat végén nevezd meg a következő lépést, aztán tarts egy rövid szünetet.',
  ],
  it: [
    'Prima del prossimo compito, fai tre respiri tranquilli e lascia scendere le spalle.',
    'Scrivi a cosa vuoi dedicare la tua attenzione oggi.',
    'Esci e nota un dettaglio del cielo, dell’aria o dei suoni intorno a te.',
    'Allunga mani e spalle prima di passare al compito successivo.',
    'Bevi qualche sorso d’acqua senza guardare uno schermo.',
    'Dai un nome a ciò che senti in questo momento, senza cercare di cambiarlo.',
    'Scegli un piccolo compito che puoi finire in dieci minuti.',
    'Nota cinque cose che vedi, poi torna a quello che stavi facendo.',
    'Scrivi un breve messaggio a una persona di cui apprezzi la compagnia.',
    'Rimetti un oggetto al suo posto e considera sufficiente questo piccolo riordino.',
    'Prima di aprire la prossima app, chiediti cosa volevi fare.',
    'Fai una breve passeggiata e nota come i piedi toccano il terreno.',
    'Prepara una bevanda calda e fai attenzione al profumo e alla temperatura.',
    'Scrivi una frase su qualcosa che è andato un po’ meglio del previsto.',
    'Distogli lo sguardo dallo schermo e riposalo su qualcosa di lontano.',
    'Prima di rispondere, rileggi il messaggio e scegli il tono che vuoi usare.',
    'Scegli una cosa da lasciare in sospeso per ora, di proposito.',
    'Apri una finestra e nota com’è l’aria.',
    'Metti una canzone e ascolta una parte che di solito ti sfugge.',
    'Rilassa la mandibola e distendi le mani.',
    'Scrivi una domanda che ti porti dentro; non devi rispondere subito.',
    'Libera una piccola superficie e fermati quando è in ordine.',
    'Nota un colore, una forma o una consistenza a cui oggi non avevi fatto caso.',
    'All’inizio della prossima conversazione, dedica tutta la tua attenzione all’altra persona.',
    'Scegli un’intenzione semplice per la prossima ora, come pazienza o curiosità.',
    'Alzati, fai ruotare le spalle e stiracchiati con calma.',
    'Prima di mangiare, prenditi un momento per notare il colore e il profumo del cibo.',
    'Scrivi una cosa per cui potresti chiedere aiuto.',
    'Fai una pausa tranquilla di un minuto tra due momenti della giornata.',
    'Nota cosa hai già fatto prima di aggiungere un altro compito alla lista.',
    'Lascia il telefono fuori portata per cinque minuti mentre fai una cosa.',
    'Quando finisci un compito, indica il passo successivo e poi fermati un momento.',
  ],
  de: [
    'Atme vor deiner nächsten Aufgabe dreimal ruhig ein und aus und lass die Schultern sinken.',
    'Schreib auf, worauf du heute deine Aufmerksamkeit richten möchtest.',
    'Geh nach draußen und nimm ein Detail am Himmel, in der Luft oder bei den Geräuschen wahr.',
    'Lockere Hände und Schultern, bevor du mit der nächsten Aufgabe weitermachst.',
    'Trink ein paar Schlucke Wasser, ohne dabei auf einen Bildschirm zu schauen.',
    'Benenne das Gefühl, das gerade da ist, ohne es gleich ändern zu wollen.',
    'Such dir eine kleine Aufgabe aus, die du in zehn Minuten abschließen kannst.',
    'Nimm fünf Dinge wahr, die du sehen kannst, und mach dann weiter.',
    'Schreib einer Person, deren Gesellschaft du schätzt, eine kurze Nachricht.',
    'Leg einen Gegenstand zurück an seinen Platz. Für heute reicht das Aufräumen.',
    'Frag dich vor dem Öffnen der nächsten App, was du dort erledigen wolltest.',
    'Mach einen kurzen Spaziergang und spür, wie deine Füße den Boden berühren.',
    'Bereite dir ein warmes Getränk zu und achte auf Duft und Temperatur.',
    'Schreib einen Satz über etwas, das etwas besser lief als erwartet.',
    'Schau vom Bildschirm weg und lass deinen Blick in die Ferne schweifen.',
    'Lies eine Nachricht vor dem Antworten noch einmal und wähle deinen Ton bewusst.',
    'Lass eine Sache für den Moment absichtlich unerledigt.',
    'Öffne ein Fenster und nimm wahr, wie sich die Luft anfühlt.',
    'Mach ein Lied an und hör auf einen Teil, den du sonst oft überhörst.',
    'Lockere den Kiefer und entspanne deine Hände.',
    'Schreib eine Frage auf, die dich beschäftigt. Du musst sie noch nicht beantworten.',
    'Räum eine kleine Fläche frei und hör auf, wenn sie ordentlich ist.',
    'Nimm eine Farbe, Form oder Oberfläche wahr, auf die du heute noch nicht geachtet hast.',
    'Schenk der anderen Person zu Beginn des nächsten Gesprächs deine volle Aufmerksamkeit.',
    'Wähl für die nächste Stunde eine einfache Absicht, zum Beispiel Geduld oder Neugier.',
    'Steh auf, kreise die Schultern und streck dich ganz in Ruhe.',
    'Nimm vor dem Essen kurz Farbe und Duft der Mahlzeit wahr.',
    'Schreib auf, wobei du um Hilfe bitten könntest.',
    'Gönn dir zwischen zwei Tagesabschnitten eine ruhige Minute, statt sofort weiterzueilen.',
    'Nimm wahr, was schon erledigt ist, bevor du deiner Liste eine neue Aufgabe hinzufügst.',
    'Leg dein Handy für fünf Minuten außer Reichweite und mach eine Sache in Ruhe.',
    'Notiere nach einer Aufgabe den nächsten Schritt und gönn dir dann eine kurze Pause.',
  ],
  fr: [
    'Avant ta prochaine tâche, prends trois respirations tranquilles et relâche les épaules.',
    'Note ce à quoi tu veux consacrer ton attention aujourd’hui.',
    'Sors et remarque un détail du ciel, de l’air ou des sons autour de toi.',
    'Étire tes mains et tes épaules avant de passer à la tâche suivante.',
    'Bois quelques gorgées d’eau sans regarder d’écran.',
    'Nomme ce que tu ressens maintenant, sans essayer de le corriger.',
    'Choisis une petite tâche que tu peux terminer en dix minutes.',
    'Remarque cinq choses que tu vois, puis reprends ce que tu faisais.',
    'Envoie un petit mot à quelqu’un dont tu apprécies la présence.',
    'Remets un objet à sa place et considère que ce rangement suffit pour aujourd’hui.',
    'Avant d’ouvrir l’application suivante, demande-toi ce que tu venais y faire.',
    'Fais une courte marche et remarque tes pieds au contact du sol.',
    'Prépare une boisson chaude et prête attention à son odeur et à sa température.',
    'Écris une phrase sur quelque chose qui s’est un peu mieux passé que prévu.',
    'Détourne les yeux de l’écran et regarde au loin pour les reposer.',
    'Avant de répondre, relis le message et choisis le ton que tu veux adopter.',
    'Décide de laisser une chose inachevée pour le moment.',
    'Ouvre une fenêtre et remarque la sensation de l’air.',
    'Lance une chanson et écoute un passage que tu remarques rarement.',
    'Desserre la mâchoire et détends les mains.',
    'Écris une question que tu portes en toi ; tu n’as pas besoin d’y répondre maintenant.',
    'Libère une petite surface et arrête-toi quand elle est dégagée.',
    'Remarque une couleur, une forme ou une texture à laquelle tu n’avais pas prêté attention aujourd’hui.',
    'Au début de ta prochaine conversation, accorde toute ton attention à l’autre personne.',
    'Choisis une intention simple pour l’heure qui vient, comme la patience ou la curiosité.',
    'Lève-toi, fais rouler tes épaules et étire-toi doucement.',
    'Avant un repas, prends un instant pour remarquer ses couleurs et son odeur.',
    'Note une chose pour laquelle tu pourrais demander de l’aide.',
    'Accorde-toi une minute calme entre deux moments de la journée au lieu de te précipiter.',
    'Remarque ce qui est déjà fait avant d’ajouter une tâche à ta liste.',
    'Mets ton téléphone hors de portée pendant cinq minutes et fais une seule chose.',
    'À la fin d’une tâche, nomme la prochaine étape, puis fais une courte pause.',
  ],
  es: [
    'Antes de tu próxima tarea, respira con calma tres veces y baja los hombros.',
    'Escribe a qué quieres prestar atención hoy.',
    'Sal un momento y observa un detalle del cielo, del aire o de los sonidos a tu alrededor.',
    'Estira las manos y los hombros antes de pasar a la siguiente tarea.',
    'Bebe unos sorbos de agua sin mirar una pantalla.',
    'Pon nombre a lo que sientes ahora, sin intentar cambiarlo.',
    'Elige una tarea pequeña que puedas terminar en diez minutos.',
    'Fíjate en cinco cosas que puedas ver y luego vuelve a lo que estabas haciendo.',
    'Escribe un mensaje breve a alguien cuya compañía valoras.',
    'Deja un objeto en su sitio y da por suficiente ese pequeño orden.',
    'Antes de abrir otra aplicación, pregúntate para qué ibas a usarla.',
    'Da un paseo corto y nota cómo tus pies tocan el suelo.',
    'Prepárate una bebida caliente y fíjate en su aroma y temperatura.',
    'Escribe una frase sobre algo que salió un poco mejor de lo esperado.',
    'Aparta la mirada de la pantalla y descánsala en algo lejano.',
    'Antes de responder, vuelve a leer el mensaje y elige el tono que quieres usar.',
    'Deja algo sin terminar por ahora, de forma intencional.',
    'Abre una ventana y nota cómo se siente el aire.',
    'Pon una canción y escucha una parte que normalmente no notas.',
    'Relaja la mandíbula y suelta las manos.',
    'Escribe una pregunta que llevas contigo; no hace falta responderla todavía.',
    'Despeja una superficie pequeña y para cuando quede libre.',
    'Fíjate en un color, una forma o una textura que hoy aún no habías notado.',
    'Al empezar la próxima conversación, presta toda tu atención a la otra persona.',
    'Elige una intención sencilla para la próxima hora, como paciencia o curiosidad.',
    'Levántate, mueve los hombros en círculos y estírate con calma.',
    'Antes de comer, tómate un momento para observar el color y el olor de la comida.',
    'Escribe algo para lo que podrías pedir ayuda.',
    'Haz una pausa tranquila de un minuto entre dos partes del día, en vez de ir con prisa.',
    'Fíjate en lo que ya has terminado antes de añadir otra tarea a la lista.',
    'Deja el teléfono fuera de tu alcance durante cinco minutos mientras haces una cosa.',
    'Al terminar una tarea, nombra el siguiente paso y después haz una breve pausa.',
  ],
  ru: [
    'Перед следующей задачей спокойно вдохни и выдохни три раза и опусти плечи.',
    'Запиши, чему сегодня хочешь уделить внимание.',
    'Выйди ненадолго и заметь одну деталь в небе, воздухе или окружающих звуках.',
    'Разомни кисти и плечи перед тем, как перейти к следующему делу.',
    'Сделай несколько глотков воды, не глядя на экран.',
    'Назови чувство, которое есть сейчас, не пытаясь его изменить.',
    'Выбери небольшое дело, которое можно закончить за десять минут.',
    'Заметь пять вещей вокруг, а затем вернись к своему занятию.',
    'Напиши короткое сообщение человеку, чьё общество тебе дорого.',
    'Положи одну вещь на место — на сегодня этого небольшого порядка достаточно.',
    'Перед тем как открыть следующее приложение, спроси себя, зачем ты туда заходишь.',
    'Немного прогуляйся и почувствуй, как ступни касаются земли.',
    'Приготовь тёплый напиток и обрати внимание на его запах и температуру.',
    'Напиши одно предложение о том, что прошло чуть лучше, чем ты ожидал.',
    'Отведи взгляд от экрана и дай глазам отдохнуть, посмотрев вдаль.',
    'Перед ответом перечитай сообщение и выбери подходящий тон.',
    'Реши пока намеренно оставить одно дело незавершённым.',
    'Открой окно и почувствуй, какой воздух.',
    'Включи песню и прислушайся к моменту, который обычно пропускаешь.',
    'Расслабь челюсть и отпусти напряжение в руках.',
    'Запиши вопрос, который тебя занимает; отвечать на него прямо сейчас не нужно.',
    'Освободи небольшую поверхность и остановись, когда на ней станет свободно.',
    'Заметь цвет, форму или фактуру, на которые сегодня ещё не обращал внимания.',
    'В начале следующего разговора полностью сосредоточься на собеседнике.',
    'Выбери простое намерение на ближайший час — например, терпение или любопытство.',
    'Встань, покрути плечами и спокойно потянись.',
    'Перед едой остановись на мгновение и заметь её цвет и запах.',
    'Запиши, с чем ты мог бы попросить о помощи.',
    'Сделай спокойную минутную паузу между делами вместо того, чтобы спешить дальше.',
    'Заметь, что уже сделано, прежде чем добавлять новое дело в список.',
    'Убери телефон подальше на пять минут, пока занимаешься одним делом.',
    'Завершая дело, назови следующий шаг и сделай короткую паузу.',
  ],
};

const sharedCopy: Record<Locale, Record<string, string>> = {
  hu: {
    'SAMPLE REFLECTION': 'MINTA GONDOLAT',
    'Let one thing be enough today.': 'Ma legyen elég egyetlen dolog.',
    'A full day can make every request feel equally urgent. You are allowed to choose what matters most before responding to the rest.':
      'Egy sűrű napon minden kérés sürgősnek tűnhet. Mielőtt a többire válaszolnál, kiválaszthatod, mi a legfontosabb.',
    'A short, uninterrupted block may help you finish one practical task.':
      'Egy rövid, megszakítás nélküli időszak segíthet befejezni egy gyakorlati feladatot.',
    'Check your time before agreeing to anything new.':
      'Mielőtt új dologra mondasz igent, nézd meg, mennyi időd van.',
    'What would a satisfying day look like beyond the number of things I finish?':
      'Mitől lenne jó ez a nap azon túl, hogy hány dolgot végzek el?',
    'This is a sample reflection, not a reading based on your chart. Add your details in Settings for a personal daily reading.':
      'Ez csak mintagondolat, nem a képleted alapján készült. Személyes napi olvasathoz add meg az adataidat a Beállításokban.',
    'Focus for today': 'Mai fókusz',
    'What to leave for later': 'Mit hagyj későbbre',
    'A moment to keep': 'Egy pillanat, amit megőrizhetsz',
    'A small daily ritual': 'Egy apró napi rituálé',
    'Explore other ideas': 'Más ötletek',
    'Your personal reading isn’t available right now. Check your saved details in Settings.':
      'A személyes napi olvasat most nem érhető el. Ellenőrizd a mentett adataidat a Beállításokban.',
    'Add current residence for your daily reflection →':
      'Add meg a jelenlegi lakóhelyedet a napi olvasathoz →',
    'Read more about today’s reflection': 'További információ a mai gondolatról',
    'Opens a simple explanation of the daily reading': 'Megnyitja a napi olvasat egyszerű magyarázatát',
    'Read more about A moment to keep': 'További információ az „Egy pillanat, amit őrizz meg” részről',
    'Opens a simple explanation': 'Megnyit egy rövid magyarázatot',
    'Explore other daily ritual ideas': 'További napi rituáléötletek',
    'Opens practical examples': 'Gyakorlati ötleteket mutat',
    'Close explanation': 'Magyarázat bezárása',
    'A quiet field of stars in a deep navy sky': 'Nyugodt csillagmező mélykék égen',
    'Daily reflection': 'Napi gondolat',
    'An overflowing list can make everything seem equally urgent. This reflection asks you to separate what matters from what is simply making noise. You might finish less and still give the important part of your day better attention.':
      'Ha túl sok a teendő, minden egyformán sürgősnek tűnhet. Ez a gondolat arra hív, hogy válaszd külön a fontos dolgokat a puszta zajtól. Lehet, hogy kevesebbet végzel el, mégis több figyelmet adsz annak, ami igazán számít.',
    'This reading is one way to think about the day’s theme and how it might connect with your life. It is not a prediction or instruction. Keep what feels useful and leave the rest.':
      'Ez egy lehetséges módja annak, hogy átgondold a nap témáját és a saját életedhez való kapcsolatát. Nem jóslat és nem utasítás. Tartsd meg, ami hasznosnak érződik, a többit engedd el.',
    'This prompt connects today’s reflection with something real in your life. Think of a task, conversation, or choice that brings the theme to mind. You can sit with the question, write a few words, or leave it unanswered. There is no right answer and no need to act right away.':
      'Ez a kérdés a mai gondolatot a saját életedhez kapcsolja. Gondolj egy feladatra, beszélgetésre vagy döntésre, amely eszedbe juttatja ezt a témát. Maradhatsz egy kicsit a kérdéssel, leírhatsz néhány szót, vagy válasz nélkül is hagyhatod. Nincs helyes válasz, és nem kell rögtön cselekedned.',
  },
  it: {
    'SAMPLE REFLECTION': 'RIFLESSIONE DI ESEMPIO',
    'Let one thing be enough today.': 'Per oggi, lascia che una cosa basti.',
    'A full day can make every request feel equally urgent. You are allowed to choose what matters most before responding to the rest.':
      'In una giornata piena ogni richiesta può sembrare urgente. Puoi scegliere cosa conta di più prima di rispondere al resto.',
    'A short, uninterrupted block may help you finish one practical task.':
      'Un breve intervallo senza interruzioni può aiutarti a completare un compito pratico.',
    'Check your time before agreeing to anything new.':
      'Prima di accettare un nuovo impegno, controlla quanto tempo hai.',
    'What would a satisfying day look like beyond the number of things I finish?':
      'Che aspetto avrebbe una giornata soddisfacente, al di là di quante cose finisco?',
    'This is a sample reflection, not a reading based on your chart. Add your details in Settings for a personal daily reading.':
      'Questa è una riflessione di esempio, non una lettura basata sul tuo tema natale. Aggiungi i tuoi dati nelle Impostazioni per una lettura personale.',
    'Focus for today': 'Il focus di oggi',
    'What to leave for later': 'Cosa rimandare',
    'A moment to keep': 'Un momento da portare con te',
    'A small daily ritual': 'Un piccolo rituale quotidiano',
    'Explore other ideas': 'Altre idee',
    'Your personal reading isn’t available right now. Check your saved details in Settings.':
      'La tua lettura personale non è disponibile al momento. Controlla i dati salvati nelle Impostazioni.',
    'Add current residence for your daily reflection →':
      'Aggiungi la residenza attuale per la riflessione quotidiana →',
    'Read more about today’s reflection': 'Approfondisci la riflessione di oggi',
    'Opens a simple explanation of the daily reading': 'Apre una spiegazione semplice della lettura quotidiana',
    'Read more about A moment to keep': 'Approfondisci “Un momento da portare con te”',
    'Opens a simple explanation': 'Apre una breve spiegazione',
    'Explore other daily ritual ideas': 'Scopri altre idee di rituali quotidiani',
    'Opens practical examples': 'Mostra esempi pratici',
    'Close explanation': 'Chiudi la spiegazione',
    'A quiet field of stars in a deep navy sky': 'Un tranquillo campo di stelle in un cielo blu notte',
    'Daily reflection': 'Riflessione quotidiana',
    'An overflowing list can make everything seem equally urgent. This reflection asks you to separate what matters from what is simply making noise. You might finish less and still give the important part of your day better attention.':
      'Una lista troppo piena può far sembrare tutto urgente allo stesso modo. Questa riflessione ti invita a distinguere ciò che conta dal semplice rumore. Potresti concludere meno cose e dedicare comunque più attenzione a ciò che è importante.',
    'This reading is one way to think about the day’s theme and how it might connect with your life. It is not a prediction or instruction. Keep what feels useful and leave the rest.':
      'Questa è una possibile lettura del tema della giornata e del suo legame con la tua vita. Non è una previsione né un’istruzione. Tieni ciò che ti è utile e lascia il resto.',
    'This prompt connects today’s reflection with something real in your life. Think of a task, conversation, or choice that brings the theme to mind. You can sit with the question, write a few words, or leave it unanswered. There is no right answer and no need to act right away.':
      'Questo spunto collega la riflessione di oggi a qualcosa di concreto nella tua vita. Pensa a un compito, una conversazione o una scelta che ti fa venire in mente il tema. Puoi restare un po’ con la domanda, scrivere qualche parola o lasciarla senza risposta. Non c’è una risposta giusta e non devi agire subito.',
  },
  de: {
    'SAMPLE REFLECTION': 'BEISPIELIMPULS',
    'Let one thing be enough today.': 'Heute darf eine Sache genügen.',
    'A full day can make every request feel equally urgent. You are allowed to choose what matters most before responding to the rest.':
      'An einem vollen Tag kann jede Bitte gleich dringend wirken. Du darfst zuerst auswählen, was dir am wichtigsten ist.',
    'A short, uninterrupted block may help you finish one practical task.':
      'Ein kurzer Zeitraum ohne Unterbrechung kann dir helfen, eine praktische Aufgabe abzuschließen.',
    'Check your time before agreeing to anything new.':
      'Prüf zuerst, wie viel Zeit du hast, bevor du etwas Neues zusagst.',
    'What would a satisfying day look like beyond the number of things I finish?':
      'Woran würde ich einen guten Tag erkennen, abgesehen davon, wie viel ich erledige?',
    'This is a sample reflection, not a reading based on your chart. Add your details in Settings for a personal daily reading.':
      'Das ist ein Beispielimpuls und keine Deutung deines Geburtshoroskops. Ergänze deine Angaben in den Einstellungen für eine persönliche Tagesdeutung.',
    'Focus for today': 'Fokus für heute',
    'What to leave for later': 'Was noch warten kann',
    'A moment to keep': 'Ein Moment zum Bewahren',
    'A small daily ritual': 'Ein kleines Ritual für jeden Tag',
    'Explore other ideas': 'Weitere Ideen',
    'Your personal reading isn’t available right now. Check your saved details in Settings.':
      'Deine persönliche Tagesdeutung ist gerade nicht verfügbar. Prüf deine gespeicherten Angaben in den Einstellungen.',
    'Add current residence for your daily reflection →':
      'Ergänze deinen aktuellen Wohnort für den Tagesimpuls →',
    'Read more about today’s reflection': 'Mehr über den Tagesimpuls erfahren',
    'Opens a simple explanation of the daily reading': 'Öffnet eine einfache Erklärung des Tagesimpulses',
    'Read more about A moment to keep': 'Mehr über „Ein Moment zum Bewahren“ erfahren',
    'Opens a simple explanation': 'Öffnet eine kurze Erklärung',
    'Explore other daily ritual ideas': 'Weitere tägliche Ritualideen ansehen',
    'Opens practical examples': 'Öffnet praktische Beispiele',
    'Close explanation': 'Erklärung schließen',
    'A quiet field of stars in a deep navy sky': 'Ein stilles Sternenfeld in einem tiefblauen Nachthimmel',
    'Daily reflection': 'Täglicher Impuls',
    'An overflowing list can make everything seem equally urgent. This reflection asks you to separate what matters from what is simply making noise. You might finish less and still give the important part of your day better attention.':
      'Eine übervolle Liste kann alles gleich dringend wirken lassen. Dieser Impuls hilft dir, Wichtiges von bloßem Lärm zu unterscheiden. Vielleicht erledigst du weniger und schenkst dem Wesentlichen des Tages trotzdem mehr Aufmerksamkeit.',
    'This reading is one way to think about the day’s theme and how it might connect with your life. It is not a prediction or instruction. Keep what feels useful and leave the rest.':
      'Diese Deutung ist eine Möglichkeit, über das Tagesthema und seinen Bezug zu deinem Leben nachzudenken. Sie ist weder Vorhersage noch Anweisung. Behalte, was dir hilft, und lass den Rest los.',
    'This prompt connects today’s reflection with something real in your life. Think of a task, conversation, or choice that brings the theme to mind. You can sit with the question, write a few words, or leave it unanswered. There is no right answer and no need to act right away.':
      'Diese Frage verbindet den Tagesimpuls mit deinem Alltag. Denk an eine Aufgabe, ein Gespräch oder eine Entscheidung, die dich an das Thema erinnert. Du kannst bei der Frage verweilen, ein paar Worte aufschreiben oder sie offenlassen. Es gibt keine richtige Antwort und du musst nicht sofort handeln.',
  },
  fr: {
    'SAMPLE REFLECTION': 'RÉFLEXION D’EXEMPLE',
    'Let one thing be enough today.': 'Aujourd’hui, une seule chose peut suffire.',
    'A full day can make every request feel equally urgent. You are allowed to choose what matters most before responding to the rest.':
      'Quand la journée est chargée, chaque demande peut sembler urgente. Tu peux choisir ce qui compte le plus avant de répondre au reste.',
    'A short, uninterrupted block may help you finish one practical task.':
      'Un court moment sans interruption peut t’aider à terminer une tâche concrète.',
    'Check your time before agreeing to anything new.':
      'Avant d’accepter quelque chose de nouveau, vérifie le temps dont tu disposes.',
    'What would a satisfying day look like beyond the number of things I finish?':
      'À quoi ressemblerait une bonne journée, au-delà du nombre de choses terminées ?',
    'This is a sample reflection, not a reading based on your chart. Add your details in Settings for a personal daily reading.':
      'Ceci est une réflexion d’exemple, pas une lecture fondée sur ton thème natal. Ajoute tes informations dans les Réglages pour obtenir une lecture personnelle.',
    'Focus for today': 'Le focus du jour',
    'What to leave for later': 'Ce qui peut attendre',
    'A moment to keep': 'Un moment à garder',
    'A small daily ritual': 'Un petit rituel quotidien',
    'Explore other ideas': 'Voir d’autres idées',
    'Your personal reading isn’t available right now. Check your saved details in Settings.':
      'Ta lecture personnelle n’est pas disponible pour le moment. Vérifie les informations enregistrées dans les Réglages.',
    'Add current residence for your daily reflection →':
      'Ajoute ton lieu de résidence actuel pour la réflexion du jour →',
    'Read more about today’s reflection': 'En savoir plus sur la réflexion du jour',
    'Opens a simple explanation of the daily reading': 'Ouvre une explication simple de la lecture du jour',
    'Read more about A moment to keep': 'En savoir plus sur « Un moment à garder »',
    'Opens a simple explanation': 'Ouvre une courte explication',
    'Explore other daily ritual ideas': 'Voir d’autres idées de rituels quotidiens',
    'Opens practical examples': 'Ouvre des exemples pratiques',
    'Close explanation': 'Fermer l’explication',
    'A quiet field of stars in a deep navy sky': 'Un champ d’étoiles paisible dans un ciel bleu nuit',
    'Daily reflection': 'Réflexion du jour',
    'An overflowing list can make everything seem equally urgent. This reflection asks you to separate what matters from what is simply making noise. You might finish less and still give the important part of your day better attention.':
      'Une liste trop longue peut donner l’impression que tout est urgent. Cette réflexion t’invite à distinguer l’essentiel du simple bruit. Tu peux faire moins de choses tout en accordant davantage d’attention à ce qui compte.',
    'This reading is one way to think about the day’s theme and how it might connect with your life. It is not a prediction or instruction. Keep what feels useful and leave the rest.':
      'Cette lecture propose une façon de réfléchir au thème du jour et à son lien avec ta vie. Ce n’est ni une prédiction ni une consigne. Garde ce qui t’aide et laisse le reste.',
    'This prompt connects today’s reflection with something real in your life. Think of a task, conversation, or choice that brings the theme to mind. You can sit with the question, write a few words, or leave it unanswered. There is no right answer and no need to act right away.':
      'Cette question relie la réflexion du jour à ta vie concrète. Pense à une tâche, une conversation ou un choix qui te rappelle ce thème. Tu peux prendre le temps d’y penser, écrire quelques mots ou la laisser sans réponse. Il n’y a pas de bonne réponse et rien ne t’oblige à agir tout de suite.',
  },
  es: {
    'SAMPLE REFLECTION': 'REFLEXIÓN DE EJEMPLO',
    'Let one thing be enough today.': 'Hoy, deja que una cosa sea suficiente.',
    'A full day can make every request feel equally urgent. You are allowed to choose what matters most before responding to the rest.':
      'En un día lleno, todas las peticiones pueden parecer urgentes. Puedes elegir lo que más importa antes de responder a las demás.',
    'A short, uninterrupted block may help you finish one practical task.':
      'Un rato breve y sin interrupciones puede ayudarte a terminar una tarea práctica.',
    'Check your time before agreeing to anything new.':
      'Antes de aceptar algo nuevo, comprueba cuánto tiempo tienes.',
    'What would a satisfying day look like beyond the number of things I finish?':
      '¿Cómo sería un día satisfactorio más allá de cuántas cosas termino?',
    'This is a sample reflection, not a reading based on your chart. Add your details in Settings for a personal daily reading.':
      'Esta es una reflexión de ejemplo, no una lectura basada en tu carta natal. Añade tus datos en Ajustes para recibir una lectura diaria personal.',
    'Focus for today': 'Enfoque de hoy',
    'What to leave for later': 'Qué dejar para después',
    'A moment to keep': 'Un momento para recordar',
    'A small daily ritual': 'Un pequeño ritual diario',
    'Explore other ideas': 'Ver otras ideas',
    'Your personal reading isn’t available right now. Check your saved details in Settings.':
      'Tu lectura personal no está disponible ahora. Revisa los datos guardados en Ajustes.',
    'Add current residence for your daily reflection →':
      'Añade tu residencia actual para la reflexión diaria →',
    'Read more about today’s reflection': 'Leer más sobre la reflexión de hoy',
    'Opens a simple explanation of the daily reading': 'Abre una explicación sencilla de la lectura diaria',
    'Read more about A moment to keep': 'Leer más sobre «Un momento para recordar»',
    'Opens a simple explanation': 'Abre una explicación breve',
    'Explore other daily ritual ideas': 'Ver más ideas de rituales diarios',
    'Opens practical examples': 'Muestra ejemplos prácticos',
    'Close explanation': 'Cerrar explicación',
    'A quiet field of stars in a deep navy sky': 'Un campo tranquilo de estrellas en un cielo azul oscuro',
    'Daily reflection': 'Reflexión diaria',
    'An overflowing list can make everything seem equally urgent. This reflection asks you to separate what matters from what is simply making noise. You might finish less and still give the important part of your day better attention.':
      'Una lista demasiado llena puede hacer que todo parezca igual de urgente. Esta reflexión te invita a distinguir lo importante del simple ruido. Quizá termines menos cosas y aun así prestes más atención a lo que de verdad importa.',
    'This reading is one way to think about the day’s theme and how it might connect with your life. It is not a prediction or instruction. Keep what feels useful and leave the rest.':
      'Esta lectura es una forma de pensar en el tema del día y en cómo puede relacionarse con tu vida. No es una predicción ni una instrucción. Quédate con lo que te sirva y deja lo demás.',
    'This prompt connects today’s reflection with something real in your life. Think of a task, conversation, or choice that brings the theme to mind. You can sit with the question, write a few words, or leave it unanswered. There is no right answer and no need to act right away.':
      'Esta pregunta conecta la reflexión de hoy con algo real de tu vida. Piensa en una tarea, conversación o decisión que te recuerde el tema. Puedes quedarte un momento con la pregunta, escribir unas palabras o dejarla sin respuesta. No hay una respuesta correcta ni hace falta actuar enseguida.',
  },
  ru: {
    'SAMPLE REFLECTION': 'ПРИМЕР РАЗМЫШЛЕНИЯ',
    'Let one thing be enough today.': 'Пусть сегодня будет достаточно одного дела.',
    'A full day can make every request feel equally urgent. You are allowed to choose what matters most before responding to the rest.':
      'В насыщенный день любая просьба может казаться срочной. Ты можешь сначала выбрать самое важное и только потом отвечать на остальное.',
    'A short, uninterrupted block may help you finish one practical task.':
      'Короткий отрезок времени без отвлечений поможет закончить одно практическое дело.',
    'Check your time before agreeing to anything new.':
      'Прежде чем соглашаться на новое дело, проверь, сколько у тебя есть времени.',
    'What would a satisfying day look like beyond the number of things I finish?':
      'Что сделало бы этот день хорошим, кроме количества выполненных дел?',
    'This is a sample reflection, not a reading based on your chart. Add your details in Settings for a personal daily reading.':
      'Это пример размышления, а не чтение по твоей карте. Добавь данные в настройках, чтобы получать личный прогноз на день.',
    'Focus for today': 'Фокус на сегодня',
    'What to leave for later': 'Что можно отложить',
    'A moment to keep': 'Мысль, которую стоит сохранить',
    'A small daily ritual': 'Небольшой ритуал на день',
    'Explore other ideas': 'Другие идеи',
    'Your personal reading isn’t available right now. Check your saved details in Settings.':
      'Личный прогноз сейчас недоступен. Проверь сохранённые данные в настройках.',
    'Add current residence for your daily reflection →':
      'Добавь нынешнее место жительства для ежедневного прогноза →',
    'Read more about today’s reflection': 'Подробнее о размышлении дня',
    'Opens a simple explanation of the daily reading': 'Открывает простое объяснение прогноза на день',
    'Read more about A moment to keep': 'Подробнее о мысли, которую стоит сохранить',
    'Opens a simple explanation': 'Открывает краткое объяснение',
    'Explore other daily ritual ideas': 'Другие идеи ежедневных ритуалов',
    'Opens practical examples': 'Показывает практические примеры',
    'Close explanation': 'Закрыть объяснение',
    'A quiet field of stars in a deep navy sky': 'Тихое звёздное небо глубокого тёмно-синего цвета',
    'Daily reflection': 'Размышление дня',
    'An overflowing list can make everything seem equally urgent. This reflection asks you to separate what matters from what is simply making noise. You might finish less and still give the important part of your day better attention.':
      'Длинный список дел может заставить считать срочным всё подряд. Эта мысль предлагает отделить важное от обычного шума. Можно сделать меньше, но уделить больше внимания тому, что действительно важно.',
    'This reading is one way to think about the day’s theme and how it might connect with your life. It is not a prediction or instruction. Keep what feels useful and leave the rest.':
      'Это один из способов поразмышлять о теме дня и о том, как она может быть связана с твоей жизнью. Это не предсказание и не указание. Оставь себе то, что полезно, а остальное отпусти.',
    'This prompt connects today’s reflection with something real in your life. Think of a task, conversation, or choice that brings the theme to mind. You can sit with the question, write a few words, or leave it unanswered. There is no right answer and no need to act right away.':
      'Этот вопрос связывает сегодняшнюю мысль с твоей реальной жизнью. Вспомни дело, разговор или выбор, который напоминает тебе об этой теме. Можно немного подумать, записать пару слов или оставить вопрос без ответа. Правильного ответа нет, и действовать сразу не нужно.',
  },
};

const dayCardDetailCopy: Record<Locale, Record<string, string>> = {
  hu: {
    'Read more about today’s focus': 'További részletek a mai fókuszról',
    'Opens a deeper note about the daily focus': 'Megnyitja a mai fókusz részletesebb magyarázatát',
    'Read more about what to leave for later': 'További részletek arról, mit érdemes későbbre hagyni',
    'Opens a gentle note about what can wait': 'Megnyitja annak magyarázatát, mi várhat még',
    'Read more about today’s ritual': 'További részletek a mai rituáléról',
    'Opens a note about the purpose of the ritual': 'Megnyitja a rituálé céljának magyarázatát',
    'Today’s focus points to something that may feel easier to begin, understand, or move forward. It is not a promise that everything will go smoothly. Choose one useful step and give it your attention; you do not have to finish everything at once.':
      'A mai fókusz arra mutat rá, amibe könnyebb lehet belevágni, amit átláthatóbbnak érezhetsz, vagy amiben előrébb juthatsz. Ez nem ígéret arra, hogy minden simán megy majd. Válassz egy hasznos, megtehető lépést, és figyelj arra; nem kell egyszerre mindent befejezned.',
    'This is a gentle nudge to give one kind of task more time or space, not a warning or a rule. If it can wait, come back to it when you have more time or clarity. If it cannot wait, take it in smaller steps and avoid adding extra pressure.':
      'Ez csak szelíd jelzés, hogy egy feladatra érdemes lehet több időt vagy teret hagyni; nem figyelmeztetés és nem szabály. Ha várhat, térj vissza rá akkor, amikor több időd vagy tisztább képed van. Ha nem halasztható, haladj kisebb lépésekben, és ne tegyél magadra még nagyobb nyomást.',
    'A small ritual is a brief pause that can help bring your attention back to the present. Try it once in a way that feels comfortable. It is an invitation, not another task you need to get right.':
      'Egy apró rituálé rövid szünet, amely segíthet visszahozni a figyelmedet a jelenbe. Próbáld ki egyszer, úgy, ahogy neked kényelmes. Ez meghívás, nem újabb feladat, amit jól kell teljesítened.',
  },
  it: {
    'Read more about today’s focus': 'Approfondisci il focus di oggi',
    'Opens a deeper note about the daily focus': 'Apre una spiegazione più dettagliata del focus di oggi',
    'Read more about what to leave for later': 'Approfondisci cosa rimandare',
    'Opens a gentle note about what can wait': 'Apre una spiegazione su cosa può aspettare',
    'Read more about today’s ritual': 'Approfondisci il rituale di oggi',
    'Opens a note about the purpose of the ritual': 'Apre una spiegazione sul senso del rituale',
    'Today’s focus points to something that may feel easier to begin, understand, or move forward. It is not a promise that everything will go smoothly. Choose one useful step and give it your attention; you do not have to finish everything at once.':
      'Il focus di oggi indica qualcosa che potrebbe essere più facile iniziare, capire o portare avanti. Non è una promessa che andrà tutto liscio. Scegli un passo utile e dedicagli attenzione: non devi finire tutto in una volta.',
    'This is a gentle nudge to give one kind of task more time or space, not a warning or a rule. If it can wait, come back to it when you have more time or clarity. If it cannot wait, take it in smaller steps and avoid adding extra pressure.':
      'È un invito gentile a dare più tempo o spazio a un certo tipo di impegno, non un avvertimento né una regola. Se può aspettare, riprendilo quando avrai più tempo o le idee più chiare. Se non può, procedi a piccoli passi senza aggiungere altra pressione.',
    'A small ritual is a brief pause that can help bring your attention back to the present. Try it once in a way that feels comfortable. It is an invitation, not another task you need to get right.':
      'Un piccolo rituale è una breve pausa che può riportare l’attenzione al presente. Provalo una volta, nel modo che ti è più comodo. È un invito, non un altro compito da svolgere alla perfezione.',
  },
  de: {
    'Read more about today’s focus': 'Mehr über deinen Fokus heute',
    'Opens a deeper note about the daily focus': 'Öffnet eine ausführlichere Erklärung zum heutigen Fokus',
    'Read more about what to leave for later': 'Mehr darüber, was noch warten kann',
    'Opens a gentle note about what can wait': 'Öffnet eine behutsame Erklärung dazu, was warten kann',
    'Read more about today’s ritual': 'Mehr über das heutige Ritual',
    'Opens a note about the purpose of the ritual': 'Öffnet eine Erklärung zum Sinn des Rituals',
    'Today’s focus points to something that may feel easier to begin, understand, or move forward. It is not a promise that everything will go smoothly. Choose one useful step and give it your attention; you do not have to finish everything at once.':
      'Der heutige Fokus zeigt auf etwas, mit dem du leichter anfangen, das du besser verstehen oder voranbringen kannst. Das heißt nicht, dass alles mühelos läuft. Wähle einen sinnvollen Schritt und konzentriere dich darauf. Du musst nicht alles auf einmal erledigen.',
    'This is a gentle nudge to give one kind of task more time or space, not a warning or a rule. If it can wait, come back to it when you have more time or clarity. If it cannot wait, take it in smaller steps and avoid adding extra pressure.':
      'Das ist ein sanfter Hinweis, einer bestimmten Aufgabe mehr Zeit oder Raum zu geben – keine Warnung und keine Regel. Wenn sie warten kann, komm darauf zurück, wenn du mehr Zeit oder Klarheit hast. Wenn nicht, geh in kleineren Schritten vor und mach dir keinen zusätzlichen Druck.',
    'A small ritual is a brief pause that can help bring your attention back to the present. Try it once in a way that feels comfortable. It is an invitation, not another task you need to get right.':
      'Ein kleines Ritual ist eine kurze Pause, die deine Aufmerksamkeit zurück ins Hier und Jetzt bringen kann. Probier es einmal so aus, wie es sich für dich gut anfühlt. Es ist eine Einladung und keine weitere Aufgabe, die du richtig machen musst.',
  },
  fr: {
    'Read more about today’s focus': 'En savoir plus sur ton point d’attention',
    'Opens a deeper note about the daily focus': 'Ouvre une explication plus détaillée du point d’attention',
    'Read more about what to leave for later': 'En savoir plus sur ce qui peut attendre',
    'Opens a gentle note about what can wait': 'Ouvre une explication douce sur ce qui peut attendre',
    'Read more about today’s ritual': 'En savoir plus sur le rituel du jour',
    'Opens a note about the purpose of the ritual': 'Ouvre une explication sur le sens du rituel',
    'Today’s focus points to something that may feel easier to begin, understand, or move forward. It is not a promise that everything will go smoothly. Choose one useful step and give it your attention; you do not have to finish everything at once.':
      'Le point d’attention du jour désigne quelque chose qu’il pourrait être plus facile de commencer, de comprendre ou de faire avancer. Cela ne garantit pas que tout se passera sans difficulté. Choisis une étape utile et concentre-toi dessus ; tu n’as pas besoin de tout terminer d’un coup.',
    'This is a gentle nudge to give one kind of task more time or space, not a warning or a rule. If it can wait, come back to it when you have more time or clarity. If it cannot wait, take it in smaller steps and avoid adding extra pressure.':
      'C’est une invitation à laisser un peu plus de temps ou d’espace à un type de tâche, pas un avertissement ni une règle. Si elle peut attendre, reprends-la quand tu auras plus de temps ou les idées plus claires. Sinon, avance par petites étapes sans te mettre davantage de pression.',
    'A small ritual is a brief pause that can help bring your attention back to the present. Try it once in a way that feels comfortable. It is an invitation, not another task you need to get right.':
      'Un petit rituel est une courte pause qui peut ramener ton attention au présent. Essaie-le une fois, d’une manière qui te convient. C’est une invitation, pas une tâche de plus à réussir.',
  },
  es: {
    'Read more about today’s focus': 'Más sobre tu foco de hoy',
    'Opens a deeper note about the daily focus': 'Abre una explicación más detallada del foco de hoy',
    'Read more about what to leave for later': 'Más sobre qué conviene dejar para después',
    'Opens a gentle note about what can wait': 'Abre una explicación amable sobre lo que puede esperar',
    'Read more about today’s ritual': 'Más sobre el ritual de hoy',
    'Opens a note about the purpose of the ritual': 'Abre una explicación sobre el sentido del ritual',
    'Today’s focus points to something that may feel easier to begin, understand, or move forward. It is not a promise that everything will go smoothly. Choose one useful step and give it your attention; you do not have to finish everything at once.':
      'El foco de hoy señala algo que quizá te resulte más fácil empezar, entender o sacar adelante. No es una promesa de que todo vaya a salir sin complicaciones. Elige un paso útil y préstale atención; no tienes que terminarlo todo de una vez.',
    'This is a gentle nudge to give one kind of task more time or space, not a warning or a rule. If it can wait, come back to it when you have more time or clarity. If it cannot wait, take it in smaller steps and avoid adding extra pressure.':
      'Es una sugerencia amable para dar más tiempo o espacio a cierto tipo de tarea, no una advertencia ni una regla. Si puede esperar, vuelve a ella cuando tengas más tiempo o las ideas más claras. Si no, avanza poco a poco y evita añadirte más presión.',
    'A small ritual is a brief pause that can help bring your attention back to the present. Try it once in a way that feels comfortable. It is an invitation, not another task you need to get right.':
      'Un pequeño ritual es una pausa breve que puede ayudarte a volver al presente. Pruébalo una vez, de una forma que te resulte cómoda. Es una invitación, no otra tarea que tengas que hacer bien.',
  },
  ru: {
    'Read more about today’s focus': 'Подробнее о фокусе на сегодня',
    'Opens a deeper note about the daily focus': 'Откроет более подробное пояснение к фокусу дня',
    'Read more about what to leave for later': 'Подробнее о том, что лучше отложить',
    'Opens a gentle note about what can wait': 'Откроет мягкое пояснение о том, что может подождать',
    'Read more about today’s ritual': 'Подробнее о сегодняшнем ритуале',
    'Opens a note about the purpose of the ritual': 'Откроет пояснение, для чего нужен ритуал',
    'Today’s focus points to something that may feel easier to begin, understand, or move forward. It is not a promise that everything will go smoothly. Choose one useful step and give it your attention; you do not have to finish everything at once.':
      'Сегодня может быть проще начать какое-то дело, разобраться в нём или сдвинуть его с места. Это не обещание, что всё пройдёт гладко. Выбери один полезный шаг и сосредоточься на нём — не обязательно успевать всё сразу.',
    'This is a gentle nudge to give one kind of task more time or space, not a warning or a rule. If it can wait, come back to it when you have more time or clarity. If it cannot wait, take it in smaller steps and avoid adding extra pressure.':
      'Это мягкая подсказка: возможно, одному делу стоит дать больше времени или пространства. Это не предупреждение и не правило. Если можно подождать, вернись к нему, когда будет больше времени или ясности. Если отложить нельзя, разбей его на небольшие шаги и не создавай себе лишнего давления.',
    'A small ritual is a brief pause that can help bring your attention back to the present. Try it once in a way that feels comfortable. It is an invitation, not another task you need to get right.':
      'Небольшой ритуал — это короткая пауза, которая помогает вернуться вниманием к настоящему. Попробуй его один раз так, как тебе удобно. Это приглашение, а не ещё одна задача, которую нужно выполнить правильно.',
  },
};

export const cosmosTranslations: Record<Locale, Record<string, string>> = {
  hu: { ...sharedCopy.hu, ...dayCardDetailCopy.hu },
  it: { ...sharedCopy.it, ...dayCardDetailCopy.it },
  de: { ...sharedCopy.de, ...dayCardDetailCopy.de },
  fr: { ...sharedCopy.fr, ...dayCardDetailCopy.fr },
  es: { ...sharedCopy.es, ...dayCardDetailCopy.es },
  ru: { ...sharedCopy.ru, ...dayCardDetailCopy.ru },
};

for (const locale of Object.keys(cosmosTranslations) as Locale[]) {
  dailyRituals.forEach((source, index) => {
    cosmosTranslations[locale][source] = ritualTranslations[locale][index] ?? source;
  });
}
