const GEMINI_MODEL    = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function callGemini(prompt, apiKey) {
  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.85,   // High creativity;
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
async function generateAll() {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  if (!apiKey) { alert('Paste your Gemini API key in the header first.'); return; }

  const config = getFormValues();
  if (!config) return;

  // 1. Read toggle states
  const runEmails = document.getElementById('modEmails').checked;
  const runLinkedIn = document.getElementById('modLinkedIn').checked;
  const runObjections = document.getElementById('modObjections').checked;

  if (!runEmails && !runLinkedIn && !runObjections) {
    alert('⚠ Please select at least one module to generate.');
    return;
  }

  const seqLen = parseInt(config.length);
  const steps = typeof EMAIL_SEQUENCE_MAP !== 'undefined' ? EMAIL_SEQUENCE_MAP[seqLen] : []; // Fallback safeguard
  
  // 2. Calculate dynamic loading steps
  let totalSteps = 0;
  if (runEmails) totalSteps += seqLen;
  if (runLinkedIn) totalSteps += 1;
  if (runObjections) totalSteps += 1;

  setGenerating(true, totalSteps);
  clearOutputs();
  showOutputSection(runEmails, runLinkedIn, runObjections);

  let done = 0;
  let previousSummary = null;

  try {
    // GENERATE EMAILS 
    if (runEmails) {
      for (const step of steps) {
        updateProgress(`Writing Email ${step.num} of ${seqLen}: "${step.angle}"…`, (done / totalSteps) * 100);
        const prompt  = buildEmailPrompt(config, step, previousSummary);
        const raw     = await callGemini(prompt, apiKey);
        const parsed  = parseEmailOutput(raw, step);
        renderEmailCard(parsed, step);
        previousSummary = parsed.internalSummary || `Email ${step.num} covered the "${step.angle}" angle.`;
        
        done++;
        if (done < totalSteps) await sleep(2000);
      }
    }

    // GENERATE LINKEDIN 
    if (runLinkedIn) {
      updateProgress('Building LinkedIn network strategy…', (done / totalSteps) * 100);
      const liRaw = await callGemini(buildLinkedInPrompt(config), apiKey);
      renderLinkedInOutput(parseLinkedInOutput(liRaw));
      
      done++;
      if (done < totalSteps) await sleep(2000);
    }

    // C. GENERATE OBJECTIONS 
    if (runObjections) {
      updateProgress('Generating threat objection bank…', (done / totalSteps) * 100);
      const objRaw = await callGemini(buildObjectionBankPrompt(config), apiKey);
      renderObjectionOutput(parseObjectionOutput(objRaw));
      
      done++;
    }

    updateProgress('✅ Execution complete!', 100);

  } catch (err) {
    showError(`⚠ ${err.message}`);
  } finally {
    setGenerating(false);
  }
}

// Single email regeneration
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

  const config = getFormValues();
  if (!config) return;

  const btn = document.getElementById('analyzeReplyBtn');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '[ PROCESSING... ]';

  try {
    const prompt = buildReplyAnalyzerPrompt(incomingReply, config);
    const raw = await callGemini(prompt, apiKey);
    
    // Clean if LLM wraps the JSON
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

// PRE-FLIGHT SIMULATOR
async function runSimulator() {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  if (!apiKey) { alert('Paste your Gemini API key in the header first.'); return; }

  const emails = Object.values(_store).filter(Boolean);
  if (emails.length === 0) { 
    alert('You must generate an Outreach Suite first before running a simulation.'); 
    return; 
  }

  const config = getFormValues();
  if (!config) return;

  const btn = document.getElementById('runSimBtn');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '[ SIMULATING PROSPECT REACTION... ]';

  try {
    const prompt = buildPerformanceSimulatorPrompt(emails, config);
    const raw = await callGemini(prompt, apiKey);
    
    const cleanJson = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanJson);
    
    // Send to UI renderer
    if (typeof renderSimulatorOutput === 'function') {
      renderSimulatorOutput(parsedData);
    }
  } catch (err) {
    alert(`⚠ Simulation failed: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}
