const GROQ_MODEL    = 'llama-3.3-70b-versatile';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

async function callGroq(prompt, apiKey, temp = 0.85, isJsonMode = false) {
  const bodyPayload = {
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: temp,
    top_p: 0.90,
    max_completion_tokens: 1300
  };
  
  if (isJsonMode) {
    bodyPayload.response_format = { type: "json_object" };
  }

  const res = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(bodyPayload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  const text = data?.choices?.?.message?.content;
  if (!text) throw new Error('Empty response from Groq.');
  return text;
}

// MAIN ORCHESTRATOR
async function generateAll() {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  if (!apiKey) { alert('Paste your Groq API key in the header first.'); return; }

  const config = getFormValues();
  if (!config) return;

  // Read toggle states
  const runEmails = document.getElementById('modEmails').checked;
  const runLinkedIn = document.getElementById('modLinkedIn').checked;
  const runObjections = document.getElementById('modObjections').checked;
  const runSim = document.getElementById('modSimulator').checked;
  const runReply = document.getElementById('modReply').checked;

  if (!runEmails && !runLinkedIn && !runObjections && !runSim && !runReply) {
    alert('⚠ Please select at least one outcome to generate.');
    return;
  }

  // Simulator failsafe: You can't simulate emails if you aren't generating them
  if (runSim && !runEmails) {
    alert('⚠ Pre-Flight Simulator requires the 01_EMAILS module to be checked.');
    return;
  }

  const seqLen = parseInt(config.length);
  const steps = typeof EMAIL_SEQUENCE_MAP !== 'undefined' ? EMAIL_SEQUENCE_MAP[seqLen] : [];
  
  // Calculate dynamic loading steps
  let totalSteps = 0;
  if (runEmails) totalSteps += seqLen;
  if (runLinkedIn) totalSteps += 1;
  if (runObjections) totalSteps += 1;
  if (runSim) totalSteps += 1;
  if (runReply) totalSteps += 1;

  setGenerating(true, totalSteps);
  clearOutputs();
  
  // show selected tabs immediately
  if (typeof showOutputSection === 'function') {
    showOutputSection(runEmails, runLinkedIn, runObjections, runSim, runReply);
  }

  let done = 0;
  let previousSummary = null;

  try {
    // A-GENERATE EMAILS 
    if (runEmails) {
      for (const step of steps) {
        updateProgress(`Writing Email ${step.num} of ${seqLen}: "${step.angle}"…`, (done / totalSteps) * 100);
        const prompt = buildEmailPrompt(config, step, previousSummary);
        const raw = await callGroq(prompt, apiKey);
        const parsed = parseEmailOutput(raw, step);
        renderEmailCard(parsed, step);
        previousSummary = parsed.internalSummary || `Email ${step.num} covered the "${step.angle}" angle.`;
        
        done++;
        if (done < totalSteps) await sleep(2000);
      }
    }

    // B-GENERATE LINKEDIN
    if (runLinkedIn) {
      updateProgress('Building LinkedIn network strategy…', (done / totalSteps) * 100);
      const liRaw = await callGroq(buildLinkedInPrompt(config), apiKey);
      renderLinkedInOutput(parseLinkedInOutput(liRaw));
      
      done++;
      if (done < totalSteps) await sleep(2000);
    }

    // C-GENERATE OBJECTIONS 
    if (runObjections) {
      updateProgress('Generating threat objection bank…', (done / totalSteps) * 100);
      const objRaw = await callGroq(buildObjectionBankPrompt(config), apiKey);
      renderObjectionOutput(parseObjectionOutput(objRaw));
      done++;
      if (done < totalSteps) await sleep(2000);
    }

    // D-PRE-FLIGHT SIMULATOR
    if (runSim) {
      updateProgress('Running prospect stress-test simulation…', (done / totalSteps) * 100);
      const emails = Object.values(_store).filter(Boolean);
      const simPrompt = buildPerformanceSimulatorPrompt(emails, config);
      const simRaw = await callGroq(simPrompt, apiKey);
      
      let cleanSim = simRaw.replace(/```json/gi, '').replace(/```/g, '').trim();
      const simMatch = cleanSim.match(/\{[\s\S]*\}/);
      if (!simMatch) throw new Error("Failed to extract JSON object from Simulator response.");
      
      const simJson = JSON.parse(simMatch[0]);
      renderSimulatorOutput(simJson);
      done++;
      if (done < totalSteps) await sleep(2000);
    }

    // E-MOCK REPLY ANALYSIS
    if (runReply) {
      updateProgress('Generating Day-0 Mock Reply Playbook…', (done / totalSteps) * 100);
      const mockReply = `Thanks for reaching out, but we are currently using another vendor for this and aren't looking to switch right now.`;
      
      const replyBox = document.getElementById('fieldIncomingReply');
      if (replyBox) replyBox.value = mockReply;

      const replyPrompt = buildReplyAnalyzerPrompt(mockReply, config);
      const replyRaw = await callGroq(replyPrompt, apiKey);
      
      let cleanRep = replyRaw.replace(/```json/gi, '').replace(/```/g, '').trim();
      const repMatch = cleanRep.match(/\{[\s\S]*\}/);
      if (!repMatch) throw new Error("Failed to extract JSON object from Reply response.");
      
      const replyJson = JSON.parse(repMatch[0]);
      renderReplyOutput(replyJson);
      done++;
    }

    updateProgress('✅ Full execution complete!', 100);

  } catch (err) {
    // Alert user
    alert(`⚠ Execution Failed:\n\n${err.message}`);
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
    const raw    = await callGroq(buildEmailPrompt(config, step, null), apiKey);
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
  if (!apiKey) { alert('Paste your Groq API key in the header first.'); return; }

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
    const raw = await callGroq(prompt, apiKey, 0.1, true);
    
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
  if (!apiKey) { alert('Paste your Groq API key in the header first.'); return; }

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
    const raw = await callGroq(prompt, apiKey, 0.1, true);
    const parsedData = JSON.parse(raw);
    
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
