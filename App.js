/**
 * App.js — Central Orchestrator for the Bot-Audit Pipeline
 *
 * Pipeline steps:
 *  1. Load .env configuration
 *  2. Read Leadlist.csv and parse leads
 *  3. Load Processed.log to skip already-emailed businesses
 *  4. For each unprocessed lead:
 *       a. Clean email (Formatter)
 *       b. Audit website (Auditor) — 40 s timeout, marks Failed on breach
 *       c. Send personalised email (Mailer)
 *       d. Append result row to Auditresults.csv
 *       e. Append to Processed.log
 *       f. Wait a random delay (30–90 s) before next lead
 *  5. Print summary when done
 */

'use strict';

require('dotenv').config();

const fs        = require('fs');
const path      = require('path');
const csv       = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const { mouloudiafyObject, cleanEmail, toTitleCase } = require('./Utils/Formatter');
const { auditWebsite, randomDelay }                  = require('./Services/Auditor');
const { sendAuditEmail }                             = require('./Services/Mailer');

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const DATA_DIR          = path.join(__dirname, 'Data');
const LEADLIST_PATH     = path.join(DATA_DIR, 'Leadlist.csv');
const AUDITRESULTS_PATH = path.join(DATA_DIR, 'Auditresults.csv');
const PROCESSED_LOG     = path.join(__dirname, 'Processed.log');
const DAILY_LIMIT       = parseInt(process.env.DAILY_LIMIT || '30', 10);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Reads the Processed.log file and returns a Set of already-processed
 * business identifiers (Businessname|Website).
 *
 * @returns {Set<string>}
 */
function loadProcessedSet() {
  if (!fs.existsSync(PROCESSED_LOG)) return new Set();
  const raw = fs.readFileSync(PROCESSED_LOG, 'utf8');
  return new Set(
    raw.split('\n').map((l) => l.trim()).filter(Boolean)
  );
}

/**
 * Appends a processed entry to Processed.log.
 *
 * @param {string} key - e.g. "Businessname|https://website.com"
 */
function markProcessed(key) {
  fs.appendFileSync(PROCESSED_LOG, key + '\n', 'utf8');
}

/**
 * Parses the Leadlist CSV into an array of Mouloudia-cased lead objects.
 *
 * @returns {Promise<object[]>}
 */
function parseLeads() {
  return new Promise((resolve, reject) => {
    const leads = [];
    fs.createReadStream(LEADLIST_PATH)
      .pipe(csv())
      .on('data', (raw) => leads.push(mouloudiafyObject(raw)))
      .on('end',  () => resolve(leads))
      .on('error', reject);
  });
}

/**
 * Initialises (or appends to) the Auditresults CSV writer.
 *
 * @param {boolean} append - If true, header is not re-written.
 * @returns {import('csv-writer').CsvWriter}
 */
function buildCsvWriter(append) {
  return createObjectCsvWriter({
    path: AUDITRESULTS_PATH,
    append,
    header: [
      { id: 'Businessname',    title: 'Businessname'    },
      { id: 'Phonenumber',     title: 'Phonenumber'     },
      { id: 'Website',         title: 'Website'         },
      { id: 'Googlemapsscore', title: 'Googlemapsscore' },
      { id: 'Emailaddress',    title: 'Emailaddress'    },
      { id: 'Instagramlink',   title: 'Instagramlink'   },
      { id: 'Facebooklink',    title: 'Facebooklink'    },
      { id: 'Linkedinlink',    title: 'Linkedinlink'    },
      { id: 'Recommand',       title: 'Recommand'       },
      // Audit Output Fields
      { id: 'Issecure',        title: 'Issecure'        },
      { id: 'Loadtime',        title: 'Loadtime'        },
      { id: 'Mobilehealth',    title: 'Mobilehealth'    },
      { id: 'HasTitle',        title: 'HasTitle'        },
      { id: 'HasDescription',  title: 'HasDescription'  },
      { id: 'Consoleerrors',   title: 'Consoleerrors'   },
      { id: 'Pagescrawled',    title: 'Pagescrawled'    },
      // UX Metrics
      { id: 'UxCLS',           title: 'UxCLS'           },
      { id: 'UxContrast',      title: 'UxContrast'      },
      { id: 'UxTapTargets',    title: 'UxTapTargets'    },
      { id: 'Auditscore',      title: 'Auditscore'      },
      { id: 'Auditstatus',     title: 'Auditstatus'     },
      { id: 'EmailSent',       title: 'EmailSent'       },
      { id: 'EmailError',      title: 'EmailError'      },
    ],
  });
}

// ---------------------------------------------------------------------------
// Main Pipeline
// ---------------------------------------------------------------------------

async function run() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║           BOT-AUDIT PIPELINE — STARTING             ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // Ensure Data directory exists
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  // Parse leads
  let leads;
  try {
    leads = await parseLeads();
  } catch (err) {
    console.error(`❌ Failed to parse Leadlist.csv: ${err.message}`);
    process.exit(1);
  }
  console.log(`📋  Loaded ${leads.length} lead(s) from Leadlist.csv\n`);

  // State management
  const processed = loadProcessedSet();
  const resultsExist = fs.existsSync(AUDITRESULTS_PATH);

  // Track stats
  let audited = 0, emailed = 0, skipped = 0, failed = 0;

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    const businessName = toTitleCase(lead.Businessname) || `Lead #${i + 1}`;
    const website      = (lead.Website || '').trim();
    const processedKey = `${businessName}|${website}`;

    console.log(`─────────────────────────────────────────────────────`);
    console.log(`[${i + 1}/${leads.length}]  ${businessName}`);
    console.log(`  🌐  ${website}`);

    if (emailed >= DAILY_LIMIT) {
      console.log(`  🛑   Daily limit of ${DAILY_LIMIT} emails reached to protect deliverability. Stopping.`);
      break;
    }

    // Skip if already processed
    if (processed.has(processedKey)) {
      console.log(`  ⏭️   Already processed — skipping.\n`);
      skipped++;
      continue;
    }

    // --- 1. Clean email ---
    const rawEmail    = lead.Emailaddress || '';
    const cleanedEmail = cleanEmail(rawEmail);
    if (!cleanedEmail) {
      console.warn(`  ⚠️   Invalid or uncleanable email: "${rawEmail}" — will audit but skip sending.`);
    } else {
      console.log(`  ✉️   ${cleanedEmail}`);
    }

    // --- 2. Audit website ---
    let auditReport = {
      Issecure:      false,
      Loadtime:      null,
      Mobilehealth:  false,
      Seometrics:    { hasTitle: false, hasDescription: false },
      Consoleerrors: 0,
      Pagescrawled:  0,
      Auditstatus:   'Failed (No URL)',
      Auditscore:    0,
    };

    if (website) {
      console.log(`  🔍  Auditing…`);
      auditReport = await auditWebsite(website, { timeoutMs: 40_000 });
      console.log(`  📊  Score: ${auditReport.Auditscore}/100  |  Status: ${auditReport.Auditstatus}`);
    } else {
      console.warn(`  ⚠️   No website URL — skipping audit.`);
      failed++;
    }

    audited++;

    // --- 3. Send email ---
    let emailSent  = false;
    let emailError = '';

    if (cleanedEmail && auditReport.Auditstatus !== 'Pending') {
      // Skip sending email if the audit score is 90 or above
      if (auditReport.Auditscore >= 90) {
        console.warn(`  ⚠️   Audit score is ${auditReport.Auditscore}/100. Skipping email to maintain high relevance.`);
        emailError = 'Skipped - Score >= 90';
      } else {
        const mailResult = await sendAuditEmail({
          to:           cleanedEmail,
          businessName,
          website,
          auditReport,
        });
        emailSent  = mailResult.success;
        emailError = mailResult.error || '';
        if (emailSent) emailed++;
      }
    }

    // --- 4. Write to Auditresults.csv ---
    const csvWriter = buildCsvWriter(resultsExist || i > 0 || skipped > 0);
    await csvWriter.writeRecords([{
      Businessname:    businessName,
      Phonenumber:     lead.Phonenumber         || '',
      Emailaddress:    cleanedEmail              || rawEmail,
      Website:         website,
      Googlemapsscore: lead.Googlemapsscore      || '',
      Issecure:        String(auditReport.Issecure),
      Loadtime:        auditReport.Loadtime !== null ? `${auditReport.Loadtime}` : '',
      Mobilehealth:    String(auditReport.Mobilehealth),
      HasTitle:        String(auditReport.Seometrics?.hasTitle),
      HasDescription:  String(auditReport.Seometrics?.hasDescription),
      Consoleerrors:   String(auditReport.Consoleerrors),
      Pagescrawled:    String(auditReport.Pagescrawled || 0),
      UxCLS:           String(auditReport.UxMetrics?.cls?.toFixed(3) || '0'),
      UxContrast:      String(auditReport.UxMetrics?.contrastIssues || false),
      UxTapTargets:    String(auditReport.UxMetrics?.tapTargetsIssues || false),
      Auditscore:      String(auditReport.Auditscore),
      Auditstatus:     auditReport.Auditstatus,
      EmailSent:       String(emailSent),
      EmailError:      emailError,
    }]);

    // --- 5. Mark processed ---
    // Only mark as processed if we successfully emailed them, OR if they are fundamentally un-emailable
    // (no website, no email, or score >= 90). This ensures timeouts and temporary errors are retried.
    if (emailSent || !website || !cleanedEmail || auditReport.Auditscore >= 90) {
      markProcessed(processedKey);
      processed.add(processedKey);
    } else {
      console.log(`  ♻️   Audit failed or email not sent. Lead remains unprocessed for future retry.`);
    }

    // --- 6. Random delay only if there's a next lead ---
    if (i < leads.length - 1) {
      await randomDelay(30_000, 90_000);
    }
  }

  // Summary
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║                   PIPELINE COMPLETE                  ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Total leads ...... ${String(leads.length).padEnd(33)}║`);
  console.log(`║  Skipped .......... ${String(skipped).padEnd(33)}║`);
  console.log(`║  Audited .......... ${String(audited).padEnd(33)}║`);
  console.log(`║  Emails sent ...... ${String(emailed).padEnd(33)}║`);
  console.log(`║  Audit failures ... ${String(failed).padEnd(33)}║`);
  console.log('╚══════════════════════════════════════════════════════╝\n');
}

run().catch((err) => {
  console.error('❌ Unhandled pipeline error:', err);
  process.exit(1);
});
