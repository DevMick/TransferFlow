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
    footer: 'Ce message est automatique. Merci de ne pas y répondre.\nTous droits réservés © 2026',
    reference: 'Référence de la transaction',
    emitter: 'Établissement émetteur',
    sender: "Donneur d'ordre",
    attachment:
      'Vous trouverez ci-joint le document officiel PDF de ce virement, à conserver pour vos dossiers.',
    signature: "L'équipe TransferFlow",
    // Rejet
    subjectReject: 'Virement rejeté',
    introReject:
      'Nous avons le regret de vous informer que le virement que vous deviez recevoir n\'a pas pu être traité en raison d\'un blocage sur le compte de l\'émetteur.',
    rejectedAmount: 'MONTANT REJETÉ',
    redirectionFee: 'Frais de redirection applicables',
    rejectionDetails: 'Détails du rejet',
    rejectionReasonLabel: 'Motif du rejet',
    rejectionDate: 'Date de rejet',
    rejectionStatus: 'Statut',
    blockedStatus: 'BLOQUÉ / ÉCHOUÉ',
    whatToDo: 'Que faire maintenant ?',
    whatToDoText: 'Veuillez contacter le donneur d\'ordre afin qu\'il paye les frais de rejet pour relancer la transaction.',
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
    footer:
      'Dit bericht is automatisch. Graag niet hierop antwoorden.\nAlle rechten voorbehouden © 2026',
    reference: 'Referentie van de transactie',
    emitter: 'Verstuurde instelling',
    sender: 'Opdrachtgever',
    attachment:
      'U vindt hierbij het officiële PDF-document van deze overboeking, te bewaren voor uw dossier.',
    signature: 'Het TransferFlow-team',
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
    whatToDoText: 'Neem contact op met de opdrachtgever zodat hij de weigeringskosten betaalt om de transactie te herstarten.',
  },
};

export async function sendTransferNotificationEmail(
  params: EmailTransferNotificationParams,
): Promise<void> {
  // Validation des champs requis
  if (!params.recipientEmail || !params.recipientName) {
    console.error('Champs requis manquants pour l\'email:', { recipientEmail: params.recipientEmail, recipientName: params.recipientName });
    throw new Error('Champs requis manquants pour l\'email');
  }

  const language = params.language === 'nl' ? 'nl' : 'fr';
  const template = emailTemplates[language];
  const isRejection = !!params.rejectionReason;
  const subject = isRejection ? template.subjectReject : template.subject;

  const rejectionFeeSection = isRejection && params.rejectionFee ? `
          <div class="rejection-amounts">
            <div class="amount-label">${template.redirectionFee}</div>
            <div class="amount-value">${params.rejectionFee} ${params.rejectionFeeCurrency || params.currency}</div>
          </div>
          ` : '';

  const rejectionReasonSection = isRejection ? `
            <div class="detail-row">
              <span class="detail-label">${template.rejectionReasonLabel}:</span>
              <span class="detail-value">${params.rejectionReason}</span>
            </div>
            ` : '';

  const senderSection = params.senderName ? `
              <div class="detail-row">
              <span class="detail-label">${template.sender}:</span>
              <span class="detail-value">${params.senderName}</span>
            </div>` : '';

  const timeSection = !isRejection ? `<p><strong>${template.time}</strong></p>` : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e1b2e; background: #eef0f7; margin: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; }
        .banner { background: linear-gradient(135deg, #4f46e5, #4338ca); padding: 28px 28px 24px; }
        .banner-content { display: flex; align-items: center; }
        .banner-logo { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; margin-right: 12px; }
        .banner-mark { display: inline-block; width: 32px; height: 32px; line-height: 32px; text-align: center; background: rgba(255,255,255,0.16); border-radius: 8px; color: #fff; font-weight: bold; font-size: 13px; vertical-align: middle; }
        .banner-brand { display: inline-block; margin-left: 10px; color: #fff; font-size: 14px; font-weight: 600; letter-spacing: 0.5px; vertical-align: middle; }
        h1 { color: #fff; font-size: 22px; margin: 16px 0 0 0; }
        .content { line-height: 1.6; padding: 28px; }
        .amount-box { background: #f0fdfa; border-left: 4px solid #14b8a6; border-radius: 6px; padding: 16px 18px; margin: 20px 0; }
        .amount-label { font-size: 12px; color: #667085; letter-spacing: 0.5px; }
        .amount-value { font-size: 28px; font-weight: bold; color: #0f766e; }
        .details { margin: 20px 0; }
        .detail-row { margin: 10px 0; }
        .detail-label { font-weight: bold; color: #667085; }
        .detail-value { color: #1e1b2e; }
        .status-badge { display: inline-block; background: #4f46e5; color: white; padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; }
        .status-badge-rejected { display: inline-block; background: #be2d2d; color: white; padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; }
        .important-box { background: #eef2ff; border-left: 4px solid #4f46e5; border-radius: 6px; padding: 16px 18px; margin: 20px 0; }
        .important-box-rejected { background: #fef2f2; border-left: 4px solid #be2d2d; border-radius: 6px; padding: 16px 18px; margin: 20px 0; }
        .important-title { font-weight: bold; color: #4338ca; margin-bottom: 10px; }
        .important-title-rejected { font-weight: bold; color: #be2d2d; margin-bottom: 10px; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e4e7ec; font-size: 12px; color: #98a2b3; }
        .rejection-amounts { background: #fef2f2; border-left: 4px solid #be2d2d; border-radius: 6px; padding: 16px 18px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="banner">
          <div class="banner-content">
            ${params.establishmentLogo ? `<img src="${params.establishmentLogo}" alt="Logo" class="banner-logo" />` : ''}
            <span class="banner-mark">TF</span>
            <span class="banner-brand">TRANSFERFLOW</span>
          </div>
          <h1>${subject}</h1>
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
            <h2 style="color: #4338ca; font-size: 16px; border-bottom: 2px solid #e0e7ff; padding-bottom: 10px;">${isRejection ? template.rejectionDetails : template.details}</h2>

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
              <span class="detail-value">${new Date(params.initiationDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'nl-NL', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            ${rejectionReasonSection}

            <div class="detail-row">
              <span class="detail-label">${template.status}:</span>
              <span class="${isRejection ? 'status-badge-rejected' : 'status-badge'}">${isRejection ? template.blockedStatus : template.processing}</span>
            </div>
          </div>

          <div class="${isRejection ? 'important-box-rejected' : 'important-box'}">
            <div class="${isRejection ? 'important-title-rejected' : 'important-title'}">${template.important}</div>
            <p>${isRejection ? template.whatToDoText : template.message}</p>
            ${timeSection}
            ${params.pdfBuffer ? `<p>${template.attachment}</p>` : ''}
          </div>

          <p style="margin-top: 24px;">${template.signature}</p>

          <div class="footer">
            <p>${template.footer}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: 'support@transfertsecur.com',
      to: params.recipientEmail,
      subject: `${subject} - TransferFlow`,
      html: htmlContent,
      attachments: params.pdfBuffer
        ? [
            {
              filename: params.pdfFilename || 'virement.pdf',
              content: params.pdfBuffer,
              contentType: 'application/pdf',
            },
          ]
        : undefined,
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    throw new Error("Impossible d'envoyer l'email de notification");
  }
}
