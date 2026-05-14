// Single source of truth for which CEFR levels are visible in the product UI.
// C1/C2 are intentionally hidden until curated content exists.

export const PRODUCT_LEVELS = ["A1", "A2", "B1", "B2"] as const;

export type ProductLevel = typeof PRODUCT_LEVELS[number];

export function isAllowedLevel(level: string): level is ProductLevel {
  return (PRODUCT_LEVELS as readonly string[]).includes(level);
}

export function clampToAllowed(level: string): ProductLevel {
  return isAllowedLevel(level) ? level : "B2";
}
