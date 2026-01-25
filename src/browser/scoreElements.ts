export function scoreButtons(buttons: any[]) {
  return buttons
    .map(b => {
      let score = 0;

      const t = b.text.toLowerCase();

      if (t.includes("book")) score += 50;
      if (t.includes("reserve")) score += 50;
      if (t.includes("appointment")) score += 40;
      if (t.includes("next")) score += 20;
      if (t.includes("continue")) score += 20;

      if (b.disabled) score -= 100;

      return { ...b, score };
    })
    .sort((a, b) => b.score - a.score);
}

