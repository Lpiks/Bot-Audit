/**
 * AuditEmail.js
 * Contains the exact Gemini shared HTML template requested by the user.
 */

'use strict';

function generateSubject(businessName, auditReport) {
  const { Loadtime, Issecure, Mobilehealth } = auditReport;

  if (Loadtime > 3000) {
    return `⚡ ${businessName} : Your website is leaking high-ticket clients`;
  }
  if (!Issecure) {
    return `🔐 Security Alert — ${businessName} website is exposed`;
  }
  if (!Mobilehealth) {
    return `📱 ${businessName} : Broken mobile experience costing conversions`;
  }
  return `🔍 Confidential Performance Audit — ${businessName}`;
}

function generateRadarChartUrl(businessName, report) {
  const scoreSecurity  = report.Issecure ? 95 : 15;
  const scoreMobile    = report.Mobilehealth ? 90 : 25;
  
  let scoreSpeed = 15;
  if (report.Loadtime !== null) {
    if (report.Loadtime <= 2000) scoreSpeed = 95;
    else if (report.Loadtime <= 3000) scoreSpeed = 70;
    else if (report.Loadtime <= 5000) scoreSpeed = 40;
  }

  let scoreSEO = 15;
  if (report.Seometrics) {
    scoreSEO = 15 + (report.Seometrics.hasTitle ? 40 : 0) + (report.Seometrics.hasDescription ? 30 : 0);
  }

  let scoreErrors = 15;
  if (report.Consoleerrors === 0) scoreErrors = 90;
  else if (report.Consoleerrors <= 3) scoreErrors = 50;

  const chartConfig = {
    type: 'radar',
    data: {
      labels: ['Speed', 'SEO', 'Mobile', 'Code', 'Security'],
      datasets: [
        {
          label: 'Current (Connect)',
          backgroundColor: 'rgba(229, 62, 62, 0.15)',
          borderColor: '#E53E3E',
          pointBackgroundColor: '#E53E3E',
          data: [scoreSpeed, scoreSEO, scoreMobile, scoreErrors, scoreSecurity]
        },
        {
          label: 'Target Standard',
          backgroundColor: 'rgba(201, 168, 76, 0.1)',
          borderColor: '#C9A84C',
          pointBackgroundColor: '#C9A84C',
          borderDash: [5, 5],
          data: [100, 100, 100, 100, 100]
        }
      ]
    },
    options: {
      scale: {
        ticks: { min: 0, max: 100, display: false },
        pointLabels: { fontSize: 13, fontStyle: 'bold', fontColor: '#555' }
      },
      legend: { position: 'bottom', labels: { fontSize: 12, fontColor: '#333' } }
    }
  };

  const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
  return `https://quickchart.io/chart?w=600&h=400&c=${encodedConfig}`;
}

function calculateFinancialImpact(loadTimeMs) {
  if (!loadTimeMs) return '$ 0';
  const delaySec = Math.max(0, (loadTimeMs - 1500) / 1000);
  if (delaySec === 0) return '$ 0';
  const monthlyLoss = 75000 * (delaySec * 0.07);
  const annualLoss = Math.round(monthlyLoss * 12);
  return `$ ` + annualLoss.toLocaleString('en-US');
}

function calculateLossPercent(loadTimeMs) {
  if (!loadTimeMs) return '0%';
  const delaySec = Math.max(0, (loadTimeMs - 1500) / 1000);
  if (delaySec === 0) return '0%';
  const pct = delaySec * 7;
  return `-${pct.toFixed(1)}% Leak`;
}

function buildHtmlEmail({ businessName, website, report, senderName, hasLogo }) {
  const chartUrl   = generateRadarChartUrl(businessName, report);
  const loadTimeSec = report.Loadtime ? (report.Loadtime / 1000).toFixed(2) + 's' : '4.21s';
  const financialLoss = calculateFinancialImpact(report.Loadtime || 4210);
  const lossPercent = calculateLossPercent(report.Loadtime || 4210);
  
  let badges = "";
  if (report.Loadtime > 3000) {
    badges += `<div class="px-4 py-2 bg-error/5 text-error rounded font-bold text-[10px] uppercase tracking-widest border border-error/10">⚡ Critical Latency</div>`;
  }
  if (!report.Issecure) {
    badges += `<div class="px-4 py-2 bg-error/5 text-error rounded font-bold text-[10px] uppercase tracking-widest border border-error/10">🔓 Security Risk</div>`;
  }
  if (!report.Mobilehealth) {
    badges += `<div class="px-4 py-2 bg-error/5 text-error rounded font-bold text-[10px] uppercase tracking-widest border border-error/10">📱 Mobile Issues</div>`;
  }
  if (report.Consoleerrors > 0) {
    badges += `<div class="px-4 py-2 bg-error/5 text-error rounded font-bold text-[10px] uppercase tracking-widest border border-error/10">❌ Script Errors (${report.Consoleerrors})</div>`;
  }
  if(badges === "") {
    badges = `<div class="px-4 py-2 bg-success/5 text-success rounded font-bold text-[10px] uppercase tracking-widest border border-success/10">✅ Excellent Health</div>`;
  }

  // Removed Gemini injected scripts (Firebase, Audio recording interceptors, etc.)
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Strategic Audit | Stepping Stones Agency</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&amp;family=Cinzel:wght@700&amp;display=swap" rel="stylesheet">

    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        heading: ['Cinzel', 'serif'],
                    },
                    colors: {
                        gold: {
                            50: '#fdfbf7',
                            100: '#f9f4e6',
                            500: '#C9A84C',
                            600: '#B08D3D',
                        },
                        onyx: '#0D0D0D',
                        success: '#2F855A',
                        error: '#E53E3E'
                    }
                }
            }
        }
    </script>

    <style>
        body {
            background-color: #fdfbf7;
            scroll-behavior: smooth;
        }

        .chart-container {
            position: relative;
            width: 100%;
            max-width: 550px;
            margin-left: auto;
            margin-right: auto;
            height: 350px;
            max-height: 400px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* --- CSS LOGO RECONSTRUCTION --- */
        .ss-logo {
            width: 60px;
            height: 60px;
            background: #000;
            border-radius: 50%;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #333;
            overflow: hidden;
        }
        
        .ss-logo::before {
            content: '';
            position: absolute;
            width: 85%;
            height: 85%;
            border: 1px solid #888;
            border-radius: 50%;
            border-top-color: transparent;
            border-bottom-color: transparent;
            transform: rotate(-45deg);
        }

        .ss-inner-blocks {
            position: relative;
            width: 40px;
            height: 40px;
            transform: rotate(-45deg);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
        }

        .ss-block {
            width: 12px;
            height: 4px;
            background: #bbb;
            box-shadow: 2px 2px 0 #555;
        }

        .ss-node {
            position: absolute;
            width: 3px;
            height: 3px;
            background: #bbb;
            border-radius: 50%;
        }
        .n1 { top: 15%; left: 20%; }
        .n2 { bottom: 15%; right: 20%; }
        .n3 { top: 50%; right: 10%; }

        /* Speed Simulation */
        @keyframes loading-slow {
            0% { width: 0%; opacity: 1; }
            80% { width: 30%; opacity: 1; }
            100% { width: 35%; opacity: 1; }
        }
        @keyframes loading-fast {
            0% { width: 0%; }
            100% { width: 100%; }
        }
        .bar-slow { animation: loading-slow 4.2s infinite linear; }
        .bar-fast { animation: loading-fast 1.2s infinite ease-out; }

        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #C9A84C;
            cursor: pointer;
        }
        
        .pulse { animation: pulse-ring 2s infinite; }
        @keyframes pulse-ring {
            0% { box-shadow: 0 0 0 0 rgba(201, 168, 76, 0.4); }
            70% { box-shadow: 0 0 0 15px rgba(201, 168, 76, 0); }
            100% { box-shadow: 0 0 0 0 rgba(201, 168, 76, 0); }
        }
    </style>
</head>
<body class="font-sans antialiased text-onyx">

    <!-- Navigation -->
    <nav class="bg-onyx py-4 px-8 sticky top-0 z-50 flex justify-between items-center shadow-2xl">
        <div class="flex items-center gap-4">
            <div class="ss-logo">
                <div class="ss-inner-blocks">
                    <div class="ss-block"></div>
                    <div class="ss-block" style="margin-left: 6px;"></div>
                    <div class="ss-block" style="margin-left: 12px;"></div>
                    <div class="ss-block" style="margin-left: 18px;"></div>
                </div>
                <div class="ss-node n1"></div>
                <div class="ss-node n2"></div>
                <div class="ss-node n3"></div>
            </div>
            <div class="hidden sm:block">
                <span class="text-white text-[10px] uppercase tracking-[0.4em] font-bold block">Stepping Stones</span>
                <span class="text-gold-500 text-[8px] uppercase tracking-[0.2em] font-medium tracking-widest">Performance Agency</span>
            </div>
        </div>
        <div class="flex items-center gap-6">
            <div class="hidden md:flex gap-8">
                <a href="#audit" class="text-white/60 hover:text-gold-500 text-[10px] uppercase font-bold tracking-widest transition-colors">Audit</a>
                <a href="#impact" class="text-white/60 hover:text-gold-500 text-[10px] uppercase font-bold tracking-widest transition-colors">Impact</a>
                <a href="#guarantee" class="text-white/60 hover:text-gold-500 text-[10px] uppercase font-bold tracking-widest transition-colors">Guarantee</a>
            </div>
            <a href="mailto:steppingstonesdev.contact@gmail.com" class="bg-gold-500 text-onyx px-5 py-2 text-[10px] font-black uppercase rounded shadow-lg hover:bg-gold-600 transition-all">Free Strategy Call</a>
        </div>
    </nav>

    <main class="max-w-6xl mx-auto px-6 py-12 space-y-24">

        <!-- SECTION: Hero Diagnosis -->
        <section id="audit" class="text-center space-y-12">
            <div class="space-y-4">
                <h1 class="font-heading text-4xl md:text-6xl text-onyx tracking-tighter uppercase leading-tight">Your Site Speed is Killing Your Deals.</h1>
                <p class="text-gray-500 uppercase tracking-[0.3em] text-[10px] font-bold">Analysis Prepared for: <span class="text-gold-600">${businessName}</span></p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white p-10 rounded-[32px] shadow-2xl border border-gold-100/50">
                <div class="space-y-6 text-left">
                    <h2 class="text-3xl font-bold leading-tight">Audit Result: <span class="text-error font-black italic">${report.Auditscore}/100</span></h2>
                    <p class="text-gray-600 leading-relaxed italic">
                        "Luxury clients expect instant service. At ${loadTimeSec}, your website is making them wait. Every second beyond 2.0s results in a significant loss of trust and conversion."
                    </p>
                    <div class="flex flex-wrap gap-3">
                        ${badges}
                    </div>
                </div>
                <div class="relative flex items-center justify-center">
                    <div class="w-48 h-48 rounded-full border-[12px] border-gray-50 flex items-center justify-center relative">
                        <div class="absolute inset-0 rounded-full border-[12px] border-gold-500" style="clip-path: inset(0 0 40% 0);"></div>
                        <div class="text-center">
                            <span class="text-6xl font-black text-gold-500">${report.Auditscore}</span>
                            <span class="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Health</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- SECTION: Social Proof -->
        <section class="text-center">
            <p class="text-[10px] uppercase tracking-[0.5em] font-bold text-gray-400 mb-8">Audited via Elite Industry Platforms</p>
            <div class="flex flex-wrap justify-center gap-12 opacity-30 hover:opacity-100 transition-opacity">
                <div class="font-bold text-xs tracking-tighter">GOOGLE LIGHTHOUSE</div>
                <div class="font-bold text-xs tracking-tighter">GTMETRIX GLOBAL</div>
                <div class="font-bold text-xs tracking-tighter">CORE WEB VITALS</div>
                <div class="font-bold text-xs tracking-tighter">CLOUDFLARE EDGE</div>
            </div>
        </section>

        <!-- SECTION: Speed Experience -->
        <section class="space-y-12">
            <div class="text-center space-y-4">
                <h3 class="font-heading text-3xl italic">The User Experience Friction</h3>
                <p class="text-gray-500">A visual comparison of your current user's wait time vs. an optimized journey.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="bg-white p-10 rounded-[32px] border border-gray-100 shadow-sm">
                    <div class="flex justify-between items-center mb-6">
                        <span class="text-xs font-bold uppercase tracking-widest text-error tracking-tighter">Current Load Time</span>
                        <span class="text-2xl font-black text-gray-200">${loadTimeSec}</span>
                    </div>
                    <div class="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                        <div class="bar-slow h-full bg-error rounded-full"></div>
                    </div>
                    <p class="mt-6 text-[11px] text-gray-400 italic">"Luxury buyers are impatient. 4s feels like an eternity."</p>
                </div>

                <div class="bg-white p-10 rounded-[32px] border-2 border-gold-500 shadow-xl relative">
                    <div class="absolute -top-3 right-8 bg-gold-500 text-onyx text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-widest">Stepping Stones Target</div>
                    <div class="flex justify-between items-center mb-6">
                        <span class="text-xs font-bold uppercase tracking-widest text-success">Optimized</span>
                        <span class="text-2xl font-black text-gold-500">1.20s</span>
                    </div>
                    <div class="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                        <div class="bar-fast h-full bg-success rounded-full"></div>
                    </div>
                    <p class="mt-6 text-[11px] text-gray-500 font-semibold italic">"Instant gratification. This drives 2x higher conversions."</p>
                </div>
            </div>
        </section>

        <!-- SECTION: Impact Calculator -->
        <section id="impact" class="bg-onyx text-white rounded-[48px] p-12 relative overflow-hidden">
            <div class="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div class="space-y-8">
                    <h3 class="font-heading text-3xl text-gold-500">The Cost of Inaction</h3>
                    <p class="text-gray-400 italic">"Slow websites cost the economy billions. For your scale, here is the estimated revenue leak caused by your current tech stack."</p>
                    
                    <div class="space-y-8">
                        <div>
                            <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-gold-500 mb-6">Monthly Revenue Est. ($)</label>
                            <input type="range" id="revRange" min="10000" max="500000" step="5000" value="75000" class="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer">
                        </div>
                        <div class="flex justify-between items-center pt-4 border-t border-white/5">
                            <span id="revVal" class="text-3xl font-black">75,000 $</span>
                            <span class="text-error font-bold text-xl">${lossPercent}</span>
                        </div>
                    </div>
                </div>

                <div class="bg-white/5 p-12 rounded-[40px] border border-white/10 text-center space-y-4">
                    <span class="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">Annual Revenue Loss Estimate</span>
                    <div id="totalLoss" class="text-5xl md:text-7xl font-black text-gold-500 tracking-tighter">${financialLoss}</div>
                    <div class="pt-8 text-[9px] text-gray-500 uppercase tracking-widest">Calculated per 1s delay industry benchmark</div>
                </div>
            </div>
        </section>

        <!-- SECTION: Radar Analysis -->
        <section class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div class="chart-container bg-white p-8 rounded-[32px] shadow-lg">
                <img src="${chartUrl}" alt="Technical Radar Chart" style="max-width: 100%; height: auto; border-radius: 12px; margin: 0 auto; display: block;" />
            </div>
            <div class="space-y-8">
                <h2 class="font-heading text-3xl">Technical Roadmap</h2>
                <div class="space-y-6">
                    <div class="flex gap-8">
                        <div class="text-gold-500 text-3xl font-heading">01</div>
                        <div>
                            <h4 class="font-bold text-onyx uppercase text-sm">Vital Surgery</h4>
                            <p class="text-sm text-gray-500 mt-2">Clearing render-blocking JS that chokes your Largest Contentful Paint (LCP).</p>
                        </div>
                    </div>
                    <div class="flex gap-8">
                        <div class="text-gold-500 text-3xl font-heading">02</div>
                        <div>
                            <h4 class="font-bold text-onyx uppercase text-sm">Asset Purge</h4>
                            <p class="text-sm text-gray-500 mt-2">Compressing massive media assets with Next-Gen formats to save 70% in bandwidth.</p>
                        </div>
                    </div>
                    <div class="flex gap-8">
                        <div class="text-gold-500 text-3xl font-heading">03</div>
                        <div>
                            <h4 class="font-bold text-onyx uppercase text-sm">Error Cleanse</h4>
                            <p class="text-sm text-gray-500 mt-2">Fixing the 6 hidden console errors that break mobile booking flows.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- SECTION: The Elite Guarantee -->
        <section id="guarantee" class="bg-white rounded-[56px] border-2 border-gold-500 p-12 text-center space-y-10 relative shadow-2xl">
            <div class="max-w-3xl mx-auto space-y-6">
                <div class="w-24 h-24 rounded-full bg-onyx mx-auto flex items-center justify-center border-4 border-gold-500 shadow-xl">
                    <span class="text-gold-500 text-4xl font-black">90+</span>
                </div>
                <h2 class="font-heading text-4xl">The 90+ Score Guarantee</h2>
                <p class="text-gray-600 text-lg leading-relaxed font-light">
                    We legally guarantee to boost your Google PageSpeed score to <span class="text-onyx font-bold">90/100 or above</span> within 5 business days.
                </p>
                <div class="p-8 bg-gold-50 border border-gold-200 rounded-3xl italic">
                    "If we do not hit our benchmarks, you pay nothing. $0. The risk is 100% on us."
                </div>
            </div>

            <div class="pt-8">
                <a href="mailto:steppingstonesdev.contact@gmail.com?subject=Connect Audit - Risk Free Booking" class="inline-block bg-onyx text-white px-16 py-7 rounded-full font-black text-xl hover:bg-gold-600 transition-all hover:scale-105 active:scale-95 shadow-2xl pulse">
                    CLAIM YOUR 90+ GUARANTEE
                </a>
                <p class="text-[9px] text-gray-400 mt-10 uppercase tracking-[0.5em] font-bold">Only 2 Audit Slots Remaining for March Cycle</p>
            </div>
        </section>

    </main>

    <footer class="bg-onyx text-white py-20 px-8 border-t border-white/5">
        <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div class="space-y-6 flex flex-col items-center md:items-start">
                <div class="ss-logo scale-150 border-gold-500/50">
                    <div class="ss-inner-blocks">
                        <div class="ss-block"></div>
                        <div class="ss-block" style="margin-left: 6px;"></div>
                        <div class="ss-block" style="margin-left: 12px;"></div>
                        <div class="ss-block" style="margin-left: 18px;"></div>
                    </div>
                </div>
                <div>
                    <div class="text-gold-500 font-heading text-2xl tracking-tighter">Stepping Stones</div>
                    <p class="text-gray-500 text-[10px] uppercase tracking-[0.6em] mt-2 font-bold tracking-widest">Digital Architecture</p>
                </div>
            </div>
            <div class="text-center md:text-right space-y-3">
                <p class="text-gold-500/60 text-[11px] font-bold uppercase tracking-widest italic underline decoration-gold-500/50">Performance Division</p>
                <p class="text-gray-600 text-[10px]">© \${new Date().getFullYear()} Stepping Stones Agency. Miami · Dubai · London.</p>
            </div>
        </div>
    </footer>
</body>
</html>`;
}

module.exports = {
  generateSubject,
  buildHtmlEmail
};
