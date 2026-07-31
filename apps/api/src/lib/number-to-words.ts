/**
 * Convertit un montant numérique en toutes lettres, en français ou en néerlandais,
 * pour l'affichage sur les documents bancaires (ex: "CINQ MILLE Euro (EUR)").
 */

const UNITS_FR = [
  '',
  'un',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
  'dix',
  'onze',
  'douze',
  'treize',
  'quatorze',
  'quinze',
  'seize',
  'dix-sept',
  'dix-huit',
  'dix-neuf',
];

const TENS_FR = [
  '',
  '',
  'vingt',
  'trente',
  'quarante',
  'cinquante',
  'soixante',
  'soixante',
  'quatre-vingt',
  'quatre-vingt',
];

function twoDigitsFr(n: number): string {
  if (n < 20) return UNITS_FR[n] ?? '';
  const ten = Math.floor(n / 10);
  const unit = n % 10;
  if (ten === 7 || ten === 9) {
    const base = TENS_FR[ten] ?? '';
    const remainder = unit + 10;
    const joiner = remainder === 11 && ten === 7 ? '-et-' : '-';
    return `${base}${joiner}${UNITS_FR[remainder] ?? ''}`;
  }
  if (unit === 0) return ten === 8 ? `${TENS_FR[ten]}s` : (TENS_FR[ten] ?? '');
  const joiner =
    unit === 1 && (ten === 2 || ten === 3 || ten === 4 || ten === 5 || ten === 6) ? '-et-' : '-';
  return `${TENS_FR[ten] ?? ''}${joiner}${UNITS_FR[unit] ?? ''}`;
}

function threeDigitsFr(n: number): string {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  let result = '';
  if (hundred > 0) {
    result += hundred === 1 ? 'cent' : `${UNITS_FR[hundred] ?? ''}-cent`;
    if (rest === 0 && hundred > 1) result += 's';
    if (rest > 0) result += ' ';
  }
  if (rest > 0) {
    result += twoDigitsFr(rest);
  }
  return result;
}

export function numberToWordsFr(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return 'zéro';

  const groups = [
    { value: 1_000_000_000, singular: 'milliard', plural: 'milliards' },
    { value: 1_000_000, singular: 'million', plural: 'millions' },
    { value: 1_000, singular: 'mille', plural: 'mille' },
  ];

  let remainder = n;
  const parts: string[] = [];

  for (const group of groups) {
    const count = Math.floor(remainder / group.value);
    if (count > 0) {
      if (group.value === 1000 && count === 1) {
        parts.push('mille');
      } else {
        const word = threeDigitsFr(count);
        const label = count > 1 ? group.plural : group.singular;
        parts.push(`${word} ${label}`);
      }
      remainder %= group.value;
    }
  }

  if (remainder > 0) {
    parts.push(threeDigitsFr(remainder));
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

const UNITS_NL = [
  '',
  'een',
  'twee',
  'drie',
  'vier',
  'vijf',
  'zes',
  'zeven',
  'acht',
  'negen',
  'tien',
  'elf',
  'twaalf',
  'dertien',
  'veertien',
  'vijftien',
  'zestien',
  'zeventien',
  'achttien',
  'negentien',
];

const TENS_NL = [
  '',
  '',
  'twintig',
  'dertig',
  'veertig',
  'vijftig',
  'zestig',
  'zeventig',
  'tachtig',
  'negentig',
];

function twoDigitsNl(n: number): string {
  if (n < 20) return UNITS_NL[n] ?? '';
  const ten = Math.floor(n / 10);
  const unit = n % 10;
  if (unit === 0) return TENS_NL[ten] ?? '';
  return `${UNITS_NL[unit] ?? ''}en${TENS_NL[ten] ?? ''}`;
}

function threeDigitsNl(n: number): string {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  let result = '';
  if (hundred > 0) {
    result += hundred === 1 ? 'honderd' : `${UNITS_NL[hundred] ?? ''}honderd`;
  }
  if (rest > 0) {
    result += twoDigitsNl(rest);
  }
  return result;
}

export function numberToWordsNl(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return 'nul';

  const groups = [
    { value: 1_000_000_000, singular: 'miljard', plural: 'miljard' },
    { value: 1_000_000, singular: 'miljoen', plural: 'miljoen' },
    { value: 1_000, singular: 'duizend', plural: 'duizend' },
  ];

  let remainder = n;
  const parts: string[] = [];

  for (const group of groups) {
    const count = Math.floor(remainder / group.value);
    if (count > 0) {
      if (group.value === 1000 && count === 1) {
        parts.push('duizend');
      } else {
        const word = threeDigitsNl(count);
        parts.push(`${word} ${group.plural}`);
      }
      remainder %= group.value;
    }
  }

  if (remainder > 0) {
    parts.push(threeDigitsNl(remainder));
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function amountInWords(value: number, currency: string, language: 'fr' | 'nl'): string {
  const words = language === 'nl' ? numberToWordsNl(value) : numberToWordsFr(value);
  return `${words.toUpperCase()} ${currency}`;
}
