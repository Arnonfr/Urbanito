# Urbanito Agent Protocol & Governance

## 1. Core Philosophy
To maintain sanity in a multi-agent environment, all agents must adhere to a strict directory structure and identity protocol. This ensures that the human operator knows exactly "who is against whom".

## 2. Directory Structure
All agents must reside in **one** single source of truth:
`/.agent/skills/<agent-name>`

*   **⛔️ Forbidden:** Do not use `.agents` (plural) or root-level folders.
*   **✅ Required:** Every agent must have a `SKILL.md` file describing its capability.

## 3. Agent Identity & Triggering
When you want to invoke an agent, you must use its **Handle**.

| Agent Name | Folder Name | Handle (Chat Trigger) | Responsibility |
| :--- | :--- | :--- | :--- |
| **Urban Guide** | `urban-guide` | `@UrbanGuide` | Creating routes, POI stories, and historical context. |
| **Supabase Expert** | `supabase-expert` | `@Supabase` | Database schema, RLS, Edge Functions. |
| **Script Writer** | `script-writer` | `@ScriptWriter` | Marketing scripts, video commercials, voiceovers. |
| **Architect** | `planning-with-files` | `@Architect` | High-level planning, file organization, rules. |

## 4. How to Register a New Agent
1.  Create a folder in `.agent/skills/<new-name>`.
2.  Add a `SKILL.md` with:
    *   `name`: The internal ID.
    *   `description`: What it does.
    *   `tools`: What it can handle.
3.  Run `npm run agents:update` (See Section 5).

## 5. Dashboard Synchronization
We do not rely on "magic" servers. We rely on file-system truth.
To see the current status of all agents, run:

```bash
node scripts/scan_agents.js
```

This will generate a `AGENTS_INDEX.md` and update the local dashboard.
