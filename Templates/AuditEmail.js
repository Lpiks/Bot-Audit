"use strict";

// ---------------------------------------------------------------------------
// Subject line
// ---------------------------------------------------------------------------

function generateSubject(businessName, auditReport) {
  return `Petite question concernant le site de ${businessName}`;
}

// ---------------------------------------------------------------------------
// Main HTML Assembly
// ---------------------------------------------------------------------------

function buildHtmlEmail({ businessName, website, report, senderName }) {
  // A simple, plain-text like email (the "Permission Approach")
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "https://www.w3.org/TR/html4/strict.dtd">
<html lang="fr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>Question concernant ${businessName}</title>
</head>
<body style="margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0d0d0d;font-size:15px;line-height:1.6;">
  <p>Bonjour,</p>
  <p>J'ai récemment visité votre site web (${website}) et j'ai repéré 2-3 détails techniques subtils qui ralentissent sa vitesse de chargement et nuisent à votre expérience mobile.</p>
  <p>Comme vous vous adressez à une clientèle premium, j'ai pris quelques minutes pour filmer une courte vidéo où je vous montre ces points et comment les corriger sans avoir tout à refaire.</p>
  <p>Seriez-vous ouvert à ce que je vous envoie le lien de la vidéo ?</p>
  <p>Bien à vous,</p>
  <p>${senderName}</p>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = { generateSubject, buildHtmlEmail };
