

## Plan: PayPal-Spenden + Pending-Flow + Feedback

### 1) Spenden-Bereich auf der Profil-Seite

Drei schicke Spenden-Karten direkt im Profil-Tab (oder als eigener Unterpunkt „Unterstützen"). Jede Karte:

- Betrag groß (5,40 € · 10,20 € · 19,20 €)
- Kurzer Untertitel („Kaffee für Ellie", „Monat Hosting", „Ein Quartal Hello!")
- Kleines Ellie-Icon
- Klick öffnet `https://paypal.me/Englischlernen/5.40` (bzw. 10.20 / 19.20) in neuem Tab
- Hover-Animation (sanft anheben, Glow)

Darunter:
- Klartext-Hinweis: „Kein Abo, keine Verpflichtung. Einmalspende per PayPal."
- Kleiner Link „Eigenen Betrag wählen" → `paypal.me/Englischlernen`

### 2) Pending-Flow (neue Nutzer)

Aktuell hat jeder neue Nutzer sofort vollen Zugriff. Neu:

- Neues Feld `access_status` in `profiles` (`pending` / `active` / `blocked`), Default `pending`
- Nach Anmeldung + Onboarding → wenn `pending` → Sperrbildschirm mit Text:
  „Danke fürs Anmelden! Hello! ist ein privates Hobby-Projekt. Sobald ich dich freischalte, geht's los. Du bekommst eine Mail."
- Mit kleiner „Unterstützen"-Sektion direkt darunter (gleiche Spenden-Karten)
- Admin-Seite bekommt Liste „Wartende Nutzer" mit Button „Freischalten"

### 3) Feedback-Box

Im Profil ein neuer Bereich „Feedback & Wünsche":
- Textarea + Senden-Button
- Speichert in neuer Tabelle `feedback` (user_id, message, created_at)
- Admin sieht alle Feedbacks in der Admin-Seite
- Bestätigung „Danke, ist angekommen!"

### Technische Notizen

- DB-Migration: `profiles.access_status` (enum), neue Tabelle `feedback` mit RLS (User darf nur eigenes Insert, Admin sieht alles)
- AccessGate erweitern: prüft `access_status`, blockt wenn `pending`
- Admin.tsx: Tab „Nutzer" + Tab „Feedback"
- Spenden-Karten als wiederverwendbare Komponente `<DonationCards />` (1× Profil, 1× Pending-Screen)
- Geänderte/neue Dateien: `src/components/DonationCards.tsx` (neu), `src/components/AccessGate.tsx`, `src/pages/Profil.tsx`, `src/pages/Admin.tsx`, neue Migration

