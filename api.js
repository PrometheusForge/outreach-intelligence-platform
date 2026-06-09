const GROQ_MODEL    = 'llama-3.3-70b-versatile';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

// CORE API CALL 
async function callGroq(prompt, apiKey) {
  const res = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}` 
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.85,
      top_p: 0.95,
      max_completion_tokens: 1300
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status} — check your API key.`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from Groq. Try again.');
  return text;
}

// MAIN ORCHESTRATOR 
// Generates all platform outputs in sequence, threading context between emails.
// Order: emails (sequential) → LinkedIn → objection bank.
async function generateAll() {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  if (!apiKey) { alert('Paste your Groq API key in the header first.'); return; }

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
      const raw     = await callGroq(prompt, apiKey);
      const parsed  = parseEmailOutput(raw, step);

      renderEmailCard(parsed, step);

      // Thread the one-sentence summary into the next email's context block
      previousSummary = parsed.internalSummary || `Email ${step.num} covered the "${step.angle}" angle.`;

      done++;
      // 2-second pause between calls — keeps well inside the 30 RPM free tier limit
      if (done < seqLen) await sleep(2000);
    }

    // 2. GENERATE LINKEDIN SEQUENCE 
    updateProgress('Building LinkedIn sequence…', (done / totalSteps) * 100);
    await sleep(2000);
    const liRaw    = await callGroq(buildLinkedInPrompt(config), apiKey);
    renderLinkedInOutput(parseLinkedInOutput(liRaw));
    done++;

    // 3. GENERATE OBJECTION BANK 
    updateProgress('Generating objection bank…', (done / totalSteps) * 100);
    await sleep(2000);
    const objRaw   = await callGroq(buildObjectionBankPrompt(config), apiKey);
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
    const raw    = await callGroq(buildEmailPrompt(config, step, null), apiKey);
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
