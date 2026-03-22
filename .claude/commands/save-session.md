Save the current session context to memory so it can be resumed in a new Claude Code session.

Do the following:

1. Summarize what we were working on in this session — what task, what decisions were made, what was completed, and exactly where we left off.
2. Note why the session is ending / why a restart is needed if that's clear from context.
3. List the specific next steps to pick up from in the next session.
4. Write this to: .claude/context.md in the project root. Completely overwrite any previous content. Use this format (run `date` to get the current time for the timestamp):

---
name: Current session context
saved: <timestamp from `date`>
description: What was being worked on at the end of the last session — resume point for next session
type: project
---

Write the content clearly so the next session can immediately pick up without re-explaining anything.
