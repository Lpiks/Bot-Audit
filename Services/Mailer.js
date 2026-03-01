/**
 * Mailer.js
 * Outreach service for the Bot-Audit pipeline.
 *
 * Responsibilities:
 *  - SMTP dispatch via Nodemailer with Logo CID attachment
 */

'use strict';

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { generateSubject, buildHtmlEmail } = require('../Templates/AuditEmail');

// ---------------------------------------------------------------------------
// Nodemailer Transport
// ---------------------------------------------------------------------------

function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ---------------------------------------------------------------------------
// Send
// ---------------------------------------------------------------------------

async function sendAuditEmail({ to, businessName, website, auditReport }) {
  if (!to) {
    return { success: false, error: 'No email address provided.' };
  }

  const senderName  = process.env.SENDER_NAME  || 'Stepping Stones Agency';
  const senderEmail = process.env.SENDER_EMAIL || 'audit@steppingstones.agency';

  const subject  = generateSubject(businessName, auditReport);
  
  // Check if logo exists in Data folder for attachment
  const logoPath = path.join(__dirname, '..', 'Data', 'logo.png');
  const hasLogo = fs.existsSync(logoPath);
  
  const htmlBody = buildHtmlEmail({ businessName, website, report: auditReport, senderName, hasLogo });

  const transporter = createTransporter();

  const mailOptions = {
    from:    `"${senderName}" <${senderEmail}>`,
    to,
    subject,
    html:    htmlBody,
  };

  if (hasLogo) {
    mailOptions.attachments = [
      {
        filename: 'logo.png',
        path: logoPath,
        cid: 'agencyLogo' // Same cid value as in the HTML img src
      }
    ];
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`  ✉️   Email sent to ${to} [MessageId: ${info.messageId}]`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`  ❌  Failed to send email to ${to}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  sendAuditEmail,
};
