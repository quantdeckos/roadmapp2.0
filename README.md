# RoadMapp Mobile (MVP Scaffold)

React Native + Expo + TypeScript scaffold for RoadMapp with:
- iOS + Android support
- phased roadmap flow with locked next phase
- repeating task model (repeat until done)
- AI planning service stub (OpenAI Responses API)
- Supabase client setup
- daily notification scheduling
- bottom navigation with 5 tabs

## Product Scope Implemented

1. Top header with:
- hamburger menu slot (Profile / Alerts / Support)
- Ask AI + Search bar
- month/date row
- new project `+` action slot

2. Middle roadmap section:
- ruler-like phase rail
- current phase title and task checklist
- check-circle completion model
- next phase locked until current phase tasks are complete
- animated transition when moving phase

3. Bottom:
- project progress section + due date
- 5-tab navigation (Home / Projects / Roadmap / Calendar / Settings)

4. Calendar:
- weekly selector
- scheduled tasks list (starter structure for full scheduling)

## Local Setup

Node.js was not available in this environment while scaffolding. Install Node 20+ first, then:

```bash
npm install
cp .env.example .env
npm run start
```

## Environment Variables

Set these in `.env`:

```env
EXPO_PUBLIC_OPENAI_API_KEY=...
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## Key Files

- `App.tsx` app shell and tab routing
- `src/screens/RoadmapScreen.tsx` flagship roadmap UI
- `src/state/useRoadmap.ts` phase lock + task progression logic
- `src/services/aiPlanner.ts` AI roadmap generation request
- `src/services/supabase.ts` backend client
- `src/services/notifications.ts` daily reminder setup

## Next Implementation Slice

1. Replace mock project with Supabase-backed project/phase/task tables.
2. Connect Ask AI bar to a real “Generate Plan” modal flow.
3. Add real drawer menu and new-project modal.
4. Persist checklist and scheduling updates in database.
5. Add authentication (email + Google).
