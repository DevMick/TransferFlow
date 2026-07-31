import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'mx1.hostinger.com',
  port: 587,
  secure: false,
  auth: {
    user: 'support@transfertsecur.com',
    pass: 'Amour##v22@',
  },
});

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: 'support@transfertsecur.com',
      to: 'adompoboua@gmail.com',
      subject: 'Test Email - TransferFlow',
      html: '<h1>Test</h1><p>Email de test</p>',
    });
    console.log('Email envoyé:', info.messageId);
  } catch (error) {
    console.error('Erreur SMTP:', error);
  }
}

testEmail();
