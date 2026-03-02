"use strict";

// ---------------------------------------------------------------------------
// Subject line
// ---------------------------------------------------------------------------

function generateSubject(businessName, auditReport) {
  const { Loadtime, Issecure, Mobilehealth } = auditReport;
  if (Loadtime > 3000)
    return `⚡ ${businessName} : Your website is leaking high-ticket clients`;
  if (!Issecure)
    return `🔐 Security Alert — ${businessName} website is exposed`;
  if (!Mobilehealth)
    return `📱 ${businessName} : Broken mobile experience costing conversions`;
  return `🔍 Confidential Performance Audit — ${businessName}`;
}

// ---------------------------------------------------------------------------
// Radar chart (QuickChart.io — email-safe static image)
// ---------------------------------------------------------------------------

function generateRadarChartUrl(businessName, report) {
  const scoreSecurity = report.Issecure ? 95 : 15;
  const scoreMobile = report.Mobilehealth ? 90 : 25;

  let scoreSpeed = 15;
  if (report.Loadtime != null) {
    if (report.Loadtime <= 2000) scoreSpeed = 95;
    else if (report.Loadtime <= 3000) scoreSpeed = 70;
    else if (report.Loadtime <= 5000) scoreSpeed = 40;
  }

  let scoreSEO = 15;
  if (report.Seometrics) {
    scoreSEO =
      15 +
      (report.Seometrics.hasTitle ? 40 : 0) +
      (report.Seometrics.hasDescription ? 30 : 0);
  }

  let scoreErrors = 15;
  if (report.Consoleerrors === 0) scoreErrors = 90;
  else if (report.Consoleerrors <= 3) scoreErrors = 50;

  const cfg = {
    type: "radar",
    data: {
      labels: ["Speed", "SEO", "Mobile", "Code", "Security"],
      datasets: [
        {
          label: `Current (${businessName})`,
          backgroundColor: "rgba(229,62,62,0.15)",
          borderColor: "#E53E3E",
          pointBackgroundColor: "#E53E3E",
          data: [scoreSpeed, scoreSEO, scoreMobile, scoreErrors, scoreSecurity],
        },
        {
          label: "Target Standard",
          backgroundColor: "rgba(201,168,76,0.1)",
          borderColor: "#C9A84C",
          pointBackgroundColor: "#C9A84C",
          borderDash: [5, 5],
          data: [100, 100, 100, 100, 100],
        },
      ],
    },
    options: {
      scale: {
        ticks: { min: 0, max: 100, display: false },
        pointLabels: { fontSize: 13, fontStyle: "bold", fontColor: "#555" },
      },
      legend: {
        position: "bottom",
        labels: { fontSize: 12, fontColor: "#333" },
      },
    },
  };

  return `https://quickchart.io/chart?w=500&h=350&c=${encodeURIComponent(JSON.stringify(cfg))}`;
}

// ---------------------------------------------------------------------------
// Financial helpers
// ---------------------------------------------------------------------------

function calcAnnualLoss(loadTimeMs) {
  // Use 500ms as baseline (industry optimal). Min 0.5s delay factor so all sites show meaningful numbers.
  const delaySec = loadTimeMs ? Math.max(0.5, (loadTimeMs - 500) / 1000) : 1;
  const annual = Math.round(75000 * delaySec * 0.07 * 12);
  return "$ " + annual.toLocaleString("en-US");
}

function calcLossPct(loadTimeMs) {
  const delaySec = loadTimeMs ? Math.max(0.5, (loadTimeMs - 500) / 1000) : 1;
  return `-${(delaySec * 7).toFixed(1)}% Conversion Leak`;
}

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

function buildBadges(report) {
  const badges = [];
  if (report.Loadtime > 3000) badges.push("⚡ Critical Load Time");
  if (!report.Issecure) badges.push("🔓 Security Risk");
  if (!report.Mobilehealth) badges.push("📱 Mobile Issues");
  
  if (report.UxMetrics?.cls > 0.1)             badges.push('📉 Severe Layout Jumps');
  if (report.UxMetrics?.contrastIssues)        badges.push('🎨 Poor Text Contrast');
  if (report.UxMetrics?.tapTargetsIssues)      badges.push('👆 Unclickable Buttons');

  if (report.Consoleerrors > 0)
    badges.push(`❌ JS Script Errors (${report.Consoleerrors})`);
  if (badges.length === 0) badges.push("✅ Excellent Health");

  return badges
    .map(
      (b) => `
    <span style="display:inline-block;padding:8px 16px;background-color:rgba(229,62,62,0.05);color:#e53e3e;border:1px solid rgba(229,62,62,0.1);border-radius:4px;font-size:10px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;margin-right:8px;margin-bottom:8px">${b}</span>
  `,
    )
    .join("");
}

// ---------------------------------------------------------------------------
// Guarantee helpers
// ---------------------------------------------------------------------------

function buildDynamicGuarantee(report) {
  // 1A. UX/Aesthetic Penalty (Highest subjective priority)
  const ux = report.UxMetrics;
  if (ux && (ux.cls > 0.1 || ux.contrastIssues || ux.tapTargetsIssues)) {
    return {
      badgeText: 'UX',
      title: 'The Elite UX/UI Guarantee',
      body: 'We legally guarantee to redesign and deploy a <strong style="color:#0d0d0d">frustration-free, luxury digital experience</strong> that passes all global accessibility and mobile usability standards within 5 business days.<br><br>' +
            '<span style="color:#e53e3e;font-weight:bold;text-transform:uppercase;font-style:italic;letter-spacing:1px;text-decoration:underline">Zero Risk:</span> If we do not eliminate all visual friction and layout drops, you pay absolutely nothing. $0.'
    };
  }

  // 1B. If Loadtime > 3000ms, use the Speed Guarantee
  if (report.Loadtime > 3000) {
    return {
      badgeText: "90+",
      title: "The Performance Guarantee",
      body:
        'We legally guarantee to boost your Google PageSpeed score to <strong style="color:#0d0d0d">90/100 or above</strong> within 5 business days.<br><br>' +
        '<span style="color:#e53e3e;font-weight:bold;text-transform:uppercase;font-style:italic;letter-spacing:1px;text-decoration:underline">Zero Risk:</span> If we do not hit our performance benchmarks, you pay absolutely nothing. $0. No retainer, no fees, no excuses.',
    };
  }

  // If Security is an issue (Not HTTPS), use the Security Guarantee
  if (!report.Issecure) {
    return {
      badgeText: "SSL",
      title: "The Ironclad Security Guarantee",
      body:
        'We legally guarantee to resolve all critical security exposures and <strong style="color:#0d0d0d">fully encrypt your client data</strong> within 48 hours.<br><br>' +
        '<span style="color:#e53e3e;font-weight:bold;text-transform:uppercase;font-style:italic;letter-spacing:1px;text-decoration:underline">Zero Risk:</span> If your site is not locked down and fully secured, you pay absolutely nothing. $0.',
    };
  }

  // If Mobile Health is an issue, use the Mobile Guarantee
  if (!report.Mobilehealth) {
    return {
      badgeText: "100",
      title: "The Mobile Conversion Guarantee",
      body:
        'We legally guarantee a <strong style="color:#0d0d0d">perfect 100/100 mobile responsiveness score</strong> to recapture your smartphone traffic within 5 business days.<br><br>' +
        '<span style="color:#e53e3e;font-weight:bold;text-transform:uppercase;font-style:italic;letter-spacing:1px;text-decoration:underline">Zero Risk:</span> If we do not deliver a flawless mobile experience, you pay absolutely nothing. $0.',
    };
  }

  // If there are JS console errors, use the Code/Error Guarantee
  if (report.Consoleerrors > 0) {
    return {
      badgeText: "0%",
      title: "The Frictionless Code Guarantee",
      body:
        'We legally guarantee to <strong style="color:#0d0d0d">resolve 100% of your javascript errors</strong> and restore seamless booking conversions within 5 business days.<br><br>' +
        '<span style="color:#e53e3e;font-weight:bold;text-transform:uppercase;font-style:italic;letter-spacing:1px;text-decoration:underline">Zero Risk:</span> If we do not eliminate the technical friction, you pay absolutely nothing. $0.',
    };
  }

  // Fallback / Excellent Health Guarantee
  return {
    badgeText: "90+",
    title: "The Elite Performance Guarantee",
    body:
      'We legally guarantee to maintain your competitive technical edge and <strong style="color:#0d0d0d">scale your digital conversions</strong>.<br><br>' +
      '<span style="color:#e53e3e;font-weight:bold;text-transform:uppercase;font-style:italic;letter-spacing:1px;text-decoration:underline">Zero Risk:</span> If we cannot demonstrably improve your bottom line, you pay absolutely nothing. $0.',
  };
}

// ---------------------------------------------------------------------------
// EMAIL HTML COMPONENTS
// ---------------------------------------------------------------------------

function renderHeader(year) {
  return `<!-- ═══ HEADER ═══ -->
  <tr>
    <td style="background-color:#0d0d0d;padding:20px 32px;border-radius:16px 16px 0 0">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tbody><tr>
          <td align="left" style="vertical-align:middle">
            <table cellpadding="0" cellspacing="0">
              <tbody><tr>
                <td style="padding-right:12px">
                  <div style="width:32px;height:32px;border:1px solid #c9a84c;display:inline-block;vertical-align:middle;text-align:center;line-height:32px;color:#c9a84c;font-family:serif;font-size:18px">S</div>
                </td>
                <td style="color:#ffffff;font-size:10px;font-weight:bold;letter-spacing:4px;text-transform:uppercase">Stepping Stones Agency</td>
              </tr></tbody>
            </table>
          </td>
          <td align="right">
            <span style="color:#c9a84c;font-size:9px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;padding:4px 12px;border:1px solid rgba(201,168,76,0.2);border-radius:20px">CONFIDENTIAL AUDIT #LUXU-${year}</span>
          </td>
        </tr></tbody>
      </table>
    </td>
  </tr>`;
}

function renderHero(businessName, score, badges) {
  return `<!-- ═══ HERO — Title + Score Card ═══ -->
  <tr>
    <td style="background-color:#ffffff;padding:48px 40px 32px 40px">
      <!-- Title -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tbody><tr>
          <td align="center" style="padding-bottom:40px">
            <h1 style="font-family:'Times New Roman',Times,serif;font-size:36px;line-height:1.2;color:#0d0d0d;text-transform:uppercase;letter-spacing:-1px;margin:0 0 16px 0">Your Brand's Prestige is Leaking.</h1>
            <p style="color:#9ca3af;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:3px;margin:0">Performance Analysis prepared for: <span style="color:#b08d3d">${businessName}</span></p>
          </td>
        </tr></tbody>
      </table>
      <!-- Score Card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #f9f4e6;border-radius:24px;margin-bottom:40px">
        <tbody><tr>
          <td width="65%" style="padding:40px;vertical-align:middle">
            <h2 style="font-size:28px;font-weight:bold;margin:0 0 20px 0">Audit Score: <span style="color:#e53e3e;font-weight:900">${score}/100</span></h2>
            <p style="color:#4b5563;line-height:1.6;font-style:italic;margin:0 0 24px 0">"Your current website performance is being analysed. For HNWIs, speed is the ultimate form of luxury. Delays cost you high-ticket clients."</p>
            <div>${badges}</div>
          </td>
          <td width="35%" align="center" style="padding:40px;vertical-align:middle">
            <div style="width:160px;height:160px;border-radius:50%;border:12px solid #f9fafb;display:inline-block;text-align:center">
              <table width="100%" height="100%" cellpadding="0" cellspacing="0">
                <tbody><tr>
                  <td align="center" style="vertical-align:middle">
                    <span style="display:block;font-size:52px;font-weight:900;color:#c9a84c;line-height:1">${score}</span>
                    <span style="display:block;font-size:10px;color:#9ca3af;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-top:4px">Performance</span>
                  </td>
                </tr></tbody>
              </table>
            </div>
          </td>
        </tr></tbody>
      </table>
    </td>
  </tr>`;
}

function renderSpeedComparison(businessName, loadTimeSec, speedBarWidth, targetLoadStr) {
  return `<!-- ═══ SPEED COMPARISON ═══ -->
  <tr>
    <td style="background-color:#ffffff;padding:0 40px 40px 40px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tbody>
          <tr>
            <td align="center" style="padding-bottom:32px">
              <h3 style="font-family:'Times New Roman',Times,serif;font-size:28px;margin:0 0 12px 0;color:#0d0d0d">Visualizing the Friction</h3>
              <p style="color:#6b7280;font-size:14px;margin:0">Your current site's loading experience vs. our optimized 5-day standard.</p>
            </td>
          </tr>
          <tr>
            <!-- Current -->
            <td width="48%" style="background-color:#fff;padding:32px;border-radius:20px;border:1px solid #f3f4f6;vertical-align:top">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tbody>
                  <tr>
                    <td align="left"><span style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#e53e3e">Current (${businessName})</span></td>
                    <td align="right"><span style="font-size:22px;font-weight:900;color:#e5e7eb">${loadTimeSec}</span></td>
                  </tr>
                  <tr><td colspan="2" style="padding:16px 0">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tbody><tr>
                        <td style="background-color:#f9fafb;height:8px;border-radius:8px">
                          <div style="background-color:#e53e3e;width:${speedBarWidth};height:8px;border-radius:8px"></div>
                        </td>
                      </tr></tbody>
                    </table>
                  </td></tr>
                  <tr>
                    <td colspan="2"><p style="font-size:11px;color:#9ca3af;line-height:1.6;font-style:italic;margin:0">"62% of users leave if a page takes more than 3 seconds to load. You may be losing more than half of your traffic."</p></td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td width="4%"></td>
            <!-- Optimized -->
            <td width="48%" style="background-color:#fff;padding:32px;border-radius:20px;border:2px solid #c9a84c;vertical-align:top">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tbody>
                  <tr>
                    <td align="left"><span style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#2f855a">Optimized (Target)</span></td>
                    <td align="right"><span style="font-size:22px;font-weight:900;color:#c9a84c">${targetLoadStr}</span></td>
                  </tr>
                  <tr><td colspan="2" style="padding:16px 0">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tbody><tr>
                        <td style="background-color:#f9fafb;height:8px;border-radius:8px">
                          <div style="background-color:#2f855a;width:100%;height:8px;border-radius:8px"></div>
                        </td>
                      </tr></tbody>
                    </table>
                  </td></tr>
                  <tr>
                    <td colspan="2"><p style="font-size:11px;color:#6b7280;line-height:1.6;font-weight:bold;font-style:italic;margin:0">"Seamless. Instant. High-converting. This is where your marketing budget actually pays off."</p></td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>`;
}

function renderCostOfInaction(delaySec, lossPct, annualLoss) {
  return `<!-- ═══ COST OF INACTION (dark, interactive) ═══ -->
  <tr>
    <td style="padding:0 40px 40px 40px;background-color:#ffffff">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d0d;border-radius:32px">
        <tbody><tr>
          <!-- Left: slider -->
          <td width="55%" style="padding:48px 32px 48px 48px;vertical-align:middle">
            <h3 style="font-family:'Times New Roman',Times,serif;font-size:28px;color:#c9a84c;margin:0 0 20px 0">The Cost of Inaction</h3>
            <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 28px 0">Industry data proves that every 1s of delay reduces conversions by <strong style="color:#ffffff">7%</strong>. For a high-ticket business like yours, the numbers are staggering.</p>

            <span style="display:block;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#c9a84c;margin-bottom:14px">Estimated Monthly Revenue ($)</span>

            <!-- Slider -->
            <input
              id="ss-rev-slider"
              type="range"
              min="10000" max="500000" step="5000" value="75000"
              style="width:100%;-webkit-appearance:none;appearance:none;height:4px;border-radius:4px;background:linear-gradient(to right,#c9a84c 15%,#1f2937 15%);outline:none;cursor:pointer;margin-bottom:20px"
              oninput="
                var v = parseInt(this.value);
                var pct = Math.round(((v - 10000) / (500000 - 10000)) * 100);
                this.style.background = 'linear-gradient(to right,#c9a84c ' + pct + '%,#1f2937 ' + pct + '%)';
                document.getElementById('ss-rev-val').textContent = v.toLocaleString('en-US') + ' $';
                var delay = ${delaySec.toFixed(4)};
                var annLoss = Math.round(v * delay * 0.07 * 12);
                document.getElementById('ss-ann-loss').textContent = '$ ' + annLoss.toLocaleString('en-US');
              "
            >
            <style>
              #ss-rev-slider::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#c9a84c;cursor:pointer;box-shadow:0 0 0 3px rgba(201,168,76,0.25)}
              #ss-rev-slider::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:#c9a84c;cursor:pointer;border:none}
            </style>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tbody><tr>
                <td align="left"><span id="ss-rev-val" style="font-size:28px;font-weight:900;color:#ffffff">75,000 $</span></td>
                <td align="right"><span style="color:#e53e3e;font-size:13px;font-weight:bold">${lossPct}</span></td>
              </tr></tbody>
            </table>
          </td>

          <!-- Right: live loss display -->
          <td width="45%" align="center" style="padding:48px 48px 48px 0;vertical-align:middle">
            <div style="background-color:rgba(255,255,255,0.05);padding:40px;border-radius:24px;border:1px solid rgba(255,255,255,0.1);text-align:center">
              <span style="display:block;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:#6b7280;margin-bottom:16px">Estimated Annual Revenue Loss</span>
              <div id="ss-ann-loss" style="font-size:40px;font-weight:900;color:#c9a84c;letter-spacing:-2px;margin-bottom:20px">${annualLoss}</div>
              <span style="display:inline-block;padding:8px 16px;background-color:rgba(201,168,76,0.1);color:#c9a84c;border-radius:4px;font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:3px">Verified via Technical Audit Data</span>
            </div>
          </td>
        </tr></tbody>
      </table>
    </td>
  </tr>`;
}

function renderRadarRoadmap(chartUrl) {
  return `<!-- ═══ RADAR + ROADMAP ═══ -->
  <tr>
    <td style="background-color:#ffffff;padding:0 40px 40px 40px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tbody><tr>
          <!-- Chart -->
          <td width="50%" style="padding-right:24px;vertical-align:middle">
            <div style="background-color:#ffffff;padding:24px;border-radius:24px;border:1px solid #f3f4f6;text-align:center">
              <img src="${chartUrl}" alt="Technical Radar" style="max-width:100%;height:auto;border-radius:12px">
            </div>
          </td>
          <!-- Roadmap -->
          <td width="50%" style="padding-left:24px;vertical-align:middle">
            <h2 style="font-family:'Times New Roman',Times,serif;font-size:28px;font-style:italic;margin:0 0 32px 0">Elite Fix Roadmap</h2>
            <!-- Step 01 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tbody><tr>
                <td width="45" style="vertical-align:top"><span style="color:#c9a84c;font-size:24px;font-weight:bold">01</span></td>
                <td>
                  <h4 style="font-size:15px;font-weight:bold;color:#0d0d0d;margin:0 0 6px 0">Core Web Vitals Surgery</h4>
                  <p style="font-size:13px;color:#6b7280;line-height:1.5;margin:0">Cleaning bloatware and render-blocking scripts that choke your site's above-the-fold content.</p>
                </td>
              </tr></tbody>
            </table>
            <!-- Step 02 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tbody><tr>
                <td width="45" style="vertical-align:top"><span style="color:#c9a84c;font-size:24px;font-weight:bold">02</span></td>
                <td>
                  <h4 style="font-size:15px;font-weight:bold;color:#0d0d0d;margin:0 0 6px 0">Enterprise MERN Rebuild</h4>
                  <p style="font-size:13px;color:#6b7280;line-height:1.5;margin:0">We rebuild your digital storefront on a modern JavaScript architecture (MERN)—completely eliminating database bloat and legacy plugins to guarantee absolute instant load times for High-Net-Worth clients.</p>
                </td>
              </tr></tbody>
            </table>
            <!-- Step 03 -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tbody><tr>
                <td width="45" style="vertical-align:top"><span style="color:#c9a84c;font-size:24px;font-weight:bold">03</span></td>
                <td>
                  <h4 style="font-size:15px;font-weight:bold;color:#0d0d0d;margin:0 0 6px 0">Conversion Preservation</h4>
                  <p style="font-size:13px;color:#6b7280;line-height:1.5;margin:0">Fixing hidden JS console errors that silently break your booking forms on mobile devices.</p>
                </td>
              </tr></tbody>
            </table>
          </td>
        </tr></tbody>
      </table>
    </td>
  </tr>`;
}

function renderGuarantee(guarantee, callSubject) {
  return `<!-- ═══ GUARANTEE + CTA ═══ -->
  <tr>
    <td style="background-color:#ffffff;padding:0 40px 48px 40px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:2px solid #c9a84c;border-radius:40px;padding:48px;text-align:center">
        <tbody>
          <tr>
            <td align="center">
              <!-- Badge -->
              <div style="background-color:#0d0d0d;border:4px solid #c9a84c;width:96px;height:96px;border-radius:50%;margin:0 auto 28px auto;display:block">
                <table width="100%" height="100%" cellpadding="0" cellspacing="0">
                  <tbody><tr>
                    <td align="center" style="vertical-align:middle">
                      <span style="font-size:28px;font-weight:900;color:#c9a84c">${guarantee.badgeText}</span>
                    </td>
                  </tr></tbody>
                </table>
              </div>
              <h2 style="font-family:'Times New Roman',Times,serif;font-size:34px;margin:0 0 20px 0;color:#0d0d0d;line-height:1.2">${guarantee.title}</h2>
              <p style="font-size:17px;color:#4b5563;line-height:1.7;margin:0 auto 28px auto;max-width:580px">
                ${guarantee.body}
              </p>
              <!-- CTA Button -->
              <div style="margin-top:32px">
                <a href="mailto:contact@steppingstones.cloud?subject=${callSubject}"
                    style="display:inline-block;background-color:#0d0d0d;color:#ffffff;padding:22px 48px;border-radius:50px;font-size:16px;font-weight:900;letter-spacing:-0.5px;text-decoration:none;text-transform:uppercase">
                  Book Your Strategy Call (15 Min)
                </a>
                <p style="font-size:9px;color:#9ca3af;font-weight:bold;text-transform:uppercase;letter-spacing:4px;margin-top:28px">Only 2 Audit Slots Remaining for March</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>`;
}

function renderFooter(year) {
  return `<!-- ═══ FOOTER ═══ -->
  <tr>
    <td style="background-color:#0d0d0d;padding:40px 48px;border-radius:0 0 16px 16px;border-top:1px solid rgba(255,255,255,0.05)">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tbody><tr>
          <td width="50%" align="left" style="padding-bottom:8px">
            <div style="color:#c9a84c;font-family:'Times New Roman',Times,serif;font-size:22px;letter-spacing:-1px;margin-bottom:6px">Stepping Stones</div>
            <p style="color:#6b7280;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:5px;margin:0">Performance · Conversion · Excellence</p>
          </td>
          <td width="50%" align="right" style="padding-bottom:8px">
            <p style="color:#4b5563;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:3px;font-style:italic;text-decoration:underline;text-decoration-color:rgba(201,168,76,0.5);margin:0 0 6px 0">Elite Digital Audit Division</p>
            <p style="color:#374151;font-size:10px;margin:0">© ${year} Stepping Stones Agency. Miami · Dubai · London.</p>
          </td>
        </tr></tbody>
      </table>
    </td>
  </tr>`;
}

// ---------------------------------------------------------------------------
// Main HTML Assembly
// ---------------------------------------------------------------------------

function buildHtmlEmail({ businessName, website, report, senderName }) {
  const chartUrl = generateRadarChartUrl(businessName, report);
  const loadTimeSec = report.Loadtime ? (report.Loadtime / 1000).toFixed(2) + "s" : "N/A";
  const annualLoss = calcAnnualLoss(report.Loadtime || 0);
  const lossPct = calcLossPct(report.Loadtime || 0);
  const score = report.Auditscore ?? 0;
  const badges = buildBadges(report);
  const guarantee = buildDynamicGuarantee(report);
  const year = new Date().getFullYear();
  const callSubject = encodeURIComponent(
    `Re: ${businessName} Audit - Performance Guarantee Booking & Audit Details`,
  );

  const delaySec = Math.max(0.5, report.Loadtime ? (report.Loadtime - 500) / 1000 : 1);
  const speedBarWidth = report.Loadtime ? Math.min(95, Math.round((report.Loadtime / 5000) * 100)) + "%" : "50%";

  const currentLoadSecs = report.Loadtime ? report.Loadtime / 1000 : 3.5;
  let targetLoadSecs = 1.00;
  // If their load time is under 1.20s, push target down so we still pitch an improvement.
  // Minimum 0.40s. (e.g. 0.99s becomes 0.69s)
  if (currentLoadSecs <= 1.20) {
    targetLoadSecs = Math.max(0.40, currentLoadSecs - 0.30);
  }
  const targetLoadStr = targetLoadSecs.toFixed(2) + "s";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "https://www.w3.org/TR/html4/strict.dtd">
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confidential Performance Audit — ${businessName}</title>
</head>
<body style="margin:0;padding:0;background-color:#fdfbf7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0d0d0d">
  <!-- WRAPPER -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fdfbf7">
    <tbody><tr><td align="center" style="padding:32px 16px">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:800px">
        <tbody>
          ${renderHeader(year)}
          ${renderHero(businessName, score, badges)}
          ${renderSpeedComparison(businessName, loadTimeSec, speedBarWidth, targetLoadStr)}
          ${renderCostOfInaction(delaySec, lossPct, annualLoss)}
          ${renderRadarRoadmap(chartUrl)}
          ${renderGuarantee(guarantee, callSubject)}
          ${renderFooter(year)}
        </tbody>
      </table>
    </td></tr></tbody>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = { generateSubject, buildHtmlEmail };
