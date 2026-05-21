# Builder OS

## What It Is
Private local dashboard for planning, managing, and improving all projects.
Never public-facing. No accounts, no external APIs yet.

## Repo
Local path: C:\Users\willi\Projects\builder-os
Private — never push to a public repo.

## Purpose
- Plan and track all project work
- Generate safe prompts for Claude / Codex / Ruflo
- Store project memory in Markdown files
- Manage what eventually gets pushed to Builder Hub
- Later: run Claude/Ruflo agents safely from here

## Tech Stack
- Next.js 16 (app router)
- Tailwind CSS v4
- TypeScript
- No database yet — Markdown files only
- No auth yet

## Current Goal
Build a usable MVP private dashboard.

## Pages
- / — Dashboard with projects, workflow, safety rules
- /projects — All 4 projects with details
- /projects/eternalnotes — EternalNotes detail page
- /tasks — Grouped tasks per project
- /prompts — Copyable prompt cards

## Rules
- Private only
- No login needed
- No external API calls yet
- No Ruflo live execution yet
- No autonomous agents yet

## Status
MVP complete. Memory files in place.
