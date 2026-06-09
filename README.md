# Cold Outreach Intelligence Platform
**Live Demo:** https://YOUR_USERNAME.github.io/outreach-intelligence-platform

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
