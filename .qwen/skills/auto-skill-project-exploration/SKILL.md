---
name: project-exploration
description: Systematic approach to thoroughly explore and analyze a large, multi-platform codebase
source: auto-skill
extracted_at: '2026-06-19T13:22:00.211Z'
---

## Project Exploration Strategy

When asked to thoroughly explore a project, use **parallel agent-based exploration** across multiple dimensions simultaneously rather than sequential reading.

### Step 1: Quick Overview (parallel reads)
- Read `package.json` (or equivalent manifest) for version, dependencies, scripts
- Read `README.md` for project purpose and features
- Read `CHANGELOG.md` (first 100 lines) for recent activity
- Run `git log -20 --oneline` for recent commits
- Run `git status --short` for uncommitted state
- Run `git branch --show-current` for current branch
- List top-level directory structure

### Step 2: Parallel Deep-Dive Agents
Launch **3 parallel agent explorations**:

**Agent 1 — Platform A (e.g., Android):**
- Top-level structure
- Core source tree packages
- Build configuration (build.gradle, CMakeLists.txt, etc.)
- Module/library inventory
- UI component inventory
- Native language breakdown (Java/Kotlin/C++)
- File counts by type

**Agent 2 — Platform B (e.g., iOS):**
- Top-level structure
- Core source tree
- Build configuration (Xcode, CocoaPods, etc.)
- Module inventory
- UI component inventory
- Language breakdown (.m/.h/.swift/.mm)
- File counts by type

**Agent 3 — Tooling & Infrastructure:**
- CLI commands and hooks
- Build system architecture
- Common/shared code
- Templates
- CI/CD configuration
- Test infrastructure
- API documentation structure
- Dependencies and scripts

### Step 3: Synthesis
Compile findings into a structured summary covering:
- **Overview**: version, platforms, codebase size, test coverage
- **Architecture**: key patterns, bridge layers, data flow
- **Platform breakdowns**: file counts, languages, modules, UI components
- **Tooling**: build system, CLI, CI/CD
- **Current state**: active branch, recent commits, uncommitted work
- **Key technologies**: per-platform tech stack comparison

### Tips
- Use `find ... | wc -l` for accurate file counts
- Check `git diff --stat HEAD~N` for recent change scope
- Look for optimization plans, integration plans, and other docs in `docs/plans/`
- Note any non-standard git setups (missing tracking, custom workflows)
