let generatedEmails = [];

// Tabs
function showTab(name, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active-tab');
    b.classList.add('text-gray-500');
  });
  document.getElementById(`tab${name.charAt(0).toUpperCase() + name.slice(1)}`).classList.remove('hidden');
  if (btn) { btn.classList.add('active-tab'); btn.classList.remove('text-gray-500'); }
}

// Email Card
function renderEmailCard(data, step) {
  generatedEmails[step.num - 1] = data;
  const id   = `ecard${step.num}`;
  const card = document.createElement('div');
  card.id    = id;
  card.className = 'email-card bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm';

  card.innerHTML = `
    <div class="px-4 py-3 bg-gray-50 border-b flex justify-between items-center cursor-pointer select-none"
         onclick="toggleCard('${id}')">
      <div>
        <span class="text-xs font-semibold text-indigo-500 uppercase tracking-wide">
          Email ${step.num} · Day ${step.day}
        </span>
        <p class="text-sm font-bold text-gray-800 mt-0.5">${step.angle}</p>
      </div>
      <div class="flex gap-3 items-center">
        <button onclick="event.stopPropagation(); regenEmail(${step.num})"
          class="text-xs text-gray-400 hover:text-indigo-600 transition">↺ Regen</button>
        <span id="${id}arrow" class="text-gray-400">▾</span>
      </div>
    </div>

    <div id="${id}body" class="p-4 space-y-3">

      <!-- Subject -->
      <div class="bg-indigo-50 rounded-lg p-3">
        <div class="flex justify-between mb-1">
          <span class="text-xs font-bold text-indigo-600 uppercase">Subject Line</span>
          <button class="text-xs text-indigo-500 hover:underline copy-btn">Copy</button>
        </div>
        <p class="text-sm font-semibold text-gray-800 subject-val">${esc(data.subject)}</p>
        <p class="text-xs text-gray-400 mt-1">Preview: ${esc(data.previewText)}</p>
      </div>

      <!-- Body -->
      <div>
        <div class="flex justify-between mb-1">
          <span class="text-xs font-bold text-gray-500 uppercase">Body</span>
          <button class="text-xs text-indigo-500 hover:underline copy-btn">Copy</button>
        </div>
        <p class="text-sm text-gray-700 whitespace-pre-line leading-relaxed body-val">${esc(data.body)}</p>
      </div>

      <!-- CTA -->
      <div class="bg-green-50 rounded-lg p-3 flex justify-between items-start gap-2">
        <div>
          <p class="text-xs font-bold text-green-700 uppercase mb-0.5">CTA</p>
          <p class="text-sm text-gray-800 cta-val">${esc(data.cta)}</p>
        </div>
        <button class="text-xs text-green-600 hover:underline flex-shrink-0 copy-btn">Copy</button>
      </div>

      <!-- Send time -->
      <p class="text-xs text-gray-400">📅 ${esc(data.bestSendTime)}</p>

      <!-- A/B Variants -->
      <details class="text-sm">
        <summary class="text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-indigo-600">A/B Subject Variants ▸</summary>
        <div class="mt-2 space-y-1">
          ${[data.variantA, data.variantB, data.variantC].map(v => `
            <div class="flex justify-between bg-gray-50 rounded px-3 py-1.5">
              <span class="text-xs text-gray-700">${esc(v)}</span>
              <button class="text-xs text-indigo-500 ml-2 copy-btn">Copy</button>
            </div>`).join('')}
        </div>
      </details>

      <!-- Why It Works -->
      <details>
        <summary class="text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-indigo-600">Why It Works ▸</summary>
        <p class="text-xs text-gray-500 italic mt-2 leading-relaxed">${esc(data.whyItWorks)}</p>
      </details>
    </div>`;

  // Wire up copy buttons by proximity to the value element
  const copyBtns = card.querySelectorAll('.copy-btn');
  const vals     = card.querySelectorAll('.subject-val, .body-val, .cta-val');
  copyBtns[0].onclick = () => copyText(data.subject);
  copyBtns[1].onclick = () => copyText(data.body);
  copyBtns[2].onclick = () => copyText(data.cta);
  copyBtns[3].onclick = () => copyText(data.variantA);
  copyBtns[4].onclick = () => copyText(data.variantB);
  copyBtns[5].onclick = () => copyText(data.variantC);

  const acc = document.getElementById('emailAccordion');
  const old = document.getElementById(id);
  old ? acc.replaceChild(card, old) : acc.appendChild(card);
}

// Linkedin Render
function renderLinkedInOutput(d) {
  document.getElementById('linkedinOutput').innerHTML = [
    { label: '🤝 Connection Request',   key: 'connectionRequest' },
    { label: '💬 Follow-Up DM 1 (Day 2)', key: 'dm1' },
    { label: '📩 Follow-Up DM 2 (Day 7)', key: 'dm2' },
    { label: '📞 Cold Voicemail Script', key: 'voicemail' },
  ].map(s => `
    <div class="bg-white border rounded-xl p-4">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-semibold text-gray-700">${s.label}</span>
        <button onclick="copyText(this.dataset.val)" data-val="${esc(d[s.key])}"
          class="text-xs text-indigo-500 hover:underline">Copy</button>
      </div>
      <p class="text-sm text-gray-600 whitespace-pre-line">${esc(d[s.key])}</p>
    </div>`).join('')
  + `<details class="bg-gray-50 rounded-xl p-4 border">
      <summary class="text-xs font-bold text-gray-500 uppercase cursor-pointer">Why This Works ▸</summary>
      <p class="text-xs text-gray-500 italic mt-2">${esc(d.whyItWorks)}</p>
     </details>`;
}

// Objection Render
function renderObjectionOutput(d) {
  document.getElementById('objectionsOutput').innerHTML =
    d.objections.map((o, i) => `
      <div class="bg-white border rounded-xl p-4 space-y-2">
        <p class="text-xs font-bold text-red-500 uppercase">Objection ${i + 1}</p>
        <p class="text-sm font-semibold text-gray-800">${esc(o.label)}</p>
        <div class="bg-green-50 rounded-lg p-3">
          <p class="text-xs font-bold text-green-700 mb-1">Your Response</p>
          <p class="text-sm text-gray-700">${esc(o.response)}</p>
          <button onclick="copyText(this.dataset.val)" data-val="${esc(o.response)}"
            class="text-xs text-green-600 hover:underline mt-1">Copy</button>
        </div>
        <div class="bg-yellow-50 rounded-lg p-3">
          <p class="text-xs font-bold text-yellow-700 mb-1">Bridge Question</p>
          <p class="text-sm text-gray-700">${esc(o.bridge)}</p>
        </div>
      </div>`).join('')
    + `<div class="bg-gray-50 border rounded-xl p-4">
        <p class="text-xs font-bold text-gray-600 uppercase mb-2">The Philosophy</p>
        <p class="text-xs text-gray-500 italic">${esc(d.philosophy)}</p>
       </div>`;
}

// Export all generated content in a structured text format for easy pasting into docs or email tools
function exportAll() {
  if (!generatedEmails.length) { alert('Generate a sequence first.'); return; }
  let out = `OUTREACH INTELLIGENCE EXPORT\nGenerated: ${new Date().toLocaleDateString()}\n${'═'.repeat(50)}\n\n`;
  generatedEmails.forEach(e => {
    if (!e) return;
    out += `EMAIL ${e.step.num} — DAY ${e.step.day}: ${e.step.angle}\n${'-'.repeat(40)}\n`;
    out += `SUBJECT: ${e.subject}\nPREVIEW: ${e.previewText}\n\n${e.body}\n\nCTA: ${e.cta}\n`;
    out += `SEND: ${e.bestSendTime}\n\nA/B VARIANTS:\n  A: ${e.variantA}\n  B: ${e.variantB}\n  C: ${e.variantC}\n\n`;
  });
  navigator.clipboard.writeText(out).then(() => toast('✅ Copied! Paste into Google Docs, Notion, or your email tool.'));
}

// Utilities
function copyText(text) { navigator.clipboard.writeText(text || '').then(() => toast('✅ Copied!')); }

function toast(msg) {
  const el = Object.assign(document.createElement('div'), {
    className: 'fixed bottom-5 right-5 bg-gray-800 text-white text-xs px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity',
    textContent: msg
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

function toggleCard(id) {
  const body  = document.getElementById(`${id}body`);
  const arrow = document.getElementById(`${id}arrow`);
  body.classList.toggle('hidden');
  arrow.textContent = body.classList.contains('hidden') ? '▸' : '▾';
}

// Sanitize strings before injecting into innerHTML
function esc(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function clearOutputs() {
  ['emailAccordion','linkedinOutput','objectionsOutput'].forEach(id =>
    document.getElementById(id).innerHTML = '');
  generatedEmails = [];
}

function showOutputSection() {
  document.getElementById('outputSection').classList.remove('hidden');
  showTab('emails', document.querySelector('.tab-btn'));
}

function showError(msg) {
  document.getElementById('emailAccordion').innerHTML =
    `<div class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">${esc(msg)}</div>`;
}

function showEmailLoading(num) {
  const card = document.getElementById(`ecard${num}`);
  if (card) card.querySelector(`#ecard${num}body`).innerHTML =
    `<p class="text-sm text-gray-400 animate-pulse p-4">Regenerating…</p>`;
}

function regenEmail(num) {
  const config = getFormValues();
  if (config) regenerateEmail(num, config);
}