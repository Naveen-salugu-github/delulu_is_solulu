export function incomeFromSlider(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  const minAnnual = 50_000 * 12;
  const maxAnnual = 10 * 10_000_000;
  const logMin = Math.log(minAnnual);
  const logMax = Math.log(maxAnnual);
  return Math.exp(logMin + clamped * (logMax - logMin));
}

export function formatIncomeAnnualINR(annual: number): string {
  const crore = 10_000_000;
  const month = annual / 12;
  if (annual >= crore) {
    return `about ₹${(annual / crore).toFixed(1)} Cr/year`;
  }
  if (month >= 100_000) {
    return `about ₹${(annual / 100_000).toFixed(1)} L/year`;
  }
  return `about ₹${Math.round(month).toLocaleString('en-IN')}/month`;
}
