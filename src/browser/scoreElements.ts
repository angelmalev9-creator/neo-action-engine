export function scoreButtons(buttons: any[]) {
  return buttons
    .map(b => {
      let score = 0;
      const t = b.text.toLowerCase();

      // English
      if (t.includes("book")) score += 50;
      if (t.includes("reserve")) score += 50;
      if (t.includes("appointment")) score += 40;
      if (t.includes("rates")) score += 40;
      if (t.includes("availability")) score += 40;
      if (t.includes("next")) score += 20;
      if (t.includes("continue")) score += 20;
      if (t.includes("show")) score += 25;
      if (t.includes("check")) score += 25;

      // Bulgarian ✅ NEW
      if (t.includes("резерв")) score += 50;
      if (t.includes("запази")) score += 50;
      if (t.includes("запиши")) score += 40;
      if (t.includes("покажи")) score += 30;
      if (t.includes("цени")) score += 30;
      if (t.includes("наличност")) score += 40;
      if (t.includes("стаи")) score += 25;
      if (t.includes("провери")) score += 30;

      if (b.disabled) score -= 100;

      return { ...b, score };
    })
    .sort((a, b) => b.score - a.score);
}
