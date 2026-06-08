// DATA STORE 
// Keyed by email number. Avoids escaping content in onclick attributes.
const _store = {};

// HTML ESCAPE 
function esc(s) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// API KEY BADGE 
function onApiKeyInput(val) {
  const badge = document.getElementById('apiBadge');
  badge.classList.toggle('on', val.length > 10);
}

// TEMPLATE PILLS 
function pickTemplate(btn, key) {
  document.querySelectorAll('.s-pill').forEach(p => p.classList.remove('selected'));
  btn.classList.add('selected');
  if (typeof applyTemplate === 'function') applyTemplate(key);
}

// TABS 
function showTab(name, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.s-tab').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  const panel = document.getElementById('tab' + name);
  if (panel) panel.classList.remove('hidden');
  if (btn) {
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
  }
}

// PROGRESS DOTS 
function buildProgressDots() {
  const seqLen = parseInt(document.getElementById('fieldLength').value) || 5;
  const total  = seqLen + 2; // emails + linkedin + objections
  const wrap   = document.getElementById('progressDots');
  wrap.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const d = document.createElement('span');
    d.className = 's-dot';
    d.id = 'sdot' + i;
    wrap.appendChild(d);
  }
}

function updateProgress(label, pct) {
  const labelEl = document.getElementById('progressLabel');
  if (labelEl) labelEl.textContent = label;

  const dots  = document.querySelectorAll('.s-dot');
  const total = dots.length;
  if (!total) return;

  const done = pct >= 100 ? total : Math.floor((pct / 100) * total);
  dots.forEach((d, i) => {
    d.className = 's-dot'
      + (i < done ? ' done' : (i === done && pct < 100) ? ' pulse' : '');
  });
}

// GENERATE STATE 
function setGenerating(on) {
  const btn  = document.getElementById('generateBtn');
  const prog = document.getElementById('progressContainer');

  btn.disabled    = on;
  btn.textContent = on ? '⏳ Generating…' : '⚡ Generate Full Outreach Suite';

  if (on) {
    buildProgressDots();
    prog.classList.add('on');
  } else {
    prog.classList.remove('on');
  }
}

// CLEAR & SHOW 
function clearOutputs() {
  ['emailTimeline', 'linkedinOutput', 'objectionsOutput']
    .forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = ''; });
  Object.keys(_store).forEach(k => delete _store[k]);
}

function showOutputSection() {
  const out = document.getElementById('outputSection');
  if (out) out.classList.remove('hidden');
  showTab('Emails', document.querySelector('.s-tab'));
}

function showError(msg) {
  const tl = document.getElementById('emailTimeline');
  if (tl) tl.innerHTML = `<div class="s-error">${esc(msg)}</div>`;
}

function showEmailLoading(num) {
  const body = document.getElementById('ebody' + num);
  if (body && body.classList.contains('open')) {
    const inner = body.querySelector('.s-ecard-inner');
    if (inner) inner.innerHTML =
      '<p style="font-family:var(--f-mono);font-size:11px;color:var(--text-lo);padding:4px 0">Regenerating…</p>';
  }
}

// EMAIL CARD 
function renderEmailCard(data, step) {
  _store[step.num] = data;

  // Build the entry node without any inline event handlers
  const entry = document.createElement('div');
  entry.className = 's-entry';

  entry.innerHTML = `
    <div class="s-entry-rail" aria-hidden="true">
      <div class="s-rail-dot"></div>
      <span class="s-rail-day">D${step.day}</span>
    </div>

    <div class="s-ecard" id="ec${step.num}">

      <!--  Header (toggle)  -->
      <div class="s-ecard-head" role="button"
           aria-expanded="false" aria-controls="ebody${step.num}"
           id="ehead${step.num}">
        <span class="s-ecard-num">E${step.num}</span>
        <div class="s-ecard-meta">
          <div class="s-ecard-angle">${esc(step.angle)}</div>
          <div class="s-ecard-subj" title="${esc(data.subject)}">${esc(data.subject)}</div>
        </div>
        <div class="s-ecard-acts">
          <button class="s-btn-regen" title="Regenerate this email" aria-label="Regenerate email ${step.num}">↺</button>
          <span class="s-caret" id="caret${step.num}" aria-hidden="true">▾</span>
        </div>
      </div>

      <!--  Body (collapsible)  -->
      <div class="s-ecard-body" id="ebody${step.num}" role="region" aria-labelledby="ehead${step.num}">
        <div class="s-ecard-inner">

          <!-- Subject -->
          <div class="s-block-row">
            <div class="s-block">
              <span class="s-block-key">Subject</span>
              <div class="s-block-val subj">${esc(data.subject)}</div>
              <div class="s-block-val preview">Preview: ${esc(data.previewText)}</div>
            </div>
            <button class="s-btn-copy" data-field="subject" aria-label="Copy subject line">copy</button>
          </div>

          <!-- Body -->
          <div class="s-block-row">
            <div class="s-block" style="flex:1;min-width:0">
              <span class="s-block-key">Body</span>
              <div class="s-block-val body-copy">${esc(data.body)}</div>
            </div>
            <button class="s-btn-copy" data-field="body" aria-label="Copy email body">copy</button>
          </div>

          <!-- CTA -->
          <div class="s-cta">
            <div class="s-cta-inner">
              <div class="s-cta-lbl">Call to Action</div>
              <div class="s-cta-text">${esc(data.cta)}</div>
            </div>
            <button class="s-btn-copy" data-field="cta" aria-label="Copy call to action">copy</button>
          </div>

          <!-- Send time -->
          <div class="s-send-time">📅 ${esc(data.bestSendTime)}</div>

          <!-- A/B Variants (expandable) -->
          <div class="s-expand-wrap">
            <button class="s-expand-hd" id="abhd${step.num}" aria-expanded="false"
                    aria-controls="ab${step.num}">
              <span class="arr" aria-hidden="true">▶</span> A/B Subject Variants
            </button>
            <div class="s-expand-body" id="ab${step.num}" role="region">
              <div class="s-ab-row">
                <span class="s-ab-ltr">A</span>
                <span class="s-ab-txt">${esc(data.variantA)}</span>
                <button class="s-btn-copy" data-field="variantA" aria-label="Copy variant A">copy</button>
              </div>
              <div class="s-ab-row">
                <span class="s-ab-ltr">B</span>
                <span class="s-ab-txt">${esc(data.variantB)}</span>
                <button class="s-btn-copy" data-field="variantB" aria-label="Copy variant B">copy</button>
              </div>
              <div class="s-ab-row">
                <span class="s-ab-ltr">C</span>
                <span class="s-ab-txt">${esc(data.variantC)}</span>
                <button class="s-btn-copy" data-field="variantC" aria-label="Copy variant C">copy</button>
              </div>
            </div>
          </div>

          <!-- Why It Works (expandable) -->
          <div class="s-expand-wrap">
            <button class="s-expand-hd" id="whyhd${step.num}" aria-expanded="false"
                    aria-controls="why${step.num}">
              <span class="arr" aria-hidden="true">▶</span> Why It Works
            </button>
            <div class="s-expand-body" id="why${step.num}" role="region">
              <div class="s-why">${esc(data.whyItWorks)}</div>
            </div>
          </div>

        </div>
      </div>
    </div>`;

  // Wire interactions via closures (safe — no escaping needed) 

  // Header toggle
  const head = entry.querySelector('.s-ecard-head');
  head.addEventListener('click', () => _toggleCard(step.num));

  // Regen button
  const regenBtn = entry.querySelector('.s-btn-regen');
  regenBtn.addEventListener('click', e => { e.stopPropagation(); regenEmail(step.num); });

  // Copy buttons — look up value from _store at click time
  entry.querySelectorAll('[data-field]').forEach(btn => {
    const field = btn.dataset.field;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      copyText(_store[step.num]?.[field] || '', btn);
    });
  });

  // Expand toggles
  entry.querySelector('#abhd' + step.num).addEventListener('click', () =>
    _toggleExpand('ab' + step.num, 'abhd' + step.num));
  entry.querySelector('#whyhd' + step.num).addEventListener('click', () =>
    _toggleExpand('why' + step.num, 'whyhd' + step.num));

  // Append or replace
  const tl  = document.getElementById('emailTimeline');
  const old = document.getElementById('ec' + step.num);
  if (old) {
    const oldEntry = old.closest('.s-entry');
    oldEntry ? tl.replaceChild(entry, oldEntry) : tl.appendChild(entry);
  } else {
    tl.appendChild(entry);
  }

  // Auto-open first card
  if (step.num === 1) _toggleCard(1);
}

function _toggleCard(num) {
  const body  = document.getElementById('ebody' + num);
  const caret = document.getElementById('caret' + num);
  const head  = document.getElementById('ehead' + num);
  if (!body) return;
  const isOpen = body.classList.toggle('open');
  if (caret) caret.classList.toggle('open', isOpen);
  if (head)  head.setAttribute('aria-expanded', isOpen);
}

function _toggleExpand(contentId, btnId) {
  const body = document.getElementById(contentId);
  const btn  = document.getElementById(btnId);
  if (!body || !btn) return;
  const isOpen = body.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
  btn.setAttribute('aria-expanded', isOpen);
}

// LINKEDIN RENDER 
function renderLinkedInOutput(d) {
  const container = document.getElementById('linkedinOutput');
  if (!container) return;

  const sections = [
    { title: '🤝 Connection Request',        key: 'connectionRequest', delay: '0.04s' },
    { title: '💬 Follow-Up DM 1 — Day 2',   key: 'dm1',               delay: '0.12s' },
    { title: '📩 Follow-Up DM 2 — Day 7',   key: 'dm2',               delay: '0.20s' },
    { title: '📞 Voicemail Script',          key: 'voicemail',         delay: '0.28s' },
  ];

  // Build cards
  container.innerHTML = sections.map(s => `
    <div class="s-li-card" style="animation-delay:${s.delay}">
      <div class="s-li-head">
        <span class="s-li-title">${s.title}</span>
      </div>
      <div class="s-li-body">${esc(d[s.key])}</div>
    </div>
  `).join('');

  if (d.whyItWorks) {
    container.innerHTML += `
      <div class="s-li-card" style="animation-delay:0.36s">
        <div class="s-li-head">
          <span class="s-li-title" style="font-style:italic;color:var(--text-mid)">Why This Sequence Works</span>
        </div>
        <div class="s-li-body" style="font-style:italic">${esc(d.whyItWorks)}</div>
      </div>`;
  }

  // Wire copy buttons after rendering (values from d object via closure)
  const cards = container.querySelectorAll('.s-li-card');
  sections.forEach((s, i) => {
    if (!cards[i]) return;
    const val     = d[s.key] || '';
    const copyBtn = document.createElement('button');
    copyBtn.className    = 's-btn-copy';
    copyBtn.textContent  = 'copy';
    copyBtn.setAttribute('aria-label', 'Copy ' + s.title);
    copyBtn.addEventListener('click', () => copyText(val, copyBtn));
    cards[i].querySelector('.s-li-head').appendChild(copyBtn);
  });
}

// OBJECTION BANK RENDER 
function renderObjectionOutput(d) {
  const container = document.getElementById('objectionsOutput');
  if (!container) return;

  container.innerHTML = d.objections.map((o, i) => `
    <div class="s-obj-card" style="animation-delay:${(i * 0.08).toFixed(2)}s">
      <span class="s-obj-n">Objection ${i + 1}</span>
      <div class="s-obj-lbl">${esc(o.label)}</div>
      <div class="s-obj-resp">
        <span class="s-obj-resp-key">Your Response</span>
        <p class="s-obj-resp-val">${esc(o.response)}</p>
      </div>
      <div class="s-obj-bridge">
        <div class="s-obj-bridge-key">Bridge Question</div>
        <div class="s-obj-bridge-val">${esc(o.bridge)}</div>
      </div>
    </div>
  `).join('');

  if (d.philosophy) {
    container.innerHTML += `
      <div class="s-philosophy">
        <div class="s-philosophy-key">The Philosophy</div>
        <p class="s-philosophy-val">${esc(d.philosophy)}</p>
      </div>`;
  }

  // Wire copy buttons on response blocks
  const cards = container.querySelectorAll('.s-obj-card');
  d.objections.forEach((o, i) => {
    const card = cards[i];
    if (!card) return;
    const resp    = card.querySelector('.s-obj-resp');
    const copyBtn = document.createElement('button');
    copyBtn.className   = 's-btn-copy';
    copyBtn.textContent = 'copy response';
    copyBtn.style.marginTop   = '6px';
    copyBtn.style.alignSelf   = 'flex-start';
    copyBtn.setAttribute('aria-label', 'Copy response to objection ' + (i + 1));
    const respText = o.response;
    copyBtn.addEventListener('click', () => copyText(respText, copyBtn));
    resp.appendChild(copyBtn);
  });
}

// EXPORT ALL 
function exportAll() {
  const emails = Object.values(_store).filter(Boolean);
  if (!emails.length) { alert('Generate a sequence first.'); return; }

  let out = `SIGNAL — OUTREACH SUITE EXPORT\nGenerated: ${new Date().toLocaleDateString()}\n${''.repeat(52)}\n\n`;

  emails.forEach(e => {
    if (!e?.step) return;
    out += `EMAIL ${e.step.num}  ·  DAY ${e.step.day}  ·  ${e.step.angle}\n${''.repeat(44)}\n`;
    out += `SUBJECT: ${e.subject}\nPREVIEW: ${e.previewText}\n\n`;
    out += `${e.body}\n\nCTA: ${e.cta}\nSEND: ${e.bestSendTime}\n\n`;
    out += `A/B VARIANTS:\n  A: ${e.variantA}\n  B: ${e.variantB}\n  C: ${e.variantC}\n\n`;
  });

  copyText(out);
}

// COPY UTILITY 
function copyText(text, btn) {
  navigator.clipboard.writeText(text || '')
    .then(() => {
      if (btn) {
        const prev = btn.textContent;
        btn.textContent = '✓ done';
        btn.classList.add('ok');
        setTimeout(() => {
          btn.textContent = prev;
          btn.classList.remove('ok');
        }, 1800);
      } else {
        _toast('✓ Copied to clipboard');
      }
    })
    .catch(() => _toast('Copy failed — please select manually'));
}

function _toast(msg) {
  const el      = document.createElement('div');
  el.className  = 's-toast';
  el.textContent = msg;
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

// REGEN BRIDGE 
function regenEmail(num) {
  const config = typeof getFormValues === 'function' ? getFormValues() : null;
  if (config && typeof regenerateEmail === 'function') regenerateEmail(num, config);
}
