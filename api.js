const SUPABASE_URL = 'https://bfgqgbhxulibxfqaayar.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZ3FnYmh4dWxpYnhmcWFheWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NzQxNjQsImV4cCI6MjA5NjE1MDE2NH0.8a3S4qQNzSB494mGNB7kZ3h36LsxlYi7ang-DCOnSWw';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentCampaignId = null;
const GROQ_MODEL    = 'llama-3.3-70b-versatile';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

const SCHEMA_EMAIL = {
  type: "object",
  properties: {
    SUBJECT: { type: "string" }, PREVIEW_TEXT: { type: "string" }, BODY: { type: "string" },
    CTA: { type: "string" }, SEND_DAY: { type: "string" }, BEST_SEND_TIME: { type: "string" },
    WHY_IT_WORKS: { type: "string" }, INTERNAL_SUMMARY: { type: "string" },
    VARIANT_SUBJECT_A: { type: "string" }, VARIANT_SUBJECT_B: { type: "string" }, VARIANT_SUBJECT_C: { type: "string" }
  },
  required: ["SUBJECT", "PREVIEW_TEXT", "BODY", "CTA", "SEND_DAY", "BEST_SEND_TIME", "WHY_IT_WORKS", "INTERNAL_SUMMARY", "VARIANT_SUBJECT_A", "VARIANT_SUBJECT_B", "VARIANT_SUBJECT_C"],
  additionalProperties: false
};

const SCHEMA_LINKEDIN = {
  type: "object",
  properties: {
    connection_request: { type: "string" }, dm_1: { type: "string" }, dm_2: { type: "string" },
    voicemail_script: { type: "string" }, why_it_works: { type: "string" }
  },
  required: ["connection_request", "dm_1", "dm_2", "voicemail_script", "why_it_works"],
  additionalProperties: false
};

const SCHEMA_OBJECTIONS = {
  type: "object",
  properties: {
    OBJECTION_1: { type: "string" }, RESPONSE_1: { type: "string" }, BRIDGE_QUESTION_1: { type: "string" },
    OBJECTION_2: { type: "string" }, RESPONSE_2: { type: "string" }, BRIDGE_QUESTION_2: { type: "string" },
    OBJECTION_3: { type: "string" }, RESPONSE_3: { type: "string" }, BRIDGE_QUESTION_3: { type: "string" },
    OBJECTION_4: { type: "string" }, RESPONSE_4: { type: "string" }, BRIDGE_QUESTION_4: { type: "string" },
    OBJECTION_5: { type: "string" }, RESPONSE_5: { type: "string" }, BRIDGE_QUESTION_5: { type: "string" },
    OBJECTION_PHILOSOPHY: { type: "string" }
  },
  required: ["OBJECTION_1", "RESPONSE_1", "BRIDGE_QUESTION_1", "OBJECTION_2", "RESPONSE_2", "BRIDGE_QUESTION_2", "OBJECTION_3", "RESPONSE_3", "BRIDGE_QUESTION_3", "OBJECTION_4", "RESPONSE_4", "BRIDGE_QUESTION_4", "OBJECTION_5", "RESPONSE_5", "BRIDGE_QUESTION_5", "OBJECTION_PHILOSOPHY"],
  additionalProperties: false
};

async function callGroq(prompt, apiKey, temp = 0.85, isJsonMode = false, jsonSchema = null, tools = null) {
  const bodyPayload = {
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: temp,
    top_p: 0.90,
    max_completion_tokens: 1300
  };
  
  if (jsonSchema) {
    bodyPayload.response_format = {
      type: "json_schema",
      json_schema: {
        name: "strict_output_schema",
        strict: true,
        schema: jsonSchema
      }
    };
  } else if (isJsonMode) {
    bodyPayload.response_format = { type: "json_object" };
  }

  if (tools) {
    bodyPayload.tools = tools;
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
  
  if (data?.choices?.[0]?.message?.tool_calls) {
    return { isToolCall: true, tools: data.choices[0].message.tool_calls };
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from Groq.');
  return text;
}

async function generateAll() {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  if (!apiKey) { alert('Paste your Groq API key in the header first.'); return; }

  const config = getFormValues();
  if (!config) return;

  const runEmails = document.getElementById('modEmails').checked;
  const runLinkedIn = document.getElementById('modLinkedIn').checked;
  const runObjections = document.getElementById('modObjections').checked;
  const runSim = document.getElementById('modSimulator').checked;
  const runReply = document.getElementById('modReply').checked;

  if (!runEmails && !runLinkedIn && !runObjections && !runSim && !runReply) {
    alert('⚠ Please select at least one outcome to generate.');
    return;
  }

  if (runSim && !runEmails) {
    alert('⚠ Pre-Flight Simulator requires the 01_EMAILS module to be checked.');
    return;
  }

  const seqLen = parseInt(config.length);
  const steps = typeof EMAIL_SEQUENCE_MAP !== 'undefined' ? EMAIL_SEQUENCE_MAP[seqLen] : [];
  
  let totalSteps = 0;
  if (runEmails) totalSteps += seqLen;
  if (runLinkedIn) totalSteps += 1;
  if (runObjections) totalSteps += 1;
  if (runSim) totalSteps += 1;
  if (runReply) totalSteps += 1;

  setGenerating(true, totalSteps);
  clearOutputs();
  
  if (typeof showOutputSection === 'function') {
    showOutputSection(runEmails, runLinkedIn, runObjections, runSim, runReply);
  }

  let done = 0;
  let previousSummary = null;

  try {
    const { data: campaignData, error: campErr } = await supabaseClient
      .from('campaign_briefs')
      .insert([{ product: config.product, icp: config.icp, goal: config.goal }])
      .select()
      .single();

    if (!campErr && campaignData) {
      currentCampaignId = campaignData.id;
    } else {
      console.error("Supabase Campaign Insert Error:", campErr);
    }

    // A-GENERATE EMAILS 
    if (runEmails) {
      for (const step of steps) {
        updateProgress(`Writing Email ${step.num} of ${seqLen}: "${step.angle}"…`, (done / totalSteps) * 100);
        const prompt = buildEmailPrompt(config, step, previousSummary);
        const raw = await callGroq(prompt, apiKey);
        const parsed = parseEmailOutput(raw, step);
        renderEmailCard(parsed, step);
        previousSummary = parsed.internalSummary || `Email ${step.num} covered the "${step.angle}" angle.`;
        
        if (currentCampaignId) {
          await supabaseClient.from('email_sequences').insert([{
            campaign_id: currentCampaignId,
            step_number: step.num,
            angle: step.angle,
            subject_line: parsed.subject,
            body: parsed.body,
            cta: parsed.cta,
            ab_variants: { a: parsed.variantA, b: parsed.variantB, c: parsed.variantC },
            why_it_works: parsed.whyItWorks
          }]);
        }

        done++;
        if (done < totalSteps) await sleep(2000);
      }
    }

    // B-GENERATE LINKEDIN
    if (runLinkedIn) {
      updateProgress('Building LinkedIn network strategy…', (done / totalSteps) * 100);
      const liRaw = await callGroq(buildLinkedInPrompt(config), apiKey);
      const parsedLi = parseLinkedInOutput(liRaw);
      renderLinkedInOutput(parsedLi);
      
      if (currentCampaignId) {
        await supabaseClient.from('linkedin_assets').insert([{
          campaign_id: currentCampaignId,
          connection_request: parsedLi.connectionRequest,
          dm_one: parsedLi.dm1,
          dm_two: parsedLi.dm2,
          voicemail_script: parsedLi.voicemail
        }]);
      }

      done++;
      if (done < totalSteps) await sleep(2000);
    }

    // C-GENERATE OBJECTIONS 
    if (runObjections) {
      updateProgress('Generating threat objection bank…', (done / totalSteps) * 100);
      const objRaw = await callGroq(buildObjectionBankPrompt(config), apiKey);
      const parsedObj = parseObjectionOutput(objRaw);
      renderObjectionOutput(parsedObj);

      if (currentCampaignId) {
        await supabaseClient.from('objection_bank').insert([{
          campaign_id: currentCampaignId,
          objections_data: parsedObj.objections,
          philosophy: parsedObj.philosophy
        }]);
      }

      done++;
      if (done < totalSteps) await sleep(2000);
    }

    // D-PRE-FLIGHT SIMULATOR
    if (runSim) {
      updateProgress('Running prospect stress-test simulation…', (done / totalSteps) * 100);
      const emails = Object.values(_store).filter(Boolean);
      const simPrompt = buildPerformanceSimulatorPrompt(emails, config);
      const simRaw = await callGroq(simPrompt, apiKey, 0, true);
      
      let cleanSim = simRaw.replace(/```json/gi, '').replace(/```/g, '').trim();
      const simMatch = cleanSim.match(/\{[\s\S]*\}/);
      if (!simMatch) throw new Error("Failed to extract JSON object from Simulator response.");
      
      const simJson = JSON.parse(simMatch[0]);
      renderSimulatorOutput(simJson);

      if (currentCampaignId) {
        await supabaseClient.from('simulations').insert([{
          campaign_id: currentCampaignId,
          overall_score: simJson.overall_score || simJson.OVERALL_SCORE,
          simulation_data: simJson
        }]);
      }

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
  document.getElementById('progressDots').style.width   = `${Math.min(100, Math.round(pct))}%`;
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
  btn.textContent = '[ PROCESSING & ORCHESTRATING... ]';

  try {
    const prompt = buildReplyAnalyzerPrompt(incomingReply, config);
    const crmToolbox = [{
      type: "function",
      function: {
        name: "update_crm_pipeline_status",
        description: "Updates the prospect's pipeline stage in the CRM based on their reply sentiment.",
        parameters: {
          type: "object",
          properties: {
            confidence_score: { type: "number", description: "1 to 10 scale of prospect interest" },
            new_pipeline_stage: { type: "string", enum: ["Interested", "Soft Objection", "Not Interested", "Meeting Booked"] }
          },
          required: ["confidence_score", "new_pipeline_stage"]
        }
      }
    }];

    const raw = await callGroq(prompt, apiKey, 0.1, true, null, crmToolbox);
    if (raw.isToolCall) {
      console.log("LLM Initiated Tool Call:", raw.tools);
      alert(`Autonomous Action Proposed: The system wants to execute [${raw.tools[0].function.name}]. Check your developer console for the exact JSON payload payload to send to your webhook.`);
      return; 
    }
    
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
  btn.textContent = '[ RUNNING ENSEMBLE EVALUATION... ]';

  try {
    const prompt = buildPerformanceSimulatorPrompt(emails, config);
    
    const calls = [
      callGroq(prompt, apiKey, 0.2, true),
      callGroq(prompt, apiKey, 0.2, true),
      callGroq(prompt, apiKey, 0.2, true)
    ];
    
    const results = await Promise.all(calls);
    const parsedResults = results.map(raw => JSON.parse(raw.replace(/```json/gi, '').replace(/```/g, '').trim()));
    
    let finalData = parsedResults[0];
    if (finalData.email_simulations && finalData.email_simulations.length > 0) {
      const firstEval = finalData.email_simulations[0].rubric_evaluation;
      const checks = [
        firstEval.specificity_final_check,
        firstEval.social_proof_final_check,
        firstEval.cost_of_inaction_final_check
      ];
      
      const passCount = checks.filter(status => status === "PASS").length;
      const scoringMatrix = { 3: 95, 2: 70, 1: 40, 0: 10 };
      
      finalData.overall_score = scoringMatrix[passCount] || 10;
    }

    if (typeof renderSimulatorOutput === 'function') {
      renderSimulatorOutput(finalData);
    }
  } catch (err) {
    alert(`⚠ Simulation failed: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}
