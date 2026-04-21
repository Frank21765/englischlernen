// Static, hand-curated lesson catalog for the "Lektionen" tab.
// Each lesson is a coherent guided unit (>= 10 mixed tasks).
// Progress is persisted locally per user — no backend schema changes needed
// for this first version.

export type TaskType = "mc" | "cloze" | "order";

interface BaseTask {
  id: string;            // stable per lesson — used as progress key
  type: TaskType;
  prompt: string;        // German question / instruction
  hint?: string;
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
  subtitle: string;
  level: "A1" | "A2" | "B1" | "B2";
  emoji: string;
  tasks: LessonTask[];
}

const mc = (id: string, prompt: string, options: string[], answer: string, hint?: string): MCTask =>
  ({ id, type: "mc", prompt, options, answer, hint });
const cz = (id: string, prompt: string, sentence: string, answer: string, translation?: string): ClozeTask =>
  ({ id, type: "cloze", prompt, sentence, answer, translation });
const ord = (id: string, prompt: string, words: string[], answer: string): OrderTask =>
  ({ id, type: "order", prompt, words, answer });

export const LESSONS: Lesson[] = [
  {
    id: "reisen",
    title: "Reisen",
    subtitle: "Am Flughafen, Hotel & unterwegs",
    level: "A2",
    emoji: "✈️",
    tasks: [
      mc("t1", "Was heißt „Reisepass“ auf Englisch?", ["passport", "ticket", "luggage", "visa"], "passport"),
      mc("t2", "Was heißt „Gepäck“?", ["bag", "luggage", "suitcase rack", "trolley"], "luggage"),
      mc("t3", "Wie sagt man „Abflug“?", ["arrival", "boarding", "departure", "landing"], "departure"),
      cz("t4", "Lücke füllen", "I would like to ___ in for my flight.", "check", "Ich möchte für meinen Flug einchecken."),
      cz("t5", "Lücke füllen", "Where is the ___ to gate 12?", "way", "Wo geht es zu Gate 12?"),
      cz("t6", "Lücke füllen", "I have a reservation ___ the name of Smith.", "in", "Ich habe eine Reservierung auf den Namen Smith."),
      ord("t7", "Sätze richtig anordnen", ["I", "would", "like", "a", "window", "seat"], "I would like a window seat"),
      ord("t8", "Sätze richtig anordnen", ["how", "long", "is", "the", "flight"], "how long is the flight"),
      mc("t9", "„Verspätung“ heißt …", ["delay", "queue", "gate", "shuttle"], "delay"),
      mc("t10", "Welcher Satz ist höflich am Empfang?", [
        "Give me a room.",
        "Could I have a room, please?",
        "Room now.",
        "I take room.",
      ], "Could I have a room, please?"),
      cz("t11", "Lücke füllen", "Breakfast is ___ from 7 to 10.", "served", "Frühstück wird von 7 bis 10 serviert."),
      ord("t12", "Sätze richtig anordnen", ["could", "you", "call", "a", "taxi"], "could you call a taxi"),
    ],
  },
  {
    id: "essen-trinken",
    title: "Essen & Trinken",
    subtitle: "Im Restaurant bestellen",
    level: "A2",
    emoji: "🍽️",
    tasks: [
      mc("t1", "Wie sagt man „Speisekarte“?", ["menu", "bill", "order", "list"], "menu"),
      mc("t2", "„Die Rechnung, bitte.“", ["The bill, please.", "The check please now.", "Money, please.", "Pay it."], "The bill, please."),
      cz("t3", "Lücke füllen", "I would ___ a coffee, please.", "like"),
      cz("t4", "Lücke füllen", "Are you ready to ___?", "order"),
      mc("t5", "„Vorspeise“ heißt …", ["starter", "dessert", "main course", "side"], "starter"),
      mc("t6", "„Nachtisch“ heißt …", ["dessert", "drink", "snack", "tip"], "dessert"),
      ord("t7", "Sätze richtig anordnen", ["can", "I", "have", "the", "menu"], "can I have the menu"),
      ord("t8", "Sätze richtig anordnen", ["I", "am", "allergic", "to", "nuts"], "I am allergic to nuts"),
      cz("t9", "Lücke füllen", "It tastes ___ good!", "really"),
      mc("t10", "Welche Antwort passt zu „How was your meal?“", [
        "It was delicious.",
        "Yes please.",
        "I am thirsty.",
        "Open it.",
      ], "It was delicious."),
      cz("t11", "Lücke füllen", "Could we have the bill, ___?", "please"),
    ],
  },
  {
    id: "umwelt",
    title: "Umwelt",
    subtitle: "Klima, Natur und Nachhaltigkeit",
    level: "B1",
    emoji: "🌱",
    tasks: [
      mc("t1", "„Umwelt“ heißt …", ["environment", "climate", "weather", "nature"], "environment"),
      mc("t2", "„Klimawandel“ heißt …", ["climate change", "global heat", "weather move", "earth shift"], "climate change"),
      mc("t3", "„Mülltrennung“ heißt …", ["waste sorting", "trash mix", "garbage time", "bin work"], "waste sorting"),
      cz("t4", "Lücke füllen", "We need to reduce our carbon ___.", "footprint"),
      cz("t5", "Lücke füllen", "Plastic ___ is a serious problem.", "pollution"),
      cz("t6", "Lücke füllen", "Many people try to ___ energy at home.", "save"),
      ord("t7", "Sätze richtig anordnen", ["we", "should", "use", "less", "plastic"], "we should use less plastic"),
      ord("t8", "Sätze richtig anordnen", ["renewable", "energy", "is", "the", "future"], "renewable energy is the future"),
      mc("t9", "Was ist KEIN „renewable energy source“?", ["solar", "wind", "coal", "hydro"], "coal"),
      mc("t10", "„Recyceln“ heißt …", ["recycle", "reuse", "refuse", "rebuild"], "recycle"),
      cz("t11", "Lücke füllen", "Cycling is better for the ___ than driving.", "environment"),
    ],
  },
  {
    id: "arbeit",
    title: "Arbeit",
    subtitle: "Beruf, Büro und Meetings",
    level: "B1",
    emoji: "💼",
    tasks: [
      mc("t1", "„Besprechung“ heißt …", ["meeting", "talking", "session call", "speech"], "meeting"),
      mc("t2", "„Kollege“ heißt …", ["colleague", "client", "boss", "friend"], "colleague"),
      mc("t3", "„Termin“ heißt …", ["appointment", "moment", "schedule book", "agenda"], "appointment"),
      cz("t4", "Lücke füllen", "I have a meeting ___ 3 pm.", "at"),
      cz("t5", "Lücke füllen", "Could you send me the report ___ Friday?", "by"),
      cz("t6", "Lücke füllen", "I am ___ charge of the new project.", "in"),
      ord("t7", "Sätze richtig anordnen", ["can", "we", "schedule", "a", "call"], "can we schedule a call"),
      ord("t8", "Sätze richtig anordnen", ["I", "will", "get", "back", "to", "you"], "I will get back to you"),
      mc("t9", "„Frist / Deadline“ heißt …", ["deadline", "endline", "timeout", "due moment"], "deadline"),
      mc("t10", "Welche E-Mail-Begrüßung ist formell?", [
        "Hey there!",
        "Yo team",
        "Dear Mr. Smith,",
        "What's up?",
      ], "Dear Mr. Smith,"),
      cz("t11", "Lücke füllen", "Please find the file ___.", "attached"),
      cz("t12", "Lücke füllen", "Looking ___ to your reply.", "forward"),
    ],
  },
  {
    id: "freizeit",
    title: "Freizeit",
    subtitle: "Hobbys, Sport und Unterhaltung",
    level: "A2",
    emoji: "🎨",
    tasks: [
      mc("t1", "„Hobby“ heißt …", ["hobby", "game", "fun", "play"], "hobby"),
      mc("t2", "„Mannschaft / Team“ heißt …", ["team", "club", "group", "crowd"], "team"),
      cz("t3", "Lücke füllen", "I ___ playing football on weekends.", "enjoy"),
      cz("t4", "Lücke füllen", "She is good ___ painting.", "at"),
      cz("t5", "Lücke füllen", "We often go ___ a walk in the park.", "for"),
      ord("t6", "Sätze richtig anordnen", ["I", "love", "watching", "movies"], "I love watching movies"),
      ord("t7", "Sätze richtig anordnen", ["do", "you", "play", "any", "instrument"], "do you play any instrument"),
      mc("t8", "Welche Antwort passt zu „What do you do in your free time?“", [
        "I read books.",
        "Yes, please.",
        "It is Monday.",
        "Tomorrow.",
      ], "I read books."),
      mc("t9", "„Konzert“ heißt …", ["concert", "show", "festival", "play"], "concert"),
      cz("t10", "Lücke füllen", "I am really ___ in photography.", "interested"),
      mc("t11", "„Fitnessstudio“ heißt …", ["gym", "studio", "club", "court"], "gym"),
    ],
  },
  {
    id: "einkaufen",
    title: "Einkaufen",
    subtitle: "Im Geschäft & Online-Shopping",
    level: "A2",
    emoji: "🛍️",
    tasks: [
      mc("t1", "„Wie viel kostet das?“", [
        "How much is it?",
        "How many it?",
        "What price you?",
        "Cost is what?",
      ], "How much is it?"),
      mc("t2", "„Größe“ heißt …", ["size", "length", "fit", "number"], "size"),
      cz("t3", "Lücke füllen", "Can I ___ this on?", "try"),
      cz("t4", "Lücke füllen", "Do you have this in a smaller ___?", "size"),
      cz("t5", "Lücke füllen", "I would like to ___ this, please.", "buy"),
      ord("t6", "Sätze richtig anordnen", ["where", "is", "the", "fitting", "room"], "where is the fitting room"),
      ord("t7", "Sätze richtig anordnen", ["do", "you", "accept", "credit", "cards"], "do you accept credit cards"),
      mc("t8", "„Reduziert / im Angebot“ heißt …", ["on sale", "in offer", "with cut", "down price"], "on sale"),
      mc("t9", "„Kassenbon / Quittung“ heißt …", ["receipt", "ticket", "note", "paper"], "receipt"),
      cz("t10", "Lücke füllen", "I would like to ___ this. It does not fit.", "return"),
      cz("t11", "Lücke füllen", "Free ___ on orders over 50 euros.", "shipping"),
    ],
  },
  {
    id: "alltag",
    title: "Alltag",
    subtitle: "Tagesablauf & smalltalk",
    level: "A1",
    emoji: "🌤️",
    tasks: [
      mc("t1", "„Wie geht es dir?“", ["How are you?", "How is you?", "What you?", "Where you?"], "How are you?"),
      mc("t2", "„Gute Nacht“ heißt …", ["Good night", "Good evening", "Good bye", "Good morning"], "Good night"),
      cz("t3", "Lücke füllen", "I usually ___ up at seven.", "get"),
      cz("t4", "Lücke füllen", "She ___ to work by bike.", "goes"),
      cz("t5", "Lücke füllen", "We have lunch ___ noon.", "at"),
      ord("t6", "Sätze richtig anordnen", ["what", "time", "is", "it"], "what time is it"),
      ord("t7", "Sätze richtig anordnen", ["I", "am", "from", "Germany"], "I am from Germany"),
      mc("t8", "Welche Antwort passt zu „Nice to meet you.“", [
        "Nice to meet you too.",
        "I am fine, thanks.",
        "See you later.",
        "It is raining.",
      ], "Nice to meet you too."),
      mc("t9", "„Wochenende“ heißt …", ["weekend", "weekday", "week off", "freeday"], "weekend"),
      cz("t10", "Lücke füllen", "I go to bed ___ 11 pm.", "at"),
      cz("t11", "Lücke füllen", "I brush my ___ every morning.", "teeth"),
    ],
  },
  {
    id: "wirtschaft",
    title: "Wirtschaft",
    subtitle: "Geld, Markt und Business-English",
    level: "B2",
    emoji: "📈",
    tasks: [
      mc("t1", "„Angebot und Nachfrage“", [
        "supply and demand",
        "offer and need",
        "give and take",
        "price and want",
      ], "supply and demand"),
      mc("t2", "„Aktie“ heißt …", ["share", "bond", "fund", "rate"], "share"),
      mc("t3", "„Umsatz“ heißt …", ["revenue", "income", "profit", "value"], "revenue"),
      cz("t4", "Lücke füllen", "Our company is expanding ___ Asia.", "into"),
      cz("t5", "Lücke füllen", "Sales increased ___ 12 percent.", "by"),
      cz("t6", "Lücke füllen", "We are looking ___ new investors.", "for"),
      ord("t7", "Sätze richtig anordnen", ["the", "market", "is", "very", "competitive"], "the market is very competitive"),
      ord("t8", "Sätze richtig anordnen", ["we", "need", "to", "cut", "costs"], "we need to cut costs"),
      mc("t9", "„Inflation“ wirkt sich besonders aus auf …", [
        "purchasing power",
        "office hours",
        "weather",
        "language",
      ], "purchasing power"),
      mc("t10", "„Gewinn“ heißt …", ["profit", "win", "bonus", "gain prize"], "profit"),
      cz("t11", "Lücke füllen", "We launched a new ___ last quarter.", "product"),
      cz("t12", "Lücke füllen", "The economy is in a ___.", "recession"),
    ],
  },
];

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

// ----- Progress persistence -----
// Per-user, per-lesson set of completed task ids.
const progressKey = (userId: string | null | undefined, lessonId: string) =>
  `hello.lesson.progress.${userId ?? "anon"}.${lessonId}`;

export interface LessonProgress {
  completedIds: string[];
  completedAt?: string; // ISO when whole lesson finished
}

export function readLessonProgress(userId: string | null | undefined, lessonId: string): LessonProgress {
  try {
    const raw = localStorage.getItem(progressKey(userId, lessonId));
    if (!raw) return { completedIds: [] };
    const p = JSON.parse(raw);
    return {
      completedIds: Array.isArray(p?.completedIds) ? p.completedIds.filter((x: unknown) => typeof x === "string") : [],
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

export function markLessonComplete(userId: string | null | undefined, lessonId: string) {
  const cur = readLessonProgress(userId, lessonId);
  const next: LessonProgress = { ...cur, completedAt: new Date().toISOString() };
  writeLessonProgress(userId, lessonId, next);
  return next;
}
