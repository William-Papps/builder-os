# Builder OS

## What It Is
Private local dashboard for planning, managing, and improving all projects.
Never public-facing. No accounts, no external APIs yet.

## Repo
Local path: C:\Users\willi\Projects\builder-os
GitHub: https://github.com/William-Papps/builder-os (private)

## Tech Stack
- Next.js 16 (app router, Turbopack)
- Tailwind CSS v4
- TypeScript
- No database — data/projects.ts and memory/*.md as source of truth
- No auth

## Purpose
- View all connected projects in one place
- Track active tasks per project
- Generate safe AI prompts pre-filled with project context
- Store project memory in Markdown
- Follow the safe workflow for every change
- Later: run Claude/Ruflo/Codex agents from here

## Pages
- / — Dashboard with stats, project grid, tasks, safety rules
- /projects — List of all connected projects (from data/projects.ts)
- /projects/[id] — Dynamic project detail page
- /projects/eternalnotes — EternalNotes overview (links to both public/private)
- /tasks — Grouped tasks per project
- /prompts — 6 prompt templates with project selector
- /workflow — 10-step safe workflow with rules

## Project Registry
All project data lives in data/projects.ts.
To add a project: add an entry to the PROJECTS array.
IDs: builder-os, builder-hub, eternalnotes-public, eternalnotes-private

## Rules
- Private only
- No login
- No external API calls yet
- No Ruflo live execution yet
- No autonomous agents yet

## Status
MVP complete. Project registry in place. All 4 projects connected.
