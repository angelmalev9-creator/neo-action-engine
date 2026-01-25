export function compareScans(before: any, after: any) {
  const beforeSlots = before.possibleSlots || [];
  const afterSlots = after.possibleSlots || [];

  const newSlots = afterSlots.filter(
    (s: any) =>
      !beforeSlots.some(
        (b: any) => b.text === s.text
      )
  );

  return {
    slotsBefore: beforeSlots.length,
    slotsAfter: afterSlots.length,
    newSlots,
    changed: newSlots.length > 0 || beforeSlots.length !== afterSlots.length
  };
}
