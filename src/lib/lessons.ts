// Static, hand-curated lesson catalog for the "Lektionen" tab.
// Each lesson is a coherent guided unit (15–20 mixed tasks) calibrated to a
// single CEFR level so the surfaced lesson set always matches the learner's
// current focus. Progress is persisted locally per user — no backend schema
// changes needed for this version.

export type TaskType = "mc" | "cloze" | "order";
export type LessonLevel = "A1" | "A2" | "B1" | "B2";

interface BaseTask {
  id: string;            // stable per lesson — used as progress key
  type: TaskType;
  prompt: string;        // German question / instruction
  hint?: string;         // light, supportive — what KIND of word/answer
  explain?: string;      // Ellie's short explanation shown on wrong / review
}
export interface MCTask extends BaseTask {
  type: "mc";
  options: string[];
  answer: string;        // exact match against options
}
export interface ClozeTask extends BaseTask {
  type: "cloze";
  sentence: string;      // contains "___" placeholder
  answer: string;        // case-insensitive
  translation?: string;
}
export interface OrderTask extends BaseTask {
  type: "order";
  words: string[];       // shuffled tokens shown to user
  answer: string;        // expected sentence
}
export type LessonTask = MCTask | ClozeTask | OrderTask;

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;          // short one-liner
  description: string;       // 1 inviting sentence under the card
  examples?: string[];       // 1–2 tiny example phrases shown on the card
  level: LessonLevel;
  emoji: string;
  tasks: LessonTask[];
}

const mc = (
  id: string, prompt: string, options: string[], answer: string,
  opts: { hint?: string; explain?: string } = {},
): MCTask => ({ id, type: "mc", prompt, options, answer, ...opts });

const cz = (
  id: string, prompt: string, sentence: string, answer: string,
  opts: { hint?: string; explain?: string; translation?: string } = {},
): ClozeTask => ({ id, type: "cloze", prompt, sentence, answer, ...opts });

const ord = (
  id: string, prompt: string, words: string[], answer: string,
  opts: { hint?: string; explain?: string } = {},
): OrderTask => ({ id, type: "order", prompt, words, answer, ...opts });

// ============================================================
// LESSONS
// At least one lesson per level. Each lesson 15–20 tasks.
// ============================================================
export const LESSONS: Lesson[] = [
  // ---------------- A1 ----------------
  {
    id: "alltag-a1",
    title: "Alltag",
    subtitle: "Tagesablauf & smalltalk",
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
        { hint: "Verb — Tagesablauf", explain: "„get up“ = aufstehen. Im Present Simple ohne -s, weil „I“." }),
      cz("t5", "Lücke füllen", "She ___ to work by bike.", "goes",
        { hint: "Verb — 3. Person Singular", explain: "Bei he/she/it bekommt das Verb ein -s: go → goes." }),
      cz("t6", "Lücke füllen", "We have lunch ___ noon.", "at",
        { hint: "Präposition — Uhrzeit", explain: "Vor genauen Zeiten benutzt man „at“: at noon, at 7." }),
      ord("t7", "Sätze richtig anordnen", ["what", "time", "is", "it"], "what time is it"),
      ord("t8", "Sätze richtig anordnen", ["I", "am", "from", "Germany"], "I am from Germany"),
      mc("t9", "Welche Antwort passt zu „Nice to meet you.“", [
        "Nice to meet you too.", "I am fine, thanks.", "See you later.", "It is raining.",
      ], "Nice to meet you too."),
      mc("t10", "„Wochenende“ heißt …", ["weekend", "weekday", "week off", "freeday"], "weekend"),
      cz("t11", "Lücke füllen", "I go to bed ___ 11 pm.", "at", { hint: "Präposition — Uhrzeit" }),
      cz("t12", "Lücke füllen", "I brush my ___ every morning.", "teeth",
        { hint: "Substantiv — Plural", explain: "Plural von „tooth“ ist unregelmäßig: teeth." }),
      mc("t13", "„Vielen Dank!“ heißt …", ["Thank you very much", "Many thank", "Thanks much you", "You thanks"], "Thank you very much"),
      cz("t14", "Lücke füllen", "I ___ a coffee every morning.", "drink", { hint: "Verb — Tagesablauf" }),
      ord("t15", "Sätze richtig anordnen", ["see", "you", "tomorrow"], "see you tomorrow"),
      mc("t16", "Welche Frage passt zu „I am 25.“", [
        "How old are you?", "How are you old?", "What old you?", "When you?",
      ], "How old are you?"),
      cz("t17", "Lücke füllen", "My name ___ Anna.", "is", { hint: "Verb to be" }),
      ord("t18", "Sätze richtig anordnen", ["where", "do", "you", "live"], "where do you live"),
    ],
  },

  // ---------------- A2 ----------------
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
        { hint: "Partizip — Verspätung", explain: "Passiv mit „has been + Partizip“: been delayed = wurde verspätet." }),
      cz("t5", "Lücke füllen", "I have a reservation ___ the name of Smith.", "in",
        { hint: "Präposition — Hotel-Reservierung", explain: "Feste Wendung: „in the name of …“." }),
      cz("t6", "Lücke füllen", "Could you ___ me where the elevator is?", "tell",
        { hint: "Verb — höfliche Frage", explain: "„Could you tell me …?“ ist eine indirekte, höfliche Frage." }),
      ord("t7", "Sätze richtig anordnen", ["I", "would", "like", "a", "window", "seat"], "I would like a window seat"),
      ord("t8", "Sätze richtig anordnen", ["how", "long", "is", "the", "flight"], "how long is the flight"),
      ord("t9", "Sätze richtig anordnen", ["could", "you", "call", "a", "taxi"], "could you call a taxi"),
      mc("t10", "Welcher Satz ist höflich am Empfang?", [
        "Give me a room.", "Could I have a room, please?", "Room now.", "I take room.",
      ], "Could I have a room, please?"),
      cz("t11", "Lücke füllen", "Breakfast is ___ from 7 to 10.", "served",
        { hint: "Passiv — Partizip", explain: "Passiv mit „is + Partizip“: is served = wird serviert." }),
      mc("t12", "„Round trip“ bedeutet …", [
        "Hin- und Rückfahrt", "Stadtrundfahrt", "kurze Pause", "Umstieg",
      ], "Hin- und Rückfahrt"),
      cz("t13", "Lücke füllen", "I'd like to book a ___ for two nights.", "room",
        { hint: "Substantiv — Hotel" }),
      ord("t14", "Sätze richtig anordnen", ["is", "breakfast", "included", "in", "the", "price"], "is breakfast included in the price"),
      mc("t15", "Wegbeschreibung: „Go straight and then turn ___.“", ["left", "leftly", "to left side", "leftway"], "left"),
      cz("t16", "Lücke füllen", "We are looking ___ a cheap hotel near the center.", "for",
        { hint: "Präposition", explain: "„look for“ = suchen. „look at“ = ansehen." }),
      ord("t17", "Sätze richtig anordnen", ["how", "much", "does", "it", "cost"], "how much does it cost"),
      mc("t18", "„Boarding pass“ ist …", ["Bordkarte", "Reisepass", "Sicherheitskontrolle", "Gepäckschein"], "Bordkarte"),
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
        { hint: "Verb — Vorlieben", explain: "Nach „enjoy“ steht die -ing-Form: enjoy playing." }),
      cz("t3", "Lücke füllen", "She is good ___ painting.", "at",
        { hint: "Präposition — Fähigkeit", explain: "„good at + -ing“ = gut in/im …" }),
      cz("t4", "Lücke füllen", "We often go ___ a walk in the park.", "for",
        { hint: "Präposition — feste Wendung", explain: "„go for a walk“ = spazieren gehen." }),
      ord("t5", "Sätze richtig anordnen", ["I", "love", "watching", "old", "movies"], "I love watching old movies"),
      ord("t6", "Sätze richtig anordnen", ["do", "you", "play", "any", "instrument"], "do you play any instrument"),
      mc("t7", "Welche Frage lädt zu einem Treffen ein?", [
        "Would you like to join us tonight?", "Where you are tonight?", "Tonight come?", "We make tonight?",
      ], "Would you like to join us tonight?"),
      cz("t8", "Lücke füllen", "I am really ___ in photography.", "interested",
        { hint: "Adjektiv — Interesse", explain: "„interested in + Thema“ — über Interessen sprechen." }),
      mc("t9", "„Konzert“ heißt …", ["concert", "show", "festival", "play"], "concert"),
      cz("t10", "Lücke füllen", "How ___ do you go to the gym?", "often",
        { hint: "Häufigkeitsfrage", explain: "„How often …?“ fragt nach der Häufigkeit." }),
      ord("t11", "Sätze richtig anordnen", ["let's", "meet", "at", "the", "café", "later"], "let's meet at the café later"),
      cz("t12", "Lücke füllen", "I usually meet my friends ___ Saturdays.", "on",
        { hint: "Präposition — Wochentage", explain: "Vor Wochentagen steht „on“: on Monday." }),
      mc("t13", "Welche Antwort lehnt höflich ab?", [
        "Sorry, I can't tonight, but maybe next week?", "No.", "I don't want.", "Stop asking.",
      ], "Sorry, I can't tonight, but maybe next week?"),
      cz("t14", "Lücke füllen", "I have been learning the guitar ___ two years.", "for",
        { hint: "Zeitdauer", explain: "„for + Zeitraum“ (zwei Jahre lang). „since“ + Zeitpunkt." }),
      ord("t15", "Sätze richtig anordnen", ["I", "can", "pick", "you", "up", "at", "eight"], "I can pick you up at eight"),
      mc("t16", "„Fitnessstudio“ heißt …", ["gym", "studio", "club", "court"], "gym"),
      cz("t17", "Lücke füllen", "I prefer reading ___ watching TV.", "to",
        { hint: "Vergleich", explain: "„prefer A to B“ = A B vorziehen." }),
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
        { hint: "Verb — Anprobe", explain: "„try on“ = anprobieren." }),
      cz("t3", "Lücke füllen", "Do you have this in a smaller ___?", "size"),
      cz("t4", "Lücke füllen", "I would like to ___ this, please.", "buy",
        { hint: "Verb — Kaufabschluss" }),
      ord("t5", "Sätze richtig anordnen", ["where", "is", "the", "fitting", "room"], "where is the fitting room"),
      ord("t6", "Sätze richtig anordnen", ["do", "you", "accept", "credit", "cards"], "do you accept credit cards"),
      mc("t7", "„Reduziert / im Angebot“ heißt …", ["on sale", "in offer", "with cut", "down price"], "on sale"),
      mc("t8", "„Kassenbon / Quittung“ heißt …", ["receipt", "ticket", "note", "paper"], "receipt"),
      cz("t9", "Lücke füllen", "I would like to ___ this. It does not fit.", "return",
        { hint: "Verb — Reklamation" }),
      cz("t10", "Lücke füllen", "Free ___ on orders over 50 euros.", "shipping",
        { hint: "Substantiv — Versand" }),
      mc("t11", "Welcher Satz ist höflich an der Kasse?", [
        "Could I pay by card, please?", "Card now.", "Pay card.", "I do card.",
      ], "Could I pay by card, please?"),
      cz("t12", "Lücke füllen", "It's a bit too tight. Do you have a ___ size?", "bigger",
        { hint: "Komparativ", explain: "Komparativ von „big“ verdoppelt das g: bigger." }),
      ord("t13", "Sätze richtig anordnen", ["I'm", "just", "looking", "thanks"], "I'm just looking thanks"),
      cz("t14", "Lücke füllen", "These shoes are ___ expensive than the others.", "more",
        { hint: "Komparativ", explain: "Bei längeren Adjektiven: „more + Adjektiv + than“." }),
      mc("t15", "„Garantie“ heißt …", ["warranty", "promise", "ticket", "contract"], "warranty"),
      cz("t16", "Lücke füllen", "I bought it ___ Monday and it broke today.", "on",
        { hint: "Präposition — Wochentag" }),
      ord("t17", "Sätze richtig anordnen", ["could", "I", "have", "a", "refund"], "could I have a refund"),
      mc("t18", "„Lieferung in 2 Tagen“ — passt …", [
        "delivery within 2 days", "delivery for 2 days", "delivery since 2 days", "delivery on 2 days",
      ], "delivery within 2 days"),
    ],
  },

  // ---------------- B1 ----------------
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
        { hint: "Partizip — E-Mail-Floskel", explain: "„Please find … attached.“ ist die Standardformel für Anhänge." }),
      cz("t4", "Lücke füllen", "Looking ___ to your reply.", "forward",
        { hint: "Adverb — Brief-Schluss", explain: "„look forward to + -ing/Substantiv“ = sich freuen auf." }),
      cz("t5", "Lücke füllen", "I am ___ charge of the new project.", "in",
        { hint: "Präposition — Verantwortung", explain: "„in charge of …“ = verantwortlich für …" }),
      cz("t6", "Lücke füllen", "Could you send me the report ___ Friday?", "by",
        { hint: "Präposition — Frist", explain: "„by Friday“ = bis spätestens Freitag." }),
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
        { hint: "Phrasal verb", explain: "„bring up“ = ein Thema ansprechen." }),
      cz("t12", "Lücke füllen", "Let's go ___ the agenda one more time.", "through",
        { hint: "Phrasal verb", explain: "„go through“ = durchgehen, durchsehen." }),
      ord("t13", "Sätze richtig anordnen", ["I'm", "afraid", "I", "have", "to", "disagree"], "I'm afraid I have to disagree"),
      mc("t14", "Welcher Satz lehnt höflich einen Vorschlag ab?", [
        "I see your point, but I'm not sure that would work.",
        "No way.", "Bad idea.", "Don't do that.",
      ], "I see your point, but I'm not sure that would work."),
      cz("t15", "Lücke füllen", "I'll send you a calendar ___ for the meeting.", "invite",
        { hint: "Substantiv — Meeting" }),
      ord("t16", "Sätze richtig anordnen", ["thanks", "for", "getting", "back", "to", "me"], "thanks for getting back to me"),
      cz("t17", "Lücke füllen", "We need to keep the client ___ on the progress.", "updated",
        { hint: "Adjektiv/Partizip", explain: "„keep someone updated“ = jemanden auf dem Laufenden halten." }),
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
        { hint: "Substantiv — feste Wendung", explain: "„carbon footprint“ = CO₂-Fußabdruck." }),
      cz("t4", "Lücke füllen", "Plastic ___ is a serious problem in the oceans.", "pollution",
        { hint: "Substantiv — Umwelt" }),
      cz("t5", "Lücke füllen", "Many people try to ___ energy at home.", "save",
        { hint: "Verb — Energie" }),
      ord("t6", "Sätze richtig anordnen", ["we", "should", "use", "less", "single-use", "plastic"], "we should use less single-use plastic"),
      ord("t7", "Sätze richtig anordnen", ["renewable", "energy", "is", "the", "future"], "renewable energy is the future"),
      mc("t8", "Was ist KEIN „renewable energy source“?", ["solar", "wind", "coal", "hydro"], "coal",
        { explain: "Kohle ist ein fossiler Brennstoff, nicht erneuerbar." }),
      mc("t9", "„Recyceln“ heißt …", ["recycle", "reuse", "refuse", "rebuild"], "recycle"),
      cz("t10", "Lücke füllen", "Cycling is better for the ___ than driving.", "environment"),
      cz("t11", "Lücke füllen", "We should switch ___ renewable energy.", "to",
        { hint: "Phrasal verb", explain: "„switch to“ = umsteigen auf." }),
      mc("t12", "„Treibhausgase“ heißt …", ["greenhouse gases", "warm air", "hot smoke", "sky steam"], "greenhouse gases"),
      ord("t13", "Sätze richtig anordnen", ["governments", "must", "take", "stronger", "action"], "governments must take stronger action"),
      cz("t14", "Lücke füllen", "Sea levels are ___ because of climate change.", "rising",
        { hint: "Verb — Verlaufsform", explain: "Present continuous: are + Verb-ing für aktuelle Trends." }),
      mc("t15", "„Nachhaltig“ heißt …", ["sustainable", "long lasting only", "kept", "longtime"], "sustainable"),
      ord("t16", "Sätze richtig anordnen", ["small", "changes", "can", "make", "a", "big", "difference"], "small changes can make a big difference"),
      cz("t17", "Lücke füllen", "Companies should be held ___ for their emissions.", "accountable",
        { hint: "Adjektiv — Verantwortung", explain: "„hold someone accountable“ = jemanden zur Verantwortung ziehen." }),
      mc("t18", "„Endangered species“ ist …", [
        "bedrohte Arten", "ausgestorbene Arten", "gefährliche Arten", "neue Arten",
      ], "bedrohte Arten"),
    ],
  },

  // ---------------- B2 ----------------
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
        { hint: "Präposition — Expansion", explain: "„expand into + Markt/Region“." }),
      cz("t4", "Lücke füllen", "Sales increased ___ 12 percent.", "by",
        { hint: "Präposition — Veränderung", explain: "„increase/decrease by + Prozent/Betrag“." }),
      cz("t5", "Lücke füllen", "We are looking ___ new investors.", "for",
        { hint: "Phrasal verb" }),
      ord("t6", "Sätze richtig anordnen", ["the", "market", "has", "become", "very", "competitive"], "the market has become very competitive"),
      ord("t7", "Sätze richtig anordnen", ["we", "need", "to", "cut", "costs", "significantly"], "we need to cut costs significantly"),
      mc("t8", "„Inflation“ wirkt sich besonders aus auf …", [
        "purchasing power", "office hours", "weather", "language",
      ], "purchasing power"),
      cz("t9", "Lücke füllen", "Our profits ___ by 8% last quarter.", "rose",
        { hint: "Verb — Past Simple, unregelmäßig", explain: "rise → rose → risen (steigen)." }),
      cz("t10", "Lücke füllen", "We launched a new product ___ last quarter.", "in",
        { hint: "Präposition — Quartal" }),
      cz("t11", "Lücke füllen", "The economy is in a ___.", "recession",
        { hint: "Substantiv — wirtschaftliche Lage" }),
      ord("t12", "Sätze richtig anordnen", ["this", "decision", "could", "have", "long-term", "consequences"], "this decision could have long-term consequences"),
      mc("t13", "Welcher Satz drückt eine Hypothese aus?", [
        "If we cut prices, we would attract more customers.",
        "We cut prices and customers come.",
        "Cut prices brings customers.",
        "Customers come for cut prices.",
      ], "If we cut prices, we would attract more customers.",
        { explain: "Conditional Type 2: If + Past Simple, would + Infinitiv (hypothetisch)." }),
      cz("t14", "Lücke füllen", "We need to take advantage ___ this opportunity.", "of",
        { hint: "Präposition — feste Wendung", explain: "„take advantage of“ = nutzen, ausnutzen." }),
      ord("t15", "Sätze richtig anordnen", ["we're", "considering", "a", "merger", "with", "a", "competitor"], "we're considering a merger with a competitor"),
      mc("t16", "„Stakeholder“ sind …", [
        "alle Interessengruppen eines Unternehmens",
        "nur die Aktionäre",
        "nur Mitarbeitende",
        "nur Kund*innen",
      ], "alle Interessengruppen eines Unternehmens"),
      cz("t17", "Lücke füllen", "The merger is subject ___ regulatory approval.", "to",
        { hint: "Präposition — Bedingung", explain: "„subject to“ = vorbehaltlich, abhängig von." }),
      cz("t18", "Lücke füllen", "We outsourced production ___ cut costs.", "to",
        { hint: "Infinitiv — Zweck", explain: "„to + Infinitiv“ drückt einen Zweck aus." }),
      ord("t19", "Sätze richtig anordnen", ["the", "board", "has", "approved", "the", "new", "strategy"], "the board has approved the new strategy"),
    ],
  },
];

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
// Per-user, per-lesson set of completed task ids + recent mistakes.
const progressKey = (userId: string | null | undefined, lessonId: string) =>
  `hello.lesson.progress.${userId ?? "anon"}.${lessonId}`;

export interface LessonProgress {
  completedIds: string[];
  /** Task ids the user got wrong at least once during the most recent run. */
  mistakeIds?: string[];
  completedAt?: string; // ISO when whole lesson finished
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

/** Reset progress for a fresh full replay (keeps completedAt badge). */
export function resetLessonRun(userId: string | null | undefined, lessonId: string) {
  const cur = readLessonProgress(userId, lessonId);
  const next: LessonProgress = { ...cur, completedIds: [], mistakeIds: [] };
  writeLessonProgress(userId, lessonId, next);
  return next;
}
