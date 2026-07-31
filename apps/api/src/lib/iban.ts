/**
 * Masque un IBAN en ne montrant que les 4 premiers et 4 derniers caractères
 * Format: ****XXXX****XXXX
 */
export function maskIban(iban: string | null | undefined): string {
  if (!iban || iban.length < 8) {
    return iban || '-';
  }
  const first = iban.substring(0, 4);
  const last = iban.substring(iban.length - 4);
  const middle = '*'.repeat(iban.length - 8);
  return `${first}${middle}${last}`;
}
