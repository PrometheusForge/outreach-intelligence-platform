// ═══════════════════════════════════════════════════════════════
// parser.js — Structured Output Field Extractor
// ═══════════════════════════════════════════════════════════════

// Finds the text value after a given LABEL: marker,
// stopping when the next known label begins.
function extractField(text, label, nextLabels = []) {
  const pattern   = new RegExp(`${label.replace(/[_]/g, '[_]')}:\\s*`, 'im');
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

// EMAIL PARSER 
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

// LINKEDIN PARSER 
function parseLinkedInOutput(raw) {
  const fields = ['CONNECTION_REQUEST','FOLLOW_UP_DM_1','FOLLOW_UP_DM_2','VOICEMAIL_SCRIPT','WHY_THIS_SEQUENCE_WORKS'];
  const get = f => extractField(raw, f, fields);
  return {
    connectionRequest: get('CONNECTION_REQUEST'),
    dm1:               get('FOLLOW_UP_DM_1'),
    dm2:               get('FOLLOW_UP_DM_2'),
    voicemail:         get('VOICEMAIL_SCRIPT'),
    whyItWorks:        get('WHY_THIS_SEQUENCE_WORKS'),
  };
}

// OBJECTION PARSER 
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