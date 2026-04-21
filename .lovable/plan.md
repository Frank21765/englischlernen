

## Plan: Spenden-Bereich verbessern (final)

### 1) Beträge & Beschriftungen korrigieren

| Betrag | Titel | Untertitel |
|---|---|---|
| 5,40 € | 3 Monate Hello! | Ein Quartal lernen |
| 10,20 € | 6 Monate Hello! | Ein halbes Jahr dabei |
| 19,20 € | 1 Jahr Hello! | Das ganze Jahr 💛 |

### 2) Vierte Karte „Freier Betrag"

- Ellie-Icon mit kleinem **roten Herz oben rechts in der Ecke** (absolut positioniert, leicht überlappend)
- Titel: „Freier Betrag"
- Untertitel: „Du entscheidest"
- Klick → `https://paypal.me/Englischlernen` (ohne Betrag)

Layout: 4 Karten, Desktop nebeneinander, Mobile 2×2.

Hinweis: Das kleine rote Herz in der Ecke kommt **nur auf die „Freier Betrag"-Karte**, damit sie sich liebevoll von den drei Festbeträgen abhebt.

### 3) Erklärtext „Warum Spenden?"

Direkt unter der Überschrift „Hello! unterstützen", über den Karten, in einer weichen Box (`bg-muted/30`, abgerundet):

> „Hello! ist mein privates Hobby-Projekt — kein Startup, keine Werbung, keine Datenverkäufe. Mit Spenden geht es **nicht um Gewinn**, sondern darum, die laufenden Kosten zu decken (Server, KI-Modelle, Domain). Jeder Euro hilft, dass Hello! online bleibt und weiterwächst. Danke! 💛"

### 4) Hinweis vor PayPal-Weiterleitung

Unter den Karten, dezent:

> „Einmalspende per PayPal · Kein Abo · Du wirst auf paypal.me weitergeleitet, wo du den Betrag bestätigen oder anpassen kannst."

### Geänderte Dateien

- `src/components/DonationCards.tsx` — neue Beträge/Titel, 4. Karte mit Herz-Badge, neuer Hinweistext
- `src/pages/Profil.tsx` — Erklärbox oberhalb der Karten
- `src/components/AccessGate.tsx` — gleiche Erklärbox auch im Pending-Screen

