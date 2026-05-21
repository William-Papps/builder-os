# Safe Workflow

## The Standard Process
Follow this order every time you work on a project.

1. Think in Builder OS
   - Plan the task here first
   - Write down what you want to accomplish
   - Check safety rules before starting

2. Generate prompt
   - Use /prompts to get the right prompt template
   - Fill in the goal and constraints
   - Make sure safety rules are included

3. Run Claude / Codex / Ruflo manually inside ONE repo
   - Open the specific repo in Claude Code or Codex
   - Run the prompt manually
   - Do not run agents across multiple repos at once yet

4. Review changes
   - Read the diff before accepting anything
   - Check for unexpected file changes
   - Verify no private data is in the diff

5. Test locally
   - Run the dev server or build
   - Check that nothing is broken
   - Run typecheck if available

6. Commit
   - Write a clear commit message
   - Stage only the files you intended to change
   - Do not stage .env or data files

7. Push public-safe changes
   - Only push to public repos what is safe
   - Never push private notes or .env files
   - Check .gitignore before pushing

8. Update Builder Hub
   - If a public tool improved, update Builder Hub
   - Keep Builder Hub pointing to the latest clean version

## Important Reminders
- One repo at a time
- Review before committing
- No autonomous pushes yet
- Builder OS is private — never push its contents publicly
