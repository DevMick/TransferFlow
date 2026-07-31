const STATUS_LABELS: Record<string, string> = {
  initiated: 'Initié',
  rejected: 'Rejeté',
};

export function translateStatus(status: string | undefined | null): string {
  if (!status) return '-';
  return STATUS_LABELS[status] ?? status;
}
