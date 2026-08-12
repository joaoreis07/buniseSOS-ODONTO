export type InstallmentPreview = { sequence: number; amount: number; dueDate: Date };

export function previewInstallments(total: number, count: number, entry: number, firstDueDate: string): InstallmentPreview[] {
  const remainingCents = Math.round((total - entry) * 100);
  const base = Math.floor(remainingCents / count);
  const remainder = remainingCents % count;
  return Array.from({ length: count }, (_, index) => {
    const dueDate = new Date(`${firstDueDate}T12:00:00`);
    dueDate.setMonth(dueDate.getMonth() + index);
    return { sequence: index + 1, amount: (base + (index === count - 1 ? remainder : 0)) / 100, dueDate };
  });
}
