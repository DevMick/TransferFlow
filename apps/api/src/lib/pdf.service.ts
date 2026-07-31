import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { EstablishmentRow, TransferRow } from '../db/schema.js';
import { getImageInfoFromDataUrl } from './image-size.js';
import { amountInWords } from './number-to-words.js';

/**
 * Génération de documents PDF de virement au format bancaire officiel,
 * bilingue français/néerlandais selon la langue choisie lors de la création
 * du virement.
 */

type Language = 'fr' | 'nl';

const DARK = [30, 27, 46] as [number, number, number]; // texte principal
const PRIMARY: [number, number, number] = [79, 70, 229]; // indigo-600 — marque + en-têtes de section
const PRIMARY_LIGHT: [number, number, number] = [99, 102, 241]; // indigo-500 — sous-en-têtes
const TEAL: [number, number, number] = [15, 118, 110]; // teal-700 — montant
const REJECTED: [number, number, number] = [190, 45, 45]; // rouge — motif de rejet
const GRAY = [102, 112, 133] as [number, number, number];
const BORDER = [224, 231, 255] as [number, number, number]; // indigo-100

const LABELS = {
  fr: {
    docTitleInitiation: 'ORDRE DE VIREMENT INTERNATIONAL',
    docTitleRejection: 'AVIS DE REJET DE VIREMENT',
    reference: 'Référence de transaction',
    executionDate: "Date d'exécution",
    detailsTitle: 'DÉTAILS DE LA TRANSACTION',
    emitter: 'Établissement émetteur',
    status: 'Statut',
    statusInitiated: 'EN TRAITEMENT',
    statusRejected: 'REJETÉ',
    partiesTitle: 'INFORMATIONS DES PARTIES',
    sender: "DONNEUR D'ORDRE",
    senderName: 'Nom de compte',
    senderAccount: 'N° compte',
    beneficiary: 'BÉNÉFICIAIRE',
    beneficiaryName: 'Nom',
    iban: 'IBAN',
    email: 'E-mail',
    bic: 'Code BIC/SWIFT',
    amountTitle: 'MONTANT DU VIREMENT',
    rejectionReasonTitle: 'MOTIF DU REJET',
    rejectedAt: 'Date de rejet',
    rejectionDetailsTitle: "DÉTAILS DE L'OPÉRATION — FRAIS DE REDIRECTION",
    initialAmount: 'Montant initial',
    redirectionFee: 'Frais de redirection',
    importantNotice: 'AVIS IMPORTANT',
    importantNoticeText: 'Le présent virement a été rejeté pour le motif indiqué ci-dessous.',
    confidentiality:
      'Ce document est confidentiel et destiné exclusivement au bénéficiaire mentionné.\nToute reproduction ou utilisation non autorisée est strictement interdite.',
  },
  nl: {
    docTitleInitiation: 'INTERNATIONALE OVERSCHRIJVINGSOPDRACHT',
    docTitleRejection: 'KENNISGEVING VAN WEIGERING',
    reference: 'Transactiereferentie',
    executionDate: 'Uitvoeringsdatum',
    detailsTitle: 'TRANSACTIEDETAILS',
    emitter: 'Uitgevende instelling',
    status: 'Status',
    statusInitiated: 'IN BEHANDELING',
    statusRejected: 'GEWEIGERD',
    partiesTitle: 'PARTIJINFORMATIE',
    sender: 'OPDRACHTGEVER',
    senderName: 'Rekeninghouder',
    senderAccount: 'N° compte',
    beneficiary: 'BEGUNSTIGDE',
    beneficiaryName: 'Rekeninghouder',
    iban: 'IBAN',
    email: 'E-mail',
    bic: 'BIC/SWIFT-code',
    amountTitle: 'BEDRAG VAN DE OVERSCHRIJVING',
    rejectionReasonTitle: 'REDEN VAN WEIGERING',
    rejectedAt: 'Weigeringsdatum',
    rejectionDetailsTitle: 'TRANSACTIEDETAILS — OMLEIDINGSKOSTEN',
    initialAmount: 'Oorspronkelijk bedrag',
    redirectionFee: 'Omleidingskosten',
    importantNotice: 'BELANGRIJKE KENNISGEVING',
    importantNoticeText: 'Deze overschrijving is geweigerd om de onderstaande reden.',
    confidentiality:
      'Dit document is vertrouwelijk en uitsluitend bestemd voor de vermelde begunstigde.\nElke reproductie of ongeoorloofd gebruik is ten strengste verboden.',
  },
} as const;

function resolveLanguage(transfer: TransferRow): Language {
  return transfer.language === 'nl' ? 'nl' : 'fr';
}

/**
 * Formate un montant avec un espace ASCII classique comme séparateur de
 * milliers. `toLocaleString` insère une espace fine insécable (U+202F) pour
 * les locales fr/nl-BE, un caractère absent des polices standards de jsPDF
 * (WinAnsiEncoding) qui s'affiche comme un glyphe manquant.
 */
function formatAmount(amount: number): string {
  const [integerPart, decimalPart] = amount.toFixed(2).split('.');
  const withThousands = (integerPart ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${withThousands},${decimalPart}`;
}

function formatDateTime(date: Date, language: Language): string {
  return date.toLocaleString(language === 'nl' ? 'nl-BE' : 'fr-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Brussels',
  });
}

function establishmentAddress(establishment: EstablishmentRow | null): string {
  if (!establishment) return '';
  const parts = [
    establishment.adresseRue,
    [establishment.codePostal, establishment.ville].filter(Boolean).join(' '),
    establishment.pays,
  ].filter(Boolean);
  return parts.join(' — ');
}

function drawHeader(
  doc: jsPDF,
  transfer: TransferRow,
  establishment: EstablishmentRow | null,
  language: Language,
  docTitle: string,
  margin: number,
  pageWidth: number,
) {
  const t = LABELS[language];
  const emitterName = establishment?.nomEtablissement || transfer.senderBank || 'TransferFlow';

  // Logo de l'établissement émetteur (repli sur la marque TransferFlow si absent)
  const logoInfo = establishment?.logoPath ? getImageInfoFromDataUrl(establishment.logoPath) : null;
  if (logoInfo && establishment?.logoPath) {
    const maxWidth = 32;
    const maxHeight = 18;
    const ratio = Math.min(maxWidth / logoInfo.width, maxHeight / logoInfo.height, 1);
    const width = logoInfo.width * ratio;
    const height = logoInfo.height * ratio;
    doc.addImage(establishment.logoPath, logoInfo.format, margin, 12, width, height);
  } else {
    doc.setFillColor(...PRIMARY);
    doc.roundedRect(margin, 14, 16, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TF', margin + 8, 23.5, { align: 'center' });
  }

  // Bloc texte à droite : établissement émetteur / adresse / titre du document
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(emitterName.toUpperCase(), pageWidth - margin, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  const address = establishmentAddress(establishment);
  if (address) {
    doc.text(address, pageWidth - margin, 23, { align: 'right' });
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text(docTitle, pageWidth - margin, address ? 29 : 25, { align: 'right' });

  // Ligne de séparation
  const lineY = 36;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(margin, lineY, pageWidth - margin, lineY);

  // Référence + date d'exécution
  doc.setFontSize(8.5);
  const refLabel = `${t.reference} : `;
  const execLabel = `${t.executionDate} : `;
  const ref = transfer.transactionReference || transfer.id.slice(0, 8).toUpperCase();
  const execDate = transfer.executionDate
    ? new Date(transfer.executionDate)
    : new Date(transfer.createdAt);
  const execValue = formatDateTime(execDate, language);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GRAY);
  doc.text(refLabel, margin, lineY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  doc.text(ref, margin + doc.getTextWidth(refLabel), lineY + 6);

  const execLabelWidth = doc.getTextWidth(execLabel);
  const execValueWidth = doc.getTextWidth(execValue);
  const execBlockStartX = pageWidth - margin - execLabelWidth - execValueWidth;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GRAY);
  doc.text(execLabel, execBlockStartX, lineY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  doc.text(execValue, execBlockStartX + execLabelWidth, lineY + 6);

  return lineY + 12;
}

function drawFooter(
  doc: jsPDF,
  establishment: EstablishmentRow | null,
  transfer: TransferRow,
  language: Language,
  margin: number,
  pageWidth: number,
  pageHeight: number,
) {
  const t = LABELS[language];
  const emitterName = establishment?.nomEtablissement || transfer.senderBank || 'TransferFlow';
  const address = establishmentAddress(establishment);

  const footerLineY = pageHeight - 24;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.2);
  doc.line(margin, footerLineY, pageWidth - margin, footerLineY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  const confidentialityLines = t.confidentiality.split('\n');
  confidentialityLines.forEach((line, i) => {
    doc.text(line, pageWidth / 2, footerLineY + 5 + i * 3.5, { align: 'center' });
  });

  if (address) {
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(
      `${emitterName} — ${address}`,
      pageWidth / 2,
      footerLineY + 5 + confidentialityLines.length * 3.5 + 3,
      { align: 'center' },
    );
  }
}

function buildDocument(
  transfer: TransferRow,
  establishment: EstablishmentRow | null,
  variant: 'initiation' | 'rejection',
  rejectionFee?: number,
  rejectionFeeCurrency?: string,
): jsPDF {
  const language = resolveLanguage(transfer);
  const t = LABELS[language];
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const docTitle = variant === 'initiation' ? t.docTitleInitiation : t.docTitleRejection;
  let y = drawHeader(doc, transfer, establishment, language, docTitle, margin, pageWidth);
  y += 4;

  const emitterName = establishment?.nomEtablissement || transfer.senderBank || 'TransferFlow';
  const execDate = transfer.executionDate
    ? new Date(transfer.executionDate)
    : new Date(transfer.createdAt);

  // --- Détails de la transaction ---
  const detailsRows: Array<[string, string]> = [
    [t.emitter, emitterName],
    [t.reference, transfer.transactionReference || transfer.id.slice(0, 8).toUpperCase()],
    [t.executionDate, formatDateTime(execDate, language)],
    [t.status, variant === 'initiation' ? t.statusInitiated : t.statusRejected],
  ];
  if (variant === 'rejection' && transfer.rejectedAt) {
    detailsRows.push([t.rejectedAt, formatDateTime(new Date(transfer.rejectedAt), language)]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.2, lineColor: BORDER, lineWidth: 0.2 },
    head: [
      [
        {
          content: t.detailsTitle,
          colSpan: 2,
          styles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        },
      ],
    ],
    body: detailsRows.map(([label, value]) => [
      { content: label, styles: { fontStyle: 'bold' } },
      value,
    ]),
    columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 'auto' } },
  });

  // --- Informations des parties ---
  // @ts-ignore jspdf-autotable augments the jsPDF instance at runtime
  y = (doc as Record<string, unknown>).lastAutoTable.finalY + 6;

  // @ts-ignore jspdf-autotable types are complex
  const partyBody: Array<Array<string | Record<string, unknown>>> = [];
  if (transfer.senderBank || transfer.senderAccountName || transfer.senderAccountNumber) {
    partyBody.push([
      {
        content: t.sender,
        colSpan: 2,
        styles: { fillColor: PRIMARY_LIGHT, textColor: 255, fontStyle: 'bold' },
      },
    ]);
    if (transfer.senderAccountName)
      partyBody.push([
        { content: t.senderName, styles: { fontStyle: 'bold' } },
        transfer.senderAccountName,
      ]);
    if (transfer.senderAccountNumber)
      partyBody.push([
        { content: t.senderAccount, styles: { fontStyle: 'bold' } },
        transfer.senderAccountNumber,
      ]);
  }
  partyBody.push([
    {
      content: t.beneficiary,
      colSpan: 2,
      styles: { fillColor: PRIMARY_LIGHT, textColor: 255, fontStyle: 'bold' },
    },
  ]);
  if (transfer.beneficiaryName)
    partyBody.push([
      { content: t.beneficiaryName, styles: { fontStyle: 'bold' } },
      transfer.beneficiaryName,
    ]);
  if (transfer.iban)
    partyBody.push([{ content: t.iban, styles: { fontStyle: 'bold' } }, transfer.iban]);
  if (transfer.beneficiaryEmail)
    partyBody.push([
      { content: t.email, styles: { fontStyle: 'bold' } },
      transfer.beneficiaryEmail,
    ]);
  if (transfer.bicSwift)
    partyBody.push([{ content: t.bic, styles: { fontStyle: 'bold' } }, transfer.bicSwift]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.2, lineColor: BORDER, lineWidth: 0.2 },
    head: [
      [
        {
          content: t.partiesTitle,
          colSpan: 2,
          styles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        },
      ],
    ],
    body: partyBody,
    columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 'auto' } },
  });

  // biome-ignore lint: jspdf-autotable augments the jsPDF instance at runtime
  y = (doc as any).lastAutoTable.finalY + 6;

  // --- Montant ---
  const amount = Number(transfer.amount || 0);
  const currency = transfer.currency || 'EUR';

  if (variant !== 'rejection') {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2.2, lineColor: BORDER, lineWidth: 0.2 },
      head: [
        [
          {
            content: t.amountTitle,
            colSpan: 2,
            styles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 9 },
          },
        ],
      ],
      body: [
        [
          {
            content: `${formatAmount(amount)} ${currency}`,
            colSpan: 2,
            styles: {
              halign: 'center',
              fontSize: 20,
              fontStyle: 'bold',
              textColor: TEAL,
              cellPadding: 4,
            },
          },
        ],
        [
          {
            content: amountInWords(amount, currency, language),
            colSpan: 2,
            styles: { halign: 'center', fontSize: 8.5, textColor: GRAY, fontStyle: 'italic' },
          },
        ],
      ],
    });

    // biome-ignore lint: jspdf-autotable augments the jsPDF instance at runtime
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  if (variant === 'rejection') {
    // Avis important
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2.2, lineColor: BORDER, lineWidth: 0.2 },
      head: [
        [
          {
            content: t.importantNotice,
            colSpan: 2,
            styles: { fillColor: REJECTED, textColor: 255, fontStyle: 'bold', fontSize: 9 },
          },
        ],
      ],
      body: [[{ content: t.importantNoticeText, colSpan: 2 }]],
      columnStyles: { 0: { cellWidth: 'auto' } },
    });

    // biome-ignore lint: jspdf-autotable augments the jsPDF instance at runtime
    y = (doc as any).lastAutoTable.finalY + 6;

    // Détails de l'opération avec frais de redirection
    if (rejectionFee !== undefined) {
      const feeCurrency = rejectionFeeCurrency || currency;
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2.2, lineColor: BORDER, lineWidth: 0.2 },
        head: [
          [
            {
              content: t.rejectionDetailsTitle,
              colSpan: 2,
              styles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold', fontSize: 9 },
            },
          ],
        ],
        body: [
          [
            { content: t.initialAmount, styles: { fontStyle: 'bold' } },
            `${formatAmount(amount)} ${currency}`,
          ],
          [
            { content: t.redirectionFee, styles: { fontStyle: 'bold' } },
            `${formatAmount(rejectionFee)} ${feeCurrency}`,
          ],
        ],
        columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 'auto' } },
      });

      // biome-ignore lint: jspdf-autotable augments the jsPDF instance at runtime
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // Motif du rejet
    if (transfer.rejectionReason) {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2.2, lineColor: BORDER, lineWidth: 0.2 },
        head: [
          [
            {
              content: t.rejectionReasonTitle,
              colSpan: 2,
              styles: { fillColor: REJECTED, textColor: 255, fontStyle: 'bold', fontSize: 9 },
            },
          ],
        ],
        body: [[{ content: transfer.rejectionReason, colSpan: 2 }]],
        columnStyles: { 0: { cellWidth: 'auto' } },
      });
    }
  }

  drawFooter(doc, establishment, transfer, language, margin, pageWidth, pageHeight);

  return doc;
}

export function generateInitiationPdf(
  transfer: TransferRow,
  establishment: EstablishmentRow | null = null,
): Buffer {
  const doc = buildDocument(transfer, establishment, 'initiation');
  return Buffer.from(new Uint8Array(doc.output('arraybuffer')));
}

export function generateRejectionPdf(
  transfer: TransferRow,
  establishment: EstablishmentRow | null = null,
  rejectionFee?: number,
  rejectionFeeCurrency?: string,
): Buffer {
  const doc = buildDocument(
    transfer,
    establishment,
    'rejection',
    rejectionFee,
    rejectionFeeCurrency,
  );
  return Buffer.from(new Uint8Array(doc.output('arraybuffer')));
}
