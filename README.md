# War Room 2026

[![CI](https://github.com/CryerWorks/war-room-2026/actions/workflows/ci.yml/badge.svg)](https://github.com/CryerWorks/war-room-2026/actions/workflows/ci.yml)

A personal goal-tracking application built as a hands-on exercise in full-stack development, Git workflow, and deployment operations.

The app tracks progress across three development domains — linguistic, technical, and physical — using a hierarchical system of goals, operations, phases, and daily modules. Built from scratch over the course of a single development session as a learning project.

## Purpose

This project exists primarily as an educational exercise. The goals were:

- Build a complete full-stack application from an empty directory to production deployment
- Practice professional Git workflow: feature branching, pull requests, code review, squash merging
- Gain experience with modern web tooling (Next.js, TypeScript, Supabase, Vercel)
- Understand systems design decisions by making them firsthand
- Create something functional enough to actually use for personal development tracking

## Architecture

```
Domain (Linguistic, Skill, Physical)
  └── Goal
        └── Operation
              └── Phase
                    └── Module (daily scheduled activity)
                          └── Note
```

Modules are the atomic unit — scheduled on specific dates with optional time slots. They can exist standalone (quick calendar items) or linked to a phase within an operation. Completing modules cascades upward: all modules done completes a phase, all phases completes an operation, all operations achieves a goal.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL via Supabase |
| Hosting | Vercel |
| Version Control | Git + GitHub |

## Features

- Hierarchical goal tracking with cascading completion
- Calendar view with module scheduling, completion toggling, and notes
- Operation command center with phase timeline and schedule view
- Sequential phase progression with auto-advance
- Completion overlays on phase, operation, and goal achievement
- Inline editing and deletion for all entities
- Hours tracking computed from module time slots
- Streak tracking (global and per-domain)
- Module linking via cascading selector (goal → operation → phase)
- Hierarchy breadcrumbs on calendar and operation views
- Mobile responsive layout

## Visual Design

Styled after a tactical HUD aesthetic. Dark-only theme with hexagonal grid background, monospaced data readouts, corner bracket indicators, a system boot sequence on first visit, page transition glitch effects, and domain-colored accents throughout.

## Local Development

```bash
git clone https://github.com/CryerWorks/war-room-2026.git
cd war-room-2026
npm install
```

Create a `.env.local` file with your Supabase credentials (see `.env.example` for the required variables). Run the migration scripts in `supabase/migrations/` in order via the Supabase SQL Editor.

```bash
npm run dev
```

Open `http://localhost:3000`.

## Project Structure

```
src/
├── app/                     # Next.js App Router pages and API routes
│   ├── api/                 # REST endpoints (domains, goals, operations, phases, modules, notes, streaks)
│   ├── calendar/            # Calendar view
│   ├── domains/             # Domain list, detail, and operation detail pages
│   └── page.tsx             # Dashboard
├── components/              # React components
│   ├── calendar/            # CalendarGrid, DayDetail
│   ├── dashboard/           # DashboardShell, DomainCard
│   ├── goals/               # GoalCard, GoalForm
│   ├── modules/             # ModuleItem, ModuleForm, ModuleNotes
│   ├── operations/          # OperationCard, OperationForm
│   ├── phases/              # PhaseForm
│   └── ui/                  # Shared primitives (ProgressBar, StepperTimeline, CompletionOverlay, etc.)
├── lib/                     # Utilities (supabase client, hours, streaks, calendar helpers)
└── types/                   # TypeScript interfaces
```

## License

Personal project. Not intended for redistribution.
