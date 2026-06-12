# Cold Outreach Intelligence Platform
**Live Demo:** https://prometheusforge.github.io/outreach-intelligence-platform/

## What It Generates
- **Email sequence** (3, 4, or 5 emails): each with subject line, body, CTA, send-time recommendation,
  psychological rationale, and 3 A/B subject variants
- **LinkedIn sequence**: connection request, two follow-up DMs, cold voicemail script
- **Objection bank**: responses + bridge questions for 5 common cold outreach objections
- **8 industry ICP presets**: one-click setup for common B2B verticals

## Technical Architecture
| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML/CSS/JS + Tailwind CSS CDN |
| AI | Google Gemini 2.5 Flash API (free tier) |
| Hosting | GitHub Pages |
| State | Browser memory only — zero backend, zero database |

## Prompt Engineering Highlights
- **Persona prompting**: consistent expert identity injected across all 6 API calls
- **Context threading**: each email prompt receives the previous email's one-sentence summary
- **Structured output enforcement**: rigid labeled fields prevent format hallucination
- **Technique injection**: each email prompt specifies the psychological technique by name
- **Rate-limit management**: 2-second pauses between sequential API calls

## Business Use Case
A B2B SaaS startup with 3 SDRs generating sequences for 5 verticals
spends ~120 hours/quarter on copywriting at a $60/hr loaded rate — $7,200/quarter.
This platform reduces that to under 2 hours, saving $6,960/quarter.
```
```
 ███████╗██╗ ██████╗ ███╗   ██╗ █████╗ ██╗     
 ██╔════╝██║██╔════╝ ████╗  ██║██╔══██╗██║     
 ███████╗██║██║  ███╗██╔██╗ ██║███████║██║     
 ╚════██║██║██║   ██║██║╚██╗██║██╔══██║██║     
 ███████║██║╚██████╔╝██║ ╚████║██║  ██║███████╗
 ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝
                  OUTREACH INTELLIGENCE // v2.0
```
 
<div align="center">
[![API](https://img.shields.io/badge/API-Groq%20Free%20Tier-orange?style=flat-square)](https://console.groq.com)
[![Model](https://img.shields.io/badge/LLM-Llama%203.3%2070B-blue?style=flat-square)](https://console.groq.com/docs/models)
[![Deploy](https://img.shields.io/badge/Deploy-GitHub%20Pages-222?style=flat-square&logo=github)](https://pages.github.com)
[![Cost](https://img.shields.io/badge/Monthly%20Cost-%240.00-brightgreen?style=flat-square)]()
[![Backend](https://img.shields.io/badge/Backend-None-lightgrey?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
 
**Full-cycle B2B cold outreach automation. Five modules. Zero cost. Runs in your browser.**
 
[**Live Demo →**](https://YOUR_USERNAME.github.io/outreach-intelligence-platform)
 
</div>
---
 
## Overview
 
Signal is a modular AI platform that generates complete B2B cold outreach campaigns from a single campaign brief. Users select which of five modules to execute — the system orchestrates sequential LLM calls, threads context between them, and returns structured, copy-ready output for every touchpoint in a modern sales motion.
 
No server. No database. No subscriptions. The API (Groq free tier) runs in the browser. Hosting (GitHub Pages) is free. Monthly operating cost: `$0.00`.
 
---
 
## The Five Modules
 
| # | Module | What It Generates |
|---|--------|-------------------|
| `01` | **Email Sequence** | 3–5 emails with subject line, body, CTA, send-time recommendation, A/B subject variants, psychological rationale per email, and a 75-word CPPC-framework body |
| `02` | **LinkedIn Network** | Connection request, two value-first DMs, cold voicemail script — all passing the Humanizer Rules (no AI filler, no "Rule of Three", peer-level tone) |
| `03` | **Objection Bank** | Five common objections × tailored response + bridge question, plus the core objection-handling philosophy |
| `04` | **Pre-Flight Simulator** | Per-email: open likelihood, reply probability, prospect inner monologue, PASS/FAIL rubric scores (specificity, social proof, cost-of-inaction), weakest line, fix. Overall: sequence survival rate `/100` |
| `05` | **Reply Analyzer** | Classifies any incoming prospect reply, assigns a temperature score (Hot → Frozen), generates a ready-to-send response, and adds an SDR coaching note on the prospect's psychology |
 
> **Modules are togglable.** Select only what you need. The orchestrator recalculates the step count, adjusts the progress indicator, and hides irrelevant output tabs automatically.
 
---
 
## Quick Start
 
**1. Clone and open**
```bash
git clone https://github.com/YOUR_USERNAME/outreach-intelligence-platform.git
cd outreach-intelligence-platform
# Open index.html with Live Server (VS Code) or any static file server
```
 
**2. Get a free Groq API key**
 
Go to [console.groq.com](https://console.groq.com) → sign up (no credit card) → API Keys → Create Key.
 
Free tier: **30 requests/minute**, **6,000 tokens/minute**, **500,000 tokens/day**. More than enough for continuous use.
 
**3. Paste the key and execute**
 
Paste your key into the header field. Select your modules. Fill the campaign brief (or pick a quick-start template). Hit **EXECUTE // OUTREACH SUITE**.
 
> Your API key is never stored or transmitted beyond your browser tab. It lives only in the current session.
 
---
 
## Prompt Engineering Architecture
 
This is the technical core of the project. Six separate prompt types, each engineered for a specific output contract.
 
### Expert Persona (`getSystemPersona`)
 
All six prompt types open with the same persona injection — a named character with explicit writing philosophy, specific forbidden phrases, and a formatting directive. The persona establishes quality standards that cascade consistently across every API call regardless of which module is running.
 
```
You are Marcus Webb, a senior B2B cold email strategist with 15 years of experience...
— Never sell in the first touch. Earn the right to the conversation.
— Specificity beats generality. Concrete numbers beat adjectives.
— One CTA per email. Never two. Never zero.
— No "Hope this finds you well." No "My name is X from Y."
```
 
### Dynamic Tone Constraints (`getToneConstraints`)
 
Tone is not passed as a label. It is converted to a behavioral instruction set before being injected into the prompt:
 
```js
case "Conversational and direct":
  return 'Use an 8th-grade reading level. Maximum sentence length is 15 words.
          Forbidden phrases: "I hope this finds you well", "I wanted to reach out".';
 
case "Data-driven and analytical":
  return 'Structure all arguments around measurable ROI. Use If/Then conditional logic.
          Do not use hyperbole or emotional adjectives.';
```
 
This means the LLM never receives the string `"Conversational"` — it receives explicit grammatical and rhetorical rules, not a suggestion.
 
### Context Threading (Email Sequence)
 
Each email prompt includes a `previousSummary` block — a one-sentence summary of what the previous email communicated and what it asked for. This summary is extracted from the `INTERNAL_SUMMARY` field of each parsed response and injected into the next prompt's `CAMPAIGN BRIEF` block.
 
```
PREVIOUS EMAIL CONTEXT (for narrative continuity):
"Email 2 introduced a case study showing 30% intake reduction and asked 
 if the prospect had 15 minutes this week."
INSTRUCTIONS: This email must logically follow and escalate from the previous one.
Do NOT reuse the same opening structure, hook angle, or CTA phrasing.
```
 
### Few-Shot Anchor Examples (Generator ↔ Simulator Feedback Loop)
 
The email generator and the Pre-Flight Simulator are architected as a deliberate feedback loop. The generator's prompt includes PASSING and FAILING examples calibrated specifically to the simulator's PASS/FAIL rubric criteria:
 
```
FEW-SHOT ANCHOR EXAMPLES (MANDATORY FOR SCORING):
 
✓ PASSING SPECIFICITY: "Our software helped Johnson Law reduce client intake 
  time by 30% and increase billing efficiency by 25%."
 
✓ PASSING COST OF INACTION: "Solo attorneys missing this automation lose up 
  to $10,000 annually in potential revenue."
 
✗ FAILING (DO NOT USE): "We offer effective practice management solutions 
  to streamline your workflows and save time."
```
 
A sequence generated by following these examples will mathematically score higher when passed through the simulator's rubric — which evaluates the exact same criteria. Generator quality and evaluator strictness are aligned by design.
 
### LinkedIn Humanizer Rules (Anti-AI-Slop Enforcement)
 
The LinkedIn module applies six explicit behavioral constraints to prevent AI-pattern writing:
 
```
1. Ban AI Filler: Strip "delve", "landscape", "tapestry", "testament", 
   "underscore", "showcase", "pivotal", "seamless".
2. No Copula Avoidance: Use "is" and "are" — not "serves as" or "functions as".
3. Kill -ing Appendages: No "...reflecting broader industry trends" tails.
4. Break the Rule of Three: AI forces ideas into threes. Pick the single 
   strongest point and stop there.
5. No Fake Pleasantries: Skip "I was so impressed by your background."
6. A Real Soft Ask: "Open to taking a look?" not "quick 15-minute sync."
```
 
### JSON Mode (Simulator + Reply Analyzer)
 
The two analytical modules use `response_format: { type: "json_object" }` with `temperature: 0.1` — enforcing deterministic, structured outputs with a complete schema defined in the prompt. No post-hoc text parsing. No format hallucination.
 
```js
// api.js — Simulator call
const simRaw = await callGroq(simPrompt, apiKey, 0.1, true); // isJsonMode = true
const simJson = JSON.parse(simRaw);
```
 
The JSON schema for the simulator defines every field type — `open_likelihood`, `reply_probability`, `prospect_monologue`, `rubric_evaluation` (with three sub-fields), `weakest_element`, `fix_suggestion`, `top_improvements`, `overall_verdict`, and an algorithmically calculated `overall_score`.
 
```json
{
  "overall_score": "Calculate strictly from rubric: 3 PASSES = 95. 2 PASSES = 70. 
                    1 PASS = 40. 0 PASSES = 10.",
  "email_simulations": [
    {
      "rubric_evaluation": {
        "specificity_check":       "PASS/FAIL",
        "social_proof_check":      "PASS/FAIL",
        "cost_of_inaction_check":  "PASS/FAIL"
      }
    }
  ]
}
```
 
---
 
## Data Flow
 
```
User Input (Campaign Brief + Module Toggles)
          │
          ▼
  getFormValues() + toggle reads
          │
          ├─── [01_EMAILS] ──► buildEmailPrompt() × N (with context threading)
          │                         │
          │                    callGroq(prompt, key, temp=0.85)
          │                         │
          │                    parseEmailOutput() ──► renderEmailCard()
          │                         │
          │                    previousSummary ──► next email prompt
          │
          ├─── [02_LINKEDIN] ─► buildLinkedInPrompt() ──► callGroq() ──► renderLinkedInOutput()
          │
          ├─── [03_OBJECTIONS] ► buildObjectionBankPrompt() ──► callGroq() ──► renderObjectionOutput()
          │
          ├─── [04_SIM] ──────► buildPerformanceSimulatorPrompt(_store emails)
          │                         │
          │                    callGroq(prompt, key, temp=0.1, jsonMode=true)
          │                         │
          │                    JSON.parse() ──► renderSimulatorOutput()
          │
          └─── [05_REPLY] ────► buildReplyAnalyzerPrompt(reply, config)
                                    │
                               callGroq(prompt, key, temp=0.1, jsonMode=true)
                                    │
                               JSON.parse() ──► renderReplyOutput()
```
 
> The Pre-Flight Simulator reads from `_store` — the email data store populated during `01_EMAILS` generation. It therefore requires `01_EMAILS` to be checked. A validation guard in `api.js` blocks the simulator from running without it.
 
---
 
## Project Structure
 
```
outreach-intelligence-platform/
│
├── index.html        # UI shell — header, form, module toggles, tab panels
├── styles.css        # Industrial Brutalism design system — see Design section
│
├── prompts.js        # All prompt builders + ICP templates + applyTemplate()
│                       getSystemPersona() · getToneConstraints() · buildEmailPrompt()
│                       buildLinkedInPrompt() · buildObjectionBankPrompt()
│                       buildReplyAnalyzerPrompt() · buildPerformanceSimulatorPrompt()
│
├── api.js            # Groq API client + module orchestrator
│                       callGroq() · generateAll() · analyzeReply() · runSimulator()
│                       regenerateEmail() · getFormValues()
│
├── parser.js         # Structured output field extractor
│                       extractField() · parseEmailOutput() · parseLinkedInOutput()
│                       parseObjectionOutput()
│
└── ui.js             # DOM rendering + interactions + export
                        _store (email data store) · renderEmailCard() · renderLinkedInOutput()
                        renderObjectionOutput() · renderSimulatorOutput() · renderReplyOutput()
                        showOutputSection() · exportAll() · copyText()
```
 
---
 
## Technology Stack
 
| Layer | Technology | Notes |
|-------|-----------|-------|
| LLM | Groq API · Llama 3.3 70B Versatile | Free tier · ~15s full suite generation |
| Frontend | Vanilla HTML / CSS / JS | No frameworks, no build step |
| Hosting | GitHub Pages | Free, permanent, zero config |
| State | Browser memory (`_store` object) | No database, no session storage |
| Fonts | Space Grotesk · Space Mono · Newsreader | Google Fonts CDN |
| API Cost | $0.00 / month | Groq free tier |
| Hosting Cost | $0.00 / month | GitHub Pages |
 
### Why Groq over Gemini or OpenAI
 
Llama 3.3 70B on Groq delivers generation speeds of 1,000–2,000 tokens per second on their custom LPU hardware. A full 5-module suite (5 emails + LinkedIn + objections + simulator + reply) completes in approximately 15 seconds. Equivalent generation on Gemini 1.5 Flash took ~45 seconds. The free tier is genuinely unlimited for this use case (500,000 tokens/day).
 
---
 
## Design System
 
**Theme: Industrial Brutalism**
 
Zero border-radius. CRT grid overlay. Terminal-style labels. High-contrast acid green on near-black.
 
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#050505` | Page background |
| `--bg-surface` | `#0A0A0A` | Cards and panels |
| `--accent` | `#CCFF00` | Active states, badges, dots |
| `--text-hi` | `#F2F2F2` | Primary text |
| `--text-mid` | `#A0A0A0` | Secondary text |
| `--danger` | `#FF2A2A` | Error states |
| `--f-display` | Space Grotesk | UI labels, headings |
| `--f-mono` | Space Mono | System labels, data, code |
| `--f-editorial` | Newsreader | Long-form email body copy |
| All radius | `0px` | Deliberately sharp, no softening |
 
Background texture: `linear-gradient` crosshatch at 40px intervals, 0.3 opacity — simulates CRT phosphor grid.
 
---
 
## Business Case
 
A B2B SaaS company with 3 SDRs writing sequences for 5 verticals spends approximately 120 hours per quarter on outreach copywriting at a loaded cost of ~$60/hour. That is **$7,200 per quarter** — and the sequences need refreshing every 90 days.
 
Signal reduces the equivalent quarterly output to under two hours at zero marginal cost.
 
| Metric | Manual | Signal |
|--------|--------|--------|
| Time per sequence | 3–5 hours | ~2 minutes |
| Sequences per quarter | 15 | 15 |
| Total quarterly hours | 45–75 hrs | ~30 minutes |
| Cost at $60/hr | $2,700–$4,500 | $0 |
| Pre-launch validation | None | Pre-Flight Simulator |
| Reply handling playbook | Ad-hoc | Reply Analyzer (instant) |
 
The Pre-Flight Simulator changes the ROI conversation: instead of discovering that a sequence underperforms after burning through a prospect list, teams validate it before sending email one.
 
---
 
## Quick-Start ICP Templates
 
Eight pre-filled campaign briefs are available in the UI. Selecting one populates all four brief fields instantly.
 
| Template | Product | ICP |
|----------|---------|-----|
| `SaaS → RevOps` | RevOps unification platform | RevOps Managers at B2B SaaS, 50–300 employees |
| `Agency → E-comm` | Performance marketing agency | DTC founders, $1M–$10M revenue, Shopify |
| `Consulting → CFOs` | Fractional CFO services | Series A–B founders planning a fundraise |
| `HR Tech → People Ops` | HR automation software | People Ops at fast-growing 50–200 person companies |
| `Accounting → Freelancers` | Freelancer accounting software | Solo designers/devs, US-based, $50–150k income |
| `Security → IT Directors` | Security awareness training | IT Directors at mid-market regulated industries |
| `Logistics → Ops Mgrs` | Route optimization SaaS | Ops Managers, 10–100 delivery vehicles |
| `LegalTech → Attorneys` | Legal practice management | Solo attorneys, family/estate/PI law |
 
---
 
## Deployment
 
This project is a static site. No build step. No configuration.
 
**GitHub Pages (recommended):**
 
1. Push all files to the `main` branch of a public repository
2. Go to **Settings → Pages → Source: Deploy from branch → main / (root)**
3. Click **Save** — your live URL appears within 2–3 minutes
```
https://YOUR_USERNAME.github.io/outreach-intelligence-platform
```
 
**Local development:**
 
Open `index.html` directly in a browser, or use VS Code Live Server extension (right-click `index.html` → "Open with Live Server").
 
> No `npm install`. No `package.json`. No environment variables. All configuration happens in the browser UI.
 
---
 
## Limitations & Known Behaviour
 
- **Simulator requires emails:** The Pre-Flight Simulator reads from the email data store (`_store`). Running it without first generating the email sequence returns an empty analysis. A validation guard prevents this when running the full suite; the standalone **EXECUTE // RUN PRE-FLIGHT SIMULATION** button on the Simulator tab will alert if no emails exist.
- **Reply Analyzer mock on full-suite run:** When triggered as part of a full suite execution, the Reply Analyzer uses a default "we're already using another vendor" reply to demonstrate the module. For live prospect replies, use the standalone textarea in the `05_REPLY_ANALYZER` tab.
- **Groq rate limits:** The free tier allows 30 requests/minute. The orchestrator includes 2-second pauses between sequential calls. Full 5-module generation (7 calls) completes well within rate limits under normal conditions.
- **Clipboard API:** The copy-to-clipboard functions require a secure context (HTTPS or localhost). They will not work when opening `index.html` directly via the `file://` protocol. Use Live Server or the GitHub Pages deployment.
---
 
## License
 
MIT — use freely, modify freely, no attribution required.
 
---
 
<div align="center">
Built with Groq API · Llama 3.3 70B · Vanilla JS · GitHub Pages · $0
 
*Full-cycle B2B outreach automation. Execute, don't write.*
 
</div>
 
