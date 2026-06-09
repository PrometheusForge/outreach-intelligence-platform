const EMAIL_SEQUENCE_MAP = {
  3: [
    { num: 1, day: 1,  angle: "Cold Introduction + Value Hook",  technique: "Pattern interrupt opening + specific outcome anchoring" },
    { num: 2, day: 5,  angle: "Pain-Point Agitation",            technique: "Future pacing + cost-of-inaction framing" },
    { num: 3, day: 11, angle: "Final Breakup Email",             technique: "Scarcity + takeaway close" },
  ],
  4: [
    { num: 1, day: 1,  angle: "Cold Introduction + Value Hook",  technique: "Pattern interrupt opening + specific outcome anchoring" },
    { num: 2, day: 4,  angle: "Social Proof / Case Study",       technique: "Specificity principle + outcome mirroring" },
    { num: 3, day: 8,  angle: "Pain-Point Agitation",            technique: "Future pacing + cost-of-inaction framing" },
    { num: 4, day: 13, angle: "Final Breakup Email",             technique: "Scarcity + takeaway close" },
  ],
  5: [
    { num: 1, day: 1,  angle: "Cold Introduction + Value Hook",  technique: "Pattern interrupt opening + specific outcome anchoring" },
    { num: 2, day: 3,  angle: "Social Proof / Case Study",       technique: "Specificity principle + outcome mirroring" },
    { num: 3, day: 6,  angle: "Pain-Point Agitation",            technique: "Future pacing + cost-of-inaction framing" },
    { num: 4, day: 10, angle: "Objection Handling",              technique: "Preemptive reframe + credibility stacking" },
    { num: 5, day: 14, angle: "Final Breakup Email",             technique: "Scarcity + takeaway close" },
  ]
};


function getSystemPersona() {
  return `You are Marcus Webb, a senior B2B cold email strategist with 15 years of experience 
running outbound campaigns for SaaS companies, agencies, and consultancies. 
Your campaigns consistently produce 15-40% reply rates.

Your writing philosophy (non-negotiable):
— Never sell in the first touch. Earn the right to the conversation.
— Specificity beats generality. Concrete numbers beat adjectives.
— One CTA per email. Never two. Never zero.
— Short is respectful. Long is lazy.
— Every opening line must pass this test: "Would I keep reading if I got this cold?"
— No "Hope this finds you well." No "My name is X from Y." No "Just following up."

CRITICAL FORMATTING RULE: Output ONLY the structured format requested. 
No preamble. No closing remarks. No Markdown decorators. No apologies. 
Just the clean, labeled, structured output — nothing else.`;
}

// Email prompt builder
function buildEmailPrompt(config, emailStep, previousSummary = null) {
  const { product, icp, goal, tone, length } = config;
  const { num, day, angle, technique } = emailStep;

  const contextBlock = previousSummary
    ? `PREVIOUS EMAIL CONTEXT (for narrative continuity):
"${previousSummary}"
INSTRUCTIONS: This email must logically follow and escalate from the previous one.
Do NOT reuse the same opening structure, hook angle, or CTA phrasing from email ${num - 1}.`
    : `INSTRUCTIONS: This is Email 1. There is no prior email.
The opening line must be immediately specific to the prospect's professional reality.
Forbidden openers: "I came across your company", "I noticed you", "I wanted to reach out."`;

  return `${getSystemPersona()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAMPAIGN BRIEF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Product / Service : ${product}
Ideal Customer Profile : ${icp}
Campaign Goal : ${goal}
Tone : ${tone}
Total sequence length : ${length} emails

${contextBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Write Email #${num} of ${length}.
Send Day     : Day ${day}
Angle        : ${angle}
Technique    : ${technique}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY OUTPUT — use EXACT labels, in this exact order
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUBJECT: [Max 9 words. Creates curiosity. No emojis. No clickbait. No question marks.]
PREVIEW_TEXT: [35-55 characters. Complements the subject — does NOT repeat it.]
BODY:
[Full email body. Rules: 100-160 words. No bullet lists. No subheadings.
Conversational prose. Opening line cannot start with the word "I".
Maximum two paragraphs. CTA goes in the final line, not embedded mid-body.]
CTA: [The exact line the prospect reads asking them to act. Single, specific, low-commitment. Max 20 words.]
SEND_DAY: Day ${day}
BEST_SEND_TIME: [Day of week + specific time + one sentence of reasoning]
WHY_IT_WORKS: [2–3 sentences naming the exact psychological principle or copywriting technique this email uses and why it is effective at this stage of the sequence.]
INTERNAL_SUMMARY: [Exactly one sentence summarizing what this email communicated and what it asked for — used internally for sequence continuity tracking.]
VARIANT_SUBJECT_A: [Alternative subject — approaches curiosity from a different angle]
VARIANT_SUBJECT_B: [Alternative subject — phrased as a question]
VARIANT_SUBJECT_C: [Alternative subject — ultra-short, 1–4 words maximum]`;
}

function buildLinkedInPrompt(config) {
  const { product, icp, goal, tone } = config;
  return `${getSystemPersona()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAMPAIGN BRIEF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Product / Service : ${product}
Ideal Customer Profile : ${icp}
Campaign Goal : ${goal}
Tone : ${tone}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR TASK: LinkedIn Multi-Touch Sequence
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Write a complete LinkedIn cold outreach sequence using value-first sequencing.

MANDATORY OUTPUT — exact labels only:

CONNECTION_REQUEST: [Max 300 characters. Zero pitch. Lead with a genuine observation, 
  shared context, or a single insight relevant to their role. End with a natural reason to connect. 
  Must not feel like a sales opener.]

FOLLOW_UP_DM_1: [Day 2 after connection accepted. Max 380 characters. 
  Share one concrete insight, useful data point, or micro-tip that is genuinely relevant 
  to their role. Do NOT make any ask. Do NOT say "I wanted to follow up."]

FOLLOW_UP_DM_2: [Day 7. Max 380 characters. Reference DM 1 briefly. 
  Now make the soft ask — frame it as a quick exchange or idea share, not a sales call.]

VOICEMAIL_SCRIPT: [30-second cold voicemail if they pick up unexpectedly. Max 75 words. 
  State name, company, a single compelling reason for the call, specific callback ask with timeframe. 
  Must sound conversational, not scripted.]

WHY_THIS_SEQUENCE_WORKS: [3–4 sentences on the psychology of value-first LinkedIn 
  outreach and why delaying the ask until DM 2 produces higher conversion than pitching on contact.]`;
}

// Generates 5 tailored objection responses, each with a bridge question that keeps the conversation alive without applying pressure.
function buildObjectionBankPrompt(config) {
  const { product, icp, goal } = config;
  return `${getSystemPersona()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAMPAIGN BRIEF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Product / Service : ${product}
ICP : ${icp}
Campaign Goal : ${goal}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR TASK: Objection Response Bank
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generate professional, conversation-preserving responses to 5 common cold outreach objections.
Core principle: Never argue. Never defend. Re-engage through curiosity.

MANDATORY FORMAT — repeat exactly for all 5 objections:

OBJECTION_1: "Not interested"
RESPONSE_1: [2–3 sentences. Acknowledge + pivot to a micro-curiosity question. Do not defend the product.]
BRIDGE_QUESTION_1: [One question that naturally re-opens dialogue without any pressure]

OBJECTION_2: "Send me some information"
RESPONSE_2: [2–3 sentences. Reframe the request — ask what's most relevant before sending anything generic.]
BRIDGE_QUESTION_2: [One qualifying question that makes a follow-up more targeted]

OBJECTION_3: "We already have a solution"
RESPONSE_3: [2–3 sentences. Validate their choice + open a gap question around what they wish worked better.]
BRIDGE_QUESTION_3: [One gap question focused on what their current solution cannot do]

OBJECTION_4: "You should speak to someone else"
RESPONSE_4: [2–3 sentences. Ask for the referral gracefully + give them a reason to make the introduction.]
BRIDGE_QUESTION_4: [One question that makes the referral easy to execute]

OBJECTION_5: "Reach out again in a few months"
RESPONSE_5: [2–3 sentences. Confirm a specific future date + give one reason to stay on their radar now.]
BRIDGE_QUESTION_5: [One question or micro-action that creates continuity before the conversation goes dormant]

OBJECTION_PHILOSOPHY: [3–4 sentences on the psychological framework behind conversation-preserving 
  objection handling and why curiosity-based responses outperform defensive responses in B2B outreach.]`;
}

// Handle responses
function buildReplyAnalyzerPrompt(incomingReply, config) {
  return `You are an elite B2B Sales Development Manager and conversation strategist. Your goal is to analyze an incoming reply from a prospect and coach an SDR on exactly how to respond.

### CAMPAIGN CONTEXT
* Product/Service: ${config.product}
* Target ICP: ${config.icp}
* Ultimate Goal: ${config.goal}

### INCOMING PROSPECT REPLY
"${incomingReply}"

### INSTRUCTIONS & GUARDRAILS
1. Analyze the prospect's reply to determine their underlying mindset, objections, and intent.
2. Draft a highly conversational, empathetic, and concise response (Maximum 3 sentences).
3. STRICT COPYWRITING RULES for the 'recommended_response':
   - DO NOT use greetings like "Hi [Name]" or "Dear [Name]" (the UI will handle this).
   - DO NOT use filler phrases like "I hope this helps" or "I understand."
   - If the reply is a Soft Objection, validate it directly before pivoting.
   - If the reply is a Hard No, be gracious, do not push back, and leave the door open.
   - Keep the reading level at an 8th-grade standard. Mimic human text messaging energy.

### OUTPUT FORMAT
You must respond ONLY with a valid JSON object. Do not include markdown code blocks (e.g., \`\`\`json), conversational filler, or explanations outside the JSON. Use this exact schema:

{
  "reply_category": "Select one: Positive/Interested | Soft Objection | Hard No | Timing Delay | Wrong Person | Info Request | Ghost/Auto-Reply",
  "temperature": "Select one: Hot | Warm | Cold | Frozen",
  "temperature_reason": "One concise sentence explaining why you assigned this temperature.",
  "recommended_response": "The 2-3 sentence drafted reply following the strict copywriting rules.",
  "next_action_plan": "Specific next step and timing (e.g., 'Send response today, if no reply in 3 days, call them' or 'Close out sequence, set CRM reminder for 6 months').",
  "coaching_note": "1-2 sentences explaining the psychology behind the prospect's reply and why the recommended response is designed the way it is."
}`;
}

// Pre-filled ICP data.
const ICP_TEMPLATES = {
  saas_revops: {
    product: "Revenue operations SaaS platform that unifies CRM, marketing automation, and sales analytics into a single reporting layer",
    icp: "RevOps Managers and VPs of Revenue at B2B SaaS companies with 50–300 employees, managing fragmented tech stacks of 5+ tools",
    goal: "Book a 20-minute live demo of the unified reporting dashboard",
    tone: "Data-driven and analytical"
  },
  agency_ecomm: {
    product: "Performance marketing agency specializing in paid social and conversion rate optimization for DTC e-commerce brands",
    icp: "E-commerce founders and CMOs running DTC brands doing $1M–$10M annual revenue, primarily on Shopify, frustrated with rising Meta CPAs",
    goal: "Schedule a 30-minute paid social audit call",
    tone: "Conversational and direct"
  },
  consulting_cfo: {
    product: "Fractional CFO and financial advisory services for venture-backed startups preparing for a Series B or C fundraise",
    icp: "Founders and existing CFOs at Series A–B startups with $3M–$15M ARR who are planning a fundraise within the next 12 months",
    goal: "Set up a 30-minute financial readiness assessment call",
    tone: "Formal and professional"
  },
  hr_tech: {
    product: "HR and people operations software that automates employee onboarding, quarterly performance reviews, and engagement survey cycles",
    icp: "People Operations Managers and HR Directors at companies with 50–200 employees undergoing rapid headcount growth",
    goal: "Book a 20-minute product walkthrough focused on onboarding automation",
    tone: "Conversational and direct"
  },
  accounting_freelance: {
    product: "Accounting and invoicing software designed exclusively for freelancers that automates tax category tagging and quarterly estimate reminders",
    icp: "Solo graphic designers, web developers, and creative consultants, aged 25–40, US-based, earning $50k–$150k annually, currently using spreadsheets or Wave",
    goal: "Book a 15-minute demo call",
    tone: "Casual and friendly"
  },
  cybersecurity_midmarket: {
    product: "Managed security awareness training platform that runs monthly phishing simulations and tracks employee security behavior scores over time",
    icp: "IT Directors and CISOs at mid-market companies with 200–1,000 employees in regulated industries such as finance, healthcare, or legal services",
    goal: "Schedule a 30-minute security posture review call",
    tone: "Data-driven and analytical"
  },
  logistics_saas: {
    product: "Route optimization SaaS for logistics and delivery operations that reduces last-mile delivery costs by an average of 23% within the first 90 days",
    icp: "Operations Managers and Supply Chain Directors at mid-sized manufacturing and distribution companies operating 10–100 delivery vehicles",
    goal: "Book a 25-minute ROI assessment call",
    tone: "Data-driven and analytical"
  },
  legaltech: {
    product: "Legal practice management software built for solo attorneys that automates client intake, billing, and routine document generation",
    icp: "Solo practice attorneys and small law firms with 1–3 attorneys specializing in family law, estate planning, or personal injury",
    goal: "Schedule a 20-minute software walkthrough",
    tone: "Formal and professional"
  }
};

// Applies a preset template to all form fields
function applyTemplate(templateKey) {
  if (!templateKey || !ICP_TEMPLATES[templateKey]) return;
  const t = ICP_TEMPLATES[templateKey];
  document.getElementById('fieldProduct').value = t.product;
  document.getElementById('fieldIcp').value = t.icp;
  document.getElementById('fieldGoal').value = t.goal;
  document.getElementById('fieldTone').value = t.tone;
}
