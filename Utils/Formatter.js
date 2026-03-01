/**
 * Formatter.js
 * Utility module for the Bot-Audit pipeline.
 *
 * Responsibilities:
 *  - Mouloudia casing: ensures all output keys follow PascalCase
 *    (e.g., Businessname, Phonenumber, Emailaddress, Website, Googlemapsscore)
 *  - Email cleaning: strips trailing junk tokens (e.g., "Wha", "Tes", digits, symbols)
 *  - Generic string sanitisation helpers
 */

"use strict";

// ---------------------------------------------------------------------------
// Mouloudia Casing
// ---------------------------------------------------------------------------

/**
 * Canonical header map — the single source of truth for every CSV key used
 * in the pipeline.  Keys are lowercase-normalised versions of whatever the
 * CSV may contain; values are the official Mouloudia-cased equivalents.
 */
const MOULOUDIA_MAP = {
  businessname: "Businessname",
  business_name: "Businessname",
  "business name": "Businessname",
  name: "Businessname",

  phonenumber: "Phonenumber",
  phone_number: "Phonenumber",
  "phone number": "Phonenumber",
  phone: "Phonenumber",

  emailaddress: "Emailaddress",
  email_address: "Emailaddress",
  "email address": "Emailaddress",
  email: "Emailaddress",

  website: "Website",
  url: "Website",
  site: "Website",

  googlemapsscore: "Googlemapsscore",
  google_maps_score: "Googlemapsscore",
  "google maps score": "Googlemapsscore",
  rating: "Googlemapsscore",

  // Audit output keys
  issecure: "Issecure",
  is_secure: "Issecure",

  loadtime: "Loadtime",
  load_time: "Loadtime",

  mobilehealth: "Mobilehealth",
  mobile_health: "Mobilehealth",

  seometrics: "Seometrics",
  seo_metrics: "Seometrics",

  consoleerrors: "Consoleerrors",
  console_errors: "Consoleerrors",

  auditstatus: "Auditstatus",
  audit_status: "Auditstatus",

  auditscore: "Auditscore",
  audit_score: "Auditscore",
};

/**
 * Returns the Mouloudia-cased version of a key.
 * Falls back to basic PascalCase conversion if the key is not in the map.
 *
 * @param {string} rawKey - The raw header / key string.
 * @returns {string}
 */
function toMouloudia(rawKey) {
  if (typeof rawKey !== "string") return rawKey;
  const normalised = rawKey.trim().toLowerCase();
  if (MOULOUDIA_MAP[normalised]) return MOULOUDIA_MAP[normalised];

  // Generic fallback: capitalise first letter, lowercase the rest
  return normalised.charAt(0).toUpperCase() + normalised.slice(1);
}

/**
 * Transforms all keys of a plain object to Mouloudia casing.
 *
 * @param {Record<string, unknown>} obj
 * @returns {Record<string, unknown>}
 */
function mouloudiafyObject(obj) {
  if (typeof obj !== "object" || obj === null) return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [toMouloudia(k), v]),
  );
}

// ---------------------------------------------------------------------------
// Email Cleaning
// ---------------------------------------------------------------------------

/**
 * Junk suffixes that data-entry errors commonly append to email addresses.
 * Sorted longest-first so greedier patterns match before shorter ones.
 */
const JUNK_SUFFIXES = [
  /\s*(Whatsapp|Whats|Wha|Wp|Tes|Test|Demo|N\/a|Na|None|Null)\s*$/i,
  /[^a-z0-9._%+\-@]+$/i, // trailing non-email-safe characters
];

/**
 * Cleans a raw email address string.
 *  - Trims surrounding whitespace
 *  - Removes common junk suffixes (case-insensitive)
 *  - Returns null if the result does not look like a valid email
 *
 * @param {string} raw
 * @returns {string|null}
 */
function cleanEmail(raw) {
  if (!raw || typeof raw !== "string") return null;

  let cleaned = raw.trim();

  // Strip every known junk pattern
  for (const pattern of JUNK_SUFFIXES) {
    cleaned = cleaned.replace(pattern, "");
  }

  cleaned = cleaned.trim();

  // Basic RFC-compliant email sanity check
  const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return EMAIL_RE.test(cleaned) ? cleaned : null;
}

// ---------------------------------------------------------------------------
// String Helpers
// ---------------------------------------------------------------------------

/**
 * Capitalises the first letter of every word in a string.
 * Useful for display of Businessname, city names, etc.
 *
 * @param {string} str
 * @returns {string}
 */
function toTitleCase(str) {
  if (!str || typeof str !== "string") return str;
  return str
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/**
 * Strips all non-digit characters from a phone number string,
 * returning only the numeric digits.
 *
 * @param {string} phone
 * @returns {string}
 */
function cleanPhone(phone) {
  if (!phone || typeof phone !== "string") return "";
  return phone.replace(/\D/g, "");
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  toMouloudia,
  mouloudiafyObject,
  cleanEmail,
  toTitleCase,
  cleanPhone,
  MOULOUDIA_MAP,
};
