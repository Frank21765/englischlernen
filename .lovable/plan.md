

## Plan

Zwei Themen.

---

### 1) Statistik aufräumen + erweitern

**Problem:** Die meisten Sessions stehen in der DB mit `total_answers=0, correct_answers=0`. Ursache: `Quiz.tsx` legt die Session beim **Start** an (mit 0/0) und der spätere `update`-Call greift nur, wenn die Session sauber „abgeschlossen" wird (Quiz komplett durchgespielt). Bei Abbruch / Tab-Wechsel / Neustart bleibt die 0/0-Leiche stehen. Wortpuzzle, Grammatik, Lückentext schreiben aktuell **gar keine** Sessions — taucht in der Statistik also nie auf.

**Fix:**

**a) Quiz nicht mehr bei Start einfügen, sondern erst am Ende:**
- `Quiz.tsx`: Insert-beim-Start-Block entfernen, stattdessen am Ende **eine** Session mit den finalen Werten inserten (oder gar nicht, falls 0 beantwortet).
- Beim Insert/Update niemals 0/0-Sessions speichern.

**b) Sessions auch für die anderen Übungen schreiben:**
- `Wortpuzzle.tsx`, `Grammar.tsx`, `Lueckentext.tsx`: nach jeder beendeten Runde eine Session inserten (mode: `wortpuzzle` / `grammar` / `cloze`) mit `total_answers` und `correct_answers` der Runde.
- `Lektion.tsx` schreibt bereits — bleibt.

**c) 0/0-Altlasten in der UI ausblenden:**
- `Statistik.tsx`: Sessions mit `total_answers=0` aus „Letzte Sessions" und Aggregaten herausfiltern (DB selbst nicht anfassen — fault-tolerant).

**d) Statistik um sinnvolle Infos erweitern:**
- **Neue Stat-Kacheln oben:** „Ø Antworten/Tag (14 T.)", „Bester Tag (Anzahl)", „Aktuelles Niveau" (aus Profil).
- **Neuer Chart:** zweite Linie/Balken „Antworten pro Tag" parallel zur Trefferquote (Balken = Volumen, Linie = %).
- **Verteilung nach Übungsart:** kleine Mini-Karte „Quiz 45% · Wortpuzzle 20% · Grammatik 15% · …" (basierend auf Sessions).
- **Pro Niveau Trefferquote:** Liste „A1 92%, A2 78%, B1 65%" (Aggregat aus Sessions).
- „Letzte Sessions": Mode-Label hübsch (Quiz/Wortpuzzle/Grammatik/Lückentext/Lektion), Icon je Mode in Kategorien-Farbe (gleich wie Erfolge).

---

### 2) „Gefahrenzone" → sicherer und granularer Bereich

**Umbenennung:** „Gefahrenzone" raus. Vorschläge zur Auswahl:
- **„Konto & Daten verwalten"** (neutral, klar)
- **„Daten löschen"** (direkt)
- **„Privatsphäre & Datenkontrolle"** (DSGVO-Touch)

**Empfehlung:** „Konto & Daten verwalten" als Section-Titel, darin Unterabschnitt „Daten löschen".

**Granulare Löschoptionen (statt einem „Alles löschen"-Knopf):**

Drei separate Aktionen in eigenen Zeilen, jede mit Icon + Beschreibung + eigenem Button:

1. **Lernstatistiken zurücksetzen** — löscht `learning_sessions` (Sessions, Trefferquote, Streak-Historie). Vokabeln & Konto bleiben.
2. **Vokabeln löschen** — löscht `vocabulary` (gesamte Sammlung inkl. Lernfortschritt). Statistiken & Konto bleiben.
3. **Konto vollständig löschen** — löscht alles: Vokabeln, Sessions, Chats, Badges, Profil, Auth-User. Logout danach.

**Sicherheit gegen versehentliches Löschen:**

Statt `window.confirm` ein **AlertDialog** (`@/components/ui/alert-dialog`, ist im Projekt) mit:
- Klarem roten Titel („Konto endgültig löschen?")
- Auflistung was gelöscht wird
- **Bestätigungs-Eingabefeld**: User muss exakt das Wort `LÖSCHEN` (oder bei Konto: die eigene E-Mail) tippen, sonst bleibt der Bestätigen-Button **disabled**.
- Zweistufig nur fürs Konto (Statistiken/Vokabeln einstufig mit Dialog, weil weniger fatal).

**Konto-Löschung technisch korrekt:**

Aktuell löscht der „Alle Daten löschen"-Button nur App-Daten und macht Logout — **der Auth-User bleibt** in der DB liegen. Das ist genau das, was du nicht willst.

Lösung: **Edge Function `delete-account`** mit Service-Role-Key:
- Authentifiziert den aufrufenden User per JWT.
- Löscht: `vocabulary`, `learning_sessions`, `chat_messages`, `chat_sessions`, `user_badges`, `user_roles`, `profiles` (alle nach `user_id = auth.uid()`).
- Ruft `supabase.auth.admin.deleteUser(uid)` auf → User ist wirklich weg.
- Frontend ruft die Function via `supabase.functions.invoke('delete-account')` auf, danach `signOut()` + Redirect zu `/auth`.

**Trennung Statistiken / Vokabeln:**
- Direkt aus `Einstellungen.tsx` per `supabase.from(...).delete().eq('user_id', user.id)` — RLS deckt das ab.

---

### Was nicht angefasst wird

- Andere Profil-Tabs, Erfolge, Layout
- Auth-Flow, Onboarding
- DB-Schema (keine Migration)

### Technische Notizen

- **Edge Function** `supabase/functions/delete-account/index.ts` — neu, nutzt `SUPABASE_SERVICE_ROLE_KEY` (bereits vorhanden), `verify_jwt = true` (Default).
- Keine DB-Migration nötig.
- Geänderte Dateien: `src/pages/Statistik.tsx`, `src/pages/Einstellungen.tsx`, `src/pages/Quiz.tsx`, `src/pages/Wortpuzzle.tsx`, `src/pages/Grammar.tsx`, `src/pages/Lueckentext.tsx`, neue Edge Function.
- Optional: einmalige still ausgeführte Bereinigung der 0/0-Sessions in der DB, oder einfach in der UI ignorieren (mache Variante 2 — risikofrei).

