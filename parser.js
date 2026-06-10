function extractField(text, label, nextLabels = []) {
  const pattern = new RegExp('^\\s*(?:\\*\\*|###\\s*)?' + label.replace(/[_]/g, '[_]') + '(?:\\*\\*)?:\\s*', 'im');
  const matchIdx  = text.search(pattern);
  if (matchIdx === -1) return '';

  const colonPos  = text.indexOf(':', matchIdx) + 1;
  let endPos      = text.length;

  for (const next of nextLabels) {
    const nextPattern = new RegExp(`\\n${next.replace(/[_]/g, '[_]')}:`, 'im');
    const nextIdx     = text.search(nextPattern);
    if (nextIdx > colonPos && nextIdx < endPos) endPos = nextIdx;
  }
  return text.substring(colonPos, endPos).trim();
}

function parseEmailOutput(raw, step) {
  const allFields = [
    'SUBJECT','PREVIEW_TEXT','BODY','CTA','SEND_DAY',
    'BEST_SEND_TIME','WHY_IT_WORKS','INTERNAL_SUMMARY',
    'VARIANT_SUBJECT_A','VARIANT_SUBJECT_B','VARIANT_SUBJECT_C'
  ];
  const get = f => extractField(raw, f, allFields.filter(x => x !== f));

  return {
    step,
    subject:         get('SUBJECT'),
    previewText:     get('PREVIEW_TEXT'),
    body:            get('BODY'),
    cta:             get('CTA'),
    bestSendTime:    get('BEST_SEND_TIME'),
    whyItWorks:      get('WHY_IT_WORKS'),
    internalSummary: get('INTERNAL_SUMMARY'),
    variantA:        get('VARIANT_SUBJECT_A'),
    variantB:        get('VARIANT_SUBJECT_B'),
    variantC:        get('VARIANT_SUBJECT_C'),
  };
}

function parseLinkedInOutput(raw) {
  try {
    const cleanJson = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);
    
    return {
      connectionRequest: data.connection_request || '',
      dm1:               data.dm_1 || '',
      dm2:               data.dm_2 || '',
      voicemail:         data.voicemail_script || '',
      whyItWorks:        data.why_it_works || ''
    };
  } catch (err) {
    console.error("Failed to parse LinkedIn output:", err);
    return {
      connectionRequest: "[ ERROR: Failed to parse JSON response ]",
      dm1: "", dm2: "", voicemail: "", whyItWorks: ""
    };
  }
}

function parseObjectionOutput(raw) {
  const objections = [];
  for (let i = 1; i <= 5; i++) {
    objections.push({
      label:    extractField(raw, `OBJECTION_${i}`,       [`RESPONSE_${i}`]),
      response: extractField(raw, `RESPONSE_${i}`,        [`BRIDGE_QUESTION_${i}`]),
      bridge:   extractField(raw, `BRIDGE_QUESTION_${i}`, [`OBJECTION_${i+1}`, 'OBJECTION_PHILOSOPHY']),
    });
  }
  return { objections, philosophy: extractField(raw, 'OBJECTION_PHILOSOPHY', []) };
}
