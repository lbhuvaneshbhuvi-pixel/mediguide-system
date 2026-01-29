Mediguide Data Flow Diagram (DFD)

Files:
- `mediguide-dfd.puml` — PlantUML source (level-1 DFD) located in `docs/`.

How to render locally:
1. Install PlantUML and Graphviz (or use an online PlantUML renderer).
2. From project root, run (if you have plantuml jar):

```powershell
# render PNG
java -jar plantuml.jar docs\mediguide-dfd.puml
# or render SVG
java -jar plantuml.jar -tsvg docs\mediguide-dfd.puml
```

3. Open the generated `docs\mediguide-dfd.png` or `docs\mediguide-dfd.svg`.

Description (high level):
- User (client browser) interacts with the Next.js web client (UI + voice input).
- Client sends symptom queries to an AI proxy API route which calls Genkit/AI and returns recommendations.
- Client automatically saves search history to `/api/search-history` and feedback to `/api/feedback`.
- Server-side routes verify Firebase ID tokens to map Firebase UID -> local mediNNN user IDs.
- Prisma/MySQL stores Users, SearchHistory, Feedback, etc.
- Admin routes are protected by an admin key and can query/clear data.

If you want a more detailed Level-2 DFD showing message payloads and error-handling paths, tell me which area to expand (AI flow, auth mapping, admin operations, or offline-sync).