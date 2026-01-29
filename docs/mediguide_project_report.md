# Mediguide Project Report

## CHAPTER I — INTRODUCTION

### 1.1 Overview of the Project

Mediguide is a bilingual (English + Tamil) web application that helps users convert symptom descriptions into medically-informed guidance, locate nearby health providers, and keep a personal search history. Built with Next.js (App Router), React and TypeScript on the front end and Next.js server routes, Firebase Authentication, and Prisma + MySQL on the backend, Mediguide combines lightweight client-side TTS, Genkit-based AI flows for symptom → medicine recommendations, and open-source places lookup (OpenStreetMap/Overpass) for provider discovery.

Key features

- Secure user authentication (Firebase) and local mediNNN mapping for pseudonymous IDs.
- Bilingual TTS (English + Tamil) with Tamil number expansion and "speak both" option.
- Local-first persistent search history (localStorage) with server sync on login.
- Free provider lookup using OpenStreetMap/Overpass (no paid API key required).
- AI-driven symptom → medicine recommendation flows with structured outputs.
- Profile dialog housing Profile / Feedback / History with per-item deletion, clear-all, and export.

### 1.2 Problem Definition

- Fragmented user experience: symptom guidance, provider lookup, and history are often scattered across multiple apps.
- Language accessibility gaps: lack of quality Tamil TTS and localized phrasing in many medical apps.
- Offline & persistence limitations: users risk losing history when moving between devices or when unauthenticated.
- Cost barriers: paid provider APIs add expense and complexity for lightweight apps.
- Usability: discoverability and workflow for saving/searching symptoms can be improved.

### 1.3 Objectives of the Project

 - Provide users with data portability and privacy controls — allow exporting, deleting, and selective syncing of search history and personal settings.

---

## CHAPTER II — SYSTEM ANALYSIS

### 2.1 Existing System

Before Mediguide, users relied on scattered websites or paid services that typically:

- Offered results primarily in English.
- Required paid APIs for provider lookup.
- Lacked an integrated search → history → provider workflow.

#### 2.1.1 Disadvantages of Existing Systems

- Language limitations (insufficient Tamil support)
- Dependence on paid APIs
- No offline-first or local-persistence options
- Fragmented UX across features

### 2.2 Proposed System

Mediguide proposes a privacy-minded, bilingual solution with:

- AI-based symptom → medicine recommendations.
- Local-first search history with optional server sync mapped to mediNNN IDs.
- Provider lookup using Overpass (OpenStreetMap) to avoid paid APIs.
- Bilingual TTS and accessible controls.

#### 2.2.1 Advantages

- Cost-effective provider lookup
- Improved Tamil accessibility
- Local-first persistence for offline resilience
- Centralized dashboard with profile dialog for feedback/history

### 2.3 Feasibility Study

- Economic Feasibility: Open-source tools and Overpass reduce costs; hosting and managed MySQL are modest for small deployments.
- Technical Feasibility: Next.js + Firebase + Prisma are stable, scalable choices; Web Speech API supports client-side TTS.
- Operational Feasibility: Simple UI and documentation reduce training costs; admin routes allow moderation.

---

## CHAPTER III — SYSTEM SPECIFICATION

### 3.1 Hardware Recommendation

- Developer machine: Intel i5, 8GB RAM, 50GB disk
- Server: 1–2 vCPU, 2–4GB RAM, managed MySQL or cloud SQL
- Client: modern browser supporting Web Speech API (Chrome, Edge)

### 3.2 Software Stack

- Frontend: Next.js (App Router), React, TypeScript, TailwindCSS
- Backend: Next.js server routes, Node.js, Prisma Client, MySQL
- Auth: Firebase Authentication
- TTS: Web Speech API (client)
- Provider lookup: Overpass (OpenStreetMap)
- AI flows: Genkit-based server flows

### 3.2.1 Front End

- Header with profile dialog (Profile / Feedback / History)
- Dashboard with centered cards
- Results display with TTS controls

### 3.2.2 Back End

- Routes implemented:
  - `POST /api/search-history` — save a search
  - `GET /api/search-history` — fetch user's history
  - `DELETE /api/search-history` — clear all history
  - `DELETE /api/search-history/{id}` — delete one entry
  - `POST /api/feedback` — submit feedback
  - `POST /api/places` — Overpass-based provider lookup
  - `GET/POST /api/users` — profile read/write
  - Admin routes: `/api/admin/*` for seed/clear/export

---

## CHAPTER IV — SYSTEM DESCRIPTION

### 4.1 Modules

- Authentication Module — Firebase + mediNNN mapping
- Symptom → Medicine Recommendation (AI) Module
- TTS Module — bilingual playback (English/Tamil)
- Search History Module — local-first storage + server sync
- Provider Lookup Module — Overpass server queries
- Profile & Feedback Module — tabbed dialog with management
- Admin Module — seed, clear, export, basic analytics

### 4.2 Module Interactions

- User searches → AI flow → results shown with optional TTS.
- User saves search locally → queued for sync on login → posted to `/api/search-history`.
- Profile dialog fetches merged history and supports delete/clear/export.
- Provider lookup queries `/api/places` and presents nearby providers.

### 4.3 Database Design (summary)

Suggested models (Prisma-like):

- `User` (id, firebaseUid, email, firstName, lastName, theme, timestamps)
- `SearchHistory` (id, userId, query, result, time)
- `Feedback` (id, userId, text, time)
- `Provider` (id, name, specialty, lat, lng, phone, address, source)
- `MedicineRecommendation` (optional structured AI outputs)

---

## CHAPTER V — SYSTEM TESTING

### 5.1 Unit Testing

- Unit tests: auth helpers, mediNNN mapping, local-persistence helpers, TTS Tamil number expansion, Overpass query builder.

### 5.2 Integration Testing

- Integration tests: save locally → sync after login; per-item delete removes server record; Overpass responses transform correctly; AI flows validate schema.

### 5.3 Validation & Acceptance

- Acceptance checks: profile dialog shows history and allows deletion/export; TTS speak both languages without errors.

---

## CHAPTER VI — SYSTEM IMPLEMENTATION

### 6.1 Coding

- Technologies: Next.js, React, TypeScript, TailwindCSS, Prisma, MySQL, Firebase Auth.
- Keep server routes stateless and validate Firebase ID tokens at entry points.

### 6.2 Deployment

**Local dev**
```powershell
npm install
npm run dev
```

**Production**
- Host on Vercel or a Node host; use managed MySQL (PlanetScale/Aurora/Cloud SQL).
- Store Firebase service credentials and DB URL in environment variables.

### 6.3 Documentation & Training

- README: setup and env variables
- Onboarding docs: using profile dialog, exporting history, TTS controls

---

## CHAPTER VII — CONCLUSION & FUTURE ENHANCEMENTS

### 7.1 Conclusion

Mediguide integrates AI-driven symptom guidance, bilingual TTS, provider lookup using open data, and a local-first history experience into a privacy-minded web app. It focuses on accessibility for Tamil speakers, cost-effective provider data, and a streamlined profile-centered UX.

### 7.2 Future Enhancements

- Mobile-first responsive redesign and PWA with offline caching
- Appointment booking and richer provider profiles
- Telemedicine (WebRTC) with scheduling
- Encrypted-at-rest patient notes and attachments
- Multi-turn AI flows and admin analytics dashboards

---

## Appendices

### A — Sample API Endpoints

- `POST /api/search-history` — save a search (auth)
- `GET /api/search-history` — fetch user's history (auth)
- `DELETE /api/search-history` — clear all user history (auth)
- `DELETE /api/search-history/{id}` — delete single entry (auth)
- `POST /api/places` — Overpass-based provider lookup
- `POST /api/feedback` — post feedback (auth)
- `GET/POST /api/users` — profile read/write (auth)
- Admin: `/api/admin/search-history`, `/api/admin/clear`, `/api/admin/seed`

### B — Quick Setup (dev)

```powershell
git clone <repo>
cd mediguide
npm install
# set environment variables (DATABASE_URL, FIREBASE_SERVICE_ACCOUNT etc.)
npm run dev
```

### C — Sample Test Cases

- Unit test: TTS Tamil number expansion
- Integration test: Save search → login → server contains new record
- Acceptance test: Speak both languages without error

---

*Report generated from the Mediguide project workspace.*
