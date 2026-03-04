/**
 * Mailer.js
 * Outreach service for the Bot-Audit pipeline.
 *
 * Responsibilities:
 *  - SMTP dispatch via Nodemailer with Logo CID attachment
 */

'use strict';

const nodemailer  = require('nodemailer');
const { ImapFlow } = require('imapflow');
const fs   = require('fs');
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
// IMAP — append message to Sent folder
// ---------------------------------------------------------------------------

async function appendToSent(rawMessage) {
  const client = new ImapFlow({
    host:    process.env.SMTP_HOST,
    port:    993,
    secure:  true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    logger: false,          // silence verbose IMAP logs
  });

  try {
    await client.connect();

    // Try common Sent folder names used by cPanel / Spacemail
    const candidates = ['Sent', 'INBOX.Sent', 'Sent Items', 'Sent Messages'];
    let appended = false;

    for (const folder of candidates) {
      try {
        await client.append(folder, rawMessage, ['\\Seen']);
        console.log(`  📂  Copied to "${folder}" folder on server`);
        appended = true;
        break;
      } catch {
        // folder doesn't exist — try next
      }
    }

    if (!appended) {
      console.warn('  ⚠️   Could not find Sent folder — message not copied to server');
    }
  } catch (err) {
    console.warn(`  ⚠️   IMAP append failed: ${err.message}`);
  } finally {
    await client.logout().catch(() => {});
  }
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

  const htmlBody = buildHtmlEmail({ businessName, website, report: auditReport, senderName });

  // Use a builder transport to capture the raw RFC-2822 message for IMAP
  const transporter = createTransporter();

  const mailOptions = {
    from:    `"${senderName}" <${senderEmail}>`,
    to,
    subject,
    html:    htmlBody,
  };

  try {
    // Send via SMTP and capture raw message bytes for IMAP append
    let rawMessage;
    const info = await transporter.sendMail({
      ...mailOptions,
      // nodemailer exposes the envelope / raw via info — we rebuild it below
    });

    console.log(`  ✉️   Email sent to ${to} [MessageId: ${info.messageId}]`);

    // Build the raw message independently so we can append it to IMAP Sent
    const builder = nodemailer.createTransport({ streamTransport: true, newline: 'unix' });
    const built   = await builder.sendMail(mailOptions);
    rawMessage    = await streamToBuffer(built.message);

    // Copy to Sent folder (non-blocking — failure is just a warning)
    appendToSent(rawMessage).catch(() => {});

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`  ❌  Failed to send email to ${to}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Helper: stream → Buffer
// ---------------------------------------------------------------------------

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data',  (chunk) => chunks.push(chunk));
    stream.on('end',   () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = { sendAuditEmail };

