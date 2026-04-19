// Lightweight SM-2 inspired spaced repetition.
// Deliberately simple: easy to reason about, robust to bad data.
//
// Inputs we keep on each vocabulary row:
//   - correct_count, wrong_count   (existing)
//   - last_seen_at                  (existing)
//   - interval_days                 (new) — current spacing in days
//   - ease_factor                   (new) — multiplier for interval growth (1.3 .. 2.8)
//   - next_review_at                (new) — when this card is due again
//   - status: "new" | "learning" | "mastered"
//
// Rules:
//   - Wrong answer  → interval shrinks to 1 day, ease decreases.
//   - Correct, never-seen → 1 day.
//   - Correct, 1 day → 3 days.
//   - Correct, otherwise → round(interval * ease).
//   - Capped at 180 days (≈ 6 months) so mastered items still reappear.
//   - Status moves to "mastered" once interval >= 21 days AND > 2 successful reps.

export interface SrsState {
  correct_count: number;
  wrong_count: number;
  interval_days: number;
  ease_factor: number;
  status: "new" | "learning" | "mastered";
}

export interface SrsUpdate {
  correct_count: number;
  wrong_count: number;
  interval_days: number;
  ease_factor: number;
  status: "new" | "learning" | "mastered";
  last_seen_at: string;
  next_review_at: string;
}

const MIN_EASE = 1.3;
const MAX_EASE = 2.8;
const MAX_INTERVAL = 180;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function computeNextReview(prev: Partial<SrsState>, isCorrect: boolean): SrsUpdate {
  const correct_count = (prev.correct_count ?? 0) + (isCorrect ? 1 : 0);
  const wrong_count = (prev.wrong_count ?? 0) + (isCorrect ? 0 : 1);
  const prevInterval = prev.interval_days ?? 0;
  const prevEase = prev.ease_factor ?? 2.5;

  let ease = prevEase;
  let interval: number;

  if (!isCorrect) {
    ease = clamp(prevEase - 0.2, MIN_EASE, MAX_EASE);
    interval = 1;
  } else if (prevInterval <= 0) {
    interval = 1;
  } else if (prevInterval === 1) {
    interval = 3;
    ease = clamp(prevEase + 0.05, MIN_EASE, MAX_EASE);
  } else {
    ease = clamp(prevEase + 0.05, MIN_EASE, MAX_EASE);
    interval = Math.round(prevInterval * ease);
  }
  interval = clamp(interval, 1, MAX_INTERVAL);

  let status: "new" | "learning" | "mastered" = "learning";
  if (interval >= 21 && correct_count >= 3 && correct_count > wrong_count) {
    status = "mastered";
  }

  const now = new Date();
  const next = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return {
    correct_count,
    wrong_count,
    interval_days: interval,
    ease_factor: ease,
    status,
    last_seen_at: now.toISOString(),
    next_review_at: next.toISOString(),
  };
}
