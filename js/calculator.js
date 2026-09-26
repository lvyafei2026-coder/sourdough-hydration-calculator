let currentMode = 'hydrate';

function t() { return (window.__i18n && window.__i18n.t) || {}; }

function fmtG(n) {
  if (!isFinite(n)) return '—';
  if (n < 10) return n.toFixed(1) + ' g';
  return Math.round(n) + ' g';
}

function fmtPct(n) {
  if (!isFinite(n)) return '—';
  return n.toFixed(1) + '%';
}

function switchMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
  document.querySelectorAll('.mode-panel').forEach(p => p.style.display = 'none');
  document.getElementById('mode-' + mode).style.display = 'block';
  calculate();
}

function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('mode')) {
    const m = params.get('mode');
    if (['hydrate','scale','starter'].includes(m)) switchMode(m);
  }
  const fields = ['hFlour','hWater','hStarter','hSalt','hStarterHyd','sTargetFlour','sHydration','sStarterPct','sSaltPct','sStarterHyd2','stTarget'];
  fields.forEach(id => {
    if (params.has(id)) {
      const el = document.getElementById(id);
      if (el) el.value = params.get(id);
    }
  });
  if (params.has('stRatio')) document.getElementById('stRatio').value = params.get('stRatio');
  calculate();
}

function buildShareUrl() {
  const params = new URLSearchParams();
  params.set('mode', currentMode);
  if (currentMode === 'hydrate') {
    ['hFlour','hWater','hStarter','hSalt','hStarterHyd'].forEach(id => params.set(id, document.getElementById(id).value));
  } else if (currentMode === 'scale') {
    ['sTargetFlour','sHydration','sStarterPct','sSaltPct','sStarterHyd2'].forEach(id => params.set(id, document.getElementById(id).value));
  } else {
    params.set('stTarget', document.getElementById('stTarget').value);
    params.set('stRatio', document.getElementById('stRatio').value);
  }
  const base = window.location.origin + window.location.pathname;
  return base + '?' + params.toString();
}

function copyShareLink() {
  const url = buildShareUrl();
  navigator.clipboard.writeText(url).then(() => {
    const el = document.getElementById('shareCopied');
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1800);
  }).catch(() => { prompt('Copy this link:', url); });
}

function calculate() {
  if (currentMode === 'hydrate') calculateHydrate();
  else if (currentMode === 'scale') calculateScale();
  else calculateStarter();
}

function calculateHydrate() {
  const tr = t();
  const flour = parseFloat(document.getElementById('hFlour').value) || 0;
  const water = parseFloat(document.getElementById('hWater').value) || 0;
  const starter = parseFloat(document.getElementById('hStarter').value) || 0;
  const salt = parseFloat(document.getElementById('hSalt').value) || 0;
  const starterHyd = parseFloat(document.getElementById('hStarterHyd').value) || 100;

  if (flour <= 0) { document.getElementById('result').classList.remove('show'); return; }

  // Starter flour and water
  const starterFlour = starter / (1 + starterHyd / 100);
  const starterWater = starter - starterFlour;

  const totalFlour = flour + starterFlour;
  const totalWater = water + starterWater;
  const totalDough = totalFlour + totalWater + salt;

  const hydration = (totalWater / totalFlour) * 100;
  const starterPct = (starter / totalFlour) * 100;
  const saltPct = (salt / totalFlour) * 100;

  // Determine hydration category
  let category = tr.hydCatMid || 'Everyday sourdough';
  if (hydration < 60) category = tr.hydCatFirm || 'Firm dough';
  else if (hydration < 68) category = tr.hydCatSandwich || 'Sandwich bread';
  else if (hydration < 75) category = tr.hydCatEveryday || 'Everyday sourdough';
  else if (hydration < 82) category = tr.hydCatOpen || 'Open crumb';
  else category = tr.hydCatWet || 'High hydration';

  document.getElementById('resultLabel').textContent = tr.hydrationLabel || 'Hydration';
  document.getElementById('resultMain').textContent = fmtPct(hydration);
  document.getElementById('resultSub').textContent = category + ' · ' + fmtG(totalDough) + ' ' + (tr.totalDough || 'total dough');

  const bd = document.getElementById('breakdown');
  bd.innerHTML = `
    <div class="bd-row"><span>${tr.bdFlour || 'Flour (main)'}</span><strong>${fmtG(flour)}<span class="pct">${fmtPct(flour / totalFlour * 100)}</span></strong></div>
    <div class="bd-row"><span>${tr.bdWater || 'Water (main)'}</span><strong>${fmtG(water)}<span class="pct">${fmtPct(water / totalFlour * 100)}</span></strong></div>
    <div class="bd-row"><span>${tr.bdStarter || 'Starter'}</span><strong>${fmtG(starter)}<span class="pct">${fmtPct(starterPct)}</span></strong></div>
    <div class="bd-row"><span>${tr.bdStarterFlour || '· Starter flour'}</span><strong>${fmtG(starterFlour)}</strong></div>
    <div class="bd-row"><span>${tr.bdStarterWater || '· Starter water'}</span><strong>${fmtG(starterWater)}</strong></div>
    <div class="bd-row"><span>${tr.bdSalt || 'Salt'}</span><strong>${fmtG(salt)}<span class="pct">${fmtPct(saltPct)}</span></strong></div>
    <div class="bd-divider"></div>
    <div class="bd-row bd-total"><span>${tr.bdTotalFlour || 'Total flour'}</span><strong>${fmtG(totalFlour)}</strong></div>
    <div class="bd-row bd-total"><span>${tr.bdTotalWater || 'Total water'}</span><strong>${fmtG(totalWater)}</strong></div>
    <div class="bd-row bd-total"><span>${tr.bdTotalDough || 'Total dough'}</span><strong>${fmtG(totalDough)}</strong></div>
  `;

  document.getElementById('result').classList.add('show');
}

function calculateScale() {
  const tr = t();
  const targetFlour = parseFloat(document.getElementById('sTargetFlour').value) || 0;
  const hydration = parseFloat(document.getElementById('sHydration').value) || 75;
  const starterPct = parseFloat(document.getElementById('sStarterPct').value) || 20;
  const saltPct = parseFloat(document.getElementById('sSaltPct').value) || 2;
  const starterHyd = parseFloat(document.getElementById('sStarterHyd2').value) || 100;

  if (targetFlour <= 0) { document.getElementById('result').classList.remove('show'); return; }

  // Target total flour = targetFlour (this is total, including starter flour)
  const starterTotal = targetFlour * (starterPct / 100);
  const starterFlour = starterTotal / (1 + starterHyd / 100);
  const starterWater = starterTotal - starterFlour;

  const mainFlour = targetFlour - starterFlour;
  const totalWaterTarget = targetFlour * (hydration / 100);
  const mainWater = totalWaterTarget - starterWater;
  const salt = targetFlour * (saltPct / 100);
  const totalDough = targetFlour + totalWaterTarget + salt;

  document.getElementById('resultLabel').textContent = tr.scaledRecipeLabel || 'Scaled recipe';
  document.getElementById('resultMain').textContent = fmtG(targetFlour) + ' ' + (tr.flour || 'flour');
  document.getElementById('resultSub').textContent = fmtPct(hydration) + ' ' + (tr.hydration || 'hydration') + ' · ' + fmtG(totalDough) + ' ' + (tr.totalDough || 'total dough');

  const bd = document.getElementById('breakdown');
  bd.innerHTML = `
    <div class="bd-row"><span>${tr.bdMainFlour || 'Main flour'}</span><strong>${fmtG(mainFlour)}</strong></div>
    <div class="bd-row"><span>${tr.bdMainWater || 'Main water'}</span><strong>${fmtG(mainWater)}</strong></div>
    <div class="bd-row"><span>${tr.bdStarter || 'Starter'}</span><strong>${fmtG(starterTotal)}<span class="pct">${fmtPct(starterPct)}</span></strong></div>
    <div class="bd-row"><span>${tr.bdStarterFlour || '· Starter flour'}</span><strong>${fmtG(starterFlour)}</strong></div>
    <div class="bd-row"><span>${tr.bdStarterWater || '· Starter water'}</span><strong>${fmtG(starterWater)}</strong></div>
    <div class="bd-row"><span>${tr.bdSalt || 'Salt'}</span><strong>${fmtG(salt)}<span class="pct">${fmtPct(saltPct)}</span></strong></div>
    <div class="bd-divider"></div>
    <div class="bd-row bd-total"><span>${tr.bdTotalFlour || 'Total flour'}</span><strong>${fmtG(targetFlour)}</strong></div>
    <div class="bd-row bd-total"><span>${tr.bdTotalWater || 'Total water'}</span><strong>${fmtG(totalWaterTarget)}</strong></div>
    <div class="bd-row bd-total"><span>${tr.bdTotalDough || 'Total dough'}</span><strong>${fmtG(totalDough)}</strong></div>
  `;

  document.getElementById('result').classList.add('show');
}

function calculateStarter() {
  const tr = t();
  const target = parseFloat(document.getElementById('stTarget').value) || 0;
  const ratioStr = document.getElementById('stRatio').value;
  const parts = ratioStr.split(':').map(Number);
  const [sPart, fPart, wPart] = parts;

  if (target <= 0) { document.getElementById('result').classList.remove('show'); return; }

  const totalParts = sPart + fPart + wPart;
  const starterAmount = target * (sPart / totalParts);
  const flourAmount = target * (fPart / totalParts);
  const waterAmount = target * (wPart / totalParts);

  document.getElementById('resultLabel').textContent = tr.starterBuildLabel || 'Starter build';
  document.getElementById('resultMain').textContent = fmtG(target);
  document.getElementById('resultSub').textContent = ratioStr + ' ' + (tr.ratio || 'ratio') + ' · ' + fmtPct(100) + ' ' + (tr.hydration || 'hydration');

  const bd = document.getElementById('breakdown');
  bd.innerHTML = `
    <div class="bd-row"><span>${tr.bdStarterSeed || 'Starter (seed)'}</span><strong>${fmtG(starterAmount)}</strong></div>
    <div class="bd-row"><span>${tr.bdFlourFeed || 'Flour (feed)'}</span><strong>${fmtG(flourAmount)}</strong></div>
    <div class="bd-row"><span>${tr.bdWaterFeed || 'Water (feed)'}</span><strong>${fmtG(waterAmount)}</strong></div>
    <div class="bd-divider"></div>
    <div class="bd-row bd-total"><span>${tr.bdTotalStarter || 'Total starter'}</span><strong>${fmtG(target)}</strong></div>
    <div class="bd-row"><span>${tr.bdRatio || 'Ratio'}</span><strong>${ratioStr}</strong></div>
  `;

  document.getElementById('result').classList.add('show');
}

window.switchMode = switchMode;
window.calculate = calculate;
window.copyShareLink = copyShareLink;
window.readUrlParams = readUrlParams;

document.addEventListener('DOMContentLoaded', function() {
  ['hFlour','hWater','hStarter','hSalt','hStarterHyd','sTargetFlour','sHydration','sStarterPct','sSaltPct','sStarterHyd2','stTarget'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculate);
  });
  const ratio = document.getElementById('stRatio');
  if (ratio) ratio.addEventListener('change', calculate);
});