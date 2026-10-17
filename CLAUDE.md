# Urbanito — Agent Instructions

## Start here

1. Read `HANDOFF_NEXT_AGENT.md` (current state, branches/PRs, costs, Firebase App Distribution steps for the native app).
2. Communicate with the user in Hebrew.
3. Do not commit or discard the owner's uncommitted `logApiCost` changes in `services/geminiService.ts` and `services/supabase.ts`.
4. Registering Firebase apps and sending App Distribution releases are outward-facing: confirm with the user first (testers, release notes).

## Project Memory

Canonical memory key: `urbanito-your-urban-guide-2`

Before substantial work, read:

1. `/Users/hyh/Documents/arnon/99 System/North Star.md`
2. `/Users/hyh/Documents/arnon/99 System/Working Agreements.md`
3. `/Users/hyh/Documents/arnon/99 System/Current Focus.md`
4. `/Users/hyh/Documents/arnon/01 Projects/urbanito-your-urban-guide-2/Overview.md`
5. `/Users/hyh/Documents/arnon/01 Projects/urbanito-your-urban-guide-2/Current State.md`

At the end of substantial work, update:

1. `/Users/hyh/Documents/arnon/90 Sessions/<date>-urbanito-your-urban-guide-2-<topic>.md`
2. `/Users/hyh/Documents/arnon/01 Projects/urbanito-your-urban-guide-2/Current State.md`
3. `/Users/hyh/Documents/arnon/01 Projects/urbanito-your-urban-guide-2/Backlog.md`
4. `/Users/hyh/Documents/arnon/01 Projects/urbanito-your-urban-guide-2/Decisions.md` when a durable decision was made

## Safety

- Do not copy `.env`, `.env.local`, `native-android/local.properties`, API keys, tokens, keystores or secrets into Obsidian, docs or commits.
- Verify facts from local files or commands before promoting them to project memory.
