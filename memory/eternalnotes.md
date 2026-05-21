# EternalNotes

## What It Is
A free local-first RAG note-taking system using Markdown files.
Split into a private personal version and a clean public open-source version.

## Status in Builder OS
Both repos are registered in data/projects.ts.
Builder OS manages tasks and prompts for both — neither repo is modified from here.

## Repos

### Private Repo (eternalnotes-private)
Local path: C:\Users\willi\Projects\private-eternalnotes
GitHub: https://github.com/William-Papps/private-eternalnotes
Contains real personal notes. NEVER push real notes to GitHub.
Status: Safe

### Public Repo (eternalnotes-public)
Local path: C:\Users\willi\Projects\obsidian-like-rag-system
GitHub: https://github.com/William-Papps/obsidian-like-rag-system
Must contain sample notes only. Clean, simple, downloadable.
Status: Cleanup Needed

## Current Goal
Clean the public repo to be a safe downloadable open-source tool.
No accounts, no billing, no private data.
Anyone should be able to clone and run it with minimal setup.

## Next Tasks (Public Repo)
- [ ] Remove accounts/signup code
- [ ] Remove billing/Stripe code
- [ ] Add sample notes only
- [ ] Rewrite README
- [ ] Simplify installation

## Next Tasks (Private Repo)
- [ ] Verify .gitignore protects notes folder
- [ ] Verify .env is not tracked
- [ ] Verify database files are not tracked
- [ ] Backup notes before any changes

## Safety Rules
- Never put real notes in the public repo
- Never push .env files in either repo
- Backup private notes before any changes
- Do not merge public code into private without careful review
- Audit GitHub history if you suspect a data leak

## Important
Do NOT restructure EternalNotes as part of Builder OS work.
Work on EternalNotes separately, using prompts from Builder OS.
