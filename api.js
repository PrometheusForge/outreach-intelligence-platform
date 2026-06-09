const GEMINI_MODEL    = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// CORE API CALL 
async function callGemini(prompt, apiKey) {
  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.85,   // High creativity; adjust down to 0.6 for more conservative output
        topP: 0.95,
        maxOutputTokens: 1300
      }
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status} — check your API key.`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini. Try again.');
  return text;
}

// MAIN ORCHESTRATOR 
// Generates all platform outputs in sequence, threading context between emails.
// Order: emails (sequential) → LinkedIn → objection bank.
async function generateAll() {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  if (!apiKey) { alert('Paste your Gemini API key in the header first.'); return; }

  const config = getFormValues();
  if (!config) return;

  const seqLen    = parseInt(config.length);
  const steps     = EMAIL_SEQUENCE_MAP[seqLen];
  const totalSteps = seqLen + 2; // emails + LinkedIn + objections

  setGenerating(true);
  clearOutputs();
  showOutputSection();

  let done = 0;
  let previousSummary = null;

  try {
    // 1. GENERATE EMAILS SEQUENTIALLY 
    for (const step of steps) {
      updateProgress(`Writing Email ${step.num} of ${seqLen}: "${step.angle}"…`, (done / totalSteps) * 100);

      const prompt  = buildEmailPrompt(config, step, previousSummary);
      const raw     = await callGemini(prompt, apiKey);
      const parsed  = parseEmailOutput(raw, step);

      renderEmailCard(parsed, step);

      // Thread the one-sentence summary into the next email's context block
      previousSummary = parsed.internalSummary || `Email ${step.num} covered the "${step.angle}" angle.`;

      done++;
      // 2-second pause between calls — keeps well inside the 15 RPM free tier limit
      if (done < seqLen) await sleep(2000);
    }

    // 2. GENERATE LINKEDIN SEQUENCE 
    updateProgress('Building LinkedIn sequence…', (done / totalSteps) * 100);
    await sleep(2000);
    const liRaw    = await callGemini(buildLinkedInPrompt(config), apiKey);
    renderLinkedInOutput(parseLinkedInOutput(liRaw));
    done++;

    // 3. GENERATE OBJECTION BANK 
    updateProgress('Generating objection bank…', (done / totalSteps) * 100);
    await sleep(2000);
    const objRaw   = await callGemini(buildObjectionBankPrompt(config), apiKey);
    renderObjectionOutput(parseObjectionOutput(objRaw));
    done++;

    updateProgress('✅ Outreach suite complete!', 100);

  } catch (err) {
    showError(`⚠ ${err.message}`);
  } finally {
    setGenerating(false);
  }
}

// SINGLE EMAIL REGENERATION 
async function regenerateEmail(emailNum, config) {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  if (!apiKey) { alert('API key required.'); return; }

  const step = EMAIL_SEQUENCE_MAP[parseInt(config.length)][emailNum - 1];
  showEmailLoading(emailNum);

  try {
    const raw    = await callGemini(buildEmailPrompt(config, step, null), apiKey);
    const parsed = parseEmailOutput(raw, step);
    renderEmailCard(parsed, step);
  } catch (err) {
    showError(`Regeneration failed: ${err.message}`);
  }
}

// HELPERS 
const sleep = ms => new Promise(r => setTimeout(r, ms));

function getFormValues() {
  const product = document.getElementById('fieldProduct').value.trim();
  const icp     = document.getElementById('fieldIcp').value.trim();
  const goal    = document.getElementById('fieldGoal').value.trim();
  if (!product || !icp || !goal) {
    alert('Please fill in Product/Service, ICP, and Campaign Goal before generating.');
    return null;
  }
  return {
    product,
    icp,
    goal,
    length: document.getElementById('fieldLength').value,
    tone:   document.getElementById('fieldTone').value,
  };
}

function updateProgress(label, pct) {
  document.getElementById('progressLabel').textContent = label;
  document.getElementById('progressBar').style.width   = `${Math.min(100, Math.round(pct))}%`;
}

function setGenerating(on) {
  const btn  = document.getElementById('generateBtn');
  const prog = document.getElementById('progressContainer');
  btn.disabled      = on;
  btn.textContent   = on ? '⏳ Generating…' : '⚡ Generate Full Outreach Suite';
  prog.classList.toggle('hidden', !on);
}

// SINGLE REPLY ANALYSIS ORCHESTRATOR
async function analyzeReply() {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  if (!apiKey) { alert('Paste your Gemini API key in the header first.'); return; }

  const incomingReply = document.getElementById('fieldIncomingReply').value.trim();
  if (!incomingReply) { alert('Please paste an incoming prospect reply first.'); return; }

  const config = getFormValues(); // Reuses your existing helper
  if (!config) return;

  const btn = document.getElementById('analyzeReplyBtn');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '[ PROCESSING... ]';

  try {
    // buildReplyAnalyzerPrompt comes from prompts.js
    const prompt = buildReplyAnalyzerPrompt(incomingReply, config);
    const raw = await callGemini(prompt, apiKey);
    
    // Clean markdown if the LLM wraps the JSON
    const cleanJson = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanJson);
    
    if (typeof renderReplyOutput === 'function') {
      renderReplyOutput(parsedData);
    }
  } catch (err) {
    alert(`⚠ Reply Analysis failed: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}
