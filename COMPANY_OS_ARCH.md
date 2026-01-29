# Urbanito Command Center (Company OS) Architecture

## 🎯 Vision
Transform the development environment into a "Company Simulation" where the user interacts with a single **AI Orchestrator (CEO/Manager)** who delegates tasks to specialized **Agent Personas**. All visualized in a browser-based Dashboard.

## 🏗 Structure

### 1. The Agents (Virtual Depts)
We will define "Agent Personas" in the system. Each has a specific system prompt/context.

*   **Alpha (Orchestrator):** The user's point of contact. Triage tasks, breaks them down, assigns to specialists.
*   **Builder (Engineering):** Codex/Dev agent. Handles code generation.
*   **Scribe (Content/Marketing):** Copywriter, SEO specialist.
*   **Watchtower (QA/Testing):** Runs tests, checks compatibility.
*   **Atlas (Data/Maps):** GIS specialist, route optimization.

### 2. The Browser Interface ("Workflow in the Browser")
A new section in the Urbanito App: `/admin/command-center` (Protected Route).

#### Components:
*   **Chat Console:** Direct line to Alpha (Orchestrator).
*   **Live Org Chart:** Visual node graph showing active agents and their status (Idle/Working).
*   **Task Stream:** Kanban-style board showing tasks moving from "Delegated" -> "In Progress" -> "Review" -> "Done".
*   **Terminal Output:** A window showing "logs" from the agents (simulated or real if hooked to backend).

### 3. Technical Implementation
*   **Frontend:** React + Tailwind.
*   **State Management:** Supabase `agents_tasks` table to persist the "Company State".
*   **AI Backend:**
    *   We use the existing `geminiService` but wrapping it with **Multi-Agent Prompts**.
    *   **Orchestrator Loop:** The Chat Console sends user input to the Orchestrator. The Orchestrator returns a structured JSON containing `{ message: string, delegated_tasks: Task[] }`.
    *   **Task Execution:** The frontend (or a background Edge Function) picks up delegated tasks and sends them to the specific Agent Persona (e.g., "Builder, write a React component for X").

## 🚀 Roadmap

### Phase 1: The Interface (UI)
*   Build the `/admin/command-center` layout.
*   Create the "Chat with CEO" component.
*   Create the "Agent Status" cards.

### Phase 2: The Brain (Logic)
*   Define the `Agent` type and `Task` type in TypeScript.
*   Implement the `Orchestrator` prompt engineering in `geminiService`.
*   Mock the delegation flow (e.g., User says "Create a new route", Planner says "Delegating to Atlas...", Atlas returns "Route created").

### Phase 3: Real Integration
*   Connect "Atlas" agent to the actual Map Generation logic.
*   Connect "Scribe" agent to the existing "Description Generation" logic.

## 📝 Example User Flow
1.  **User:** "I want to launch a new 'Night Life' route in Tel Aviv."
2.  **Alpha (Manager):** "Understood. I'm activating the team.
    *   Assigning **Atlas** to find 5 top bars.
    *   Assigning **Scribe** to write the marketing copy.
    *   Assigning **Builder** to configure the route JSON."
3.  **UI:** Shows 3 spinning loaders under the respective Agents.
4.  **Atlas:** "Found 5 bars..." (Task moves to Done).
5.  **Alpha:** "Atlas is done. Scribe is working on descriptions..."

---

**Does this match your vision of the 'Company Structure'?**
