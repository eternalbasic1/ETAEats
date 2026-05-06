export function formatINR(paise: number, options?: { withSymbol?: boolean }): string {
  const rupees = paise / 100;
  const formatted = rupees.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return options?.withSymbol !== false ? `₹${formatted}` : formatted;
}

export function formatINRFromRupees(rupees: number, options?: { withSymbol?: boolean }): string {
  const formatted = rupees.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return options?.withSymbol !== false ? `₹${formatted}` : formatted;
}
