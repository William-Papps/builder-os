# Safe Workflow

## The Standard Process

Follow this every time you work on any project.
This protects against accidental data exposure and unintended changes.

1. Talk through idea
   - Think out loud in Builder OS first
   - Write down what you want to accomplish and why

2. Save decision
   - Update memory/ files with the goal and constraints
   - Record what is off-limits for this session

3. Select project
   - Go to /projects and pick the single repo you will work in
   - Do not plan cross-repo changes in the same session yet

4. Generate prompt
   - Go to /prompts and select the project
   - Copy the relevant prompt template
   - Fill in the specific task and constraints

5. Run Claude / Codex / Ruflo manually in that repo
   - Open the target repo in Claude Code or Codex directly
   - Paste the prompt and run it
   - Do NOT start agents from Builder OS yet

6. Review changes
   - Read every changed file before accepting
   - Check for unexpected changes or private data in diffs
   - Verify nothing unrelated was modified

7. Test locally
   - Run the dev server or build
   - Verify the change works correctly
   - Run typecheck if available

8. Commit
   - Stage only the files you intended to change
   - Write a clear commit message
   - NEVER stage .env, database files, or notes

9. Update Builder OS memory
   - Come back to Builder OS
   - Update memory/ files with what changed
   - Mark tasks done in /tasks
   - Note what is next

10. Push / update public hub if needed
    - Only push to public repos what is safe
    - If a public tool improved, update Builder Hub too

## Key Rules
- Work in one repo at a time
- Review every diff before committing
- No autonomous pushes — you decide what ships
- Builder OS is private — never push its content publicly
- Never push .env files or private notes
- Agents do not deploy or push automatically yet
