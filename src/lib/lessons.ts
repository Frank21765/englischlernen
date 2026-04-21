// Static, hand-curated lesson catalog for the "Lektionen" tab.
// Each lesson is a coherent guided unit (15–20 mixed tasks) calibrated to a
// single CEFR level. Each level surfaces 8 lessons so the overview always feels
// full and structured. Progress is persisted locally per user.

export type TaskType = "mc" | "cloze" | "order";
export type LessonLevel = "A1" | "A2" | "B1" | "B2";

export interface ExtraExample {
  en: string;
  de: string;
}

interface BaseTask {
  id: string;
  type: TaskType;
  prompt: string;
  hint?: string;
  explain?: string;
  acceptedAnswers?: string[];
  /** Optional richer "what to look for" tip shown as the second hint line. */
  meaningHint?: string;
  /** Optional second example sentence (with German translation) for the explanation. */
  extraExample?: ExtraExample;
}
export interface MCTask extends BaseTask {
  type: "mc";
  options: string[];
  answer: string;
}
export interface ClozeTask extends BaseTask {
  type: "cloze";
  sentence: string;
  answer: string;
  translation?: string;
}
export interface OrderTask extends BaseTask {
  type: "order";
  words: string[];
  answer: string;
}
export type LessonTask = MCTask | ClozeTask | OrderTask;

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  examples?: string[];
  level: LessonLevel;
  emoji: string;
  tasks: LessonTask[];
}

type TaskExtras = { hint?: string; explain?: string; acceptedAnswers?: string[]; meaningHint?: string; extraExample?: ExtraExample };

const mc = (
  id: string, prompt: string, options: string[], answer: string,
  opts: TaskExtras = {},
): MCTask => ({ id, type: "mc", prompt, options, answer, ...opts });

const cz = (
  id: string, prompt: string, sentence: string, answer: string,
  opts: TaskExtras & { translation?: string } = {},
): ClozeTask => ({ id, type: "cloze", prompt, sentence, answer, ...opts });

const ord = (
  id: string, prompt: string, words: string[], answer: string,
  opts: TaskExtras = {},
): OrderTask => ({ id, type: "order", prompt, words, answer, ...opts });

// ============================================================
// LESSONS — 8 per level (A1, A2, B1, B2)
// Same 8 themes per level, each calibrated for that level.
// ============================================================

const A1_LESSONS: Lesson[] = [
  {
    id: "alltag-a1",
    title: "Alltag",
    subtitle: "Tagesablauf & Smalltalk",
    description: "Begrüßungen, Uhrzeit und einfache Fragen für jeden Tag.",
    examples: ["How are you?", "What time is it?"],
    level: "A1",
    emoji: "🌤️",
    tasks: [
      mc("t1", "„Wie geht es dir?“", ["How are you?", "How is you?", "What you?", "Where you?"], "How are you?",
        { explain: "„How are you?“ ist die feste Frageform mit dem Verb to be." }),
      mc("t2", "„Gute Nacht“ heißt …", ["Good night", "Good evening", "Good bye", "Good morning"], "Good night"),
      mc("t3", "„Bitte“ (höflich bitten) heißt …", ["please", "thanks", "sorry", "welcome"], "please"),
      cz("t4", "Lücke füllen", "I usually ___ up at seven.", "get",
        { hint: "Hier fehlt ein Verb für deinen Alltag", explain: "„get up“ = aufstehen. Im Present Simple ohne -s, weil „I“." }),
      cz("t5", "Lücke füllen", "She ___ to work by bike.", "goes",
        { hint: "Bei he/she/it bekommt das Verb ein -s", explain: "Bei he/she/it bekommt das Verb ein -s: go → goes." }),
      cz("t6", "Lücke füllen", "We have lunch ___ noon.", "at",
        { hint: "Vor einer Uhrzeit steht ein kleines Wort wie „at“", explain: "Vor genauen Zeiten benutzt man „at“: at noon, at 7." }),
      ord("t7", "Sätze richtig anordnen", ["what", "time", "is", "it"], "what time is it"),
      ord("t8", "Sätze richtig anordnen", ["I", "am", "from", "Germany"], "I am from Germany"),
      mc("t9", "Welche Antwort passt zu „Nice to meet you.“", [
        "Nice to meet you too.", "I am fine, thanks.", "See you later.", "It is raining.",
      ], "Nice to meet you too."),
      mc("t10", "„Wochenende“ heißt …", ["weekend", "weekday", "week off", "freeday"], "weekend"),
      cz("t11", "Lücke füllen", "I go to bed ___ 11 pm.", "at", { hint: "Vor einer Uhrzeit steht ein kleines Wort wie „at“" }),
      cz("t12", "Lücke füllen", "I brush my ___ every morning.", "teeth",
        { hint: "Hier fehlt ein Wort im Plural", explain: "Plural von „tooth“ ist unregelmäßig: teeth." }),
      mc("t13", "„Vielen Dank!“ heißt …", ["Thank you very much", "Many thank", "Thanks much you", "You thanks"], "Thank you very much"),
      cz("t14", "Lücke füllen", "I ___ a coffee every morning.", "drink", { hint: "Hier fehlt ein Verb für deinen Alltag" }),
      ord("t15", "Sätze richtig anordnen", ["see", "you", "tomorrow"], "see you tomorrow"),
      mc("t16", "Welche Frage passt zu „I am 25.“", [
        "How old are you?", "How are you old?", "What old you?", "When you?",
      ], "How old are you?"),
      cz("t17", "Lücke füllen", "My name ___ Anna.", "is", { hint: "Hier fehlt eine Form von „sein“ (am/is/are)" }),
      ord("t18", "Sätze richtig anordnen", ["where", "do", "you", "live"], "where do you live"),
    ],
  },
  {
    id: "essen-a1",
    title: "Essen & Trinken",
    subtitle: "Im Café & Restaurant",
    description: "Bestellen, bezahlen und einfache Wünsche äußern.",
    examples: ["A coffee, please.", "The bill, please."],
    level: "A1",
    emoji: "☕",
    tasks: [
      mc("t1", "„Einen Kaffee, bitte.“", ["A coffee, please.", "Coffee me.", "Give coffee.", "I do coffee."], "A coffee, please."),
      mc("t2", "„Wasser“ heißt …", ["water", "wine", "milk", "juice"], "water"),
      mc("t3", "„Brot“ heißt …", ["bread", "butter", "cake", "rice"], "bread"),
      cz("t4", "Lücke füllen", "I would ___ a tea, please.", "like",
        { hint: "Ein höfliches Verb für „möchten“ passt", explain: "„I would like …“ ist höflicher als „I want …“." }),
      cz("t5", "Lücke füllen", "Can I have the ___, please?", "bill",
        { hint: "Ein Wort aus dem Restaurant passt", explain: "„the bill“ = die Rechnung." }),
      cz("t6", "Lücke füllen", "I am very ___.", "hungry", { hint: "Hier passt ein Gefühl wie „hungry / tired“" }),
      ord("t7", "Sätze richtig anordnen", ["I", "am", "thirsty"], "I am thirsty"),
      ord("t8", "Sätze richtig anordnen", ["a", "table", "for", "two", "please"], "a table for two please"),
      mc("t9", "„Frühstück“ heißt …", ["breakfast", "lunch", "dinner", "snack"], "breakfast"),
      mc("t10", "„Apfel“ heißt …", ["apple", "orange", "banana", "lemon"], "apple"),
      cz("t11", "Lücke füllen", "I don't ___ meat.", "eat", { hint: "Hier passt ein Verb fürs Essen" }),
      cz("t12", "Lücke füllen", "This soup is ___ good.", "very", { hint: "Ein kleines Wort, das verstärkt (wie „very“)" }),
      ord("t13", "Sätze richtig anordnen", ["the", "menu", "please"], "the menu please"),
      mc("t14", "„Lecker!“ heißt …", ["Delicious!", "Heavy!", "Long!", "Hot!"], "Delicious!"),
      cz("t15", "Lücke füllen", "Two coffees ___ one tea, please.", "and", { hint: "Hier fehlt ein Verbindungswort wie „and / or / but“" }),
      mc("t16", "Welche Antwort passt zu „Anything else?“", [
        "No, thank you.", "Yes, please go.", "I am cold.", "It is morning.",
      ], "No, thank you."),
      cz("t17", "Lücke füllen", "I ___ like sugar in my coffee.", "don't", { hint: "Hier fehlt eine kurze Verneinung" }),
      ord("t18", "Sätze richtig anordnen", ["can", "I", "pay", "please"], "can I pay please"),
    ],
  },
  {
    id: "reisen-a1",
    title: "Reisen",
    subtitle: "Erste Wörter unterwegs",
    description: "Bahnhof, Hotel und einfache Wegfragen.",
    examples: ["Where is the station?", "One ticket, please."],
    level: "A1",
    emoji: "✈️",
    tasks: [
      mc("t1", "„Wo ist der Bahnhof?“", ["Where is the station?", "Where station?", "What is station?", "How is station?"], "Where is the station?"),
      mc("t2", "„Fahrkarte“ heißt …", ["ticket", "key", "card", "paper"], "ticket"),
      cz("t3", "Lücke füllen", "One ticket ___ London, please.", "to",
        { hint: "Vor einem Reiseziel kommt ein kleines Richtungswort", explain: "Vor dem Reiseziel steht „to“." }),
      cz("t4", "Lücke füllen", "I am ___ Germany.", "from", { hint: "Vor dem Herkunftsland kommt ein kleines Wort" }),
      cz("t5", "Lücke füllen", "Excuse me, where ___ the toilet?", "is", { hint: "Hier fehlt eine Form von „sein“ (am/is/are)" }),
      ord("t6", "Sätze richtig anordnen", ["I", "have", "two", "bags"], "I have two bags"),
      ord("t7", "Sätze richtig anordnen", ["where", "is", "my", "room"], "where is my room"),
      mc("t8", "„Hotel“ heißt …", ["hotel", "house", "home", "room"], "hotel"),
      cz("t9", "Lücke füllen", "I would like a ___ for one night.", "room", { hint: "Ein Wort aus dem Hotel passt" }),
      mc("t10", "„Links“ heißt …", ["left", "right", "up", "near"], "left"),
      mc("t11", "„Rechts“ heißt …", ["right", "left", "near", "far"], "right"),
      cz("t12", "Lücke füllen", "Go ___ for 100 metres.", "straight", { hint: "Hier passt ein Richtungswort" }),
      ord("t13", "Sätze richtig anordnen", ["how", "much", "is", "it"], "how much is it"),
      mc("t14", "„Flughafen“ heißt …", ["airport", "airline", "airbus", "airway"], "airport"),
      cz("t15", "Lücke füllen", "My flight is ___ 8 pm.", "at", { hint: "Vor einer Uhrzeit steht ein kleines Wort wie „at“" }),
      ord("t16", "Sätze richtig anordnen", ["I", "need", "a", "taxi"], "I need a taxi"),
      cz("t17", "Lücke füllen", "Is there a bank ___ here?", "near", { hint: "Ein kleines Wort für „nahe“" }),
      mc("t18", "„Koffer“ heißt …", ["suitcase", "bag stuff", "case bag", "boxbag"], "suitcase"),
    ],
  },
  {
    id: "einkaufen-a1",
    title: "Einkaufen",
    subtitle: "Im Geschäft & auf dem Markt",
    description: "Preise, Mengen und einfache Fragen beim Einkaufen.",
    examples: ["How much is it?", "Two apples, please."],
    level: "A1",
    emoji: "🛒",
    tasks: [
      mc("t1", "„Wie viel kostet das?“", ["How much is it?", "How many it?", "What it cost?", "Cost is what?"], "How much is it?"),
      mc("t2", "„Geld“ heißt …", ["money", "coin", "card", "buy"], "money"),
      cz("t3", "Lücke füllen", "I ___ two apples, please.", "want", { hint: "Ein Verb für „wollen / hätte gern“ passt" }),
      cz("t4", "Lücke füllen", "It costs five ___.", "euros", { hint: "Eine Währung im Plural passt" }),
      ord("t5", "Sätze richtig anordnen", ["one", "kilo", "of", "tomatoes", "please"], "one kilo of tomatoes please"),
      mc("t6", "„Teuer“ heißt …", ["expensive", "cheap", "small", "open"], "expensive"),
      mc("t7", "„Billig“ heißt …", ["cheap", "expensive", "small", "free"], "cheap"),
      cz("t8", "Lücke füllen", "Do you ___ bread?", "have", { hint: "Ein Verb für „haben / vorrätig sein“" }),
      ord("t9", "Sätze richtig anordnen", ["I", "pay", "by", "card"], "I pay by card"),
      mc("t10", "„Tasche / Tüte“ heißt …", ["bag", "box", "cup", "can"], "bag"),
      cz("t11", "Lücke füllen", "Can I ___ a bag?", "have", { hint: "Hier passt eine höfliche Bitte" }),
      mc("t12", "Welche Antwort passt zu „How much?“", ["Three euros.", "I am fine.", "Tomorrow.", "Yes please."], "Three euros."),
      cz("t13", "Lücke füllen", "I would ___ a small one.", "like", { hint: "Ein höfliches „I would ___“ passt" }),
      ord("t14", "Sätze richtig anordnen", ["that's", "all", "thank", "you"], "that's all thank you"),
      cz("t15", "Lücke füllen", "Sorry, I don't ___ change.", "have", { hint: "Ein Verb für „haben“ passt" }),
      mc("t16", "„Sonderangebot“ heißt …", ["special offer", "low price thing", "down day", "sell time"], "special offer"),
      cz("t17", "Lücke füllen", "How ___ apples would you like?", "many", { hint: "Frage nach Menge bei zählbaren Dingen (apples → ___ apples?)" }),
      ord("t18", "Sätze richtig anordnen", ["I'm", "just", "looking"], "I'm just looking"),
    ],
  },
  {
    id: "freizeit-a1",
    title: "Freizeit",
    subtitle: "Hobbys und Wochenende",
    description: "Über einfache Hobbys und freie Zeit sprechen.",
    examples: ["I like music.", "Do you play football?"],
    level: "A1",
    emoji: "🎵",
    tasks: [
      mc("t1", "„Ich mag Musik.“", ["I like music.", "I likes music.", "Me music like.", "Music I am."], "I like music."),
      cz("t2", "Lücke füllen", "I ___ playing football.", "like", { hint: "Ein Verb für „mögen“ passt hier" }),
      cz("t3", "Lücke füllen", "Do you ___ tennis?", "play", { hint: "Hier fehlt ein Verb, das man mit Sport benutzt" }),
      mc("t4", "„Buch lesen“ heißt …", ["read a book", "book read", "make a book", "do a book"], "read a book"),
      ord("t5", "Sätze richtig anordnen", ["I", "watch", "TV", "every", "day"], "I watch TV every day"),
      mc("t6", "„Schwimmen“ heißt …", ["swim", "run", "jump", "ride"], "swim"),
      cz("t7", "Lücke füllen", "I go ___ a walk on Sunday.", "for", { hint: "Feste Wendung: „go ___ a walk“" }),
      ord("t8", "Sätze richtig anordnen", ["my", "hobby", "is", "cooking"], "my hobby is cooking"),
      mc("t9", "Welche Antwort passt zu „Do you like jazz?“", ["Yes, I do.", "Yes, I am.", "Yes, I have.", "Yes, I go."], "Yes, I do."),
      cz("t10", "Lücke füllen", "I play the ___.", "guitar", { hint: "Ein Musikinstrument passt hier" }),
      mc("t11", "„Park“ heißt …", ["park", "place", "yard", "field"], "park"),
      ord("t12", "Sätze richtig anordnen", ["let's", "go", "to", "the", "park"], "let's go to the park"),
      cz("t13", "Lücke füllen", "I ___ to music in the evening.", "listen", { hint: "Hier kommt eine feste Wendung mit „to“" }),
      mc("t14", "„Kino“ heißt …", ["cinema", "movie place", "film house", "show room"], "cinema"),
      cz("t15", "Lücke füllen", "On Saturday I meet ___ friends.", "my", { hint: "Hier fehlt ein Wort wie „my / your / his“" }),
      ord("t16", "Sätze richtig anordnen", ["do", "you", "want", "to", "come"], "do you want to come"),
      mc("t17", "Welcher Satz lädt ein?", [
        "Do you want to come?", "You come?", "Come you can?", "I come you?",
      ], "Do you want to come?"),
      cz("t18", "Lücke füllen", "I love ___ movies.", "watching", { hint: "Nach „love“ steht das Verb mit -ing" }),
    ],
  },
  {
    id: "arbeit-a1",
    title: "Arbeit",
    subtitle: "Beruf & einfache Vorstellung",
    description: "Über deinen Beruf und Arbeitstag sprechen.",
    examples: ["I am a teacher.", "I work in an office."],
    level: "A1",
    emoji: "💼",
    tasks: [
      mc("t1", "„Ich bin Lehrer.“", ["I am a teacher.", "I teacher.", "I do teacher.", "Me teacher."], "I am a teacher."),
      cz("t2", "Lücke füllen", "I ___ in an office.", "work", { hint: "Ein Verb für „arbeiten“ passt hier" }),
      cz("t3", "Lücke füllen", "She is a ___.", "doctor", { hint: "Hier fehlt ein Beruf" }),
      mc("t4", "„Krankenschwester“ heißt …", ["nurse", "doctor", "teacher", "engineer"], "nurse"),
      ord("t5", "Sätze richtig anordnen", ["what", "is", "your", "job"], "what is your job"),
      cz("t6", "Lücke füllen", "I start work ___ 9 am.", "at", { hint: "Vor einer Uhrzeit steht ein kleines Wort wie „at“" }),
      cz("t7", "Lücke füllen", "I ___ home at 5.", "go", { hint: "Hier fehlt ein Verb für „gehen / fahren“" }),
      mc("t8", "„Büro“ heißt …", ["office", "shop", "school", "home"], "office"),
      ord("t9", "Sätze richtig anordnen", ["I", "am", "a", "student"], "I am a student"),
      mc("t10", "„Chef / Chefin“ heißt …", ["boss", "leader man", "head one", "boss top"], "boss"),
      cz("t11", "Lücke füllen", "I work ___ Monday to Friday.", "from", { hint: "Vor einem Zeitraum kommt ein kleines Wort wie „from“" }),
      cz("t12", "Lücke füllen", "She works ___ a hospital.", "in", { hint: "Vor einem Ort kommt ein kleines Wort wie „in“ oder „at“" }),
      ord("t13", "Sätze richtig anordnen", ["I", "have", "a", "meeting", "today"], "I have a meeting today"),
      mc("t14", "„Computer“ heißt …", ["computer", "comp box", "screen man", "type box"], "computer"),
      cz("t15", "Lücke füllen", "I write ___ every day.", "emails", { hint: "Etwas aus dem Büro im Plural" }),
      mc("t16", "Welche Antwort passt zu „What do you do?“", [
        "I am an engineer.", "I am fine.", "It is Tuesday.", "Yes, please.",
      ], "I am an engineer."),
      cz("t17", "Lücke füllen", "My job is very ___.", "interesting", { hint: "Ein Meinungswort wie „interesting“ passt" }),
      ord("t18", "Sätze richtig anordnen", ["I", "like", "my", "job"], "I like my job"),
    ],
  },
  {
    id: "umwelt-a1",
    title: "Umwelt",
    subtitle: "Natur und Wetter",
    description: "Einfache Wörter für Natur, Wetter und Tiere.",
    examples: ["It is sunny.", "I love trees."],
    level: "A1",
    emoji: "🌳",
    tasks: [
      mc("t1", "„Es ist sonnig.“", ["It is sunny.", "It sun.", "He sunny.", "Today sun."], "It is sunny."),
      mc("t2", "„Baum“ heißt …", ["tree", "leaf", "wood", "plant"], "tree"),
      cz("t3", "Lücke füllen", "It is very ___ today.", "cold", { hint: "Hier passt ein Wort fürs Wetter" }),
      cz("t4", "Lücke füllen", "I ___ animals.", "love", { hint: "Hier passt ein Gefühl wie „lieben“ oder „mögen“" }),
      mc("t5", "„Hund“ heißt …", ["dog", "cat", "bird", "fish"], "dog"),
      mc("t6", "„Katze“ heißt …", ["cat", "dog", "horse", "mouse"], "cat"),
      ord("t7", "Sätze richtig anordnen", ["the", "sky", "is", "blue"], "the sky is blue"),
      cz("t8", "Lücke füllen", "Look at the ___ in the sky.", "sun", { hint: "Ein Wort, das man am Himmel sieht" }),
      cz("t9", "Lücke füllen", "It is ___ outside.", "raining", { hint: "Hier passt ein Wetter-Verb in der -ing Form" }),
      mc("t10", "„Wald“ heißt …", ["forest", "park", "field", "garden"], "forest"),
      cz("t11", "Lücke füllen", "Birds can ___.", "fly", { hint: "Ein Verb, das Tiere typisch tun" }),
      ord("t12", "Sätze richtig anordnen", ["I", "see", "a", "big", "bird"], "I see a big bird"),
      mc("t13", "„Fluss“ heißt …", ["river", "lake", "sea", "rain"], "river"),
      cz("t14", "Lücke füllen", "We need clean ___.", "water", { hint: "Ein Wort aus der Natur passt" }),
      mc("t15", "„Müll / Abfall“ heißt …", ["rubbish", "thing out", "old box", "drop bag"], "rubbish"),
      cz("t16", "Lücke füllen", "I love walking in the ___.", "park", { hint: "Hier fehlt ein Ort" }),
      ord("t17", "Sätze richtig anordnen", ["the", "sun", "is", "shining"], "the sun is shining"),
      mc("t18", "„Blume“ heißt …", ["flower", "leaf", "tree", "fruit"], "flower"),
    ],
  },
  {
    id: "wirtschaft-a1",
    title: "Wirtschaft",
    subtitle: "Geld, Bank & Karten",
    description: "Erste Wörter rund um Geld und Bezahlen.",
    examples: ["I pay by card.", "Where is the bank?"],
    level: "A1",
    emoji: "💶",
    tasks: [
      mc("t1", "„Ich zahle mit Karte.“", ["I pay by card.", "I card pay.", "I pay card on.", "Card I pay."], "I pay by card."),
      mc("t2", "„Bank“ heißt …", ["bank", "shop", "office", "post"], "bank"),
      cz("t3", "Lücke füllen", "Where is the ___?", "bank", { hint: "Ein Wort für ein Gebäude mit Geld" }),
      cz("t4", "Lücke füllen", "I have no ___.", "money", { hint: "Ein Wort für „Geld“" }),
      mc("t5", "„Rechnung / Bill“ ist …", ["bill", "card", "ticket", "key"], "bill"),
      ord("t6", "Sätze richtig anordnen", ["I", "pay", "in", "cash"], "I pay in cash"),
      cz("t7", "Lücke füllen", "Can I pay ___ card?", "by", { hint: "Hier fehlt ein kleines Verbindungswort (Zahlungsart)" }),
      cz("t8", "Lücke füllen", "It is too ___ for me.", "expensive", { hint: "Ein Wort für „kostet viel“" }),
      mc("t9", "„Münze“ heißt …", ["coin", "note", "card", "bill"], "coin"),
      mc("t10", "„Geldschein“ heißt …", ["note", "coin", "bill paper", "card paper"], "note"),
      ord("t11", "Sätze richtig anordnen", ["how", "much", "is", "the", "ticket"], "how much is the ticket"),
      cz("t12", "Lücke füllen", "I need to ___ money.", "change", { hint: "Hier fehlt ein Verb (Geldwechsel)" }),
      mc("t13", "„Geldautomat“ heißt …", ["ATM", "money box", "auto bank", "cash room"], "ATM"),
      cz("t14", "Lücke füllen", "The shop is ___.", "closed", { hint: "Ein Wort für „nicht offen“ (Geschäft am Abend)" }),
      mc("t15", "„Offen“ heißt …", ["open", "closed", "ready", "in"], "open"),
      ord("t16", "Sätze richtig anordnen", ["I", "have", "ten", "euros"], "I have ten euros"),
      cz("t17", "Lücke füllen", "Can I have a ___, please?", "receipt", { hint: "Hier fehlt ein passendes Wort (Beleg)" }),
      mc("t18", "Welche Antwort passt zu „Cash or card?“", [
        "Card, please.", "Yes please.", "I am fine.", "It is Monday.",
      ], "Card, please."),
    ],
  },
];

const A2_LESSONS: Lesson[] = [
  {
    id: "reisen-a2",
    title: "Reisen",
    subtitle: "Am Flughafen, Hotel & unterwegs",
    description: "Check-in, Hotel und Wegbeschreibungen souverän meistern.",
    examples: ["I'd like a window seat.", "Could you call a taxi?"],
    level: "A2",
    emoji: "✈️",
    tasks: [
      mc("t1", "Wie sagt man höflich am Schalter „Ich möchte einchecken“?", [
        "I would like to check in, please.",
        "I want check in now.",
        "Check me in.",
        "Give check in.",
      ], "I would like to check in, please.",
        { explain: "„would like to“ ist die höfliche Form von „want to“." }),
      mc("t2", "Was passt? „Excuse me, where is the ___ to gate 12?“", ["way", "road", "street", "path"], "way",
        { explain: "„the way to ...“ ist die feste Wendung für „der Weg zu ...“." }),
      mc("t3", "„Verspätung“ heißt …", ["delay", "queue", "gate", "shuttle"], "delay"),
      cz("t4", "Lücke füllen", "My flight has been ___ by two hours.", "delayed",
        { hint: "Hier passt eine Verb-Form auf -ed/-en (Verspätung)", explain: "Passiv mit „has been + Partizip“: been delayed = wurde verspätet." }),
      cz("t5", "Lücke füllen", "I have a reservation ___ the name of Smith.", "in",
        { hint: "Hier fehlt ein kleines Verbindungswort (Hotel-Reservierung)", explain: "Feste Wendung: „in the name of …“." }),
      cz("t6", "Lücke füllen", "Could you ___ me where the elevator is?", "tell",
        { hint: "Hier fehlt ein Verb (höfliche Frage)", explain: "„Could you tell me …?“ ist eine indirekte, höfliche Frage." }),
      ord("t7", "Sätze richtig anordnen", ["I", "would", "like", "a", "window", "seat"], "I would like a window seat"),
      ord("t8", "Sätze richtig anordnen", ["how", "long", "is", "the", "flight"], "how long is the flight"),
      ord("t9", "Sätze richtig anordnen", ["could", "you", "call", "a", "taxi"], "could you call a taxi"),
      mc("t10", "Welcher Satz ist höflich am Empfang?", [
        "Give me a room.", "Could I have a room, please?", "Room now.", "I take room.",
      ], "Could I have a room, please?"),
      cz("t11", "Lücke füllen", "Breakfast is ___ from 7 to 10.", "served",
        { hint: "Hier passt eine Passiv-Form", explain: "Passiv mit „is + Partizip“: is served = wird serviert." }),
      mc("t12", "„Round trip“ bedeutet …", [
        "Hin- und Rückfahrt", "Stadtrundfahrt", "kurze Pause", "Umstieg",
      ], "Hin- und Rückfahrt"),
      cz("t13", "Lücke füllen", "I'd like to book a ___ for two nights.", "room",
        { hint: "Ein Wort aus dem Hotel passt" }),
      ord("t14", "Sätze richtig anordnen", ["is", "breakfast", "included", "in", "the", "price"], "is breakfast included in the price"),
      mc("t15", "Wegbeschreibung: „Go straight and then turn ___.“", ["left", "leftly", "to left side", "leftway"], "left"),
      cz("t16", "Lücke füllen", "We are looking ___ a cheap hotel near the center.", "for",
        { hint: "Hier fehlt ein kleines Verbindungswort", explain: "„look for“ = suchen. „look at“ = ansehen." }),
      ord("t17", "Sätze richtig anordnen", ["how", "much", "does", "it", "cost"], "how much does it cost"),
      mc("t18", "„Boarding pass“ ist …", ["Bordkarte", "Reisepass", "Sicherheitskontrolle", "Gepäckschein"], "Bordkarte"),
    ],
  },
  {
    id: "essen-a2",
    title: "Essen & Trinken",
    subtitle: "Restaurant & Bestellen",
    description: "Im Restaurant souverän bestellen und Wünsche äußern.",
    examples: ["I'd like the steak, medium.", "Could we have the bill?"],
    level: "A2",
    emoji: "🍽️",
    tasks: [
      mc("t1", "Höflich bestellen: „Ich hätte gern das Steak, medium.“", [
        "I'd like the steak, medium, please.",
        "I take steak medium.",
        "Steak medium for me.",
        "Give me steak.",
      ], "I'd like the steak, medium, please."),
      cz("t2", "Lücke füllen", "Could we have the ___, please?", "bill",
        { hint: "Hier fehlt ein passendes Wort (Restaurantende)", explain: "„the bill“ (UK) / „the check“ (US) = die Rechnung." }),
      cz("t3", "Lücke füllen", "I'm allergic ___ nuts.", "to",
        { hint: "Hier fehlt ein kleines Verbindungswort (Allergie)", explain: "„allergic to + Substanz“." }),
      cz("t4", "Lücke füllen", "Could you ___ me a fork, please?", "bring",
        { hint: "Verb des Holens — dem Gast etwas an den Tisch …",
          explain: "Im Restaurant „bringt“ (bring) der Kellner Dinge an den Tisch. „Take“ wäre wegnehmen, „give“ klingt nicht höflich, „get“ würde eher heißen, dass der Kellner sie sich selbst holt." }),
      ord("t5", "Sätze richtig anordnen", ["a", "table", "for", "two", "by", "the", "window"], "a table for two by the window"),
      ord("t6", "Sätze richtig anordnen", ["could", "I", "see", "the", "menu", "please"], "could I see the menu please"),
      mc("t7", "„Vorspeise“ heißt …", ["starter", "first food", "before meal", "open dish"], "starter"),
      mc("t8", "„Nachtisch“ heißt …", ["dessert", "after eat", "sweet end", "post dish"], "dessert"),
      cz("t9", "Lücke füllen", "I'll have the same ___ him.", "as",
        { hint: "Hier fehlt ein kleines Wort, das zwei Dinge vergleicht (z. B. as/than/to)", explain: "„the same as …“ = das gleiche wie …" }),
      cz("t10", "Lücke füllen", "This soup has too much salt — it's too ___.", "salty",
        { hint: "Beschreibungswort vom Wort „salt“ abgeleitet (salt → ___y).",
          explain: "Aus dem Substantiv „salt“ wird das Adjektiv „salty“ (mit -y). Andere Geschmackswörter wie „sweet“ oder „spicy“ passen vom Satz her nicht, weil hier ausdrücklich von Salz die Rede ist." }),
      ord("t11", "Sätze richtig anordnen", ["could", "we", "have", "some", "more", "water"], "could we have some more water"),
      mc("t12", "Welche Antwort passt zu „How would you like your steak?“", [
        "Medium, please.", "Yes please.", "On Monday.", "By card.",
      ], "Medium, please."),
      cz("t13", "Lücke füllen", "I'd like a glass ___ red wine.", "of",
        { hint: "Hier fehlt ein kleines Verbindungswort (Mengen)", explain: "„a glass of …“ — Mengenangabe mit „of“." }),
      cz("t14", "Lücke füllen", "Is service ___ in the price?", "included",
        { hint: "Partizip von „include“ — „mit drin“ in der Rechnung.",
          explain: "„be included in the price“ = im Preis enthalten. Hier braucht es das Partizip „included“, weil es als Passiv mit „is“ steht." }),
      ord("t15", "Sätze richtig anordnen", ["could", "we", "split", "the", "bill"], "could we split the bill"),
      mc("t16", "„Empfehlung des Hauses“ heißt …", [
        "the chef's recommendation", "house say food", "boss eat", "best home dish",
      ], "the chef's recommendation"),
      cz("t17", "Lücke füllen", "I'm vegetarian, so no chicken, beef or pork — basically no ___.", "meat",
        { hint: "Oberbegriff für chicken, beef und pork.",
          explain: "Gesucht ist der Oberbegriff für Hähnchen, Rind und Schwein — also „meat“. „Fish“ wäre zwar für viele Vegetarier auch tabu, ist aber kein Oberbegriff für die genannten Fleischsorten." }),
      ord("t18", "Sätze richtig anordnen", ["that", "was", "delicious", "thank", "you"], "that was delicious thank you"),
    ],
  },
  {
    id: "freizeit-a2",
    title: "Freizeit",
    subtitle: "Hobbys, Sport und Unterhaltung",
    description: "Über Hobbys reden und Verabredungen treffen.",
    examples: ["I'm interested in photography.", "Do you play any instrument?"],
    level: "A2",
    emoji: "🎨",
    tasks: [
      mc("t1", "Welche Antwort passt zu „What do you do in your free time?“", [
        "I read books and go hiking.", "Yes, please.", "It is Monday.", "Tomorrow at six.",
      ], "I read books and go hiking."),
      cz("t2", "Lücke füllen", "I ___ playing football on weekends.", "enjoy",
        { hint: "Hier fehlt ein Verb (Vorlieben)", explain: "Nach „enjoy“ steht die -ing-Form: enjoy playing." }),
      cz("t3", "Lücke füllen", "She is good ___ painting.", "at",
        { hint: "Hier kommt ein kleines Wort, das zu „good“ passt (good ___ …)", explain: "„good at + -ing“ = gut in/im …" }),
      cz("t4", "Lücke füllen", "We often go ___ a walk in the park.", "for",
        { hint: "Hier fehlt ein kleines Verbindungswort (feste Wendung)", explain: "„go for a walk“ = spazieren gehen." }),
      ord("t5", "Sätze richtig anordnen", ["I", "love", "watching", "old", "movies"], "I love watching old movies"),
      ord("t6", "Sätze richtig anordnen", ["do", "you", "play", "any", "instrument"], "do you play any instrument"),
      mc("t7", "Welche Frage lädt zu einem Treffen ein?", [
        "Would you like to join us tonight?", "Where you are tonight?", "Tonight come?", "We make tonight?",
      ], "Would you like to join us tonight?"),
      cz("t8", "Lücke füllen", "I am really ___ in photography.", "interested",
        { hint: "Hier passt ein Beschreibungswort (Interesse)", explain: "„interested in + Thema“ — über Interessen sprechen." }),
      mc("t9", "„Konzert“ heißt …", ["concert", "show", "festival", "play"], "concert"),
      cz("t10", "Lücke füllen", "How ___ do you go to the gym?", "often",
        { hint: "Hier wird gefragt: „Wie oft?“ — ein einzelnes kurzes Wort", explain: "„How often …?“ fragt nach der Häufigkeit." }),
      ord("t11", "Sätze richtig anordnen", ["let's", "meet", "at", "the", "café", "later"], "let's meet at the café later"),
      cz("t12", "Lücke füllen", "I usually meet my friends ___ Saturdays.", "on",
        { hint: "Hier fehlt ein kleines Verbindungswort (Wochentage)", explain: "Vor Wochentagen steht „on“: on Monday." }),
      mc("t13", "Welche Antwort lehnt höflich ab?", [
        "Sorry, I can't tonight, but maybe next week?", "No.", "I don't want.", "Stop asking.",
      ], "Sorry, I can't tonight, but maybe next week?"),
      cz("t14", "Lücke füllen", "I have been learning the guitar ___ two years.", "for",
        { hint: "Vor einer Dauer (z. B. „three days“) — kleines Wort für „lang“", explain: "„for + Zeitraum“ (zwei Jahre lang). „since“ + Zeitpunkt." }),
      ord("t15", "Sätze richtig anordnen", ["I", "can", "pick", "you", "up", "at", "eight"], "I can pick you up at eight"),
      mc("t16", "„Fitnessstudio“ heißt …", ["gym", "studio", "club", "court"], "gym"),
      cz("t17", "Lücke füllen", "I prefer reading ___ watching TV.", "to",
        { hint: "Hier fehlt ein kleines Wort, das zwei Dinge vergleicht (z. B. as/than/to)", explain: "„prefer A to B“ = A B vorziehen." }),
    ],
  },
  {
    id: "einkaufen-a2",
    title: "Einkaufen",
    subtitle: "Im Geschäft & online shoppen",
    description: "Größen, Preise und Reklamationen sicher klären.",
    examples: ["Can I try this on?", "I'd like to return this."],
    level: "A2",
    emoji: "🛍️",
    tasks: [
      mc("t1", "„Wie viel kostet das?“", [
        "How much is it?", "How many it?", "What price you?", "Cost is what?",
      ], "How much is it?"),
      cz("t2", "Lücke füllen", "Can I ___ this on?", "try",
        { hint: "Hier fehlt ein Verb (Anprobe)", explain: "„try on“ = anprobieren." }),
      cz("t3", "Lücke füllen", "Do you have this in a smaller ___?", "size",
        { hint: "Hier fehlt ein passendes Wort (Kleidung)" }),
      cz("t4", "Lücke füllen", "I would like to ___ this, please.", "buy",
        { hint: "Hier fehlt ein Verb (Kaufabschluss)" }),
      ord("t5", "Sätze richtig anordnen", ["where", "is", "the", "fitting", "room"], "where is the fitting room"),
      ord("t6", "Sätze richtig anordnen", ["do", "you", "accept", "credit", "cards"], "do you accept credit cards"),
      mc("t7", "„Reduziert / im Angebot“ heißt …", ["on sale", "in offer", "with cut", "down price"], "on sale"),
      mc("t8", "„Kassenbon / Quittung“ heißt …", ["receipt", "ticket", "note", "paper"], "receipt"),
      cz("t9", "Lücke füllen", "I would like to ___ this. It does not fit.", "return",
        { hint: "Hier fehlt ein Verb (Reklamation)" }),
      cz("t10", "Lücke füllen", "Free ___ on orders over 50 euros.", "shipping",
        { hint: "Hier fehlt ein passendes Wort (Versand)" }),
      mc("t11", "Welcher Satz ist höflich an der Kasse?", [
        "Could I pay by card, please?", "Card now.", "Pay card.", "I do card.",
      ], "Could I pay by card, please?"),
      cz("t12", "Lücke füllen", "It's a bit too tight. Do you have a ___ size?", "bigger",
        { hint: "Steigerungsform — „mehr/größer als …“ (more/bigger …)", explain: "Komparativ von „big“ verdoppelt das g: bigger." }),
      ord("t13", "Sätze richtig anordnen", ["I'm", "just", "looking", "thanks"], "I'm just looking thanks"),
      cz("t14", "Lücke füllen", "These shoes are ___ expensive than the others.", "more",
        { hint: "Steigerungsform — „mehr/größer als …“ (more/bigger …)", explain: "Bei längeren Adjektiven: „more + Adjektiv + than“." }),
      mc("t15", "„Garantie“ heißt …", ["warranty", "promise", "ticket", "contract"], "warranty"),
      cz("t16", "Lücke füllen", "I bought it ___ Monday and it broke today.", "on",
        { hint: "Hier fehlt ein kleines Verbindungswort (Wochentag)" }),
      ord("t17", "Sätze richtig anordnen", ["could", "I", "have", "a", "refund"], "could I have a refund"),
      mc("t18", "„Lieferung in 2 Tagen“ — passt …", [
        "delivery within 2 days", "delivery for 2 days", "delivery since 2 days", "delivery on 2 days",
      ], "delivery within 2 days"),
    ],
  },
  {
    id: "alltag-a2",
    title: "Alltag",
    subtitle: "Routinen & kleine Probleme",
    description: "Tagesabläufe genauer beschreiben und Probleme lösen.",
    examples: ["I usually take the bus.", "My phone isn't working."],
    level: "A2",
    emoji: "🌤️",
    tasks: [
      mc("t1", "„Ich nehme normalerweise den Bus.“", [
        "I usually take the bus.", "I take usually bus.", "Bus I take normal.", "I am bus take.",
      ], "I usually take the bus."),
      cz("t2", "Lücke füllen", "My phone isn't ___.", "working",
        { hint: "Hier fehlt eine -ing-Form, die sagt, dass das Handy gerade nicht funktioniert.", explain: "„working“ bedeutet hier nicht „arbeiten“, sondern „funktionieren“. Mit „My phone isn't working“ sagt man, dass das Handy im Moment nicht richtig läuft. Diese Form kannst du auch für andere Geräte benutzen, zum Beispiel: „The printer isn't working." }),
      cz("t3", "Lücke füllen", "I have to ___ my parents tonight.", "call",
        { hint: "Nach „have to“ kommt die Grundform eines Verbs. Gemeint ist das normale Alltagsverb dafür, die Eltern heute Abend anzurufen.", explain: "Nach „have to“ folgt die Grundform des Verbs. „call“ passt hier sehr gut, weil es die neutrale und häufige Form für „anrufen“ ist. „phone“ ist in diesem Satz ebenfalls möglich, aber in der Lektion verwenden wir „call“ als Standardvariante.", acceptedAnswers: ["phone"] }),
      cz("t4", "Lücke füllen", "I'm running ___ of milk.", "out",
        { hint: "Hier fehlt ein kleines Partikelwort (in/out/on/off/up/down/through …), das die Bedeutung des Verbs verändert", explain: "„run out of“ = nichts mehr haben von." }),
      ord("t5", "Sätze richtig anordnen", ["I", "always", "have", "coffee", "in", "the", "morning"], "I always have coffee in the morning"),
      ord("t6", "Sätze richtig anordnen", ["could", "you", "help", "me", "for", "a", "minute"], "could you help me for a minute"),
      mc("t7", "„Termin vereinbaren“ heißt …", [
        "make an appointment", "do a date", "give a meet", "set a time talk",
      ], "make an appointment"),
      cz("t8", "Lücke füllen", "I forgot ___ buy bread.", "to",
        { hint: "Nach „forget“ folgt oft ein kleines Brückenwort vor dem nächsten Verb (forget ___ do …)", explain: "Nach „forget“ steht meist „to + Infinitiv“." }),
      cz("t9", "Lücke füllen", "Sorry, I'm ___ a hurry.", "in",
        { hint: "Hier fehlt ein kleines Verbindungswort (feste Wendung)", explain: "„in a hurry“ = in Eile." }),
      ord("t10", "Sätze richtig anordnen", ["I", "usually", "go", "to", "bed", "at", "eleven"], "I usually go to bed at eleven"),
      mc("t11", "Welche Antwort passt zu „How was your day?“", [
        "Pretty good, thanks!", "It is Monday.", "I am 30.", "By bike.",
      ], "Pretty good, thanks!"),
      cz("t12", "Lücke füllen", "I need to ___ an appointment with the doctor.", "make",
        { hint: "Gesucht ist das übliche Verb zu „appointment“. Im Englischen „macht“ man einen Termin, statt ihn sprachlich zu „nehmen“.", explain: "Mit „make an appointment“ benutzt man die normale feste Verbindung für einen Termin. Das Verb „make“ passt, weil man einen Termin vereinbart oder ausmacht. Dieses Muster kannst du genauso in Sätzen wie „I need to make an appointment for Friday“ wiederverwenden." }),
      cz("t13", "Lücke füllen", "Could you turn ___ the music?", "down",
        { hint: "Hier fehlt ein kleines Partikelwort (in/out/on/off/up/down/through …), das die Bedeutung des Verbs verändert", explain: "„turn down“ = leiser machen." }),
      ord("t14", "Sätze richtig anordnen", ["I'll", "be", "there", "in", "ten", "minutes"], "I'll be there in ten minutes"),
      mc("t15", "Welche Aussage drückt eine Routine aus?", [
        "I usually have lunch at one.", "I am have lunch one.", "Lunch is to me at one.", "One I lunch.",
      ], "I usually have lunch at one."),
      cz("t16", "Lücke füllen", "I'm looking ___ to the weekend.", "forward",
        { hint: "Hier passt ein kleines Wort (feste Wendung)", explain: "„look forward to“ = sich freuen auf." }),
      ord("t17", "Sätze richtig anordnen", ["can", "I", "call", "you", "back", "later"], "can I call you back later"),
      mc("t18", "„Termin absagen“ heißt …", [
        "cancel the appointment", "off the meeting", "stop the date", "no the time",
      ], "cancel the appointment"),
    ],
  },
  {
    id: "arbeit-a2",
    title: "Arbeit",
    subtitle: "Job, Kollegen & Aufgaben",
    description: "Über Aufgaben, Kollegen und einfache Mails sprechen.",
    examples: ["I'm working on a report.", "I'll send it by Friday."],
    level: "A2",
    emoji: "💼",
    tasks: [
      mc("t1", "„Ich arbeite an einem Bericht.“", [
        "I'm working on a report.", "I work on report.", "I make report work.", "Report I work.",
      ], "I'm working on a report."),
      cz("t2", "Lücke füllen", "I'll send it ___ Friday.", "by",
        { hint: "Hier fehlt ein kleines Verbindungswort (Frist)", explain: "„by + Tag“ = bis spätestens." }),
      cz("t3", "Lücke füllen", "Can we ___ a meeting for tomorrow?", "set",
        { hint: "Hier fehlt ein Verb (Kollokation)", explain: "„set up a meeting“ = ein Meeting ansetzen." }),
      cz("t4", "Lücke füllen", "I'm responsible ___ the budget.", "for",
        { hint: "Hier fehlt ein kleines Verbindungswort (Verantwortung)" }),
      ord("t5", "Sätze richtig anordnen", ["I", "have", "a", "lot", "of", "work", "today"], "I have a lot of work today"),
      ord("t6", "Sätze richtig anordnen", ["could", "you", "help", "me", "with", "this", "report"], "could you help me with this report"),
      mc("t7", "„Pause machen“ heißt …", ["take a break", "do a pause", "make pause", "break go"], "take a break"),
      cz("t8", "Lücke füllen", "I'll be out of the office ___ Monday.", "on",
        { hint: "Hier fehlt ein kleines Verbindungswort (Wochentag)" }),
      cz("t9", "Lücke füllen", "I'm sorry, I'm ___ at the moment.", "busy",
        { hint: "Ein Wort für „nicht offen“ (Geschäft am Abend)" }),
      ord("t10", "Sätze richtig anordnen", ["thanks", "for", "your", "quick", "reply"], "thanks for your quick reply"),
      mc("t11", "Welche Antwort passt zu „How's the project going?“", [
        "It's going well, thanks.", "Yes please.", "On Tuesday.", "By bus.",
      ], "It's going well, thanks."),
      cz("t12", "Lücke füllen", "Please ___ me know if you have questions.", "let",
        { hint: "Hier passt eine feste Verb-Wendung", explain: "„let someone know“ = jemanden wissen lassen." }),
      cz("t13", "Lücke füllen", "Sorry for the late ___.", "reply",
        { hint: "Hier fehlt ein passendes Wort (E-Mail)" }),
      ord("t14", "Sätze richtig anordnen", ["I'll", "send", "you", "the", "details", "tonight"], "I'll send you the details tonight"),
      mc("t15", "„Anhang“ heißt …", ["attachment", "add file", "with paper", "stick on"], "attachment"),
      cz("t16", "Lücke füllen", "I work ___ a small team.", "in",
        { hint: "Hier fehlt ein kleines Verbindungswort (Gruppe)" }),
      ord("t17", "Sätze richtig anordnen", ["can", "we", "talk", "after", "the", "meeting"], "can we talk after the meeting"),
      mc("t18", "Welcher Satz schließt eine E-Mail höflich ab?", [
        "Best regards,", "End mail.", "By bye.", "Done.",
      ], "Best regards,"),
    ],
  },
  {
    id: "umwelt-a2",
    title: "Umwelt",
    subtitle: "Wetter & einfache Umweltthemen",
    description: "Wetter beschreiben und einfach über Umwelt sprechen.",
    examples: ["It's getting warmer.", "We should recycle more."],
    level: "A2",
    emoji: "🌱",
    tasks: [
      mc("t1", "„Es wird wärmer.“", [
        "It's getting warmer.", "It get warm.", "It makes warmer.", "It warm now.",
      ], "It's getting warmer."),
      cz("t2", "Lücke füllen", "We should ___ more.", "recycle",
        { hint: "Hier fehlt ein Verb (Umwelt)", explain: "„recycle“ = Wiederverwerten." }),
      cz("t3", "Lücke füllen", "It's been raining ___ three days.", "for",
        { hint: "Zeitdauer — for/since", explain: "„for + Zeitraum“." }),
      cz("t4", "Lücke füllen", "Please turn ___ the light when you leave.", "off",
        { hint: "Hier fehlt ein kleines Partikelwort (in/out/on/off/up/down/through …), das die Bedeutung des Verbs verändert", explain: "„turn off“ = ausschalten." }),
      ord("t5", "Sätze richtig anordnen", ["the", "weather", "is", "getting", "worse"], "the weather is getting worse"),
      ord("t6", "Sätze richtig anordnen", ["we", "should", "use", "less", "plastic"], "we should use less plastic"),
      mc("t7", "„Regenschirm“ heißt …", ["umbrella", "rainstick", "wet hat", "rain box"], "umbrella"),
      cz("t8", "Lücke füllen", "Don't ___ the water running.", "leave",
        { hint: "Hier fehlt ein Verb (Umweltschutz)" }),
      cz("t9", "Lücke füllen", "I usually go to work ___ bike.", "by",
        { hint: "Hier fehlt ein kleines Verbindungswort (Verkehrsmittel)" }),
      ord("t10", "Sätze richtig anordnen", ["it", "looks", "like", "it's", "going", "to", "rain"], "it looks like it's going to rain"),
      mc("t11", "„Mülltonne“ heißt …", ["bin", "trash time", "out box", "dirt cup"], "bin"),
      cz("t12", "Lücke füllen", "We need to ___ care of nature.", "take",
        { hint: "Hier fehlt ein Verb (Kollokation)", explain: "„take care of“ = sich kümmern um." }),
      cz("t13", "Lücke füllen", "It's too ___ to go out.", "cold",
        { hint: "Hier passt ein Wort fürs Wetter" }),
      ord("t14", "Sätze richtig anordnen", ["the", "weather", "is", "really", "nice", "today"], "the weather is really nice today"),
      mc("t15", "„Sonnenenergie“ heißt …", ["solar energy", "sun power one", "energy sun day", "light hot energy"], "solar energy"),
      cz("t16", "Lücke füllen", "I forgot my umbrella, and now it's ___.", "raining", { hint: "Hier fehlt ein Verb (Wetter -ing)" }),
      ord("t17", "Sätze richtig anordnen", ["small", "things", "can", "make", "a", "difference"], "small things can make a difference"),
      mc("t18", "Welcher Satz schlägt etwas Umweltfreundliches vor?", [
        "Why don't we walk instead of drive?", "Drive please now.", "No drive want.", "Walk drive same.",
      ], "Why don't we walk instead of drive?"),
    ],
  },
  {
    id: "wirtschaft-a2",
    title: "Wirtschaft",
    subtitle: "Geld, Bank & Online-Shopping",
    description: "Konto, Karten und einfache Zahlungen verstehen.",
    examples: ["I'd like to open an account.", "My card was declined."],
    level: "A2",
    emoji: "💶",
    tasks: [
      mc("t1", "„Ich möchte ein Konto eröffnen.“", [
        "I'd like to open an account.", "I want open count.", "Open me account.", "Account I make.",
      ], "I'd like to open an account."),
      cz("t2", "Lücke füllen", "My card was ___.", "declined",
        { hint: "Hier passt eine Verb-Form auf -ed/-en (Zahlung)", explain: "„be declined“ = abgelehnt werden (Karte)." }),
      cz("t3", "Lücke füllen", "I need to ___ some money from my account.", "withdraw",
        { hint: "Hier fehlt ein Verb (Bank)", explain: "„withdraw money“ = Geld abheben." }),
      cz("t4", "Lücke füllen", "Could you ___ this for me, please?", "change",
        { hint: "Hier fehlt ein Verb (Geldwechsel)" }),
      ord("t5", "Sätze richtig anordnen", ["how", "much", "is", "it", "in", "euros"], "how much is it in euros"),
      ord("t6", "Sätze richtig anordnen", ["could", "I", "pay", "in", "cash"], "could I pay in cash"),
      mc("t7", "„Überweisung“ heißt …", ["bank transfer", "money send", "give cash", "card move"], "bank transfer"),
      cz("t8", "Lücke füllen", "I'd like to transfer money ___ my friend.", "to",
        { hint: "Hier fehlt ein kleines Verbindungswort (Empfänger)" }),
      cz("t9", "Lücke füllen", "There's a small ___ for the transfer.", "fee",
        { hint: "Hier fehlt ein passendes Wort (Bankgebühr)" }),
      ord("t10", "Sätze richtig anordnen", ["the", "ATM", "is", "out", "of", "service"], "the ATM is out of service"),
      mc("t11", "Welcher Satz beschreibt einen Online-Kauf?", [
        "I bought it online.", "I online buy.", "Online I am buy.", "It buy online me.",
      ], "I bought it online."),
      cz("t12", "Lücke füllen", "The price ___ shipping is 50 euros.", "including",
        { hint: "Hier passt eine Verb-Form auf -ed/-en (Kosten)", explain: "„including + Substantiv“ = einschließlich." }),
      cz("t13", "Lücke füllen", "I'd like to ___ for this in cash.", "pay",
        { hint: "Hier fehlt ein Verb (Bezahlen)" }),
      ord("t14", "Sätze richtig anordnen", ["I", "got", "a", "discount", "of", "ten", "percent"], "I got a discount of ten percent"),
      mc("t15", "„Rückerstattung“ heißt …", ["refund", "back pay", "money give again", "return cash"], "refund"),
      cz("t16", "Lücke füllen", "Prices have gone ___ a lot this year.", "up",
        { hint: "Hier fehlt ein kleines Partikelwort (in/out/on/off/up/down/through …), das die Bedeutung des Verbs verändert", explain: "„go up“ = steigen." }),
      ord("t17", "Sätze richtig anordnen", ["could", "I", "have", "a", "receipt", "please"], "could I have a receipt please"),
      mc("t18", "„Sparen“ heißt …", ["to save (money)", "to spend slow", "to keep low", "to make small"], "to save (money)"),
    ],
  },
];

const B1_LESSONS: Lesson[] = [
  {
    id: "arbeit-b1",
    title: "Arbeit",
    subtitle: "Beruf, Büro und Meetings",
    description: "Mails schreiben, Meetings führen und professionell auftreten.",
    examples: ["I'll get back to you.", "Please find the file attached."],
    level: "B1",
    emoji: "💼",
    tasks: [
      mc("t1", "Welche E-Mail-Begrüßung ist formell?", [
        "Hey there!", "Yo team", "Dear Mr. Smith,", "What's up?",
      ], "Dear Mr. Smith,"),
      mc("t2", "„I'll get back to you.“ bedeutet …", [
        "Ich melde mich wieder bei dir.",
        "Ich gehe jetzt zurück.",
        "Ich komme bald vorbei.",
        "Ich schicke es zurück.",
      ], "Ich melde mich wieder bei dir."),
      cz("t3", "Lücke füllen", "Please find the file ___.", "attached",
        { hint: "Hier passt eine Verb-Form auf -ed/-en (E-Mail-Floskel)", explain: "„Please find … attached.“ ist die Standardformel für Anhänge." }),
      cz("t4", "Lücke füllen", "Looking ___ to your reply.", "forward",
        { hint: "Hier passt ein kleines Wort (Brief-Schluss)", explain: "„look forward to + -ing/Substantiv“ = sich freuen auf." }),
      cz("t5", "Lücke füllen", "I am ___ charge of the new project.", "in",
        { hint: "Hier fehlt ein kleines Verbindungswort (Verantwortung)", explain: "„in charge of …“ = verantwortlich für …" }),
      cz("t6", "Lücke füllen", "Could you send me the report ___ Friday?", "by",
        { hint: "Hier fehlt ein kleines Verbindungswort (Frist)", explain: "„by Friday“ = bis spätestens Freitag." }),
      ord("t7", "Sätze richtig anordnen", ["can", "we", "schedule", "a", "call", "tomorrow"], "can we schedule a call tomorrow"),
      ord("t8", "Sätze richtig anordnen", ["I'd", "like", "to", "follow", "up", "on", "this"], "I'd like to follow up on this"),
      mc("t9", "„Frist / Deadline“ heißt …", ["deadline", "endline", "timeout", "due moment"], "deadline"),
      mc("t10", "Welche Antwort signalisiert höflich Unsicherheit?", [
        "I'll need to double-check and get back to you.",
        "I don't know.",
        "Ask someone else.",
        "Maybe.",
      ], "I'll need to double-check and get back to you."),
      cz("t11", "Lücke füllen", "I'd like to bring ___ a quick point.", "up",
        { hint: "Hier fehlt ein kleines Partikelwort (in/out/on/off/up/down/through …), das die Bedeutung des Verbs verändert", explain: "„bring up“ = ein Thema ansprechen." }),
      cz("t12", "Lücke füllen", "Let's go ___ the agenda one more time.", "through",
        { hint: "Hier fehlt ein kleines Partikelwort (in/out/on/off/up/down/through …), das die Bedeutung des Verbs verändert", explain: "„go through“ = durchgehen, durchsehen." }),
      ord("t13", "Sätze richtig anordnen", ["I'm", "afraid", "I", "have", "to", "disagree"], "I'm afraid I have to disagree"),
      mc("t14", "Welcher Satz lehnt höflich einen Vorschlag ab?", [
        "I see your point, but I'm not sure that would work.",
        "No way.", "Bad idea.", "Don't do that.",
      ], "I see your point, but I'm not sure that would work."),
      cz("t15", "Lücke füllen", "I'll send you a calendar ___ for the meeting.", "invite",
        { hint: "Hier fehlt ein passendes Wort (Meeting)" }),
      ord("t16", "Sätze richtig anordnen", ["thanks", "for", "getting", "back", "to", "me"], "thanks for getting back to me"),
      cz("t17", "Lücke füllen", "We need to keep the client ___ on the progress.", "updated",
        { hint: "Hier passt ein Beschreibungswort", explain: "„keep someone updated“ = jemanden auf dem Laufenden halten." }),
      mc("t18", "Was bedeutet „ASAP“?", [
        "as soon as possible", "as simple as possible", "all sent and processed", "after some active planning",
      ], "as soon as possible"),
    ],
  },
  {
    id: "umwelt-b1",
    title: "Umwelt",
    subtitle: "Klima, Natur und Nachhaltigkeit",
    description: "Über Klimawandel und nachhaltigen Alltag diskutieren.",
    examples: ["We should use less plastic.", "Renewable energy is the future."],
    level: "B1",
    emoji: "🌱",
    tasks: [
      mc("t1", "„Klimawandel“ heißt …", ["climate change", "global heat", "weather move", "earth shift"], "climate change"),
      mc("t2", "„Mülltrennung“ heißt …", ["waste sorting", "trash mix", "garbage time", "bin work"], "waste sorting"),
      cz("t3", "Lücke füllen", "We need to reduce our carbon ___.", "footprint",
        { hint: "Hier fehlt ein passendes Wort (feste Wendung)", explain: "„carbon footprint“ = CO₂-Fußabdruck." }),
      cz("t4", "Lücke füllen", "Plastic ___ is a serious problem in the oceans.", "pollution",
        { hint: "Hier fehlt ein passendes Wort (Umwelt)" }),
      cz("t5", "Lücke füllen", "Many people try to ___ energy at home.", "save",
        { hint: "Hier fehlt ein Verb (Energie)" }),
      ord("t6", "Sätze richtig anordnen", ["we", "should", "use", "less", "single-use", "plastic"], "we should use less single-use plastic"),
      ord("t7", "Sätze richtig anordnen", ["renewable", "energy", "is", "the", "future"], "renewable energy is the future"),
      mc("t8", "Was ist KEIN „renewable energy source“?", ["solar", "wind", "coal", "hydro"], "coal",
        { explain: "Kohle ist ein fossiler Brennstoff, nicht erneuerbar." }),
      mc("t9", "„Recyceln“ heißt …", ["recycle", "reuse", "refuse", "rebuild"], "recycle"),
      cz("t10", "Lücke füllen", "Cycling is better for the ___ than driving.", "environment",
        { hint: "Ein Wort aus der Natur passt" }),
      cz("t11", "Lücke füllen", "We should switch ___ renewable energy.", "to",
        { hint: "Hier fehlt ein kleines Partikelwort (in/out/on/off/up/down/through …), das die Bedeutung des Verbs verändert", explain: "„switch to“ = umsteigen auf." }),
      mc("t12", "„Treibhausgase“ heißt …", ["greenhouse gases", "warm air", "hot smoke", "sky steam"], "greenhouse gases"),
      ord("t13", "Sätze richtig anordnen", ["governments", "must", "take", "stronger", "action"], "governments must take stronger action"),
      cz("t14", "Lücke füllen", "Sea levels are ___ because of climate change.", "rising",
        { hint: "Hier fehlt ein Verb (Verlaufsform)", explain: "Present continuous: are + Verb-ing für aktuelle Trends." }),
      mc("t15", "„Nachhaltig“ heißt …", ["sustainable", "long lasting only", "kept", "longtime"], "sustainable"),
      ord("t16", "Sätze richtig anordnen", ["small", "changes", "can", "make", "a", "big", "difference"], "small changes can make a big difference"),
      cz("t17", "Lücke füllen", "Companies should be held ___ for their emissions.", "accountable",
        { hint: "Hier passt ein Beschreibungswort (Verantwortung)", explain: "„hold someone accountable“ = jemanden zur Verantwortung ziehen." }),
      mc("t18", "„Endangered species“ ist …", [
        "bedrohte Arten", "ausgestorbene Arten", "gefährliche Arten", "neue Arten",
      ], "bedrohte Arten"),
    ],
  },
  {
    id: "reisen-b1",
    title: "Reisen",
    subtitle: "Erfahrungen & Empfehlungen",
    description: "Reiseerlebnisse erzählen und Tipps austauschen.",
    examples: ["I've been to Japan twice.", "You should definitely visit Kyoto."],
    level: "B1",
    emoji: "✈️",
    tasks: [
      mc("t1", "„Ich war zweimal in Japan.“", [
        "I've been to Japan twice.", "I was in Japan two.", "I am go Japan twice.", "I went Japan two.",
      ], "I've been to Japan twice.",
        { explain: "Present Perfect für Lebenserfahrungen: „I've been to …“." }),
      cz("t2", "Lücke füllen", "You should definitely ___ Kyoto.", "visit",
        { hint: "Hier fehlt ein Verb (Reiseempfehlung)" }),
      cz("t3", "Lücke füllen", "I'm thinking ___ travelling to Spain next year.", "of",
        { hint: "Hier fehlt ein kleines Verbindungswort", explain: "„think of/about + -ing“." }),
      cz("t4", "Lücke füllen", "It's worth ___ early in the morning.", "going",
        { hint: "Hier fehlt ein Verb (-ing nach „worth“)", explain: "Nach „worth“ steht die -ing-Form." }),
      ord("t5", "Sätze richtig anordnen", ["I", "had", "the", "time", "of", "my", "life"], "I had the time of my life"),
      ord("t6", "Sätze richtig anordnen", ["the", "flight", "was", "delayed", "by", "three", "hours"], "the flight was delayed by three hours"),
      mc("t7", "„Sehenswürdigkeit“ heißt …", ["landmark", "look place", "tour stop", "see point"], "landmark"),
      cz("t8", "Lücke füllen", "If I ___ more time, I would stay another week.", "had",
        { hint: "Hypothetisch: „If I ___ …, I would …“ — Past-Form gefragt", explain: "If + Past Simple, would + Infinitiv (hypothetisch)." }),
      cz("t9", "Lücke füllen", "Make sure to ___ travel insurance.", "get",
        { hint: "Hier fehlt ein Verb (Reiseplanung)" }),
      ord("t10", "Sätze richtig anordnen", ["I'd", "rather", "stay", "in", "a", "small", "guesthouse"], "I'd rather stay in a small guesthouse"),
      mc("t11", "Welcher Satz drückt eine Empfehlung aus?", [
        "You really ought to try the local food.",
        "You food eat must.", "Eat food you.", "Food you good now.",
      ], "You really ought to try the local food."),
      cz("t12", "Lücke füllen", "We got ___ the train at the wrong stop.", "off",
        { hint: "Hier fehlt ein kleines Partikelwort (in/out/on/off/up/down/through …), das die Bedeutung des Verbs verändert", explain: "„get off“ = aussteigen (Bahn/Bus)." }),
      cz("t13", "Lücke füllen", "I can't wait ___ go on holiday.", "to",
        { hint: "Vor dem nächsten Verb fehlt ein kurzes Brückenwort (___ + Grundform)" }),
      ord("t14", "Sätze richtig anordnen", ["the", "view", "from", "the", "top", "is", "amazing"], "the view from the top is amazing"),
      mc("t15", "„Reisepass“ heißt …", ["passport", "travel paper", "go card", "id book"], "passport"),
      cz("t16", "Lücke füllen", "I ___ never been to South America.", "have",
        { hint: "Hier fehlt ein kleines Hilfswort wie „have/has“ (Present Perfect)" }),
      ord("t17", "Sätze richtig anordnen", ["it's", "one", "of", "the", "best", "places", "I've", "ever", "been"], "it's one of the best places I've ever been"),
      mc("t18", "„Auf Reisen ein Risiko eingehen“ heißt …", [
        "to take a risk", "to make a danger", "to do a chance", "to put risk",
      ], "to take a risk"),
    ],
  },
  {
    id: "essen-b1",
    title: "Essen & Trinken",
    subtitle: "Kochen, Geschmack & Vorlieben",
    description: "Rezepte, Geschmack und Ernährung detailliert beschreiben.",
    examples: ["This dish is too spicy for me.", "I usually cook from scratch."],
    level: "B1",
    emoji: "🍳",
    tasks: [
      mc("t1", "„Mir ist das Gericht zu scharf.“", [
        "This dish is too spicy for me.",
        "It is hot dish to me.", "Dish is spicy too me.", "Me dish hot.",
      ], "This dish is too spicy for me."),
      cz("t2", "Lücke füllen", "I usually cook from ___.", "scratch",
        { hint: "Hier fehlt ein passendes Wort (Kochen)", explain: "„from scratch“ = von Grund auf." }),
      cz("t3", "Lücke füllen", "Could you ___ down the recipe for me?", "write",
        { hint: "Hier fehlt ein zusammengesetztes Verb", explain: "„write down“ = aufschreiben." }),
      cz("t4", "Lücke füllen", "I'd rather have fish ___ meat.", "than",
        { hint: "Hier fehlt ein kleines Wort, das zwei Dinge vergleicht (z. B. as/than/to)", explain: "„rather A than B“ = lieber A als B." }),
      ord("t5", "Sätze richtig anordnen", ["it", "tastes", "much", "better", "with", "garlic"], "it tastes much better with garlic"),
      ord("t6", "Sätze richtig anordnen", ["could", "I", "have", "the", "dressing", "on", "the", "side"], "could I have the dressing on the side"),
      mc("t7", "„Rezept“ heißt …", ["recipe", "menu", "dish list", "food paper"], "recipe"),
      cz("t8", "Lücke füllen", "Add salt ___ taste.", "to",
        { hint: "Hier fehlt ein kleines Verbindungswort (Kochanweisung)", explain: "„to taste“ = nach Geschmack." }),
      cz("t9", "Lücke füllen", "It needs to simmer ___ ten minutes.", "for",
        { hint: "Vor einer Dauer (z. B. „three days“) — kleines Wort für „lang“" }),
      ord("t10", "Sätze richtig anordnen", ["I", "am", "not", "really", "into", "spicy", "food"], "I am not really into spicy food"),
      mc("t11", "„Ich habe einen leichten Appetit.“", [
        "I'm a light eater.", "I eat light am.", "Eat me small.", "I am small to eat.",
      ], "I'm a light eater."),
      cz("t12", "Lücke füllen", "She is allergic ___ shellfish.", "to",
        { hint: "Hier fehlt ein kleines Verbindungswort (Allergie)" }),
      cz("t13", "Lücke füllen", "I could ___ a coffee right now.", "use",
        { hint: "Ein Verb für „wollen / hätte gern“ passt", explain: "„I could use …“ = ich könnte … gut gebrauchen." }),
      ord("t14", "Sätze richtig anordnen", ["the", "service", "was", "fast", "but", "the", "food", "was", "average"], "the service was fast but the food was average"),
      mc("t15", "„Trinkgeld“ heißt …", ["tip", "small money", "extra cash", "thanks pay"], "tip"),
      cz("t16", "Lücke füllen", "I'm trying to cut ___ on sugar.", "down",
        { hint: "Hier fehlt ein kleines Partikelwort (in/out/on/off/up/down/through …), das die Bedeutung des Verbs verändert", explain: "„cut down on“ = reduzieren." }),
      ord("t17", "Sätze richtig anordnen", ["this", "wine", "goes", "really", "well", "with", "cheese"], "this wine goes really well with cheese"),
      mc("t18", "„Probieren / kosten“ heißt …", ["taste", "try eat", "open mouth", "smell food"], "taste"),
    ],
  },
  {
    id: "freizeit-b1",
    title: "Freizeit",
    subtitle: "Pläne, Filme & Diskussionen",
    description: "Über Pläne, Filme und Meinungen detailliert sprechen.",
    examples: ["What are you up to this weekend?", "I'd recommend that movie."],
    level: "B1",
    emoji: "🎬",
    tasks: [
      mc("t1", "Lockere Frage: „Was machst du am Wochenende?“", [
        "What are you up to this weekend?",
        "What you do weekend?", "Weekend what doing?", "You weekend what?",
      ], "What are you up to this weekend?"),
      cz("t2", "Lücke füllen", "I'd recommend that ___ — it's brilliant.", "movie",
        { hint: "Hier fehlt ein passendes Wort (Empfehlung)" }),
      cz("t3", "Lücke füllen", "I'm really ___ forward to the concert.", "looking",
        { hint: "Hier passt eine feste Verb-Wendung", explain: "„be looking forward to + -ing/Substantiv“." }),
      cz("t4", "Lücke füllen", "I can't stand ___ in queues.", "waiting",
        { hint: "-ing-Form nach „can't stand“" }),
      ord("t5", "Sätze richtig anordnen", ["why", "don't", "we", "go", "for", "a", "drink", "later"], "why don't we go for a drink later"),
      ord("t6", "Sätze richtig anordnen", ["I", "haven't", "seen", "him", "in", "ages"], "I haven't seen him in ages"),
      mc("t7", "Welcher Satz beschreibt eine Meinung?", [
        "If you ask me, the book is better than the film.",
        "Book film better is.", "Me say book good.", "I am book read good.",
      ], "If you ask me, the book is better than the film."),
      cz("t8", "Lücke füllen", "It depends ___ the weather.", "on",
        { hint: "Hier fehlt ein kleines Verbindungswort (feste Wendung)", explain: "„depend on“ = abhängen von." }),
      cz("t9", "Lücke füllen", "I used ___ play tennis every week.", "to",
        { hint: "Vergangenheitsgewohnheit", explain: "„used to + Infinitiv“ = früher (regelmäßig) tun." }),
      ord("t10", "Sätze richtig anordnen", ["how", "about", "going", "to", "the", "cinema", "tonight"], "how about going to the cinema tonight"),
      mc("t11", "„Ausschlafen“ heißt …", ["sleep in", "long sleep", "much rest", "deep night"], "sleep in"),
      cz("t12", "Lücke füllen", "We had a really good ___ at the party.", "time",
        { hint: "Hier fehlt ein passendes Wort (feste Wendung)" }),
      cz("t13", "Lücke füllen", "I'm not really ___ fan of horror movies.", "a",
        { hint: "Hier fehlt ein kleines Wort wie „a / the“ (feste Wendung)", explain: "„be a fan of …“ = Fan von … sein." }),
      ord("t14", "Sätze richtig anordnen", ["it", "was", "such", "a", "great", "weekend"], "it was such a great weekend"),
      mc("t15", "„Bin gerade beschäftigt — können wir später reden?“", [
        "I'm a bit busy — can we talk later?",
        "Busy now me — talk you next.", "I busy talk later.", "Talk me when free.",
      ], "I'm a bit busy — can we talk later?"),
      cz("t16", "Lücke füllen", "It was raining, ___ we stayed home.", "so",
        { hint: "Hier fehlt ein Verbindungswort (Folge)" }),
      ord("t17", "Sätze richtig anordnen", ["I", "totally", "lost", "track", "of", "time"], "I totally lost track of time"),
      mc("t18", "„Eintrittskarte (Konzert/Kino)“ heißt …", ["ticket", "go pass", "ride card", "in slip"], "ticket"),
    ],
  },
  {
    id: "einkaufen-b1",
    title: "Einkaufen",
    subtitle: "Vergleichen & Reklamieren",
    description: "Produkte vergleichen, reklamieren und verhandeln.",
    examples: ["This one is much better value.", "I'd like to make a complaint."],
    level: "B1",
    emoji: "🛍️",
    tasks: [
      mc("t1", "„Das ist viel besser vom Preis-Leistungs-Verhältnis.“", [
        "This one is much better value.",
        "This is good price thing.", "Better price more this.", "Price better this is.",
      ], "This one is much better value."),
      cz("t2", "Lücke füllen", "I'd like to make a ___ about a faulty product.", "complaint",
        { hint: "Hier fehlt ein passendes Wort (Reklamation)" }),
      cz("t3", "Lücke füllen", "It's ___ the same as the other one.", "almost",
        { hint: "Hier passt ein kleines Wort (Vergleich)" }),
      cz("t4", "Lücke füllen", "Could you give me a ___ on this?", "discount",
        { hint: "Hier fehlt ein passendes Wort (Preis)" }),
      ord("t5", "Sätze richtig anordnen", ["I'm", "afraid", "this", "doesn't", "work", "properly"], "I'm afraid this doesn't work properly"),
      ord("t6", "Sätze richtig anordnen", ["could", "I", "speak", "to", "the", "manager"], "could I speak to the manager"),
      mc("t7", "„Lieferung“ heißt …", ["delivery", "send time", "go-arrive", "out cargo"], "delivery"),
      cz("t8", "Lücke füllen", "The package never ___.", "arrived",
        { hint: "Hier fehlt ein Verb (Past Simple)" }),
      cz("t9", "Lücke füllen", "I'd like to exchange this ___ a smaller size.", "for",
        { hint: "Hier fehlt ein kleines Verbindungswort (Tausch)", explain: "„exchange A for B“ = A gegen B tauschen." }),
      ord("t10", "Sätze richtig anordnen", ["the", "product", "doesn't", "match", "the", "description"], "the product doesn't match the description"),
      mc("t11", "Welcher Satz reklamiert höflich?", [
        "I'm sorry, but this isn't quite what I expected.",
        "Bad thing me.", "No good is this.", "Send me different now.",
      ], "I'm sorry, but this isn't quite what I expected."),
      cz("t12", "Lücke füllen", "It's still under ___, so it should be free.", "warranty",
        { hint: "Hier fehlt ein passendes Wort (Garantie)" }),
      cz("t13", "Lücke füllen", "I can't decide ___ the two.", "between",
        { hint: "Hier fehlt ein kleines Verbindungswort (Wahl)", explain: "„between A and B“ — Wahl zwischen zweien." }),
      ord("t14", "Sätze richtig anordnen", ["I'd", "rather", "pay", "a", "bit", "more", "for", "quality"], "I'd rather pay a bit more for quality"),
      mc("t15", "„Skontrückgabe / Rückgabe“ heißt …", ["return", "back come", "out send", "give re"], "return"),
      cz("t16", "Lücke füllen", "Do these come ___ a guarantee?", "with",
        { hint: "Hier fehlt ein kleines Verbindungswort (Lieferumfang)" }),
      ord("t17", "Sätze richtig anordnen", ["could", "you", "throw", "in", "free", "shipping"], "could you throw in free shipping"),
      mc("t18", "„out of stock“ bedeutet …", [
        "nicht auf Lager", "im Sonderangebot", "neu eingetroffen", "im Schaufenster",
      ], "nicht auf Lager"),
    ],
  },
  {
    id: "alltag-b1",
    title: "Alltag",
    subtitle: "Probleme & Verabredungen",
    description: "Alltagsprobleme erklären und Termine verschieben.",
    examples: ["Something's come up.", "Let me get back to you."],
    level: "B1",
    emoji: "🌤️",
    tasks: [
      mc("t1", "„Mir ist etwas dazwischengekommen.“", [
        "Something's come up.",
        "Thing come me.", "Come up some.", "Up come thing me.",
      ], "Something's come up.",
        { explain: "„Something has come up.“ = Mir ist etwas dazwischengekommen." }),
      cz("t2", "Lücke füllen", "Let me ___ back to you on that.", "get",
        { hint: "Hier fehlt ein zusammengesetztes Verb", explain: "„get back to someone“ = sich wieder bei jemandem melden." }),
      cz("t3", "Lücke füllen", "Could we ___ the meeting to next week?", "move",
        { hint: "Hier fehlt ein Verb (Termin verschieben)" }),
      cz("t4", "Lücke füllen", "I'm running a bit ___.", "late",
        { hint: "Hier passt ein kleines Wort (Verspätung)" }),
      ord("t5", "Sätze richtig anordnen", ["sorry", "to", "keep", "you", "waiting"], "sorry to keep you waiting"),
      ord("t6", "Sätze richtig anordnen", ["could", "we", "reschedule", "for", "tomorrow"], "could we reschedule for tomorrow"),
      mc("t7", "„Kein Stress“ heißt locker …", ["no worries", "no stress is", "cool me", "easy zero"], "no worries"),
      cz("t8", "Lücke füllen", "I'll be there ___ ten minutes.", "in",
        { hint: "Hier fehlt ein kleines Verbindungswort (Zeit in der Zukunft)", explain: "„in + Zeitspanne“ = in (z. B. zehn) Minuten." }),
      cz("t9", "Lücke füllen", "Could you do me a ___?", "favour",
        { hint: "Hier fehlt ein passendes Wort (Bitte)", explain: "„do someone a favour“ = jemandem einen Gefallen tun." }),
      ord("t10", "Sätze richtig anordnen", ["my", "phone", "battery", "is", "almost", "dead"], "my phone battery is almost dead"),
      mc("t11", "Welche höfliche Bitte passt am besten?", [
        "Would you mind opening the window?",
        "Open window you do.", "You window open.", "Window do you?",
      ], "Would you mind opening the window?"),
      cz("t12", "Lücke füllen", "I had ___ stand in line for ages.", "to",
        { hint: "Modalverb-Vergangenheit", explain: "„had to + Infinitiv“ = musste." }),
      cz("t13", "Lücke füllen", "I'm not really ___ to it today.", "up",
        { hint: "Hier fehlt ein kleines Partikelwort (in/out/on/off/up/down/through …), das die Bedeutung des Verbs verändert", explain: "„be up to something“ = sich etwas zutrauen / Lust haben." }),
      ord("t14", "Sätze richtig anordnen", ["I", "completely", "forgot", "to", "buy", "milk"], "I completely forgot to buy milk"),
      mc("t15", "„Mir geht's so la-la.“ — locker …", [
        "I'm not too bad, I guess.",
        "Me so so.", "I am la la.", "I middle today.",
      ], "I'm not too bad, I guess."),
      cz("t16", "Lücke füllen", "Sorry, I didn't catch ___ you said.", "what",
        { hint: "Indirektes Pronomen" }),
      ord("t17", "Sätze richtig anordnen", ["could", "you", "speak", "a", "bit", "more", "slowly"], "could you speak a bit more slowly"),
      mc("t18", "„Ich beeile mich.“ heißt …", [
        "I'll be quick.", "I am fast.", "I run me.", "Quick me am.",
      ], "I'll be quick."),
    ],
  },
  {
    id: "wirtschaft-b1",
    title: "Wirtschaft",
    subtitle: "Geld, Arbeit & Markt",
    description: "Über Gehalt, Konten und Märkte sicher sprechen.",
    examples: ["I'm trying to save up.", "Prices have gone up sharply."],
    level: "B1",
    emoji: "💶",
    tasks: [
      mc("t1", "„Ich versuche zu sparen.“", [
        "I'm trying to save up.",
        "I save myself.", "Save I want now.", "Up save me try.",
      ], "I'm trying to save up.",
        { explain: "„save up (for)“ = sparen (auf)." }),
      cz("t2", "Lücke füllen", "Prices have gone ___ sharply this year.", "up",
        { hint: "Hier passt ein zusammengesetztes Verb (Preise)" }),
      cz("t3", "Lücke füllen", "I'd like to apply ___ a loan.", "for",
        { hint: "Hier fehlt ein kleines Verbindungswort (Bewerbung)", explain: "„apply for + Substantiv“." }),
      cz("t4", "Lücke füllen", "I can't ___ a new car right now.", "afford",
        { hint: "Hier fehlt ein Verb (Geld)" }),
      ord("t5", "Sätze richtig anordnen", ["it's", "a", "great", "deal", "if", "you", "ask", "me"], "it's a great deal if you ask me"),
      ord("t6", "Sätze richtig anordnen", ["could", "we", "talk", "about", "a", "raise"], "could we talk about a raise"),
      mc("t7", "„Gehaltserhöhung“ heißt …", ["raise", "more pay one", "salary up", "money grow"], "raise"),
      cz("t8", "Lücke füllen", "My salary is paid ___ the 15th of each month.", "on",
        { hint: "Hier fehlt ein kleines Verbindungswort (Datum)" }),
      cz("t9", "Lücke füllen", "I'd rather invest ___ the long term.", "in",
        { hint: "Hier fehlt ein kleines Verbindungswort (Investition)" }),
      ord("t10", "Sätze richtig anordnen", ["I", "live", "from", "paycheck", "to", "paycheck"], "I live from paycheck to paycheck"),
      mc("t11", "Welcher Satz beschreibt einen Engpass?", [
        "Money's a bit tight at the moment.",
        "Money small me.", "Tight money is now.", "I no money fully.",
      ], "Money's a bit tight at the moment."),
      cz("t12", "Lücke füllen", "Inflation has gone ___ five percent.", "up",
        { hint: "Hier passt ein zusammengesetztes Verb (Trend)" }),
      cz("t13", "Lücke füllen", "Could you split the bill ___ four?", "by",
        { hint: "Hier fehlt ein kleines Verbindungswort (teilen)" }),
      ord("t14", "Sätze richtig anordnen", ["I'm", "saving", "up", "for", "a", "new", "laptop"], "I'm saving up for a new laptop"),
      mc("t15", "„auf Pump kaufen“ heißt …", ["buy on credit", "buy on pump", "make credit get", "credit buy yes"], "buy on credit"),
      cz("t16", "Lücke füllen", "The currency has lost a lot of ___.", "value",
        { hint: "Hier fehlt ein passendes Wort (Wert)" }),
      ord("t17", "Sätze richtig anordnen", ["the", "interest", "rate", "has", "gone", "up", "again"], "the interest rate has gone up again"),
      mc("t18", "„Steuern“ heißt …", ["taxes", "state pay", "money give law", "state cuts"], "taxes"),
    ],
  },
];

const B2_LESSONS: Lesson[] = [
  {
    id: "wirtschaft-b2",
    title: "Wirtschaft",
    subtitle: "Geld, Markt und Business-English",
    description: "Märkte, Zahlen und Strategie souverän auf Englisch besprechen.",
    examples: ["Sales increased by 12 percent.", "We need to cut costs."],
    level: "B2",
    emoji: "📈",
    tasks: [
      mc("t1", "„Angebot und Nachfrage“", [
        "supply and demand", "offer and need", "give and take", "price and want",
      ], "supply and demand"),
      mc("t2", "„Umsatz“ vs. „Gewinn“: „revenue“ ist …", [
        "Umsatz (vor Kosten)", "Gewinn (nach Kosten)", "Verlust", "Investition",
      ], "Umsatz (vor Kosten)",
        { explain: "Revenue = Umsatz (Einnahmen). Profit = Gewinn nach Abzug der Kosten." }),
      cz("t3", "Lücke füllen", "Our company is expanding ___ Asia.", "into",
        { hint: "Hier fehlt ein kleines Verbindungswort (Expansion)", explain: "„expand into + Markt/Region“." }),
      cz("t4", "Lücke füllen", "Sales increased ___ 12 percent.", "by",
        { hint: "Hier fehlt ein kleines Verbindungswort (Veränderung)", explain: "„increase/decrease by + Prozent/Betrag“." }),
      cz("t5", "Lücke füllen", "We are looking ___ new investors.", "for",
        { hint: "Hier fehlt ein kleines Partikelwort (in/out/on/off/up/down/through …), das die Bedeutung des Verbs verändert" }),
      ord("t6", "Sätze richtig anordnen", ["the", "market", "has", "become", "very", "competitive"], "the market has become very competitive"),
      ord("t7", "Sätze richtig anordnen", ["we", "need", "to", "cut", "costs", "significantly"], "we need to cut costs significantly"),
      mc("t8", "„Inflation“ wirkt sich besonders aus auf …", [
        "purchasing power", "office hours", "weather", "language",
      ], "purchasing power"),
      cz("t9", "Lücke füllen", "Our profits ___ by 8% last quarter.", "rose",
        { hint: "Hier fehlt ein Verb (Past Simple, unregelmäßig)", explain: "rise → rose → risen (steigen)." }),
      cz("t10", "Lücke füllen", "We launched a new product ___ last quarter.", "in",
        { hint: "Hier fehlt ein kleines Verbindungswort (Quartal)" }),
      cz("t11", "Lücke füllen", "The economy is in a ___.", "recession",
        { hint: "Hier fehlt ein passendes Wort (wirtschaftliche Lage)" }),
      ord("t12", "Sätze richtig anordnen", ["this", "decision", "could", "have", "long-term", "consequences"], "this decision could have long-term consequences"),
      mc("t13", "Welcher Satz drückt eine Hypothese aus?", [
        "If we cut prices, we would attract more customers.",
        "We cut prices and customers come.",
        "Cut prices brings customers.",
        "Customers come for cut prices.",
      ], "If we cut prices, we would attract more customers.",
        { explain: "Conditional Type 2: If + Past Simple, would + Infinitiv (hypothetisch)." }),
      cz("t14", "Lücke füllen", "We need to take advantage ___ this opportunity.", "of",
        { hint: "Hier fehlt ein kleines Verbindungswort (feste Wendung)", explain: "„take advantage of“ = nutzen, ausnutzen." }),
      ord("t15", "Sätze richtig anordnen", ["we're", "considering", "a", "merger", "with", "a", "competitor"], "we're considering a merger with a competitor"),
      mc("t16", "„Stakeholder“ sind …", [
        "alle Interessengruppen eines Unternehmens",
        "nur die Aktionäre",
        "nur Mitarbeitende",
        "nur Kund*innen",
      ], "alle Interessengruppen eines Unternehmens"),
      cz("t17", "Lücke füllen", "The merger is subject ___ regulatory approval.", "to",
        { hint: "Hier fehlt ein kleines Verbindungswort (Bedingung)", explain: "„subject to“ = vorbehaltlich, abhängig von." }),
      cz("t18", "Lücke füllen", "We outsourced production ___ cut costs.", "to",
        { hint: "Hier passt die Grundform eines Verbs (Zweck)", explain: "„to + Infinitiv“ drückt einen Zweck aus." }),
      ord("t19", "Sätze richtig anordnen", ["the", "board", "has", "approved", "the", "new", "strategy"], "the board has approved the new strategy"),
    ],
  },
  {
    id: "arbeit-b2",
    title: "Arbeit",
    subtitle: "Verhandlungen & Führung",
    description: "Verhandeln, präsentieren und souverän moderieren.",
    examples: ["Let me play devil's advocate.", "Let's circle back to that."],
    level: "B2",
    emoji: "💼",
    tasks: [
      mc("t1", "„Lass mich Anwalt des Teufels spielen.“", [
        "Let me play devil's advocate.",
        "Me devil play say.", "I am devil say now.", "Devil me play talk.",
      ], "Let me play devil's advocate.",
        { explain: "„play devil's advocate“ = bewusst Gegenargumente bringen." }),
      cz("t2", "Lücke füllen", "Let's ___ back to that point later.", "circle",
        { hint: "Hier passt ein zusammengesetztes Verb (Meeting)", explain: "„circle back to“ = später noch einmal aufgreifen." }),
      cz("t3", "Lücke füllen", "We need to align ___ the core priorities.", "on",
        { hint: "Hier fehlt ein kleines Verbindungswort (Abstimmung)", explain: "„align on + Thema“ = sich einig werden auf." }),
      cz("t4", "Lücke füllen", "Could you walk me ___ the proposal?", "through",
        { hint: "Hier fehlt ein kleines Partikelwort (in/out/on/off/up/down/through …), das die Bedeutung des Verbs verändert", explain: "„walk someone through“ = jemanden durch etwas führen." }),
      ord("t5", "Sätze richtig anordnen", ["I'd", "like", "to", "push", "back", "on", "that", "assumption"], "I'd like to push back on that assumption"),
      ord("t6", "Sätze richtig anordnen", ["let's", "park", "this", "and", "come", "back", "to", "it"], "let's park this and come back to it"),
      mc("t7", "Welcher Satz drückt vorsichtige Zustimmung aus?", [
        "I take your point, although I do have one reservation.",
        "Yes is yes.", "I agree no question.", "All good for me.",
      ], "I take your point, although I do have one reservation."),
      cz("t8", "Lücke füllen", "We're under a tight ___.", "deadline",
        { hint: "Hier fehlt ein passendes Wort (Druck)" }),
      cz("t9", "Lücke füllen", "I'd appreciate it ___ you could share the slides.", "if",
        { hint: "Hier fehlt ein Verbindungswort (höflich)", explain: "„I'd appreciate it if + Past Simple“ — sehr höflich." }),
      ord("t10", "Sätze richtig anordnen", ["could", "we", "take", "this", "discussion", "offline"], "could we take this discussion offline"),
      mc("t11", "Welcher Satz fasst eine Diskussion zusammen?", [
        "So, to sum up, we agreed on three next steps.",
        "Sum talk we now.", "End all good.", "We see done.",
      ], "So, to sum up, we agreed on three next steps."),
      cz("t12", "Lücke füllen", "Bear ___ mind that the budget is fixed.", "in",
        { hint: "Hier fehlt ein kleines Verbindungswort (feste Wendung)", explain: "„bear in mind“ = berücksichtigen." }),
      cz("t13", "Lücke füllen", "We're ___ the verge of closing the deal.", "on",
        { hint: "Hier fehlt ein kleines Verbindungswort (feste Wendung)", explain: "„on the verge of“ = kurz davor." }),
      ord("t14", "Sätze richtig anordnen", ["we'll", "need", "to", "manage", "expectations", "carefully"], "we'll need to manage expectations carefully"),
      mc("t15", "„Eskalation“ professionell umgehen — welcher Satz?", [
        "I'd suggest we escalate this to the steering committee.",
        "We escalate now boss.", "Up boss send this.", "Big boss decide do.",
      ], "I'd suggest we escalate this to the steering committee."),
      cz("t16", "Lücke füllen", "Let's keep this conversation off the ___.", "record",
        { hint: "Hier fehlt ein passendes Wort (feste Wendung)", explain: "„off the record“ = inoffiziell." }),
      ord("t17", "Sätze richtig anordnen", ["I", "think", "we", "should", "table", "this", "for", "now"], "I think we should table this for now"),
      cz("t18", "Lücke füllen", "We're ___ the same page now.", "on",
        { hint: "Hier fehlt ein kleines Verbindungswort (Verständnis)", explain: "„on the same page“ = einer Meinung sein." }),
    ],
  },
  {
    id: "umwelt-b2",
    title: "Umwelt",
    subtitle: "Klimadebatte & Politik",
    description: "Klimapolitik und Nachhaltigkeit differenziert diskutieren.",
    examples: ["Climate change is accelerating.", "We need bold policy action."],
    level: "B2",
    emoji: "🌍",
    tasks: [
      mc("t1", "„Der Klimawandel beschleunigt sich.“", [
        "Climate change is accelerating.",
        "Climate go fast.", "Earth heat more.", "Weather faster get.",
      ], "Climate change is accelerating."),
      cz("t2", "Lücke füllen", "We urgently need bold policy ___.", "action",
        { hint: "Hier fehlt ein passendes Wort (Politik)" }),
      cz("t3", "Lücke füllen", "Many countries are ___ to net-zero targets.", "committed",
        { hint: "Hier passt eine Verb-Form auf -ed/-en (Verpflichtung)", explain: "„be committed to + Substantiv/-ing“ = sich verpflichtet fühlen zu." }),
      cz("t4", "Lücke füllen", "There's growing concern ___ deforestation.", "about",
        { hint: "Hier fehlt ein kleines Verbindungswort (Sorge)" }),
      ord("t5", "Sätze richtig anordnen", ["we", "can", "no", "longer", "afford", "to", "wait"], "we can no longer afford to wait"),
      ord("t6", "Sätze richtig anordnen", ["the", "evidence", "is", "overwhelming", "and", "undeniable"], "the evidence is overwhelming and undeniable"),
      mc("t7", "Welcher Begriff passt? „Kohlenstoffneutralität“", [
        "carbon neutrality", "carbon zero set", "no-coal time", "earth balance",
      ], "carbon neutrality"),
      cz("t8", "Lücke füllen", "Renewables now ___ for over 40% of new capacity.", "account",
        { hint: "Hier fehlt ein Verb (Statistik)", explain: "„account for + Prozent/Anteil“ = ausmachen." }),
      cz("t9", "Lücke füllen", "Strict regulation could ___ industries to innovate.", "force",
        { hint: "Hier fehlt ein Verb (Anreiz)" }),
      ord("t10", "Sätze richtig anordnen", ["we", "must", "weigh", "short-term", "costs", "against", "long-term", "gains"], "we must weigh short-term costs against long-term gains"),
      mc("t11", "Welcher Satz drückt vorsichtige Skepsis aus?", [
        "I'm not entirely convinced that voluntary pledges will be enough.",
        "Not good me say.", "No like this think.", "Bad maybe yes.",
      ], "I'm not entirely convinced that voluntary pledges will be enough."),
      cz("t12", "Lücke füllen", "The transition will be costly ___ the long run.", "in",
        { hint: "Hier fehlt ein kleines Verbindungswort (Zeit)", explain: "„in the long run“ = auf lange Sicht." }),
      cz("t13", "Lücke füllen", "Emissions have ___ to record highs.", "soared",
        { hint: "Hier fehlt ein Verb (starker Anstieg)", explain: "„soar“ = stark/schnell ansteigen." }),
      ord("t14", "Sätze richtig anordnen", ["a", "carbon", "tax", "could", "drive", "real", "behavior", "change"], "a carbon tax could drive real behavior change"),
      mc("t15", "„greenwashing“ bezeichnet …", [
        "scheinbare Nachhaltigkeit zur PR",
        "echtes Recycling",
        "Energiesparen im Haushalt",
        "Ökolandwirtschaft",
      ], "scheinbare Nachhaltigkeit zur PR"),
      cz("t16", "Lücke füllen", "We can't simply ___ a blind eye to the data.", "turn",
        { hint: "Hier passt eine feste Verb-Wendung", explain: "„turn a blind eye to“ = ignorieren." }),
      ord("t17", "Sätze richtig anordnen", ["the", "shift", "to", "renewables", "is", "well", "underway"], "the shift to renewables is well underway"),
      mc("t18", "Welcher Satz fordert Verantwortung?", [
        "Major emitters should be held to account.",
        "Big bad must do.", "Make them pay only.", "Bad people stop now.",
      ], "Major emitters should be held to account."),
    ],
  },
  {
    id: "reisen-b2",
    title: "Reisen",
    subtitle: "Reflektiert reisen & erzählen",
    description: "Reiseerfahrungen nuanciert beschreiben und vergleichen.",
    examples: ["The trip exceeded my expectations.", "It was off the beaten track."],
    level: "B2",
    emoji: "✈️",
    tasks: [
      mc("t1", "„Die Reise hat meine Erwartungen übertroffen.“", [
        "The trip exceeded my expectations.",
        "Trip was big good.", "Better was trip me.", "Expect more got me.",
      ], "The trip exceeded my expectations."),
      cz("t2", "Lücke füllen", "It was really off the beaten ___.", "track",
        { hint: "Hier fehlt ein passendes Wort (feste Wendung)", explain: "„off the beaten track“ = abseits der Touristenpfade." }),
      cz("t3", "Lücke füllen", "We made a point ___ trying the local cuisine.", "of",
        { hint: "Hier fehlt ein kleines Verbindungswort (feste Wendung)", explain: "„make a point of + -ing“ = bewusst tun." }),
      cz("t4", "Lücke füllen", "The hotel left a lot ___ be desired.", "to",
        { hint: "Hier fehlt ein kleines Verbindungswort (feste Wendung)", explain: "„leave a lot to be desired“ = viel zu wünschen übrig lassen." }),
      ord("t5", "Sätze richtig anordnen", ["had", "I", "known", "earlier", "I", "would", "have", "booked", "it"], "had I known earlier I would have booked it"),
      ord("t6", "Sätze richtig anordnen", ["the", "scenery", "is", "absolutely", "breathtaking"], "the scenery is absolutely breathtaking"),
      mc("t7", "Welcher Satz drückt eine Empfehlung mit Vorbehalt aus?", [
        "I'd recommend it, provided you can handle the heat.",
        "Go yes if hot okay.", "If not hot then go.", "You hot? Then go.",
      ], "I'd recommend it, provided you can handle the heat."),
      cz("t8", "Lücke füllen", "We ended ___ staying an extra night.", "up",
        { hint: "Hier fehlt ein kleines Partikelwort (in/out/on/off/up/down/through …), das die Bedeutung des Verbs verändert", explain: "„end up + -ing“ = letzten Endes etwas tun." }),
      cz("t9", "Lücke füllen", "The view was nothing ___ of spectacular.", "short",
        { hint: "Hier passt ein Beschreibungswort (feste Wendung)", explain: "„nothing short of“ = geradezu, geradewegs." }),
      ord("t10", "Sätze richtig anordnen", ["it's", "well", "worth", "the", "extra", "effort"], "it's well worth the extra effort"),
      mc("t11", "Welcher Satz beschreibt eine kulturelle Beobachtung?", [
        "Locals tend to value family above all else.",
        "Family big locals love.", "All love big family there.", "There family good is.",
      ], "Locals tend to value family above all else."),
      cz("t12", "Lücke füllen", "We had to make do ___ what we had.", "with",
        { hint: "Hier fehlt ein kleines Verbindungswort (feste Wendung)", explain: "„make do with“ = sich begnügen mit." }),
      cz("t13", "Lücke füllen", "The flight wasn't ___ as bad as I'd feared.", "nearly",
        { hint: "Hier passt ein kleines Wort (Vergleich)", explain: "„not nearly as ... as“ = bei weitem nicht so ... wie." }),
      ord("t14", "Sätze richtig anordnen", ["I", "wouldn't", "go", "back", "in", "a", "hurry"], "I wouldn't go back in a hurry"),
      mc("t15", "„Touristenfalle“ heißt …", ["tourist trap", "tourist box", "fall tourist place", "trap people there"], "tourist trap"),
      cz("t16", "Lücke füllen", "It pays ___ book accommodation in advance.", "to",
        { hint: "Vor dem nächsten Verb fehlt ein kurzes Brückenwort (___ + Grundform)", explain: "„it pays to + Infinitiv“ = es lohnt sich zu …" }),
      ord("t17", "Sätze richtig anordnen", ["nothing", "could", "have", "prepared", "me", "for", "that", "view"], "nothing could have prepared me for that view"),
      mc("t18", "„kurzfristig buchen“ heißt …", [
        "to book at short notice", "to make book quick", "fast time book", "near now book",
      ], "to book at short notice"),
    ],
  },
  {
    id: "essen-b2",
    title: "Essen & Trinken",
    subtitle: "Genuss, Kritik und Kultur",
    description: "Restaurants und Speisen differenziert bewerten und beschreiben.",
    examples: ["The flavors are wonderfully balanced.", "It's a bit underseasoned."],
    level: "B2",
    emoji: "🍷",
    tasks: [
      mc("t1", "„Die Aromen sind wunderbar ausgewogen.“", [
        "The flavors are wonderfully balanced.",
        "Tastes balance very.", "Good taste much there.", "Flavor mix is okay.",
      ], "The flavors are wonderfully balanced."),
      cz("t2", "Lücke füllen", "It's a bit ___-seasoned for my taste.", "under",
        { hint: "Hier passt eine Vorsilbe wie „un-/dis-“ (Mangel)", explain: "„under-seasoned“ = zu wenig gewürzt." }),
      cz("t3", "Lücke füllen", "The dish doesn't quite live up ___ the hype.", "to",
        { hint: "Hier fehlt ein kleines Verbindungswort (feste Wendung)", explain: "„live up to“ = gerecht werden." }),
      cz("t4", "Lücke füllen", "Could you do that ___ a vegetarian version?", "as",
        { hint: "Hier fehlt ein kleines Verbindungswort (Variante)" }),
      ord("t5", "Sätze richtig anordnen", ["I", "could", "happily", "eat", "this", "every", "single", "day"], "I could happily eat this every single day"),
      ord("t6", "Sätze richtig anordnen", ["the", "presentation", "is", "as", "stunning", "as", "the", "taste"], "the presentation is as stunning as the taste"),
      mc("t7", "Welcher Satz drückt eine sanfte Kritik aus?", [
        "The pasta was lovely, although it could have used a touch more salt.",
        "Pasta good but salt no enough.", "Good pasta. More salt.", "Pasta yes salt no.",
      ], "The pasta was lovely, although it could have used a touch more salt."),
      cz("t8", "Lücke füllen", "The wine pairs beautifully ___ the cheese.", "with",
        { hint: "Hier fehlt ein kleines Verbindungswort (Kombination)", explain: "„pair with“ = (gut) zusammenpassen mit." }),
      cz("t9", "Lücke füllen", "The chef has a real ___ for fresh herbs.", "knack",
        { hint: "Hier fehlt ein passendes Wort (Talent)", explain: "„a knack for“ = ein Händchen für." }),
      ord("t10", "Sätze richtig anordnen", ["the", "service", "left", "something", "to", "be", "desired"], "the service left something to be desired"),
      mc("t11", "„hidden gem“ bedeutet …", [
        "ein wenig bekannter Geheimtipp",
        "ein teures Restaurant",
        "ein Buffet",
        "ein Kettenrestaurant",
      ], "ein wenig bekannter Geheimtipp"),
      cz("t12", "Lücke füllen", "I've developed quite a ___ for spicy food.", "taste",
        { hint: "Hier fehlt ein passendes Wort (feste Wendung)", explain: "„develop a taste for“ = Geschmack finden an." }),
      cz("t13", "Lücke füllen", "It's not ___ my street, to be honest.", "up",
        { hint: "Hier fehlt ein kleines Partikelwort (in/out/on/off/up/down/through …), das die Bedeutung des Verbs verändert", explain: "„not up my street“ = nicht mein Ding." }),
      ord("t14", "Sätze richtig anordnen", ["the", "menu", "caters", "to", "a", "wide", "range", "of", "diets"], "the menu caters to a wide range of diets"),
      mc("t15", "„Häppchen / Vorspeise zum Sharen“ heißt …", ["small plates", "share plate one", "tiny food", "side meal"], "small plates"),
      cz("t16", "Lücke füllen", "I'd rate it eight ___ of ten.", "out",
        { hint: "Hier fehlt ein kleines Verbindungswort (Bewertung)" }),
      ord("t17", "Sätze richtig anordnen", ["the", "ingredients", "are", "sourced", "locally", "wherever", "possible"], "the ingredients are sourced locally wherever possible"),
      mc("t18", "Welcher Satz beschreibt höflich Unverträglichkeit?", [
        "I'm afraid gluten doesn't really agree with me.",
        "Gluten bad me.", "I no gluten can.", "Take off gluten me.",
      ], "I'm afraid gluten doesn't really agree with me."),
    ],
  },
  {
    id: "freizeit-b2",
    title: "Freizeit",
    subtitle: "Kunst, Filme & Diskussion",
    description: "Kultur und Hobbys mit Tiefgang besprechen.",
    examples: ["The plot was a bit predictable.", "It really resonated with me."],
    level: "B2",
    emoji: "🎭",
    tasks: [
      mc("t1", "„Die Handlung war etwas vorhersehbar.“", [
        "The plot was a bit predictable.",
        "Story not surprise.", "Plot is easy guess.", "Plot small flat.",
      ], "The plot was a bit predictable."),
      cz("t2", "Lücke füllen", "It really ___ with me on a personal level.", "resonated",
        { hint: "Hier passt ein Gefühl wie „lieben“ oder „mögen“", explain: "„resonate with“ = jemanden persönlich ansprechen." }),
      cz("t3", "Lücke füllen", "The pacing felt a bit off ___ the start.", "from",
        { hint: "Hier fehlt ein kleines Verbindungswort (Anfang)" }),
      cz("t4", "Lücke füllen", "I'm not really ___ to that genre.", "drawn",
        { hint: "Hier passt eine Verb-Form auf -ed/-en (Anziehung)", explain: "„be drawn to“ = sich hingezogen fühlen zu." }),
      ord("t5", "Sätze richtig anordnen", ["it's", "the", "kind", "of", "film", "that", "stays", "with", "you"], "it's the kind of film that stays with you"),
      ord("t6", "Sätze richtig anordnen", ["I", "wouldn't", "go", "as", "far", "as", "calling", "it", "a", "masterpiece"], "I wouldn't go as far as calling it a masterpiece"),
      mc("t7", "Welcher Satz drückt zwiespältige Meinung aus?", [
        "I'm in two minds about it, to be honest.",
        "I two head this.", "I split see.", "Mind two yes.",
      ], "I'm in two minds about it, to be honest."),
      cz("t8", "Lücke füllen", "The book grew ___ me over time.", "on",
        { hint: "Hier fehlt ein kleines Partikelwort (in/out/on/off/up/down/through …), das die Bedeutung des Verbs verändert", explain: "„grow on someone“ = einem mit der Zeit gefallen." }),
      cz("t9", "Lücke füllen", "Their performance was nothing ___ extraordinary.", "short",
        { hint: "feste Wendung — Lob", explain: "„nothing short of“ = geradezu." }),
      ord("t10", "Sätze richtig anordnen", ["it", "raises", "more", "questions", "than", "it", "answers"], "it raises more questions than it answers"),
      mc("t11", "Welcher Satz fasst eine Meinung diplomatisch zusammen?", [
        "It has its moments, but it's not without flaws.",
        "Moment good but bad.", "Sometimes good only it.", "Yes some good no fault no.",
      ], "It has its moments, but it's not without flaws."),
      cz("t12", "Lücke füllen", "I'm a bit ___ the fence about it.", "on",
        { hint: "Hier fehlt ein kleines Verbindungswort (feste Wendung)", explain: "„on the fence“ = unentschlossen." }),
      cz("t13", "Lücke füllen", "She has a real ___ for storytelling.", "gift",
        { hint: "Hier fehlt ein passendes Wort (Talent)" }),
      ord("t14", "Sätze richtig anordnen", ["it", "really", "isn't", "for", "the", "faint", "of", "heart"], "it really isn't for the faint of heart"),
      mc("t15", "„page-turner“ bedeutet …", [
        "fesselndes Buch", "schwieriges Buch", "Sachbuch", "Bilderbuch",
      ], "fesselndes Buch"),
      cz("t16", "Lücke füllen", "I couldn't put it ___.", "down",
        { hint: "Hier fehlt ein kleines Partikelwort (in/out/on/off/up/down/through …), das die Bedeutung des Verbs verändert", explain: "„can't put a book down“ = ein Buch nicht aus der Hand legen können." }),
      ord("t17", "Sätze richtig anordnen", ["the", "ending", "completely", "took", "me", "by", "surprise"], "the ending completely took me by surprise"),
      mc("t18", "„cliffhanger“ ist …", [
        "ein offener, spannender Schluss",
        "der Beginn eines Films",
        "ein Werbeblock",
        "der Abspann",
      ], "ein offener, spannender Schluss"),
    ],
  },
  {
    id: "einkaufen-b2",
    title: "Einkaufen",
    subtitle: "Konsum, Marken & Verhandeln",
    description: "Über Konsumtrends, Marken und Verhandlungen sprechen.",
    examples: ["It's a steal at this price.", "Could you throw in a discount?"],
    level: "B2",
    emoji: "🛒",
    tasks: [
      mc("t1", "„Das ist zu dem Preis ein Schnäppchen.“", [
        "It's a steal at this price.",
        "Cheap good price me.", "Big save price this.", "Money less small good.",
      ], "It's a steal at this price.",
        { explain: "„a steal“ = ein Schnäppchen." }),
      cz("t2", "Lücke füllen", "Could you ___ in a small discount?", "throw",
        { hint: "Hier passt ein zusammengesetztes Verb (Verhandeln)", explain: "„throw in“ = obendrauf geben." }),
      cz("t3", "Lücke füllen", "The brand has built up a loyal ___.", "following",
        { hint: "Hier fehlt ein passendes Wort (Marke)", explain: "„a loyal following“ = treue Anhängerschaft." }),
      cz("t4", "Lücke füllen", "I'm willing to settle ___ a small refund.", "for",
        { hint: "Hier fehlt ein kleines Verbindungswort (feste Wendung)", explain: "„settle for“ = sich zufriedengeben mit." }),
      ord("t5", "Sätze richtig anordnen", ["I'd", "appreciate", "a", "discount", "for", "buying", "in", "bulk"], "I'd appreciate a discount for buying in bulk"),
      ord("t6", "Sätze richtig anordnen", ["the", "quality", "more", "than", "justifies", "the", "price"], "the quality more than justifies the price"),
      mc("t7", "Welcher Satz beschreibt Impulskauf?", [
        "It was a complete impulse buy.",
        "I quick buy.", "Just want now buy.", "Not plan buy.",
      ], "It was a complete impulse buy."),
      cz("t8", "Lücke füllen", "These products are flying ___ the shelves.", "off",
        { hint: "Hier fehlt ein kleines Partikelwort (in/out/on/off/up/down/through …), das die Bedeutung des Verbs verändert", explain: "„fly off the shelves“ = sich blitzschnell verkaufen." }),
      cz("t9", "Lücke füllen", "I tend to shop ___ rather than online.", "in-store",
        { hint: "Hier passt ein kleines Wort (Einkaufsart)" }),
      ord("t10", "Sätze richtig anordnen", ["the", "packaging", "is", "way", "over", "the", "top"], "the packaging is way over the top"),
      mc("t11", "Welcher Satz reklamiert formell?", [
        "I'd like to file a formal complaint regarding the order.",
        "Bad order me.", "Order no good give back.", "I send back order.",
      ], "I'd like to file a formal complaint regarding the order."),
      cz("t12", "Lücke füllen", "We've decided to phase ___ that product line.", "out",
        { hint: "Hier fehlt ein kleines Partikelwort (in/out/on/off/up/down/through …), das die Bedeutung des Verbs verändert", explain: "„phase out“ = auslaufen lassen." }),
      cz("t13", "Lücke füllen", "It's hardly worth ___ for the discount.", "queueing",
        { hint: "Hier fehlt ein Verb (-ing nach „worth“)" }),
      ord("t14", "Sätze richtig anordnen", ["consumers", "are", "increasingly", "drawn", "to", "sustainable", "brands"], "consumers are increasingly drawn to sustainable brands"),
      mc("t15", "„Black Friday Schnäppchen“ heißt …", ["doorbuster deals", "front shop sales", "smash low buys", "rush day off"], "doorbuster deals"),
      cz("t16", "Lücke füllen", "These shoes are second to ___.", "none",
        { hint: "feste Wendung — Lob", explain: "„second to none“ = unübertroffen." }),
      ord("t17", "Sätze richtig anordnen", ["this", "purchase", "is", "really", "a", "long-term", "investment"], "this purchase is really a long-term investment"),
      mc("t18", "„buyer's remorse“ ist …", [
        "Reue nach einem Kauf",
        "Freude über Schnäppchen",
        "Treuepunkte",
        "Garantieanspruch",
      ], "Reue nach einem Kauf"),
    ],
  },
  {
    id: "alltag-b2",
    title: "Alltag",
    subtitle: "Beziehungen & feine Nuancen",
    description: "Differenziert über Beziehungen, Werte und Alltag sprechen.",
    examples: ["We see eye to eye on most things.", "Let's agree to disagree."],
    level: "B2",
    emoji: "🌤️",
    tasks: [
      mc("t1", "„Wir sind uns in den meisten Dingen einig.“", [
        "We see eye to eye on most things.",
        "We eyes look same.", "Most we say yes.", "Eye eye see we.",
      ], "We see eye to eye on most things.",
        { explain: "„see eye to eye“ = einer Meinung sein." }),
      cz("t2", "Lücke füllen", "Let's agree ___ disagree.", "to",
        { hint: "Vor dem nächsten Verb fehlt ein kurzes Brückenwort (___ + Grundform)", explain: "„agree to disagree“ = vereinbaren, anderer Meinung zu bleiben." }),
      cz("t3", "Lücke füllen", "I'd rather not get ___ in this argument.", "involved",
        { hint: "Hier passt eine Verb-Form auf -ed/-en (Beteiligung)" }),
      cz("t4", "Lücke füllen", "She has a knack ___ defusing tense situations.", "for",
        { hint: "Hier fehlt ein kleines Verbindungswort (Talent)" }),
      ord("t5", "Sätze richtig anordnen", ["I", "didn't", "mean", "to", "come", "across", "as", "rude"], "I didn't mean to come across as rude"),
      ord("t6", "Sätze richtig anordnen", ["that's", "not", "exactly", "what", "I", "had", "in", "mind"], "that's not exactly what I had in mind"),
      mc("t7", "Welcher Satz verteidigt sanft die eigene Meinung?", [
        "With all due respect, I see things a little differently.",
        "Respect but no.", "I no agree all.", "Different I think only.",
      ], "With all due respect, I see things a little differently."),
      cz("t8", "Lücke füllen", "I take it back — I shouldn't have ___ that.", "said",
        { hint: "Hier passt eine Verb-Form auf -ed/-en (Bedauern)" }),
      cz("t9", "Lücke füllen", "He has a tendency ___ overthink things.", "to",
        { hint: "Vor dem nächsten Verb fehlt ein kurzes Brückenwort (___ + Grundform)", explain: "„a tendency to + Infinitiv“." }),
      ord("t10", "Sätze richtig anordnen", ["it's", "easier", "said", "than", "done", "of", "course"], "it's easier said than done of course"),
      mc("t11", "Welcher Satz drückt Empathie aus?", [
        "I can totally see where you're coming from.",
        "I see you.", "From you come, yes.", "Where you, I see.",
      ], "I can totally see where you're coming from."),
      cz("t12", "Lücke füllen", "Let's not jump ___ conclusions.", "to",
        { hint: "Hier fehlt ein kleines Verbindungswort (feste Wendung)", explain: "„jump to conclusions“ = voreilig schließen." }),
      cz("t13", "Lücke füllen", "I got the wrong end of the ___.", "stick",
        { hint: "Hier fehlt ein passendes Wort (feste Wendung)", explain: "„get the wrong end of the stick“ = etwas missverstehen." }),
      ord("t14", "Sätze richtig anordnen", ["I", "may", "have", "spoken", "out", "of", "turn"], "I may have spoken out of turn"),
      mc("t15", "Welcher Satz entschuldigt sich aufrichtig?", [
        "I owe you an apology — I really wasn't thinking.",
        "Sorry me bad.", "Bad I am sorry.", "Sorry think no.",
      ], "I owe you an apology — I really wasn't thinking."),
      cz("t16", "Lücke füllen", "She tends to be a bit set ___ her ways.", "in",
        { hint: "Hier fehlt ein kleines Verbindungswort (feste Wendung)", explain: "„set in one's ways“ = festgefahren in Gewohnheiten." }),
      ord("t17", "Sätze richtig anordnen", ["I", "didn't", "want", "to", "step", "on", "anyone's", "toes"], "I didn't want to step on anyone's toes"),
      mc("t18", "„aus heiterem Himmel“ heißt …", [
        "out of the blue", "from clear sky", "happy heaven sky", "blue come down",
      ], "out of the blue"),
    ],
  },
];

export const LESSONS: Lesson[] = [
  ...A1_LESSONS,
  ...A2_LESSONS,
  ...B1_LESSONS,
  ...B2_LESSONS,
];




// ============================================================
// Hint + explanation helpers
//
// Goal: every task should provide a useful, learner-friendly hint
// (what kind of word + a real meaning clue + a small narrowing)
// AND a 4-5 sentence explanation with mini-grammar and a second example.
// ============================================================

/** Mask all but the first 1-2 letters and (optionally) the ending of a word. */
const wordShape = (word: string): string => {
  const w = word.replace(/[^a-z']/gi, "");
  if (w.length <= 3) return `beginnt mit **${w[0]}**`;
  const start = w.slice(0, 2);
  const endLen = w.length >= 6 ? 3 : 2;
  const end = w.slice(-endLen);
  return `beginnt mit **${start}** und endet auf **-${end}**`;
};

interface TaskOverride {
  /** Part of speech / form, e.g. "Adjektiv (Partizip)", "Phrasal Verb". */
  pos?: string;
  /** Concrete German meaning of the missing word, e.g. "verspätet, verzögert". */
  meansDe?: string;
  /** Sense-tip: what kind of meaning the learner should look for in this sentence. */
  meaning?: string;
  /** Mini-grammar / word-knowledge explanation. */
  grammar?: string;
  /** Second example sentence with German translation. */
  example?: ExtraExample;
  /** Legacy: short "kind" label used as fallback if pos is missing. */
  kind?: string;
}

const TASK_OVERRIDES: Record<string, TaskOverride> = {
  "Free ___ on orders over 50 euros.": {
    pos: "Nomen (-ing-Form von „to ship“)",
    meansDe: "Versand, Lieferung",
    meaning: "Gesucht ist ein Wort, das beschreibt, wie die Ware vom Shop zu dir nach Hause kommt — nicht die Ware selbst, sondern der Vorgang des Versendens.",
    grammar: "„shipping“ ist die -ing-Form von „to ship“ und wird im Englischen als Nomen für den Versand benutzt. Viele Tätigkeiten werden so zu Nomen: cooking, parking, shopping.",
    example: { en: "We offer free shipping worldwide.", de: "Wir bieten weltweit kostenlosen Versand." },
  },
  "I have to ___ my parents tonight.": {
    pos: "Verb in der Grundform",
    meansDe: "anrufen",
    meaning: "Gesucht ist das übliche Alltagsverb dafür, jemanden über das Telefon zu erreichen.",
    grammar: "Nach „have to“ steht im Englischen immer die Grundform (call, work, leave). „call“ ist die häufigste Standardvariante; „phone“ wird ebenfalls akzeptiert.",
    example: { en: "I have to call the doctor in the morning.", de: "Ich muss morgens den Arzt anrufen." },
  },
  "My phone isn't ___.": {
    pos: "-ing-Form (Verlaufsform)",
    meansDe: "funktionierend / am Funktionieren",
    meaning: "Es geht nicht darum, dass das Handy „arbeitet“ wie ein Mensch, sondern dass es gerade nicht funktioniert.",
    grammar: "„work“ heißt bei Geräten „funktionieren“. Mit „be + not + working“ sagst du, dass etwas im Moment nicht läuft.",
    example: { en: "The printer isn't working again.", de: "Der Drucker funktioniert schon wieder nicht." },
  },
  "This soup has too much salt — it's too ___.": {
    pos: "Adjektiv (Geschmack)",
    meansDe: "salzig",
    meaning: "Der Satz nennt schon den Grund: zu viel Salz. Gesucht ist also genau das Geschmackswort dazu — nicht süß, nicht scharf, nicht heiß.",
    grammar: "Aus dem Nomen „salt“ wird mit -y das Adjektiv „salty“. Dieses Muster gilt für viele Geschmäcker und Wetterwörter: rain → rainy, sun → sunny, spice → spicy.",
    example: { en: "These chips are way too salty for me.", de: "Diese Chips sind mir viel zu salzig." },
  },
  "Could you ___ down the recipe for me?": {
    pos: "Verb (Teil eines Phrasal Verbs)",
    meansDe: "schreiben (zusammen mit „down“ = aufschreiben)",
    meaning: "Zusammen mit „down“ ist ein Verb gemeint, das bedeutet, etwas auf Papier oder ins Handy zu notieren, damit man es später nachlesen kann.",
    grammar: "„write down“ ist ein typisches Phrasal Verb: das kleine „down“ verändert die Bedeutung. „write“ allein heißt nur „schreiben“, „write down“ heißt „aufschreiben/notieren“.",
    example: { en: "Let me write down your phone number.", de: "Ich schreibe mir deine Telefonnummer auf." },
  },
  "We need to keep the client ___ on the progress.": {
    pos: "Adjektiv (Partizip auf -ed)",
    meansDe: "auf dem Laufenden, informiert",
    meaning: "Es geht darum, in welchem Zustand der Kunde bleiben soll — nämlich auf dem neuesten Stand zu allen Neuigkeiten.",
    grammar: "Nach „keep someone …“ folgt ein Wort, das einen Zustand beschreibt (happy, safe, informed, updated). „keep someone updated“ heißt „jemanden auf dem Laufenden halten“.",
    example: { en: "I'll keep you updated on any changes.", de: "Ich halte dich über Änderungen auf dem Laufenden." },
  },
  "My flight has been ___ by two hours.": {
    pos: "Adjektiv / Partizip (Past Participle von „to delay“)",
    meansDe: "verspätet, verzögert",
    meaning: "Gesucht ist ein Wort, das ausdrückt, dass der Flug nicht pünktlich ist, sondern zwei Stunden später kommt.",
    grammar: "Im Passiv Perfekt steht „has/have been + Partizip“. „delayed“ ist das Partizip von „to delay“ (verzögern) und beschreibt hier den Zustand des Flugs: er wurde verspätet.",
    example: { en: "The meeting was delayed because of traffic.", de: "Das Meeting wurde wegen des Verkehrs verschoben." },
  },
  "Breakfast is ___ from 7 to 10.": {
    pos: "Adjektiv / Partizip (Past Participle von „to serve“)",
    meansDe: "serviert, angeboten",
    meaning: "Gesucht ist ein Wort, das sagt, dass das Frühstück in dieser Zeit für die Gäste bereitsteht — also wann es ausgegeben wird.",
    grammar: "„be + Partizip“ ist das englische Passiv: „is served“ = „wird serviert“. So beschreibst du im Englischen oft Öffnungs- oder Servicezeiten in Hotels und Restaurants.",
    example: { en: "Dinner is served from 6 p.m.", de: "Abendessen wird ab 18 Uhr serviert." },
  },
  "I ___ playing football on weekends.": {
    pos: "Verb in der Grundform (gefolgt von -ing)",
    meansDe: "genießen, gerne tun",
    meaning: "Gesucht ist ein Verb, mit dem du ausdrückst, dass dir eine Tätigkeit Spaß macht — also dass du etwas gerne machst.",
    grammar: "Nach „enjoy“ folgt im Englischen immer die -ing-Form, nie der Infinitiv: enjoy playing, enjoy reading, enjoy cooking. „I enjoy to play“ wäre falsch.",
    example: { en: "I really enjoy cooking on Sundays.", de: "Ich koche sonntags wirklich gerne." },
  },
  "I am really ___ in photography.": {
    pos: "Adjektiv (Partizip auf -ed, beschreibt ein Gefühl)",
    meansDe: "interessiert",
    meaning: "Gesucht ist ein Wort, das beschreibt, wie du dich gegenüber dem Thema Fotografie fühlst — nämlich, dass du dich dafür begeisterst und mehr darüber wissen willst.",
    grammar: "„interested in + Thema“ ist eine feste englische Verbindung. Achtung: Das Gefühl ist „interested“ (-ed = ich fühle es), die Sache selbst ist „interesting“ (-ing = sie löst das Gefühl aus).",
    example: { en: "She is interested in modern art.", de: "Sie interessiert sich für moderne Kunst." },
  },
  "She is good ___ painting.": {
    pos: "Präposition (festes Anhängsel an „good“)",
    meansDe: "in / im (bei Fähigkeiten)",
    meaning: "Gesucht ist das kleine Wort, mit dem man im Englischen ausdrückt, worin jemand gut ist — es kommt fest hinter „good“.",
    grammar: "„good at + Tätigkeit“ ist eine feste Verbindung; nach „at“ steht meist die -ing-Form: good at painting, good at cooking, good at swimming.",
    example: { en: "He is really good at solving problems.", de: "Er ist richtig gut darin, Probleme zu lösen." },
  },
  "We often go ___ a walk in the park.": {
    pos: "Präposition (Teil einer festen Wendung)",
    meansDe: "für (hier Teil von „spazieren gehen“)",
    meaning: "Gesucht ist das kleine Wort, das zu „go ___ a walk“ gehört — die feste englische Wendung für „spazieren gehen“.",
    grammar: "„go for a walk / a run / a swim / a coffee“ — mit „go for + Nomen“ machst du im Englischen viele Aktivitäten zum Vorschlag oder zur Routine.",
    example: { en: "Let's go for a coffee after work.", de: "Lass uns nach der Arbeit einen Kaffee trinken gehen." },
  },
  "Could we have the ___, please?": {
    pos: "Nomen (Restaurant-Vokabel)",
    meansDe: "Rechnung",
    meaning: "Gesucht ist das Wort, mit dem du am Ende des Restaurantbesuchs nach dem Zettel fragst, auf dem steht, was du bezahlen musst.",
    grammar: "Im britischen Englisch heißt es „the bill“, im amerikanischen Englisch „the check“. Beide bezeichnen die Rechnung im Restaurant.",
    example: { en: "Could we have the bill, please? We're in a hurry.", de: "Können wir bitte die Rechnung haben? Wir haben es eilig." },
  },
  "I'm allergic ___ nuts.": {
    pos: "Präposition (festes Anhängsel an „allergic“)",
    meansDe: "gegen (bei Allergien)",
    meaning: "Gesucht ist das kleine Wort, mit dem du im Englischen sagst, gegen was du allergisch bist — es kommt fest hinter „allergic“.",
    grammar: "„allergic to + Stoff/Lebensmittel“ ist die feste Form: allergic to nuts, allergic to pollen, allergic to cats. Im Deutschen sagen wir „allergisch gegen“, im Englischen „allergic to“.",
    example: { en: "My son is allergic to peanuts.", de: "Mein Sohn ist allergisch gegen Erdnüsse." },
  },
  "I'll have the same ___ him.": {
    pos: "Vergleichswort (Konjunktion)",
    meansDe: "wie (beim Vergleich)",
    meaning: "Gesucht ist das kleine Wort, mit dem du im Englischen sagst, dass etwas gleich ist wie etwas anderes — hier: dasselbe Essen wie er.",
    grammar: "„the same as …“ ist die feste englische Form für „dasselbe wie …“. Nicht „the same like“ oder „the same than“ — immer „as“.",
    example: { en: "I have the same phone as my sister.", de: "Ich habe das gleiche Handy wie meine Schwester." },
  },
  "Is service ___ in the price?": {
    pos: "Adjektiv / Partizip (Past Participle von „to include“)",
    meansDe: "enthalten, eingeschlossen",
    meaning: "Gesucht ist ein Wort, das sagt, dass der Service schon Teil des Gesamtpreises ist — also dass nichts mehr extra dazukommt.",
    grammar: "„be included in …“ ist die englische Passivform für „in etwas enthalten sein“. Das Partizip „included“ kommt von „to include“ (einschließen).",
    example: { en: "Breakfast is included in the room rate.", de: "Frühstück ist im Zimmerpreis enthalten." },
  },
  "How ___ do you go to the gym?": {
    pos: "Häufigkeitsadverb",
    meansDe: "oft",
    meaning: "Gesucht ist das Wort, mit dem du fragst, wie häufig jemand etwas macht — also nach der Anzahl der Male pro Woche oder Monat.",
    grammar: "„How often …?“ ist die Standardfrage nach Häufigkeit. Antworten beginnen meist mit „once a week“, „twice a month“, „every day“, „rarely“.",
    example: { en: "How often do you check your emails?", de: "Wie oft schaust du in deine E-Mails?" },
  },
  "I usually meet my friends ___ Saturdays.": {
    pos: "Präposition (Wochentage)",
    meansDe: "an (vor Wochentagen)",
    meaning: "Gesucht ist das kleine Wort, das im Englischen vor Wochentagen steht, wenn du sagst, wann etwas regelmäßig passiert.",
    grammar: "Vor Wochentagen steht „on“: on Monday, on Saturdays. Vor Monaten und Jahreszeiten steht „in“ (in July, in summer), vor Uhrzeiten „at“ (at 7).",
    example: { en: "We have a team meeting on Mondays.", de: "Wir haben montags ein Team-Meeting." },
  },
  "I have been learning the guitar ___ two years.": {
    pos: "Präposition (Zeitdauer)",
    meansDe: "seit / lang (bei Zeiträumen)",
    meaning: "Gesucht ist das kleine Wort, mit dem du sagst, wie lang etwas schon dauert — hier: zwei Jahre lang bis jetzt.",
    grammar: "Im Present Perfect Continuous: „for + Zeitraum“ (for two years, for a week) oder „since + Zeitpunkt“ (since 2022, since Monday). „for“ misst die Dauer, „since“ nennt den Startpunkt.",
    example: { en: "I have known her for ten years.", de: "Ich kenne sie seit zehn Jahren." },
  },
  "I prefer reading ___ watching TV.": {
    pos: "Präposition (Vergleich nach „prefer“)",
    meansDe: "gegenüber (beim Vorziehen)",
    meaning: "Gesucht ist das kleine Wort, mit dem du im Englischen ausdrückst, was du im Vergleich lieber magst — nicht „than“, sondern ein anderes.",
    grammar: "„prefer A to B“ ist die feste Form: man zieht A dem B vor. Achtung: Nicht „prefer than“! Mit „would rather“ benutzt man dagegen „than“: I'd rather read than watch TV.",
    example: { en: "I prefer tea to coffee in the morning.", de: "Morgens trinke ich lieber Tee als Kaffee." },
  },
  "I would ___ a tea, please.": {
    pos: "Verb (Teil von „would like“)",
    meansDe: "mögen, gerne haben",
    meaning: "Gesucht ist das Verb, das zu „would“ gehört, um höflich auszudrücken, dass du etwas haben möchtest.",
    grammar: "„I would like …“ ist die höfliche Standardform für „I want …“. Im Restaurant, Café oder Geschäft benutzt man fast immer „would like“ — „want“ klingt direkter.",
    example: { en: "I would like a glass of water, please.", de: "Ich hätte gerne ein Glas Wasser, bitte." },
  },
  "Could you ___ me a fork, please?": {
    pos: "Verb in der Grundform",
    meansDe: "bringen",
    meaning: "Gesucht ist das Verb für die Tätigkeit, die der Kellner macht, wenn er dir etwas an den Tisch holt.",
    grammar: "„bring“ heißt „herbringen“ (zu mir/uns), „take“ heißt „mitnehmen / wegbringen“. Im Restaurant bringt der Kellner Dinge — also „bring“. Nach „Could you …?“ steht immer die Grundform ohne „to“.",
    example: { en: "Could you bring us some more bread, please?", de: "Könnten Sie uns bitte noch etwas Brot bringen?" },
  },
};

const overrideForTask = (task: LessonTask): TaskOverride | undefined => {
  if (task.type === "cloze") return TASK_OVERRIDES[task.sentence];
  return TASK_OVERRIDES[task.prompt];
};

const normalizeLessonText = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

const filledClozeSentence = (task: ClozeTask, answer = task.answer) => task.sentence.replace("___", answer);

const taskAnswers = (task: LessonTask) => [task.answer, ...(task.acceptedAnswers ?? [])];

export function isTaskAnswerCorrect(task: LessonTask, value: string): boolean {
  const normalized = normalizeLessonText(value);
  if (!normalized) return false;
  return taskAnswers(task).some((answer) => normalizeLessonText(answer) === normalized);
}

/** Short part-of-speech / form label, shown as second hint line ("Wortart"). */
const buildKindHint = (task: LessonTask): string => {
  const override = overrideForTask(task);
  if (override?.pos) return override.pos;
  if (override?.kind) return override.kind;
  if (task.type === "mc") return "Wähle die Option, die als ganzer englischer Satz wirklich natürlich klingt.";
  if (task.type === "order") return "Bau das Satzgerüst auf: erst Subjekt + Verb, dann Ergänzungen wie Zeit oder Ort.";

  const ans = task.answer.toLowerCase();
  const small = ["to","at","on","in","for","of","as","than","out","down","up","off","by","with","from","into","about","the","a","an","and","or","but"];
  if (small.includes(ans)) return "Kurzes Strukturwort (Präposition oder Verbindungswort)";
  if (ans.endsWith("ing")) return "-ing-Form (Verlaufsform oder Nomen aus einem Verb)";
  if (ans.endsWith("ed") || ans.endsWith("en")) return "Partizip / Past Participle (Form auf -ed/-en)";
  if (ans.endsWith("ly")) return "Adverb (beschreibt, wie etwas geschieht)";
  if (ans.endsWith("er") || ans.endsWith("est")) return "Steigerungsform eines Adjektivs";
  if (ans.endsWith("y") && ans.length > 3) return "Adjektiv (oft aus Nomen + -y gebildet)";
  if (ans.length <= 4) return "Kurzes Verbindungs- oder Hilfswort";
  return "Inhaltswort, das genau in diese Situation passt";
};

/** Sense-tip: leads with meaning ("Gesucht ist ein Wort, das …"), then letter shape.
 *  Only shown when we actually have a real meaning sentence — never a fragmentary
 *  pseudo-sentence built from a short legacy `hint`. */
const buildMeaningHint = (task: LessonTask): string | undefined => {
  let meaning: string | undefined;
  if (task.meaningHint && task.meaningHint.trim().length > 0) {
    meaning = task.meaningHint.trim();
  } else {
    const override = overrideForTask(task);
    if (override?.meaning) meaning = override.meaning.trim();
  }

  // No real meaning available → for cloze, at least show the letter shape as a fallback.
  if (!meaning) {
    if (task.type === "cloze") {
      return `Englisches Wort: ${wordShape(task.answer)}.`;
    }
    return undefined;
  }

  if (!/[.!?…]$/.test(meaning)) meaning = `${meaning}.`;
  if (task.type === "cloze") {
    return `${meaning} Englisches Wort: ${wordShape(task.answer)}.`;
  }
  return meaning;
};

export function getTaskHint(task: LessonTask): string | undefined {
  if (task.type !== "cloze" && !task.hint) return undefined;
  return buildKindHint(task);
}

export function getTaskMeaningHint(task: LessonTask): string | undefined {
  return buildMeaningHint(task);
}

/** German translation / meaning of the answer. Used as the first explanation line. */
const buildAnswerMeaning = (task: LessonTask): string | undefined => {
  const override = overrideForTask(task);
  if (override?.meansDe) {
    return `Bedeutung: „${task.answer}“ heißt auf Deutsch ${override.meansDe}.`;
  }
  return undefined;
};

/** "Wortart / Herkunft"-Zeile, fällt zurück auf den Kind-Hint. */
const buildWordType = (task: LessonTask): string | undefined => {
  const override = overrideForTask(task);
  const pos = override?.pos ?? override?.kind;
  if (pos) return `Wortart: ${pos}.`;
  if (task.type !== "cloze") return undefined;
  const ans = task.answer.toLowerCase();
  if (ans.endsWith("ing")) return "Wortart: -ing-Form — kann Verlaufsform oder Nomen sein.";
  if (ans.endsWith("ed") || ans.endsWith("en")) return "Wortart: Partizip (Past Participle), oft im Passiv oder als Adjektiv.";
  if (ans.endsWith("ly")) return "Wortart: Adverb.";
  if (ans.endsWith("y") && ans.length > 3) return "Wortart: Adjektiv.";
  return undefined;
};

const buildMiniGrammar = (task: LessonTask): string | undefined => {
  const override = overrideForTask(task);
  if (override?.grammar) return override.grammar;
  if (task.explain) return task.explain;

  if (task.type === "cloze") {
    const ans = task.answer.toLowerCase();
    if (ans.endsWith("ing")) {
      return "Die -ing-Form steht im Englischen entweder für einen laufenden Vorgang („is working“) oder als Nomen für eine Tätigkeit („shopping“, „cooking“).";
    }
    if (ans.endsWith("ed") || ans.endsWith("en")) {
      return "Mit „be / has been + Partizip“ baust du im Englischen das Passiv: der Satz beschreibt nicht, was jemand tut, sondern was mit dem Subjekt geschieht.";
    }
    if (ans.endsWith("y") && ans.length > 3) {
      return "Viele englische Adjektive entstehen aus einem Nomen + -y: salt → salty, rain → rainy, sun → sunny.";
    }
    if (["to","for","at","in","on","of","with","from","by","about"].includes(ans)) {
      return `Das kleine Wort „${task.answer}“ ist hier Teil einer festen englischen Verbindung. Solche Strukturwörter lernst du am besten zusammen mit dem ganzen Ausdruck.`;
    }
    if (["than","more","most"].includes(ans) || ans.endsWith("er") || ans.endsWith("est")) {
      return "Vergleiche im Englischen: kurze Adjektive bekommen -er/-est, längere stehen mit „more/most“ — und nach dem Vergleich folgt oft „than“.";
    }
  }
  if (task.type === "order") {
    return "Englische Sätze folgen meist dem Muster Subjekt + Verb + Objekt. Zeit- und Ortsangaben kommen typischerweise an den Anfang oder ans Ende.";
  }
  return undefined;
};

const buildExtraExample = (task: LessonTask): ExtraExample | undefined => {
  if (task.extraExample) return task.extraExample;
  const override = overrideForTask(task);
  return override?.example;
};

const buildMismatchExplanation = (task: LessonTask, userAnswer?: string): string | undefined => {
  if (!userAnswer) return undefined;
  const attempt = userAnswer.trim();
  if (!attempt) return undefined;
  if (taskAnswers(task).some((answer) => normalizeLessonText(answer) === normalizeLessonText(attempt))) {
    if (normalizeLessonText(attempt) !== normalizeLessonText(task.answer)) {
      return `Deine Lösung „${attempt}“ ist hier auch möglich. In der Lektion zeigen wir „${task.answer}“ als Standardform, damit du eine klare Hauptvariante mitnehmen kannst.`;
    }
    return undefined;
  }
  if (task.type === "mc") {
    return `„${attempt}“ passt hier nicht, weil diese Option als ganzer englischer Satz entweder grammatisch unvollständig ist oder etwas anderes ausdrückt als gefragt.`;
  }
  if (task.type === "order") {
    return `Deine Reihenfolge „${attempt}“ klingt im Englischen nicht ganz natürlich — meistens verrutscht dabei die Stellung von Subjekt, Verb oder einer kleinen Zeit-/Ortsangabe.`;
  }
  return `„${attempt}“ passt hier nicht, weil die Lücke genau die Bedeutung oder die feste Form braucht, die mit „${task.answer}“ entsteht.`;
};

export function getTaskExplanation(task: LessonTask, opts: { isCorrect: boolean; userAnswer?: string }): string {
  const parts: string[] = [];

  // 1. Lösung im Satz
  if (task.type === "cloze") {
    parts.push(`„${task.answer}“ passt hier, weil der Satz dann klar und natürlich klingt: „${filledClozeSentence(task)}“.`);
  } else if (task.type === "mc") {
    parts.push(`„${task.answer}“ ist die richtige Wahl, weil nur diese Option den Sinn der deutschen Vorlage als natürlicher englischer Satz wiedergibt.`);
  } else {
    parts.push(`Die richtige Reihenfolge ist „${task.answer}“ — so steht das englische Satzgerüst sauber: erst Subjekt/Frage, dann Verb, dann Ergänzung.`);
  }

  // 2. Bei Fehler: warum die eigene Antwort nicht passt
  if (!opts.isCorrect) {
    const mismatch = buildMismatchExplanation(task, opts.userAnswer);
    if (mismatch) parts.push(mismatch);
  }

  // 3. Bedeutung (DE) des gesuchten Wortes
  const meaning = buildAnswerMeaning(task);
  if (meaning) parts.push(meaning);

  // 4. Wortart / Herkunft
  const wordType = buildWordType(task);
  if (wordType) parts.push(wordType);

  // 5. Mini-Grammatik / Wortwissen
  const grammar = buildMiniGrammar(task);
  if (grammar) parts.push(grammar);

  // 6. Zweiter Beispielsatz mit Übersetzung
  const example = buildExtraExample(task);
  if (example) parts.push(`Beispiel: „${example.en}“ — ${example.de}`);

  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => /[.!?…]$/.test(p) ? p : `${p}.`)
    .join(" \u2003");
}

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

/** Returns lessons matching the given level. Falls back to the closest available
 *  lesson set (e.g. C1/C2 → B2) so we never show an empty grid. */
export function lessonsForLevel(level: string): Lesson[] {
  const exact = LESSONS.filter((l) => l.level === level);
  if (exact.length > 0) return exact;
  if (level === "C1" || level === "C2") return LESSONS.filter((l) => l.level === "B2");
  return LESSONS;
}

// ----- Progress persistence -----
const progressKey = (userId: string | null | undefined, lessonId: string) =>
  `hello.lesson.progress.${userId ?? "anon"}.${lessonId}`;

export interface LessonProgress {
  completedIds: string[];
  mistakeIds?: string[];
  completedAt?: string;
}

export function readLessonProgress(userId: string | null | undefined, lessonId: string): LessonProgress {
  try {
    const raw = localStorage.getItem(progressKey(userId, lessonId));
    if (!raw) return { completedIds: [] };
    const p = JSON.parse(raw);
    return {
      completedIds: Array.isArray(p?.completedIds) ? p.completedIds.filter((x: unknown) => typeof x === "string") : [],
      mistakeIds: Array.isArray(p?.mistakeIds) ? p.mistakeIds.filter((x: unknown) => typeof x === "string") : [],
      completedAt: typeof p?.completedAt === "string" ? p.completedAt : undefined,
    };
  } catch {
    return { completedIds: [] };
  }
}

export function writeLessonProgress(userId: string | null | undefined, lessonId: string, value: LessonProgress) {
  try {
    localStorage.setItem(progressKey(userId, lessonId), JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function markTaskComplete(userId: string | null | undefined, lessonId: string, taskId: string) {
  const cur = readLessonProgress(userId, lessonId);
  if (cur.completedIds.includes(taskId)) return cur;
  const next: LessonProgress = { ...cur, completedIds: [...cur.completedIds, taskId] };
  writeLessonProgress(userId, lessonId, next);
  return next;
}

export function recordTaskMistake(userId: string | null | undefined, lessonId: string, taskId: string) {
  const cur = readLessonProgress(userId, lessonId);
  if (cur.mistakeIds?.includes(taskId)) return cur;
  const next: LessonProgress = { ...cur, mistakeIds: [...(cur.mistakeIds ?? []), taskId] };
  writeLessonProgress(userId, lessonId, next);
  return next;
}

export function markLessonComplete(userId: string | null | undefined, lessonId: string) {
  const cur = readLessonProgress(userId, lessonId);
  const next: LessonProgress = { ...cur, completedAt: new Date().toISOString() };
  writeLessonProgress(userId, lessonId, next);
  return next;
}

export function resetLessonRun(userId: string | null | undefined, lessonId: string) {
  const cur = readLessonProgress(userId, lessonId);
  const next: LessonProgress = { ...cur, completedIds: [], mistakeIds: [] };
  writeLessonProgress(userId, lessonId, next);
  return next;
}
