/**
 * Auditor.js
 * Deep-audit service for the Bot-Audit pipeline.
 *
 * Performs a 5-point technical check across MULTIPLE pages per site:
 *  1. Issecure      — HTTPS check (URL-level, once per site)
 *  2. Loadtime      — avg navigation timing across all crawled pages
 *  3. Mobilehealth  — any page with horizontal overflow → fail
 *  4. Seometrics    — homepage title/description presence
 *  5. Consoleerrors — total JS errors across all crawled pages
 *
 * Crawl behaviour is controlled via .env:
 *   MAX_PAGES=5   → visit homepage + up to 4 internal sub-pages (default: 5)
 *   HEADLESS=false → show browser window
 *
 * Anti-bot measures:
 *  - Randomised delays between leads (30–90 s)
 *  - Custom browser args to lower fingerprint surface
 *  - 40-second per-page timeout → marks Auditstatus as "Failed" on breach
 */

'use strict';

const { chromium } = require('playwright');
const { playAudit } = require('playwright-lighthouse');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a promise that resolves after a random delay in the given range.
 * @param {number} minMs
 * @param {number} maxMs
 * @returns {Promise<void>}
 */
function randomDelay(minMs = 30_000, maxMs = 90_000) {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  console.log(`  ⏳  Waiting ${(delay / 1000).toFixed(1)}s before next request…`);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Normalises a URL: removes hash, trailing slash, lowercases scheme+host.
 * Used for de-duplication of crawl candidates.
 * @param {string} href
 * @returns {string}
 */
function normaliseUrl(href) {
  try {
    const u = new URL(href);
    u.hash = '';
    // Remove trailing slash on path (but keep root '/')
    if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch (_) {
    return href;
  }
}

/**
 * Extracts all same-origin <a href> links from the current page.
 * @param {import('playwright').Page} page
 * @param {string} origin - e.g. "https://example.com"
 * @returns {Promise<string[]>}
 */
async function extractInternalLinks(page, origin) {
  return page.evaluate((origin) => {
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    const links = new Set();
    for (const a of anchors) {
      try {
        const u = new URL(a.href, window.location.href);
        if (u.origin === origin) {
          // Skip mailto, tel, javascript, files
          if (['http:', 'https:'].includes(u.protocol)) {
            links.add(u.toString());
          }
        }
      } catch (_) {}
    }
    return Array.from(links);
  }, origin);
}

/**
 * Computes an overall Auditscore (0–100) from the five audit dimensions.
 *
 * Scoring rubric:
 *  - Issecure:       +20 pts  (HTTPS = pass)
 *  - Loadtime:       +25 pts  (avg ≤2 s = full, ≤3 s = half, >3 s = 0)
 *  - Mobilehealth:   +20 pts  (ALL pages pass)
 *  - Seometrics:     +20 pts  (10 pts per tag on homepage)
 *  - Consoleerrors:  +15 pts  (0 total = full, 1-3 = half, >3 = 0)
 *
 * @param {object} report
 * @returns {number}
 */
function computeAuditScore(report) {
  let score = 0;

  if (report.Issecure) score += 20;

  const lt = report.Loadtime;
  if (lt !== null && lt <= 2000) score += 25;
  else if (lt !== null && lt <= 3000) score += 12;

  if (report.Mobilehealth) score += 20;

  if (report.Seometrics?.hasTitle)       score += 10;
  if (report.Seometrics?.hasDescription) score += 10;

  const ce = report.Consoleerrors;
  if (ce === 0)  score += 15;
  else if (ce <= 3) score += 7;

  // Apply UX Penalties from Lighthouse
  const ux = report.UxMetrics;
  if (ux) {
    if (ux.cls > 0.1) score -= 10;  // Severe layout shift penalty
    if (ux.contrastIssues) score -= 5;
    if (ux.tapTargetsIssues) score -= 5;
  }

  // Ensure score stays bounded
  return Math.max(0, Math.min(100, score));
}

// ---------------------------------------------------------------------------
// Single-page audit helper
// ---------------------------------------------------------------------------

/**
 * Audits a single already-opened page and returns its per-page metrics.
 *
 * @param {import('playwright').Page} page
 * @param {number} timeoutMs
 * @returns {Promise<{loadtime: number, mobileOverflow: boolean, seo: object, errors: number}>}
 */
async function auditPage(page, timeoutMs) {
  // Load time from Performance API
  const timing = await page.evaluate(() => {
    const t = window.performance.timing;
    return { start: t.navigationStart, end: t.loadEventEnd };
  });
  const loadtime = timing.end - timing.start;

  // Mobile overflow check at 375px
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(600);
  const mobileOverflow = await page.evaluate(
    () => document.body.scrollWidth > window.innerWidth
  );

  // Restore to desktop
  await page.setViewportSize({ width: 1280, height: 800 });

  // SEO (only meaningful on homepage, but collected everywhere)
  const seo = await page.evaluate(() => ({
    hasTitle:       !!document.querySelector('title')?.textContent?.trim(),
    hasDescription: !!document.querySelector('meta[name="description"]')?.content?.trim(),
  }));

  return { loadtime, mobileOverflow, seo };
}

// ---------------------------------------------------------------------------
// Main Audit Entry Point
// ---------------------------------------------------------------------------

/**
 * Launches a browser, crawls the site up to MAX_PAGES pages, and returns
 * an aggregated audit report.
 *
 * @param {string} url          - Root URL of the site to audit.
 * @param {object} [options]
 * @param {number} [options.timeoutMs=40000]
 * @param {number} [options.maxPages]        - Overrides MAX_PAGES env var.
 * @returns {Promise<object>}   Aggregated audit report with Mouloudia keys.
 */
async function auditWebsite(url, { timeoutMs = 40_000, maxPages } = {}) {
  const MAX_PAGES = maxPages ?? parseInt(process.env.MAX_PAGES || '5', 10);

  const report = {
    Issecure:      false,
    Loadtime:      null,
    Mobilehealth:  false,
    Seometrics:    { hasTitle: false, hasDescription: false },
    Consoleerrors: 0,
    Pagescrawled:  0,
    UxMetrics:     { cls: 0, contrastIssues: false, tapTargetsIssues: false },
    Auditstatus:   'Pending',
    Auditscore:    0,
  };

  // HTTPS check — no browser needed
  try {
    report.Issecure = url.trim().toLowerCase().startsWith('https://');
  } catch (_) {
    report.Issecure = false;
  }

  let browser;
  try {
    const port = 9222; // Required for Lighthouse connection
    browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false',
      args: [
        `--remote-debugging-port=${port}`,
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    // Shared console error counter across all pages in this context
    let totalConsoleErrors = 0;
    context.on('page', (p) => {
      p.on('console',   (msg) => { if (msg.type() === 'error') totalConsoleErrors++; });
      p.on('pageerror', ()    => { totalConsoleErrors++; });
    });

    // -----------------------------------------------------------------------
    // Step 1 — Homepage
    // -----------------------------------------------------------------------
    const page = await context.newPage();

    console.log(`  📄  [1/${MAX_PAGES}] Homepage: ${url}`);
    await page.goto(url, { waitUntil: 'load', timeout: timeoutMs });

    const homeMetrics = await auditPage(page, timeoutMs);

    // Lighthouse Audit on Homepage UX Metrics
    console.log(`  🛟  Running Lighthouse UX Audit on homepage…`);
    try {
      const lhAudit = await playAudit({
        page: page,
        port: 9222,
        config: { extends: 'lighthouse:default' },
        thresholds: { performance: 0, accessibility: 0, seo: 0 }, // We don't fail the build, just collect
        reports: {
          formats: { json: false, html: false }, // we explicitly read raw results
          name: 'audit-report'
        }
      });
      
      const audits = lhAudit.lhr.audits;
      report.UxMetrics.cls = audits['cumulative-layout-shift']?.numericValue || 0;
      report.UxMetrics.contrastIssues = audits['color-contrast']?.score === 0;
      report.UxMetrics.tapTargetsIssues = audits['tap-targets']?.score === 0;
      
    } catch (lhErr) {
      console.warn(`  ⚠️   Lighthouse audit failed: ${lhErr.message}`);
    }

    // Grab origin for same-origin filtering
    const origin = new URL(url).origin;

    // Extract internal links while we have the homepage open
    const rawLinks = await extractInternalLinks(page, origin);

    // De-duplicate and exclude the homepage itself
    const normalisedHome = normaliseUrl(url);
    const queue = [
      ...new Set(rawLinks.map(normaliseUrl).filter((l) => l !== normalisedHome)),
    ].slice(0, MAX_PAGES - 1); // leave slot 1 for homepage

    console.log(`  🔗  Found ${rawLinks.length} internal link(s) — will visit ${queue.length} sub-page(s)`);

    // Accumulate results — start with homepage
    const loadtimes    = [homeMetrics.loadtime];
    let   mobileAllOk  = !homeMetrics.mobileOverflow;
    report.Seometrics  = homeMetrics.seo;         // SEO evaluated on homepage only
    report.Pagescrawled = 1;

    // -----------------------------------------------------------------------
    // Step 2 — Sub-pages
    // -----------------------------------------------------------------------
    for (let i = 0; i < queue.length; i++) {
      const subUrl = queue[i];
      console.log(`  📄  [${i + 2}/${Math.min(queue.length + 1, MAX_PAGES)}] ${subUrl}`);

      try {
        await page.goto(subUrl, { waitUntil: 'load', timeout: timeoutMs });
        const metrics = await auditPage(page, timeoutMs);
        loadtimes.push(metrics.loadtime);
        if (metrics.mobileOverflow) mobileAllOk = false;
        report.Pagescrawled++;
      } catch (subErr) {
        console.warn(`  ⚠️   Sub-page failed (${subUrl}): ${subErr.message?.slice(0, 60)}`);
      }

      // Small courtesy pause between sub-pages (1.5–3 s)
      await new Promise((r) =>
        setTimeout(r, Math.floor(Math.random() * 1500) + 1500)
      );
    }

    // Give a final window for late-firing errors
    await new Promise((r) => setTimeout(r, 500));

    // -----------------------------------------------------------------------
    // Step 3 — Aggregate
    // -----------------------------------------------------------------------
    const avgLoadtime = Math.round(
      loadtimes.reduce((a, b) => a + b, 0) / loadtimes.length
    );

    report.Loadtime      = avgLoadtime;
    report.Mobilehealth  = mobileAllOk;
    report.Consoleerrors = totalConsoleErrors;
    report.Auditscore    = computeAuditScore(report);
    report.Auditstatus   = 'Success';

  } catch (err) {
    const isTimeout =
      err.message?.includes('Timeout') || err.message?.includes('timeout');
    report.Auditstatus = isTimeout
      ? 'Failed (Timeout)'
      : `Failed (${err.message?.slice(0, 80)})`;
    console.error(`  ❌  Audit failed for ${url}: ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }

  return report;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  auditWebsite,
  randomDelay,
  computeAuditScore,
};
