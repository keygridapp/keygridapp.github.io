// Builds app/index.html, the in-browser version of Keygrid, from the Keygrid app sources.
//
//   node tools/build-web-app.js <path to the Keygrid app repository>
//
// It uses the same interface (scripts/page.template.html) and analysis engine
// (scripts/analysis.js) as the Mac app, so both stay identical. In the browser,
// song history is saved in the browser's own storage and "Keep on top" is hidden.
const fs = require('fs');
const path = require('path');

const appRepo = process.argv[2];
if (!appRepo) { console.error('Usage: node tools/build-web-app.js <Keygrid app repo>'); process.exit(1); }
const site = path.join(__dirname, '..');

let page = fs.readFileSync(path.join(appRepo, 'scripts', 'page.template.html'), 'utf8');
const engine = fs.readFileSync(path.join(appRepo, 'scripts', 'analysis.js'), 'utf8');
page = page.replace('__ENGINE__', () => engine);

// The template's own <title> is replaced by the head below.
page = page.replace(/<title>[^<]*<\/title>\s*/, '');

// Fonts come from the website's own copies instead of Google Fonts.
page = page.replace(/<link rel="preconnect"[^>]*>\s*/g, '').replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/, '');
const faces = [
  ['Outfit', 300, 'outfit-latin-300-normal'], ['Outfit', 400, 'outfit-latin-400-normal'], ['Outfit', 500, 'outfit-latin-500-normal'],
  ['Figtree', 400, 'figtree-latin-400-normal'], ['Figtree', 500, 'figtree-latin-500-normal'], ['Figtree', 600, 'figtree-latin-600-normal'],
  ['IBM Plex Mono', 400, 'ibm-plex-mono-latin-400-normal'], ['IBM Plex Mono', 500, 'ibm-plex-mono-latin-500-normal'],
].map(([family, weight, file]) => `@font-face { font-family: "${family}"; font-style: normal; font-weight: ${weight}; font-display: swap; src: url("../img/${file}.woff2") format("woff2"); }`).join('\n');
page = page.replace('<style>', '<style>\n' + faces + '\n');

// The Keygrid name links back to the website, and a button links to the Mac and Windows downloads.
page = page.replace('<h1>Key<span>grid</span></h1>', '<h1><a class="home" href="../" title="Keygrid website">Key<span>grid</span></a></h1>');
page = page.replace(
  '<button class="btn" id="pinBtn"',
  '<a class="btn" href="../#install" id="download" title="Download Keygrid for Mac or Windows">Download</a>\n    <button class="btn" id="pinBtn"'
);
page = page.replace('</style>', '.brand h1 a.home { color: inherit; text-decoration: none; }\na.btn { text-decoration: none; display: inline-flex; align-items: center; }\n</style>');

// Visit counts (GoatCounter, no cookies), plus one event each time a beat finishes analyzing.
// Only the event name is sent: never the file name, the results or the audio.
const analyzed = "      saveHistory(t);\n      if (t.id !== currentId) dropTrack(t);";
if (!page.includes(analyzed)) throw new Error('analysis hook not found in page.template.html');
page = page.replace(analyzed, analyzed.replace('saveHistory(t);', "saveHistory(t);\n      try { window.goatcounter && window.goatcounter.count({ path: 'beat-analyzed', title: 'Beat analyzed (web app)', event: true }); } catch (e) {}"));

const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Keygrid in your browser</title>
<meta name="description" content="Drop in a beat to get its BPM, key, vocal reverb and delay times, and a beat health check. Runs in your browser; your audio never leaves your computer.">
<meta property="og:title" content="Keygrid in your browser">
<meta property="og:image" content="https://keygridapp.github.io/img/social-preview.png">
<meta name="theme-color" content="#14111d">
<link rel="icon" type="image/png" href="../img/favicon.png">
<link rel="apple-touch-icon" href="../img/icon-180.png">
<link rel="manifest" href="manifest.webmanifest">
<script data-goatcounter="https://keygrid.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
<style>:root{color-scheme:light dark}body{margin:0;font:14px system-ui,-apple-system,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
`;
fs.mkdirSync(path.join(site, 'app'), { recursive: true });
fs.writeFileSync(path.join(site, 'app', 'index.html'), head + page + '\n</body>\n</html>\n');

// Lets Chrome and Edge offer "Install Keygrid" so it opens in its own window.
fs.writeFileSync(path.join(site, 'app', 'manifest.webmanifest'), JSON.stringify({
  name: 'Keygrid',
  short_name: 'Keygrid',
  description: 'BPM, key, vocal reverb and delay times for any beat.',
  start_url: './',
  scope: './',
  display: 'standalone',
  background_color: '#14111d',
  theme_color: '#14111d',
  icons: [
    { src: '../img/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '../img/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
}, null, 2) + '\n');
console.log('Wrote app/index.html and app/manifest.webmanifest');
