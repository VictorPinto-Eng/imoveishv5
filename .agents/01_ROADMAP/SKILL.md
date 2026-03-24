---
name: Roadmap Management
description: Workflow for maintaining the project roadmap and tracking development progress.
---

# Skill: Roadmap Management

This skill is designed to ensure the `roadmap.md` artifact is consistently updated as development progresses.

## ⚠️ MANDATORY REQUIREMENT

**BEFORE starting any new development or task:**
1.  **Register the task in `roadmap.md`** in the project root.
2.  If the task is new, add it to `🟡 Em Desenvolvimento`.
3.  Ensure the `task.md` for the current activity reflects the roadmap status.

## Core Responsibilities

1.  **Automatic Updates**: Whenever a task is marked as complete in `task.md` or a feature is implemented, mirror that change in the `roadmap.md` file.
2.  **Date Tracking**: Record the start date when a feature moves to `In Progress` and the end date when it is `Completed`.
3.  **New Ideas**: Capture new user requests or ideas discussed in the chat and add them to the `🔴 Roadmap (Futuro)` or `🟡 Em Desenvolvimento` sections.
4.  **Location Logging**: For every significant change, document the primary files or components affected to maintain a clear history.

## Workflow

1.  **Check Roadmap**: At the start of a task, review `roadmap.md` to see where the current work fits.
2.  **Update Status**:
    - When starting: Move item to `Em Desenvolvimento` and add "Início: [Data]".
    - When finishing: Move item to `Concluído` and add "Fim: [Data]".
3.  **Register Ideas**: If a user mentions a future desire, immediately add it to the roadmap.
4.  **Artifact Synchronization**: Ensure `roadmap.md` remains the "Source of Truth" for the project's high-level progress, while `task.md` handles granular implementation steps.

## Formatting Standards

- Use status emojis: 🟢 (Finished), 🟡 (In Progress), 🔴 (Future/Roadmap).
- Include date ranges: `(Início: DD/MM/AAAA - Fim: DD/MM/AAAA)`.
- Use concise bullet points for features.
