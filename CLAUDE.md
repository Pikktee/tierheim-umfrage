# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start Next.js dev server
- `npm run build` — Production build
- `npm run lint` — ESLint (flat config, core-web-vitals)

No test framework is configured.

## Architecture

Next.js 16 App Router project (TypeScript, React 19) that visualizes survey results from a German animal shelter (Tierheim Hanau). Single-page dashboard with charts powered by Recharts.

**Data flow:** Server Component (`app/page.tsx`) → `getSurveyData()` reads and parses `data/Umfrage.csv` server-side with PapaParse → passes parsed `SurveyData` as props to the client-side `SurveyDashboard` component.

**Key files:**
- `src/lib/survey-types.ts` — Types and target group definitions (`TargetGroupId`, `SurveyRecord`, `SurveyQuestion`)
- `src/lib/survey-data.ts` — Server-only CSV parsing, age normalization, multi-select splitting, target group assignment logic
- `src/components/survey-dashboard.tsx` — Client component: question/group selectors, bar/pie charts, summary modal, records table modal
- `app/globals.css` — All styling (no CSS framework, no Tailwind)
- `data/Umfrage.csv` — Raw survey data, German column headers matching question strings in code

**Target groups** are determined at parse time by combining age bracket with role-specific answers (adopter/surrenderer/volunteer). The mapping logic lives in `getGroups()` in `survey-data.ts`. Questions are organized into groups matching these target groups.

**Multi-select questions** are listed explicitly in `MULTI_SELECT_QUESTIONS` set — these render as horizontal bar charts; single-select questions render as donut pie charts.

## Conventions

- Language: UI and all survey content is German. Code identifiers are English.
- Path alias: `@/*` maps to project root (e.g., `@/src/lib/survey-data`).
- Font: Noto Sans via `next/font/google`.
- No component library — plain HTML elements with custom CSS.
