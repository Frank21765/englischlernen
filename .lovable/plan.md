

## Plan: Spenden-Boxen aufräumen + „Freier Betrag" hübscher

### 1) Spenden + Feedback nur an einer Stelle

Aktuell stehen `<DonationCards />` und `<FeedbackBox />` direkt in `src/pages/Profil.tsx` — das ist das **gemeinsame Layout** für alle Unterseiten (`/profil/erfolge`, `/profil/statistik`, `/profil/einstellungen`). Deshalb tauchen sie überall auf.

**Lösung**: Ein neuer eigener Tab **„Unterstützen"** in der Profil-Navigation:

- Neue Route: `/profil/unterstuetzen`
- Neue Seite: `src/pages/Unterstuetzen.tsx` mit Erklärbox + `<DonationCards />` + `<FeedbackBox />`
- Neuer Tab in der Sub-Nav (mit Herz-Icon ❤️) zwischen „Statistik" und „Einstellungen"
- Aus `Profil.tsx` werden die beiden Komponenten **entfernt**, sodass sie nur noch auf der neuen Seite erscheinen

### 2) „Freier Betrag"-Karte mit großer Ellie

Komplett-Redesign der 4. Karte:

```text
┌──────────────────────────┐
│   ❤ (Herz-Badge oben)    │
│                          │
│        ┌──────┐          │
│        │      │          │
│        │ Ellie│  ← groß  │
│        │ (64) │          │
│        └──────┘          │
│                          │
│      Freier Betrag       │
│      Du entscheidest     │
└──────────────────────────┘
```

- Ellie zentriert, **groß** (`size={64}`), kein Hintergrundkreis (sie steht für sich)
- Kleines rotes Herz-Badge oben rechts (bleibt wie jetzt)
- Kein „★"-Symbol mehr — Ellie ersetzt es
- Sanfter Verlaufs-Hintergrund, leicht hervorgehoben gegenüber den 3 Festbetrag-Karten
- Feste Höhe damit alle 4 Karten gleich hoch sind

Die 3 Festbetrag-Karten bleiben unverändert (kleines Ellie-Icon oben links + Betrag groß).

### Geänderte / neue Dateien

- **Neu**: `src/pages/Unterstuetzen.tsx` — eigene Seite mit Spenden + Feedback + Erklärbox
- `src/pages/Profil.tsx` — `DonationCards` und `FeedbackBox` entfernen, neuen Tab „Unterstützen" hinzufügen, Erklärbox entfernen
- `src/App.tsx` — neue Route `/profil/unterstuetzen` registrieren
- `src/components/DonationCards.tsx` — „Freier Betrag"-Karte mit großer Ellie statt Icon+Stern

