// parser.js (Fully refactored for Strict Mode Native JSON Parsing)

function parseEmailOutput(raw, step) {
  try {
    // With Strict Mode, 'raw' will be a pure stringified JSON object
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

    // Direct object mapping replaces regex extraction
    return {
      step,
      subject:         data.SUBJECT || data.subject || '',
      previewText:     data.PREVIEW_TEXT || data.preview_text || '',
      body:            data.BODY || data.body || '',
      cta:             data.CTA || data.cta || '',
      bestSendTime:    data.BEST_SEND_TIME || data.best_send_time || '',
      whyItWorks:      data.WHY_IT_WORKS || data.why_it_works || '',
      internalSummary: data.INTERNAL_SUMMARY || data.internal_summary || '',
      variantA:        data.VARIANT_SUBJECT_A || data.variant_a || '',
      variantB:        data.VARIANT_SUBJECT_B || data.variant_b || '',
      variantC:        data.VARIANT_SUBJECT_C || data.variant_c || '',
    };
  } catch (err) {
    console.error("Email API strict parsing error:", err);
    return { step, subject: "[ ERROR: Strict JSON Format Failed ]" };
  }
}

function parseLinkedInOutput(raw) {
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    
    return {
      connectionRequest: data.connection_request || '',
      dm1:               data.dm_1 || '',
      dm2:               data.dm_2 || '',
      voicemail:         data.voicemail_script || '',
      whyItWorks:        data.why_it_works || ''
    };
  } catch (err) {
    console.error("LinkedIn strict parsing error:", err);
    return {
      connectionRequest: "[ ERROR: Strict JSON Format Failed ]",
      dm1: "", dm2: "", voicemail: "", whyItWorks: ""
    };
  }
}

function parseObjectionOutput(raw) {
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const objections = [];
    
    for (let i = 1; i <= 5; i++) {
      objections.push({
        label:    data[`OBJECTION_${i}`] || data[`objection_${i}`] || '',
        response: data[`RESPONSE_${i}`] || data[`response_${i}`] || '',
        bridge:   data[`BRIDGE_QUESTION_${i}`] || data[`bridge_question_${i}`] || '',
      });
    }
    
    return { 
      objections, 
      philosophy: data.OBJECTION_PHILOSOPHY || data.objection_philosophy || '' 
    };
  } catch (err) {
    console.error("Objection Bank strict parsing error:", err);
    return { objections: [], philosophy: "[ ERROR: Strict JSON Format Failed ]" };
  }
}
