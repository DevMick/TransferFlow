import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'support@transfertsecur.com',
    pass: 'Amour##v22@',
  },
});

interface EmailTransferNotificationParams {
  recipientEmail: string | null;
  recipientName: string | null;
  senderName: string | null;
  amount: string;
  currency: string;
  language: string;
  reference: string;
  initiationDate: string | Date;
  establishmentName: string;
  establishmentLogo?: string;
  iban: string | null;
  pdfBuffer?: Buffer;
  pdfFilename?: string;
  rejectionReason?: string;
  rejectionFee?: string;
  rejectionFeeCurrency?: string;
}

const emailTemplates = {
  fr: {
    subject: 'Ordre de virement initié',
    greeting: 'Cher/Chère',
    intro:
      "Nous vous informons qu'un virement bancaire international a été initié en votre faveur et est actuellement en cours de traitement selon nos protocoles de sécurité.",
    amount: 'MONTANT DU VIREMENT',
    details: "Détails de l'opération",
    beneficiary: 'Bénéficiaire (IBAN)',
    date: "Date d'initiation",
    status: 'Statut',
    processing: 'EN TRAITEMENT',
    important: 'Information importante',
    message:
      'Ce virement sera traité dans les plus brefs délais. Vous recevrez une notification dès que les fonds seront disponibles sur votre compte.',
    time: 'Temps de traitement estimé: 1-3 jours ouvrables',
    verificationNotice: "En attente de vérification d'identité",
    verificationText:
      'Votre transaction est actuellement en cours de vérification de sécurité. Nos équipes valident tous les détails pour garantir la conformité de votre opération.',
    footer: 'Ce message est automatique. Merci de ne pas y répondre.\nTous droits réservés © 2026',
    reference: 'Référence de la transaction',
    emitter: 'Établissement émetteur',
    sender: "Donneur d'ordre",
    attachment:
      'Vous trouverez ci-joint le document officiel PDF de ce virement, à conserver pour vos dossiers.',
    signature: "L'équipe",
    // Rejet
    subjectReject: 'Virement rejeté',
    introReject:
      "Nous avons le regret de vous informer que le virement que vous deviez recevoir n'a pas pu être traité en raison d'un blocage sur le compte de l'émetteur.",
    rejectedAmount: 'MONTANT REJETÉ',
    redirectionFee: 'Frais de redirection applicables',
    rejectionDetails: 'Détails du rejet',
    rejectionReasonLabel: 'Motif du rejet',
    rejectionDate: 'Date de rejet',
    rejectionStatus: 'Statut',
    blockedStatus: 'BLOQUÉ / ÉCHOUÉ',
    whatToDo: 'Que faire maintenant ?',
    whatToDoText:
      "Veuillez contacter le donneur d'ordre afin qu'il paye les frais de rejet pour relancer la transaction.",
  },
  nl: {
    subject: 'Overboekingsopdracht geïnitieerd',
    greeting: 'Geachte',
    intro:
      'Wij informeren u dat een internationaal geldtransfer in uw voordeel is geïnitieerd en momenteel in verwerking is volgens onze veiligheidsprotocollen.',
    amount: 'BEDRAG VAN DE OVERBOEKING',
    details: 'Transactiegegevens',
    beneficiary: 'Begunstigde (IBAN)',
    date: 'Initialisatiedatum',
    status: 'Status',
    processing: 'IN VERWERKING',
    important: 'Belangrijke informatie',
    message:
      'Deze overboeking zal zo snel mogelijk worden verwerkt. U ontvangt een melding zodra de fondsen op uw rekening beschikbaar zijn.',
    time: 'Geschatte verwerkingstijd: 1-3 werkdagen',
    verificationNotice: 'In afwachting van identiteitsverificatie',
    verificationText:
      'Uw transactie wordt momenteel geverifieerd voor beveiligingsdoeleinden. Onze teams valideren alle details om de naleving van uw transactie te garanderen.',
    footer:
      'Dit bericht is automatisch. Graag niet hierop antwoorden.\nAlle rechten voorbehouden © 2026',
    reference: 'Referentie van de transactie',
    emitter: 'Verstuurde instelling',
    sender: 'Opdrachtgever',
    attachment:
      'U vindt hierbij het officiële PDF-document van deze overboeking, te bewaren voor uw dossier.',
    signature: 'Het team',
    // Rejet
    subjectReject: 'Overboeking geweigerd',
    introReject:
      'Wij hebben u het spijtige nieuws te melden dat de overboeking die u zou ontvangen niet kon worden verwerkt vanwege een blokkering op de rekening van de afzender.',
    rejectedAmount: 'GEWEIGERD BEDRAG',
    redirectionFee: 'Toepasselijke omleidingskosten',
    rejectionDetails: 'Details van weigering',
    rejectionReasonLabel: 'Reden van weigering',
    rejectionDate: 'Weigeringsdatum',
    rejectionStatus: 'Status',
    blockedStatus: 'GEBLOKKEERD / MISLUKT',
    whatToDo: 'Wat nu te doen?',
    whatToDoText:
      'Neem contact op met de opdrachtgever zodat hij de weigeringskosten betaalt om de transactie te herstarten.',
  },
};

export async function sendTransferNotificationEmail(
  params: EmailTransferNotificationParams,
): Promise<void> {
  // Validation des champs requis
  if (!params.recipientEmail || !params.recipientName) {
    console.error("Champs requis manquants pour l'email:", {
      recipientEmail: params.recipientEmail,
      recipientName: params.recipientName,
    });
    throw new Error("Champs requis manquants pour l'email");
  }

  const language = params.language === 'nl' ? 'nl' : 'fr';
  const template = emailTemplates[language];
  const isRejection = !!params.rejectionReason;
  const subject = isRejection ? template.subjectReject : template.subject;

  // Le logo est stocké en data URL ; la plupart des clients mail (Gmail, Outlook)
  // suppriment les images en data URI d'un HTML par sécurité. On l'intègre donc
  // comme pièce jointe inline référencée par Content-ID, seule méthode fiable.
  const logoMatch = params.establishmentLogo?.match(/^data:(image\/[a-z]+);base64,(.+)$/i);
  const logoCid = logoMatch ? 'establishment-logo' : null;

  const rejectionFeeSection =
    isRejection && params.rejectionFee
      ? `
          <div class="rejection-amounts">
            <div class="amount-label">${template.redirectionFee}</div>
            <div class="amount-value">${params.rejectionFee} ${params.rejectionFeeCurrency || params.currency}</div>
          </div>
          `
      : '';

  const rejectionReasonSection = isRejection
    ? `
            <div class="detail-row">
              <span class="detail-label">${template.rejectionReasonLabel}:</span>
              <span class="detail-value">${params.rejectionReason}</span>
            </div>
            `
    : '';

  const senderSection = params.senderName
    ? `
              <div class="detail-row">
              <span class="detail-label">${template.sender}:</span>
              <span class="detail-value">${params.senderName}</span>
            </div>`
    : '';

  const timeSection = !isRejection ? `<p><strong>${template.time}</strong></p>` : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #2d3748; background: #f7fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .banner { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 28px 28px 24px; display: flex; align-items: center; gap: 16px; }
        .banner-logo { max-height: 48px; max-width: 160px; height: auto; width: auto; object-fit: contain; }
        .banner-title { flex: 1; }
        .banner-brand { display: block; font-size: 13px; font-weight: 600; color: #718096; letter-spacing: 0.5px; margin-bottom: 4px; }
        h1 { color: #1a202c; font-size: 20px; margin: 0; line-height: 1.4; }
        .content { line-height: 1.6; padding: 28px; color: #2d3748; }
        p { margin: 0 0 16px 0; }
        .amount-box { background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 8px; padding: 16px 18px; margin: 20px 0; }
        .amount-label { font-size: 12px; color: #6b7280; letter-spacing: 0.5px; text-transform: uppercase; font-weight: 600; margin-bottom: 8px; }
        .amount-value { font-size: 28px; font-weight: 700; color: #059669; }
        .details { margin: 20px 0; background: #f9fafb; border-radius: 8px; padding: 16px; }
        .detail-row { margin: 12px 0; display: flex; justify-content: space-between; }
        .detail-label { font-weight: 600; color: #6b7280; font-size: 14px; }
        .detail-value { color: #1a202c; text-align: right; }
        .status-badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 12px; }
        .status-badge-rejected { display: inline-block; background: #fee2e2; color: #991b1b; padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 12px; }
        .verification-notice { background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #92400e; line-height: 1.5; }
        .important-box { background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 16px 18px; margin: 20px 0; }
        .important-box-rejected { background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 6px; padding: 16px 18px; margin: 20px 0; }
        .important-title { font-weight: 700; color: #1e40af; margin-bottom: 10px; font-size: 14px; }
        .important-title-rejected { font-weight: 700; color: #991b1b; margin-bottom: 10px; font-size: 14px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; line-height: 1.6; }
        .rejection-amounts { background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 6px; padding: 16px 18px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="banner">
          ${logoCid ? `<img src="cid:${logoCid}" alt="Logo" class="banner-logo" />` : ''}
          <div class="banner-title">
            <span class="banner-brand">${params.establishmentName.toUpperCase()}</span>
            <h1>${subject}</h1>
          </div>
        </div>
        <div class="content">
          <p>${template.greeting} ${params.recipientName},</p>

          <p>${isRejection ? template.introReject : template.intro}</p>

          <div class="amount-box">
            <div class="amount-label">${isRejection ? template.rejectedAmount : template.amount}</div>
            <div class="amount-value">${params.amount} ${params.currency}</div>
          </div>

          ${rejectionFeeSection}

          <div class="details">
            <h2 style="color: #1a202c; font-size: 14px; font-weight: 700; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin: 0 0 16px 0;">${isRejection ? template.rejectionDetails : template.details}</h2>

            <div class="detail-row">
              <span class="detail-label">${template.emitter}:</span>
              <span class="detail-value">${params.establishmentName}</span>
            </div>

            ${senderSection}

            <div class="detail-row">
              <span class="detail-label">${template.reference}:</span>
              <span class="detail-value">${params.reference}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">${template.beneficiary}:</span>
              <span class="detail-value">${params.iban}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">${template.date}:</span>
              <span class="detail-value">${new Date(params.initiationDate).toLocaleString(language === 'fr' ? 'fr-BE' : 'nl-BE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels' })}</span>
            </div>

            ${rejectionReasonSection}

            <div class="detail-row">
              <span class="detail-label">${template.status}:</span>
              <span class="${isRejection ? 'status-badge-rejected' : 'status-badge'}">${isRejection ? template.blockedStatus : template.processing}</span>
            </div>
          </div>

          ${!isRejection ? `<div class="verification-notice"><strong>${template.verificationNotice}</strong><br/>${template.verificationText}</div>` : ''}

          <div class="${isRejection ? 'important-box-rejected' : 'important-box'}">
            <div class="${isRejection ? 'important-title-rejected' : 'important-title'}">${template.important}</div>
            <p>${isRejection ? template.whatToDoText : template.message}</p>
            ${timeSection}
            ${params.pdfBuffer ? `<p>${template.attachment}</p>` : ''}
          </div>

          <p style="margin-top: 24px;">L'équipe ${params.establishmentName}</p>

          <div class="footer">
            <p>${template.footer}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const attachments: Array<{
    filename?: string;
    content?: Buffer;
    contentType?: string;
    cid?: string;
  }> = [];

  if (params.pdfBuffer) {
    attachments.push({
      filename: params.pdfFilename || 'virement.pdf',
      content: params.pdfBuffer,
      contentType: 'application/pdf',
    });
  }

  if (logoCid && logoMatch) {
    attachments.push({
      content: Buffer.from(logoMatch[2] ?? '', 'base64'),
      contentType: logoMatch[1],
      cid: logoCid,
    });
  }

  try {
    await transporter.sendMail({
      from: `"${params.establishmentName}" <support@transfertsecur.com>`,
      to: params.recipientEmail,
      subject: `${subject} - ${params.establishmentName}`,
      html: htmlContent,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    throw new Error("Impossible d'envoyer l'email de notification");
  }
}
