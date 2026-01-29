Mediguide — Data Flow Diagram (Level 2)

This Level-2 DFD expands the high-level diagram to show client-side TTS, localStorage/pending sync behavior, and the optional cloud-TTS fallback.

How to render
- Install PlantUML or use an online PlantUML renderer.
- From the project root:
  - `java -jar plantuml.jar docs/mediguide-dfd-level2.puml` -> generates PNG/SVG next to the file.

Key components
- Web Client (Next.js): handles Search UI, Voice Input, TTS player, and Local Storage for offline-first search history.
- Sync Worker: reads `medi_pending_syncs` and attempts to POST to `/api/search-history` when user is authenticated.
- API Layer (Next.js server routes): `/api/ai/symptom`, `/api/search-history`, `/api/feedback`, `/api/users`, `/api/admin/*`, and an optional `/api/tts` for cloud TTS.
- Database (MySQL + Prisma): stores Users, SearchHistory, Feedback, etc.
- Firebase Auth: issues ID tokens used for server-side verification and mapping to local `mediNNN` users.
- Genkit / AI Services: handles symptom->medicine inference.
- Cloud TTS (optional): used when client-side Tamil voices are unavailable.

Client-specific notes
- Local storage keys used in the app:
  - `medi_search_history_local` — stores recent searches for UI + offline access.
  - `medi_pending_syncs` — stores searches to be synced when user logs in or regains connectivity.
  - `medi_tts_auto_speak`, `medi_tts_speak_both` — TTS preferences.
- TTS flow:
  - `speak(text, lang)` selects a voice (prioritizes `ta-IN` / `ta` for Tamil), expands numbers to Tamil words using `expandNumbersToTamil()`, and invokes `speechSynthesis`.
  - If local voices missing, UI provides `Init TTS` and `Refresh` to help browsers populate voices; falls back to cloud TTS if configured.

If you want a PNG/SVG generated and attached here, I can render the PlantUML locally and provide the image, or guide you through running PlantUML on your machine.