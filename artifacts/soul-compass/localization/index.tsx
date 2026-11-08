import React, { createContext, useCallback, useContext, type PropsWithChildren } from 'react';
import { useProfile } from '@/profile/ProfileContext';
import { cosmosTranslations } from './cosmos';
import crystalUiTranslations from './crystal-ui-translations.json';
import crystalGuidanceTranslations from './crystal-guidance-translations.json';
import { onboardingTranslations } from './onboarding';
import { screenTranslations } from './screen-copy';
import { natalTranslations } from './natal-copy';
import { dailyReadingTranslations } from './daily-copy';

export const APP_LOCALES = ['en', 'hu', 'it', 'de', 'fr', 'es', 'ru'] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export const APP_LANGUAGE_LABELS: Record<AppLocale, string> = {
  en: 'English',
  hu: 'Magyar',
  it: 'Italiano',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  ru: 'Русский',
};

const crystalUiCopy = crystalUiTranslations as unknown as Record<
  Exclude<AppLocale, 'en'>,
  Record<string, string>
>;
const crystalGuidanceCopy = crystalGuidanceTranslations as unknown as Record<
  Exclude<AppLocale, 'en'>,
  Record<string, string>
>;

const localizedText: Record<Exclude<AppLocale, 'en'>, Record<string, string>> = {
  hu: {
    COSMOS: 'KOZMOSZ',
    CRYSTALS: 'KRISTÁLYOK',
    'NATAL CHART': 'SZÜLETÉSI KÉPLET',
    EXPLORE: 'FELFEDEZÉS',
    'Today’s reflection': 'Mai gondolatok',
    'The Stone Guide': 'Útmutató a kövekhez',
    'More ways to reflect, at your pace.': 'További lehetőségek az önreflexióra, a saját tempódban.',
    'A quick guide to Soul Compass': 'Rövid útmutató a Soul Compass alkalmazáshoz',
    WELCOME: 'ÜDVÖZLÜNK',
    'FOUR WAYS TO EXPLORE': 'NÉGY MÓD A FELFEDEZÉSRE',
    'Explore the app': 'Fedezd fel az alkalmazást',
    'Daily reflections, a crystal guide, an optional birth chart, and more ways to explore.':
      'Napi gondolatok, kristálykalauz, választható születési képlet és további önismereti lehetőségek.',
    'IN DEVELOPMENT': 'KÉSZÜLŐBEN',
    'Tarot, longer-term transits, and Life Directions are planned for this space. Your daily Cosmos, Crystals, and Natal Chart stay just as they are.':
      'A Tarot, a hosszabb távú tranzitok és az Életirányok később kerülnek ide. A napi Kozmosz, Kristályok és Születési képlet lapok változatlanul elérhetők.',
    Tarot: 'Tarot',
    'Start with one card for a question on your mind. Larger spreads can come later.':
      'Kezdj egy lappal egy téged foglalkoztató kérdéshez. Később több lapos kirakások is jöhetnek.',
    'Long-term transits': 'Hosszabb távú tranzitok',
    'Follow longer planetary cycles and how their themes may connect with your chart.':
      'Kövesd a hosszabb bolygóciklusokat, és figyeld meg, hogyan kapcsolódhatnak a képletedhez.',
    'Life Directions': 'Életirányok',
    'Explore work styles, strengths, and interests that may feel natural to you.':
      'Fedezd fel, milyen munkastílusok, erősségek és érdeklődési területek illeszkedhetnek hozzád.',
    PLANNED: 'TERVBE VÉVE',
    'App language': 'Alkalmazás nyelve',
    'Some parts are translated, but most screens are still in English.':
      'Az alkalmazás egyes részei már le vannak fordítva, de a legtöbb képernyő még angolul jelenik meg.',
    'Language saved. Most screens are still in English.':
      'A nyelvi beállítás mentve. A legtöbb képernyő még angolul jelenik meg.',
    Cosmos: 'Kozmosz',
    'A short daily reflection with a focus and a question.':
      'Rövid napi gondolat egy fókuszponttal és egy kérdéssel.',
    Crystals: 'Kristályok',
    "See today's stone suggestions, browse stones, and track your collection.":
      'Nézd meg a napi kőajánlásokat, böngészd a köveket, és vezesd a gyűjteményedet.',
    'Natal Chart': 'Születési képlet',
    'Explore your birth chart in plain language. Optional; the other tabs work without it.':
      'Fedezd fel a születési képletedet közérthetően. Nem kötelező; a többi lap enélkül is használható.',
    Explore: 'Felfedezés',
    'Tarot reflections, longer-term transits, and Life Directions are planned for this space.':
      'A Tarot-önreflexiók, a hosszabb távú tranzitok és az Életirányok később kapnak helyet itt.',
  },
  it: {
    COSMOS: 'COSMO',
    CRYSTALS: 'CRISTALLI',
    'NATAL CHART': 'TEMA NATALE',
    EXPLORE: 'ESPLORA',
    'Today’s reflection': 'La riflessione di oggi',
    'The Stone Guide': 'Guida alle pietre',
    'More ways to reflect, at your pace.': 'Altri modi per riflettere, con i tuoi tempi.',
    'A quick guide to Soul Compass': 'Una breve guida a Soul Compass',
    WELCOME: 'BENVENUTO',
    'FOUR WAYS TO EXPLORE': 'QUATTRO MODI PER ESPLORARE',
    'Explore the app': 'Esplora l’app',
    'Daily reflections, a crystal guide, an optional birth chart, and more ways to explore.':
      'Riflessioni quotidiane, una guida ai cristalli, un tema natale facoltativo e altri modi per esplorare.',
    Cosmos: 'Cosmo',
    'A short daily reflection with a focus and a question.':
      'Una breve riflessione quotidiana, con un punto su cui concentrarsi e una domanda.',
    Crystals: 'Cristalli',
    "See today's stone suggestions, browse stones, and track your collection.":
      'Scopri i suggerimenti del giorno, esplora le pietre e tieni traccia della tua collezione.',
    'Natal Chart': 'Tema natale',
    'Explore your birth chart in plain language. Optional; the other tabs work without it.':
      'Esplora il tuo tema natale con parole semplici. È facoltativo: le altre schede funzionano anche senza.',
    Explore: 'Esplora',
    'Tarot reflections, longer-term transits, and Life Directions are planned for this space.':
      'Qui sono previste riflessioni con i Tarocchi, transiti di più lunga durata e Direzioni di vita.',
    'IN DEVELOPMENT': 'IN SVILUPPO',
    'Tarot, longer-term transits, and Life Directions are planned for this space. Your daily Cosmos, Crystals, and Natal Chart stay just as they are.':
      'In questo spazio sono previsti i Tarocchi, i transiti a lungo termine e le Direzioni di vita. Le schede quotidiane Cosmos, Cristalli e Tema natale restano invariate.',
    Tarot: 'Tarocchi',
    'Start with one card for a question on your mind. Larger spreads can come later.':
      'Inizia con una carta per una domanda che hai in mente. In seguito potranno arrivare stese più ampie.',
    'Long-term transits': 'Transiti a lungo termine',
    'Follow longer planetary cycles and how their themes may connect with your chart.':
      'Segui i cicli planetari più lunghi e scopri come i loro temi possono collegarsi al tuo tema natale.',
    'Life Directions': 'Direzioni di vita',
    'Explore work styles, strengths, and interests that may feel natural to you.':
      'Esplora stili di lavoro, punti di forza e interessi che potrebbero rispecchiarti.',
    PLANNED: 'IN PROGRAMMA',
    'App language': 'Lingua dell’app',
    'Some parts are translated, but most screens are still in English.':
      'Alcune parti sono tradotte, ma la maggior parte delle schermate è ancora in inglese.',
    'Language saved. Most screens are still in English.':
      'Lingua salvata. La maggior parte delle schermate è ancora in inglese.',
  },
  de: {
    COSMOS: 'KOSMOS',
    CRYSTALS: 'KRISTALLE',
    'NATAL CHART': 'GEBURTSHOROSKOP',
    EXPLORE: 'ENTDECKEN',
    'Today’s reflection': 'Dein Impuls für heute',
    'The Stone Guide': 'Der Steinkompass',
    'More ways to reflect, at your pace.': 'Mehr Raum zum Nachdenken – in deinem Tempo.',
    'A quick guide to Soul Compass': 'Ein kurzer Überblick über Soul Compass',
    WELCOME: 'WILLKOMMEN',
    'FOUR WAYS TO EXPLORE': 'VIER WEGE ZUM ENTDECKEN',
    'Explore the app': 'App entdecken',
    'Daily reflections, a crystal guide, an optional birth chart, and more ways to explore.':
      'Tägliche Impulse, ein Kristallführer, ein optionales Geburtshoroskop und weitere Möglichkeiten zur Selbstreflexion.',
    Cosmos: 'Kosmos',
    'A short daily reflection with a focus and a question.':
      'Ein kurzer täglicher Impuls mit einem Schwerpunkt und einer Frage.',
    Crystals: 'Kristalle',
    "See today's stone suggestions, browse stones, and track your collection.":
      'Sieh dir die Steinvorschläge des Tages an, entdecke Kristalle und verwalte deine Sammlung.',
    'Natal Chart': 'Geburtshoroskop',
    'Explore your birth chart in plain language. Optional; the other tabs work without it.':
      'Entdecke dein Geburtshoroskop in klarer Sprache. Es ist optional; die anderen Bereiche funktionieren auch ohne.',
    Explore: 'Entdecken',
    'Tarot reflections, longer-term transits, and Life Directions are planned for this space.':
      'Hier sind Tarot-Impulse, längerfristige Transite und mögliche Lebenswege geplant.',
    'IN DEVELOPMENT': 'IN ENTWICKLUNG',
    'Tarot, longer-term transits, and Life Directions are planned for this space. Your daily Cosmos, Crystals, and Natal Chart stay just as they are.':
      'Hier sind Tarot-Impulse, längerfristige Transite und Lebenswege geplant. Die täglichen Bereiche Kosmos, Kristalle und Geburtshoroskop bleiben unverändert.',
    Tarot: 'Tarot',
    'Start with one card for a question on your mind. Larger spreads can come later.':
      'Beginne mit einer Karte zu einer Frage, die dich beschäftigt. Größere Legungen können später folgen.',
    'Long-term transits': 'Längerfristige Transite',
    'Follow longer planetary cycles and how their themes may connect with your chart.':
      'Verfolge längere Planetenzyklen und entdecke, wie ihre Themen mit deinem Horoskop zusammenhängen können.',
    'Life Directions': 'Mögliche Lebenswege',
    'Explore work styles, strengths, and interests that may feel natural to you.':
      'Entdecke Arbeitsweisen, Stärken und Interessen, die zu dir passen könnten.',
    PLANNED: 'GEPLANT',
    'App language': 'App-Sprache',
    'Some parts are translated, but most screens are still in English.':
      'Einige Bereiche sind übersetzt, aber die meisten Bildschirme sind noch auf Englisch.',
    'Language saved. Most screens are still in English.':
      'Sprache gespeichert. Die meisten Bildschirme sind noch auf Englisch.',
  },
  fr: {
    COSMOS: 'COSMOS',
    CRYSTALS: 'CRISTAUX',
    'NATAL CHART': 'THÈME NATAL',
    EXPLORE: 'EXPLORER',
    'Today’s reflection': 'Votre réflexion du jour',
    'The Stone Guide': 'Guide des pierres',
    'More ways to reflect, at your pace.': 'D’autres pistes de réflexion, à votre rythme.',
    'A quick guide to Soul Compass': 'Petit guide de Soul Compass',
    WELCOME: 'BIENVENUE',
    'FOUR WAYS TO EXPLORE': 'QUATRE FAÇONS D’EXPLORER',
    'Explore the app': 'Découvrir l’application',
    'Daily reflections, a crystal guide, an optional birth chart, and more ways to explore.':
      'Des réflexions quotidiennes, un guide des cristaux, un thème natal facultatif et d’autres pistes à explorer.',
    Cosmos: 'Cosmos',
    'A short daily reflection with a focus and a question.':
      'Une courte réflexion quotidienne, avec un point d’attention et une question.',
    Crystals: 'Cristaux',
    "See today's stone suggestions, browse stones, and track your collection.":
      'Consultez les pierres suggérées aujourd’hui, parcourez le guide et suivez votre collection.',
    'Natal Chart': 'Thème natal',
    'Explore your birth chart in plain language. Optional; the other tabs work without it.':
      'Explorez votre thème natal avec des mots simples. C’est facultatif ; les autres onglets fonctionnent sans lui.',
    Explore: 'Explorer',
    'Tarot reflections, longer-term transits, and Life Directions are planned for this space.':
      'Des pistes de réflexion avec le Tarot, des transits de plus longue durée et des pistes de vie sont prévus ici.',
    'IN DEVELOPMENT': 'EN PRÉPARATION',
    'Tarot, longer-term transits, and Life Directions are planned for this space. Your daily Cosmos, Crystals, and Natal Chart stay just as they are.':
      'Des réflexions avec le Tarot, des transits de plus longue durée et des pistes de vie sont prévus ici. Les onglets Cosmos, Cristaux et Thème natal restent inchangés.',
    Tarot: 'Tarot',
    'Start with one card for a question on your mind. Larger spreads can come later.':
      'Commencez par une carte pour explorer une question qui vous préoccupe. Des tirages plus complets pourront venir ensuite.',
    'Long-term transits': 'Transits à long terme',
    'Follow longer planetary cycles and how their themes may connect with your chart.':
      'Suivez les cycles planétaires plus longs et voyez comment leurs thèmes peuvent se relier à votre thème natal.',
    'Life Directions': 'Pistes de vie',
    'Explore work styles, strengths, and interests that may feel natural to you.':
      'Explorez les façons de travailler, les points forts et les centres d’intérêt qui pourraient vous correspondre.',
    PLANNED: 'PRÉVU',
    'App language': 'Langue de l’application',
    'Some parts are translated, but most screens are still in English.':
      'Certaines parties sont traduites, mais la plupart des écrans sont encore en anglais.',
    'Language saved. Most screens are still in English.':
      'Langue enregistrée. La plupart des écrans sont encore en anglais.',
  },
  es: {
    COSMOS: 'COSMOS',
    CRYSTALS: 'CRISTALES',
    'NATAL CHART': 'CARTA NATAL',
    EXPLORE: 'EXPLORAR',
    'Today’s reflection': 'Reflexión de hoy',
    'The Stone Guide': 'Guía de piedras',
    'More ways to reflect, at your pace.': 'Más formas de reflexionar, a tu ritmo.',
    'A quick guide to Soul Compass': 'Una guía breve de Soul Compass',
    WELCOME: 'BIENVENIDO',
    'FOUR WAYS TO EXPLORE': 'CUATRO FORMAS DE EXPLORAR',
    'Explore the app': 'Explorar la aplicación',
    'Daily reflections, a crystal guide, an optional birth chart, and more ways to explore.':
      'Reflexiones diarias, una guía de cristales, una carta natal opcional y más formas de explorar.',
    Cosmos: 'Cosmos',
    'A short daily reflection with a focus and a question.':
      'Una reflexión breve para el día, con un enfoque y una pregunta.',
    Crystals: 'Cristales',
    "See today's stone suggestions, browse stones, and track your collection.":
      'Consulta las piedras sugeridas para hoy, explora el catálogo y lleva un registro de tu colección.',
    'Natal Chart': 'Carta natal',
    'Explore your birth chart in plain language. Optional; the other tabs work without it.':
      'Explora tu carta natal con palabras sencillas. Es opcional; las demás pestañas funcionan sin ella.',
    Explore: 'Explorar',
    'Tarot reflections, longer-term transits, and Life Directions are planned for this space.':
      'Aquí están previstas reflexiones con el Tarot, tránsitos de más larga duración y rumbos de vida.',
    'IN DEVELOPMENT': 'EN PREPARACIÓN',
    'Tarot, longer-term transits, and Life Directions are planned for this space. Your daily Cosmos, Crystals, and Natal Chart stay just as they are.':
      'Aquí se preparan reflexiones con el Tarot, tránsitos de más larga duración y Rumbos de vida. Las pestañas Cosmos, Cristales y Carta natal siguen igual.',
    Tarot: 'Tarot',
    'Start with one card for a question on your mind. Larger spreads can come later.':
      'Empieza con una carta para explorar una pregunta que tengas en mente. Más adelante pueden llegar tiradas más amplias.',
    'Long-term transits': 'Tránsitos a largo plazo',
    'Follow longer planetary cycles and how their themes may connect with your chart.':
      'Sigue ciclos planetarios más largos y observa cómo sus temas pueden relacionarse con tu carta natal.',
    'Life Directions': 'Rumbos de vida',
    'Explore work styles, strengths, and interests that may feel natural to you.':
      'Explora estilos de trabajo, fortalezas e intereses que podrían encajarte.',
    PLANNED: 'PREVISTO',
    'App language': 'Idioma de la aplicación',
    'Some parts are translated, but most screens are still in English.':
      'Algunas partes están traducidas, pero la mayoría de las pantallas siguen en inglés.',
    'Language saved. Most screens are still in English.':
      'Idioma guardado. La mayoría de las pantallas siguen en inglés.',
  },
  ru: {
    COSMOS: 'КОСМОС',
    CRYSTALS: 'КРИСТАЛЛЫ',
    'NATAL CHART': 'НАТАЛЬНАЯ КАРТА',
    EXPLORE: 'ИССЛЕДОВАТЬ',
    'Today’s reflection': 'Размышление дня',
    'The Stone Guide': 'Гид по камням',
    'More ways to reflect, at your pace.': 'Больше способов поразмышлять — в своём темпе.',
    'A quick guide to Soul Compass': 'Краткий гид по Soul Compass',
    WELCOME: 'ДОБРО ПОЖАЛОВАТЬ',
    'FOUR WAYS TO EXPLORE': 'ЧЕТЫРЕ СПОСОБА ИССЛЕДОВАТЬ СЕБЯ',
    'Explore the app': 'Открыть приложение',
    'Daily reflections, a crystal guide, an optional birth chart, and more ways to explore.':
      'Ежедневные размышления, гид по кристаллам, натальная карта по желанию и другие способы лучше узнать себя.',
    Cosmos: 'Космос',
    'A short daily reflection with a focus and a question.':
      'Короткое ежедневное размышление, фокус на день и вопрос для себя.',
    Crystals: 'Кристаллы',
    "See today's stone suggestions, browse stones, and track your collection.":
      'Смотрите камни дня, изучайте каталог и отмечайте камни в своей коллекции.',
    'Natal Chart': 'Натальная карта',
    'Explore your birth chart in plain language. Optional; the other tabs work without it.':
      'Изучайте натальную карту простым языком. Она необязательна: остальные вкладки работают и без неё.',
    Explore: 'Исследовать',
    'Tarot reflections, longer-term transits, and Life Directions are planned for this space.':
      'Здесь планируются размышления с картами Таро, разбор длительных транзитов и направления жизни.',
    'IN DEVELOPMENT': 'В РАЗРАБОТКЕ',
    'Tarot, longer-term transits, and Life Directions are planned for this space. Your daily Cosmos, Crystals, and Natal Chart stay just as they are.':
      'Здесь планируются размышления с картами Таро, разбор длительных транзитов и направления жизни. Ежедневные разделы «Космос», «Кристаллы» и «Натальная карта» останутся без изменений.',
    Tarot: 'Таро',
    'Start with one card for a question on your mind. Larger spreads can come later.':
      'Начни с одной карты и вопроса, который тебя волнует. Позже могут появиться более подробные расклады.',
    'Long-term transits': 'Длительные транзиты',
    'Follow longer planetary cycles and how their themes may connect with your chart.':
      'Следи за длительными планетарными циклами и тем, как их темы могут быть связаны с твоей натальной картой.',
    'Life Directions': 'Направления жизни',
    'Explore work styles, strengths, and interests that may feel natural to you.':
      'Посмотри, какие форматы работы, сильные стороны и интересы могут тебе подходить.',
    PLANNED: 'В ПЛАНАХ',
    'App language': 'Язык приложения',
    'Some parts are translated, but most screens are still in English.':
      'Некоторые части уже переведены, но большинство экранов пока на английском.',
    'Language saved. Most screens are still in English.':
      'Язык сохранён. Большинство экранов пока на английском.',
  },
};

const localDataDeletionTranslations: Record<Exclude<AppLocale, 'en'>, Record<string, string>> = {
  hu: {
    'Delete local profile': 'Helyi profil törlése',
    'Remove your profile and saved details from this device. Soul Compass will return to setup; select a language and enter your details again to continue.':
      'Töröld erről az eszközről a profilodat és a mentett adataidat. A Soul Compass visszatér a beállításhoz; a folytatáshoz válassz nyelvet, és add meg újra az adataidat.',
    'Delete my local data': 'Helyi adataim törlése',
    'Delete your local data?': 'Törlöd a helyi adataidat?',
    'This cannot be undone. It removes your birth details, current home, saved chart, language, daily feeling, preferences, stone collection, and chart permission from this device. You will return to setup and need to enter your details again. Device backups and technical network records are not deleted.':
      'Ez a művelet nem vonható vissza. Eltávolítja erről az eszközről a születési adataidat, jelenlegi lakóhelyedet, mentett képletedet, nyelvedet, napi hangulatodat, beállításaidat, kőgyűjteményedet és a képletszámítás engedélyét. Ezután visszatérsz a beállításhoz, és újra meg kell adnod az adataidat. Az eszköz biztonsági mentéseit és a hálózati funkciók technikai naplóit nem törli.',
    'Keep my data': 'Megtartom az adataimat',
    'Delete and start over': 'Törlés és újrakezdés',
    'Deleting…': 'Törlés…',
    'Could not finish deleting data. Some information may remain on this device. Chart requests are blocked for now. Please try again before closing the app.':
      'Nem sikerült befejezni a törlést. Néhány adat az eszközön maradhat. A képletszámítások egyelőre le vannak tiltva. Próbáld újra az alkalmazás bezárása előtt.',
  },
  it: {
    'Delete local profile': 'Elimina il profilo locale',
    'Remove your profile and saved details from this device. Soul Compass will return to setup; select a language and enter your details again to continue.':
      'Rimuovi da questo dispositivo il profilo e i dati salvati. Soul Compass tornerà alla configurazione iniziale: scegli una lingua e inserisci di nuovo i tuoi dati per continuare.',
    'Delete my local data': 'Elimina i miei dati locali',
    'Delete your local data?': 'Eliminare i dati locali?',
    'This cannot be undone. It removes your birth details, current home, saved chart, language, daily feeling, preferences, stone collection, and chart permission from this device. You will return to setup and need to enter your details again. Device backups and technical network records are not deleted.':
      'Non puoi annullare questa operazione. Verranno rimossi da questo dispositivo i dati di nascita, il luogo in cui vivi, la carta salvata, la lingua, lo stato d’animo del giorno, le preferenze, la collezione di pietre e il consenso al calcolo della carta. Tornerai alla configurazione iniziale e dovrai inserire di nuovo i tuoi dati. I backup del dispositivo e i registri tecnici di rete non vengono eliminati.',
    'Keep my data': 'Conserva i miei dati',
    'Delete and start over': 'Elimina e ricomincia',
    'Deleting…': 'Eliminazione…',
    'Could not finish deleting data. Some information may remain on this device. Chart requests are blocked for now. Please try again before closing the app.':
      'Non è stato possibile completare l’eliminazione. Alcuni dati potrebbero restare su questo dispositivo. Per ora le richieste della carta sono bloccate. Riprova prima di chiudere l’app.',
  },
  de: {
    'Delete local profile': 'Lokales Profil löschen',
    'Remove your profile and saved details from this device. Soul Compass will return to setup; select a language and enter your details again to continue.':
      'Entferne dein Profil und gespeicherte Angaben von diesem Gerät. Soul Compass kehrt zur Einrichtung zurück. Wähle eine Sprache und gib deine Daten erneut ein, um fortzufahren.',
    'Delete my local data': 'Meine lokalen Daten löschen',
    'Delete your local data?': 'Lokale Daten löschen?',
    'This cannot be undone. It removes your birth details, current home, saved chart, language, daily feeling, preferences, stone collection, and chart permission from this device. You will return to setup and need to enter your details again. Device backups and technical network records are not deleted.':
      'Das lässt sich nicht rückgängig machen. Geburtsdaten, aktueller Wohnort, gespeichertes Geburtshoroskop, Sprache, Tagesgefühl, Einstellungen, Steinsammlung und die Zustimmung zur Berechnung werden von diesem Gerät entfernt. Danach kehrst du zur Einrichtung zurück und musst deine Daten erneut eingeben. Gerätesicherungen und technische Netzwerkprotokolle werden dadurch nicht gelöscht.',
    'Keep my data': 'Daten behalten',
    'Delete and start over': 'Löschen und neu beginnen',
    'Deleting…': 'Wird gelöscht…',
    'Could not finish deleting data. Some information may remain on this device. Chart requests are blocked for now. Please try again before closing the app.':
      'Die Daten konnten nicht vollständig gelöscht werden. Einige Angaben können auf diesem Gerät verbleiben. Berechnungsanfragen sind vorerst gesperrt. Bitte versuche es erneut, bevor du die App schließt.',
  },
  fr: {
    'Delete local profile': 'Supprimer le profil local',
    'Remove your profile and saved details from this device. Soul Compass will return to setup; select a language and enter your details again to continue.':
      'Supprimez de cet appareil votre profil et les informations enregistrées. Soul Compass reviendra à la configuration initiale. Choisissez une langue et saisissez à nouveau vos informations pour continuer.',
    'Delete my local data': 'Supprimer mes données locales',
    'Delete your local data?': 'Supprimer vos données locales ?',
    'This cannot be undone. It removes your birth details, current home, saved chart, language, daily feeling, preferences, stone collection, and chart permission from this device. You will return to setup and need to enter your details again. Device backups and technical network records are not deleted.':
      'Cette action est irréversible. Elle supprime de cet appareil vos données de naissance, votre lieu de résidence, votre thème natal enregistré, la langue, votre humeur du jour, vos préférences, votre collection de pierres et votre autorisation de calcul. Vous reviendrez à la configuration initiale et devrez saisir à nouveau vos informations. Les sauvegardes de l’appareil et les journaux techniques du réseau ne sont pas supprimés.',
    'Keep my data': 'Conserver mes données',
    'Delete and start over': 'Supprimer et recommencer',
    'Deleting…': 'Suppression…',
    'Could not finish deleting data. Some information may remain on this device. Chart requests are blocked for now. Please try again before closing the app.':
      'La suppression n’a pas pu être terminée. Certaines informations peuvent rester sur cet appareil. Les demandes de calcul sont bloquées pour le moment. Réessayez avant de fermer l’application.',
  },
  es: {
    'Delete local profile': 'Eliminar perfil local',
    'Remove your profile and saved details from this device. Soul Compass will return to setup; select a language and enter your details again to continue.':
      'Elimina de este dispositivo tu perfil y los datos guardados. Soul Compass volverá a la configuración inicial. Elige un idioma e introduce tus datos otra vez para continuar.',
    'Delete my local data': 'Eliminar mis datos locales',
    'Delete your local data?': '¿Eliminar tus datos locales?',
    'This cannot be undone. It removes your birth details, current home, saved chart, language, daily feeling, preferences, stone collection, and chart permission from this device. You will return to setup and need to enter your details again. Device backups and technical network records are not deleted.':
      'No se puede deshacer. Se eliminarán de este dispositivo tus datos de nacimiento, tu residencia actual, la carta guardada, el idioma, el estado de ánimo del día, las preferencias, la colección de piedras y el permiso para calcular la carta. Volverás a la configuración inicial y tendrás que introducir tus datos de nuevo. No se eliminan las copias de seguridad del dispositivo ni los registros técnicos de red.',
    'Keep my data': 'Conservar mis datos',
    'Delete and start over': 'Eliminar y empezar de nuevo',
    'Deleting…': 'Eliminando…',
    'Could not finish deleting data. Some information may remain on this device. Chart requests are blocked for now. Please try again before closing the app.':
      'No se pudieron eliminar todos los datos. Es posible que algunos sigan en este dispositivo. Por ahora, las solicitudes de cálculo están bloqueadas. Inténtalo de nuevo antes de cerrar la aplicación.',
  },
  ru: {
    'Delete local profile': 'Удалить локальный профиль',
    'Remove your profile and saved details from this device. Soul Compass will return to setup; select a language and enter your details again to continue.':
      'Удалить профиль и сохранённые данные с этого устройства. Soul Compass вернётся к начальной настройке: выбери язык и введи данные заново, чтобы продолжить.',
    'Delete my local data': 'Удалить мои данные с устройства',
    'Delete your local data?': 'Удалить данные с устройства?',
    'This cannot be undone. It removes your birth details, current home, saved chart, language, daily feeling, preferences, stone collection, and chart permission from this device. You will return to setup and need to enter your details again. Device backups and technical network records are not deleted.':
      'Это действие нельзя отменить. С этого устройства будут удалены дата и место рождения, текущее место жительства, сохранённая натальная карта, язык, настроение, настройки, коллекция камней и разрешение на расчёт карты. После этого приложение вернётся к начальной настройке, и данные нужно будет ввести заново. Резервные копии устройства и технические сетевые журналы эта функция не удаляет.',
    'Keep my data': 'Оставить данные',
    'Delete and start over': 'Удалить и начать заново',
    'Deleting…': 'Удаление…',
    'Could not finish deleting data. Some information may remain on this device. Chart requests are blocked for now. Please try again before closing the app.':
      'Не удалось завершить удаление. Некоторые данные могут остаться на устройстве. Расчёт натальной карты пока заблокирован. Попробуй ещё раз до закрытия приложения.',
  },
};

const localeContext = createContext<AppLocale>('en');

export function normalizeAppLocale(value: string | null | undefined): AppLocale {
  const base = value?.trim().toLowerCase().split(/[-_]/)[0];
  return APP_LOCALES.find((locale) => locale === base) ?? 'en';
}

export function translateText(source: string, locale: AppLocale): string {
  if (locale === 'en') return source;
  return localDataDeletionTranslations[locale][source]
    ?? localizedText[locale][source]
    ?? cosmosTranslations[locale][source]
    ?? onboardingTranslations[locale][source]
    ?? crystalGuidanceCopy[locale]?.[source]
    ?? crystalUiCopy[locale]?.[source]
    ?? screenTranslations[locale][source]
    ?? natalTranslations[locale][source]
    ?? dailyReadingTranslations[locale][source]
    ?? source;
}

export function formatAppText(
  source: string,
  locale: AppLocale,
  values: Record<string, string | number>,
): string {
  return translateText(source, locale).replace(/\{([^}]+)\}/g, (token, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : token,
  );
}

export function AppLocaleProvider({ children }: PropsWithChildren) {
  const { preferences } = useProfile();
  const locale = normalizeAppLocale(preferences.language);
  return <localeContext.Provider value={locale}>{children}</localeContext.Provider>;
}

export function useAppText() {
  const locale = useContext(localeContext);
  return useCallback((source: string) => translateText(source, locale), [locale]);
}

export function useAppLocale() {
  return useContext(localeContext);
}
