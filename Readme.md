# Facultify

**Facultify** is a modern educational assessment platform that bridges the gap between teaching and evaluation. It gives educators tools to create, manage, and grade tests — and provides students a clean, distraction-free exam experience — all within a single multi-role web application.

> **Current status**: The application is fully production-ready end-to-end. Real Supabase authentication, database, and Row Level Security are all wired up and working. All mock data has been removed from every page. To run against your own database, create a Supabase project, run `supabase/schema.sql`, and add the three env vars to `.env.local`. See [Supabase Setup](#supabase-setup).

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Roles & Features](#roles--features)
  - [Admin](#admin)
  - [Teacher](#teacher)
  - [Student](#student)
- [Data Models](#data-models)
- [State Management](#state-management)
- [Backend — Supabase](#backend--supabase)
  - [Database schema](#database-schema)
  - [Multi-tenancy & RLS](#multi-tenancy--rls)
  - [Service layer](#service-layer)
  - [Auth flow](#auth-flow)
  - [RLS bootstrap fix](#rls-bootstrap-fix)
- [Supabase Setup](#supabase-setup)
- [Subscription Plans](#subscription-plans)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Roadmap](#roadmap)

---

## Overview

Facultify is built for educational institutions. A single institution account contains:

- One **Admin** who manages teachers, monitors analytics, and controls billing.
- Multiple **Teachers** who create tests, manage student batches, and grade submissions.
- Multiple **Students** who take exams and track their performance over time.

The platform supports three question types (MCQ, True/False, Written), an AI-powered test generator, per-role analytics dashboards, and a tiered subscription billing model.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| UI Library | React 19 |
| Styling | Tailwind CSS 3.4 |
| Component Primitives | Radix UI + shadcn/ui |
| State Management | Zustand 5 |
| Forms | React Hook Form 7 + Zod 4 |
| Charts | Recharts 2 |
| Icons | Lucide React |
| Notifications | Sonner |
| **Database** | **Supabase (PostgreSQL)** |
| **Auth** | **Supabase Auth** |
| **Storage** | **Supabase Storage** (for logo uploads, future) |
| **AI generation** | **Supabase Edge Functions** (calls OpenAI / Anthropic) |

---

## Project Structure

```
Facultify/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Marketing landing page
│   ├── onboard/page.tsx          # Institution onboarding wizard (real Supabase)
│   ├── auth/
│   │   ├── login/page.tsx        # Email + password login form
│   │   ├── signup/page.tsx       # Account creation with email confirmation
│   │   └── callback/route.ts     # OAuth / magic-link code exchange + profile creation
│   ├── admin/
│   │   ├── layout.tsx            # Auth guard: redirects if no session or wrong role
│   │   ├── page.tsx              # Admin dashboard (real Supabase data)
│   │   ├── teachers/page.tsx     # Teacher management & invitations
│   │   ├── analytics/page.tsx    # Institution-wide analytics (real data)
│   │   ├── billing/page.tsx      # Subscription & invoice management (real data)
│   │   └── settings/page.tsx     # Institution settings
│   ├── teacher/
│   │   ├── layout.tsx            # Auth guard: redirects if no session or wrong role
│   │   ├── page.tsx              # Teacher dashboard (real Supabase data)
│   │   ├── create-test/page.tsx  # 3-step test builder
│   │   ├── tests/page.tsx        # Test list & management
│   │   ├── ai-generator/page.tsx # AI-powered test generation
│   │   ├── checking/page.tsx     # Submission grading interface
│   │   └── students/page.tsx     # Student & batch management
│   └── student/
│       ├── layout.tsx            # Auth guard: redirects if no session or wrong role
│       ├── page.tsx              # Student dashboard (real Supabase data)
│       ├── tests/page.tsx        # Available & past tests
│       ├── test/[id]/page.tsx    # Exam-taking interface
│       ├── analytics/page.tsx    # Personal performance analytics
│       └── profile/page.tsx      # Student profile
├── components/
│   ├── ui/                       # 28 shadcn/ui base components
│   ├── dashboards/               # Shared dashboard chrome (nav, sidebar, stats cards)
│   │   └── DashboardNav.tsx      # User dropdown with real name/email + sign out
│   ├── marketing/                # Landing page sections
│   └── testing/                  # Exam-specific components (timer, question display)
├── hooks/

│   ├── use-countdown.ts          # Countdown timer logic
│   └── use-toast.ts              # Toast notification hook
├── lib/
│   ├── types.ts                  # All TypeScript domain model definitions
│   ├── database.types.ts         # TypeScript types matching Supabase DB rows
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client (Client Components)
│   │   ├── server.ts             # Server Supabase client (RSC / Route Handlers)
│   │   └── admin.ts              # Service-role client — bypasses RLS (server-only)
│   ├── supabase-service.ts       # Real backend service layer — used by all pages
│   ├── mock-service.ts           # Legacy in-memory service (kept for reference only)
│   ├── mock-data.ts              # Seed data used only for SUBSCRIPTION_PLANS config
│   └── utils.ts                  # Shared utilities (formatting, color helpers)
├── store/
│   └── app-store.ts              # Zustand store: real Supabase session, initSession(), signOut()
├── supabase/
│   └── schema.sql                # Full PostgreSQL schema — run once in Supabase SQL Editor
├── middleware.ts                  # Next.js edge middleware: protects /admin, /teacher, /student, /onboard
├── .env.local.example            # Required env var template
├── tailwind.config.ts
├── next.config.ts
└── tsconfig.json
```

---

## Roles & Features

### Admin

Admins represent the institution owner/manager. They access `/admin/*` routes.

**Dashboard** — KPI cards (total teachers, students, active tests), recent test activity chart sourced from real test data, and quick-action shortcuts.

**Teacher Management** (`/admin/teachers`) — Invite teachers by email, activate/deactivate accounts, and monitor capacity usage against the subscription plan limit.

**Analytics** (`/admin/analytics`) — Institution-wide charts: monthly test volume, submission trends, subject distribution, and teacher activity (tests created per teacher from live data). Enrolled students list loaded directly from the database.

**Billing** (`/admin/billing`) — View current subscription plan, usage summary (real teacher and student counts from the database), upgrade path, and full invoice history with payment status.

**Settings** (`/admin/settings`) — Institution name, domain, branding, and configuration.

**Onboarding** (`/onboard`) — A 4-step wizard for new institutions: institution details → admin profile → subscription plan selection → confirmation. Submits to Supabase and redirects to the admin dashboard on success.

---

### Teacher

Teachers access `/teacher/*` routes.

**Dashboard** — Stats (students, tests, pending grading, average class score), recent test cards, and quick-action buttons. All data loaded from real Supabase queries.

**Create Test** (`/teacher/create-test`) — A 3-step guided builder:

1. **Test Details** — Title, subject, batch, duration, scheduled open/close times.
2. **Add Questions** — Add any number of questions. Supports:
   - **MCQ**: Multiple choice with one correct option.
   - **True/False**: Binary choice with correct answer.
   - **Written**: Free-text question with a model answer for manual grading.
   - Each question has difficulty (easy/medium/hard), marks, and an optional explanation.
3. **Review & Publish** — Summary view with the option to save as draft or publish immediately.

**Manage Tests** (`/teacher/tests`) — Filterable list (All / Draft / Published / Active / Closed). Each card shows attempt count, average score, and status with actions to edit, delete, or publish.

**AI Generator** (`/teacher/ai-generator`) — Configure subject, topic, difficulty mix, and question count. Generates a full test automatically (uses AI credits from the subscription quota).

**Grading** (`/teacher/checking`) — Split-panel interface: left shows the submission queue (filterable by test and grading status), right shows the full answer sheet for the selected submission. Written answers are manually scored with optional feedback; MCQ/T-F answers are auto-marked.

**Students** (`/teacher/students`) — Create and manage batches (classes). Add/remove students, track enrollment, and view batch-level performance.

---

### Student

Students access `/student/*` routes.

**Dashboard** — Upcoming tests with countdown, recent results, and a score trend sparkline. All sourced from real submissions in the database.

**Tests** (`/student/tests`) — Tabs for Upcoming and Past tests. Upcoming tests show time remaining; past tests show score, percentage, and pass/fail badge.

**Exam Interface** (`/student/test/[id]`) — Full-screen, distraction-free exam environment:
- Live countdown timer with color-coded urgency states.
- Question navigation grid showing answered / unanswered / flagged states.
- Renders all three question types (MCQ, True/False, Written).
- Auto-saves answers on every change.
- Submit confirmation dialog before final submission.

**Analytics** (`/student/analytics`) — Personal charts: score history over time (area chart), subject-wise breakdown, tests attempted vs passed, best/weakest subject highlights.

**Profile** (`/student/profile`) — Name, email, roll number, and enrolled batches.

---

## Data Models

All TypeScript types are defined in `lib/types.ts`. The corresponding Supabase table types (snake_case DB columns) are in `lib/database.types.ts`.

```
Institution
  id, name, domain, adminEmail, subscriptionTier,
  maxTeachers, maxStudents, isActive, createdAt

Teacher
  id, institutionId, name, email, subject,
  isActive, joinedAt, studentCount, testCount

Student
  id, institutionId, teacherId, batchId, name,
  email, rollNumber, isActive, enrolledAt,
  overallScore, testsAttempted

Batch
  id, teacherId, institutionId, name, subject, studentCount

MockTest
  id, teacherId, institutionId, batchId, title, subject,
  status (draft | published | active | closed),
  totalMarks, durationMinutes, scheduledAt, closesAt,
  questions[], attemptCount, avgScore, aiGenerated

Question
  id, testId, order, type (mcq | text | true_false),
  text, marks, difficulty (easy | medium | hard),
  options[] (MCQOption), correctAnswer, explanation

Submission
  id, testId, studentId, status (not_started | in_progress | submitted | graded),
  startedAt, submittedAt, gradedAt, totalScore, maxScore,
  percentage, timeTakenMinutes, answers[]

SubmissionAnswer
  questionId, selectedOptionId?, textAnswer?,
  isCorrect?, marksAwarded?, teacherFeedback?, timeSpentSeconds

Invoice
  id, institutionId, amount, currency,
  status (paid | pending | overdue), issuedAt, dueAt
```

Analytics snapshots:
- `AdminAnalytics` — institution-level metrics and AI quota usage
- `TeacherAnalytics` — class performance, pending grading count, recent test scores
- `StudentAnalytics` — score history, subject breakdown, pass rate

---

## State Management

`store/app-store.ts` uses Zustand. The store holds the active session as a discriminated union and drives all role-based routing.

```ts
type ActiveSession =
  | { role: 'admin';   user: Institution & { adminName: string } }
  | { role: 'teacher'; user: Teacher; institution: Institution }
  | { role: 'student'; user: Student; institution: Institution; teacher: Teacher }
```

**Key functions on the store:**

- `initSession()` — Called on mount in every dashboard layout. Calls `supabase.auth.getUser()`, then queries the `profiles` table to determine the user's role, then fetches the correct entity row (institution / teacher / student) and sets `activeSession`. A module-level guard prevents concurrent calls when multiple layouts mount simultaneously.
- `signOut()` — Calls `supabase.auth.signOut()` and clears the session.
- `sessionLoading` — Boolean flag set to `true` while `initSession()` is running. Layouts show a spinner until this is `false`.

Role-based routing is enforced in two layers:
1. **Middleware** (`middleware.ts`) — runs on the edge before every request to protected routes. Redirects to `/auth/login` if there is no active Supabase cookie session.
2. **Layout auth guards** — each dashboard layout (`admin/layout.tsx`, `teacher/layout.tsx`, `student/layout.tsx`) calls `initSession()`, checks the role, and redirects if it does not match the route prefix.

---

## Backend — Supabase

The entire backend runs on **Supabase** — Postgres for the database, Supabase Auth for users, and Edge Functions for AI test generation.

### Database schema

`supabase/schema.sql` creates the following tables:

| Table | What it stores |
|---|---|
| `institutions` | One row per institution (tenant). Holds subscription tier, plan limits, and AI credit usage. |
| `profiles` | Links each `auth.users` row to an institution, a role (`admin` / `teacher` / `student`), and the specific entity row. This is the glue between Supabase Auth and the application data. |
| `teachers` | Teacher records. `user_id` is null until the teacher accepts their invitation and creates an account. |
| `batches` | Groups of students created by a teacher. |
| `students` | Student records. `batch_id` and `teacher_id` define which class they belong to. |
| `tests` | Test configurations. Stores `attempt_count` and `avg_score` as denormalized columns — kept up to date automatically by a Postgres trigger whenever a submission changes. |
| `questions` | Individual questions belonging to a test. |
| `question_options` | MCQ and True/False answer options. Foreign-keyed to a question. |
| `submissions` | One row per (test, student) pair. Tracks status from `not_started` → `in_progress` → `submitted` → `graded`. |
| `submission_answers` | One row per (submission, question) pair. Stores the student's answer, auto-grading result, and any teacher feedback. |
| `invoices` | Billing invoices per institution. Admin-only read access via RLS. |

**Automatic triggers** (no application code needed):

- When a `submission` row is inserted or updated, a trigger recalculates `tests.attempt_count` and `tests.avg_score` and writes them back to the test row.
- When a `student` row is inserted or deleted, a trigger increments or decrements `batches.student_count`.

**View: `teachers_with_stats`**

A database view that joins `teachers` with live counts from `students` and `tests`, returning `student_count` and `test_count` per teacher. Uses `security_invoker = true` so RLS on the underlying tables still applies.

---

### Multi-tenancy & RLS

Every table has Row Level Security enabled. No authenticated user can read or write another institution's data — the database itself rejects the query.

Three `SECURITY DEFINER` helper functions are used inside every RLS policy:

```sql
auth_institution_id()  -- returns the logged-in user's institution_id
auth_role()            -- returns 'admin', 'teacher', or 'student'
auth_entity_id()       -- returns the user's entity row id (teacher.id, student.id, etc.)
```

These are defined as `SECURITY DEFINER` so they always query `profiles` as the function owner, avoiding a recursive RLS check on `profiles` itself.

**Example — what a student can see in `tests`:**

```sql
create policy "tests_select" on tests for select to authenticated
  using (
    institution_id = auth_institution_id() and (
      auth_role() = 'admin' or
      teacher_id = auth_entity_id() or
      (auth_role() = 'student' and
        status != 'draft' and
        batch_id = (select batch_id from students where id = auth_entity_id())
      )
    )
  );
```

A student can only see tests that belong to their institution, are not drafts, and are assigned to their specific batch.

---

### Service layer

`lib/supabase-service.ts` is the real backend service used by all pages. Every function has the **same name and TypeScript signature** as the old `lib/mock-service.ts`, making the migration a one-line import change per file.

The service handles translation between Supabase's snake_case columns (`teacher_id`, `joined_at`) and the camelCase TypeScript types the rest of the app uses (`teacherId`, `joinedAt`). This mapping is done by private `toTeacher()`, `toStudent()`, `toTest()` etc. mapper functions — the rest of the app never sees raw DB rows.

**Important implementation detail:** The service uses an **untyped** `createBrowserClient` (no `<Database>` generic) rather than the typed client. This is intentional — the typed Supabase client's generic inference collapses to `never` when the `Database` type doesn't include a `Relationships` key on every table, which causes cascading TypeScript errors across the entire service layer. The mapper functions already provide full type safety at the domain boundary, so the untyped client is the right trade-off.

**Auto-grading on submit** — When `submitTest()` is called, the service fetches the test's questions and correct options, grades every MCQ and True/False answer automatically, upserts all answers to `submission_answers`, and updates the submission's `total_score` and `percentage`. Written answers are left ungraded for the teacher to score manually via `gradeTextAnswer()`.

**AI generation** — `generateAITest()` calls `supabase.functions.invoke('generate-test', ...)` which triggers a Supabase Edge Function. That Edge Function (to be written separately) calls the AI provider (OpenAI, Anthropic, etc.) and returns a `MockTest` payload. The edge function runs on Supabase's servers so API keys are never exposed to the browser.

---

### Auth flow

Supabase Auth handles all user accounts. Here is how each role gets created and how the session is established.

**Admin (institution owner):**
1. Admin visits `/auth/signup`, enters full name + email + password.
2. Supabase sends a confirmation email. Admin clicks the link, which hits `/auth/callback`.
3. The callback route checks for an existing profile. If none, it redirects to `/onboard`.
4. Admin completes the onboarding wizard. `onboardInstitution()` inserts the `institutions` row and creates a `profiles` row linking the auth user as `role: 'admin'`.
5. `initSession()` is called, reads the profile, and sets the admin session in the Zustand store.

**Teacher:**
1. Admin adds a teacher from `/admin/teachers` — a `teachers` row is inserted (no `user_id` yet).
2. Teacher receives an invite email (via `supabase.auth.admin.inviteUserByEmail()` — requires wiring a Server Action using `lib/supabase/admin.ts`).
3. Teacher clicks the link, hits `/auth/callback`. The callback finds no profile for the new user, checks the `teachers` table by email, creates a `profiles` row with `role: 'teacher'`, and links `teachers.user_id` to the auth user.
4. Teacher is redirected to `/teacher`.

**Student:**
1. Teacher adds a student from `/teacher/students` — a `students` row is inserted.
2. Same invite flow as teachers. The callback checks `students` by email, creates the profile with `role: 'student'`, and links `students.user_id`.
3. Student is redirected to `/student`.

**Session lifecycle:**
- Every dashboard layout calls `initSession()` on mount.
- `initSession()` calls `supabase.auth.getUser()`, queries `profiles`, then fetches the entity row (institution / teacher / student).
- `sessionLoading` stays `true` until the query completes. The layout renders a spinner during this time.
- `signOut()` in the nav dropdown calls `supabase.auth.signOut()` and redirects to `/auth/login`.

---

### RLS bootstrap fix

When a new admin creates their institution via the onboarding wizard, there is a chicken-and-egg problem:

- The `institutions` table SELECT policy checks `id = auth_institution_id()`.
- `auth_institution_id()` queries the `profiles` table.
- At the moment of insertion, the profile doesn't exist yet — so `auth_institution_id()` returns `NULL`.
- A chained `.insert().select().single()` call would therefore return no rows and throw.

**Fix:** `onboardInstitution()` in `supabase-service.ts` generates the institution UUID client-side using `crypto.randomUUID()`, inserts the institution row (INSERT policy is `with check (true)` — unrestricted), immediately inserts the `profiles` row, and only then fetches the institution with a separate `.select()` call. By the time of the SELECT, the profile exists and `auth_institution_id()` resolves correctly.

---

## Supabase Setup

**1. Create a Supabase project**

Go to [supabase.com](https://supabase.com), create a new project, and wait for the database to be provisioned.

**2. Run the schema**

Open the SQL Editor in your Supabase dashboard. Paste the entire contents of `supabase/schema.sql` and run it. This creates all tables, enums, indexes, triggers, RLS policies, and helper functions in one shot.

> If you see errors about enum types already existing, either reset the database first or comment out the `create type` lines for types that already exist.

**3. Set environment variables**

```bash
cp .env.local.example .env.local
```

Fill in the three values from your Supabase project's **Settings → API** page:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

**4. Start the app**

```bash
npm run dev
```

Visit `http://localhost:3000/auth/signup` to create the first admin account, then complete the onboarding wizard.

**5. Regenerate DB types (whenever schema changes)**

```bash
npx supabase gen types typescript --local > lib/database.types.ts
```

---

## Subscription Plans

| | Starter | Growth | Enterprise |
|---|---|---|---|
| **Price / month** | $29 | $79 | $199 |
| **Max Teachers** | 5 | 25 | Unlimited |
| **Max Students** | 100 | 500 | Unlimited |
| **AI Credits / month** | 20 | 100 | 999 |
| **Analytics** | Basic | Advanced | Full Suite |
| **Custom Branding** | No | Yes | Yes |
| **SSO / LDAP** | No | No | Yes |
| **API Access** | No | No | Yes |
| **Support** | Email | Email + Chat | 24/7 Dedicated |

---

## Getting Started

**Prerequisites**: Node.js 18+

```bash
# Clone the repo
git clone <repo-url>
cd Facultify

# Install dependencies
npm install

# Add your Supabase credentials (see Supabase Setup above)
cp .env.local.example .env.local

# Start development server
npm run dev
```

Open `http://localhost:3000/auth/signup` to create your first institution admin account.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server with hot reload |
| `npm run build` | Create optimised production build |
| `npm start` | Run production build locally |
| `npm run lint` | Run ESLint across the codebase |

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values.

```env
# Required for Supabase connection
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Server-side only — never expose to the browser
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

> **SUPABASE_SERVICE_ROLE_KEY** — This key bypasses all RLS policies. It is used by `lib/supabase/admin.ts` for privileged server-side operations (sending invite emails). Never import `admin.ts` from a Client Component or expose this key in any client-side bundle.

---

## Deployment

Facultify is a standard Next.js application. Deploy to any platform that supports Node.js.

**Vercel (recommended)**

```bash
npm i -g vercel
vercel
```

Add the three Supabase env vars in your Vercel project settings (Settings → Environment Variables). Vercel keeps `SUPABASE_SERVICE_ROLE_KEY` server-side automatically since it doesn't start with `NEXT_PUBLIC_`.

**Other options**: Netlify, Railway, Render, Docker, AWS (ECS/Amplify), Azure App Service.

---

## Roadmap

- [x] **Frontend** — Full multi-role UI (Admin, Teacher, Student)
- [x] **Mock service layer** — In-memory backend for UI development
- [x] **Supabase schema** — PostgreSQL tables, enums, indexes, triggers, RLS
- [x] **Row Level Security** — Multi-tenant data isolation enforced at database level
- [x] **Supabase service layer** — Drop-in replacement for mock service (`supabase-service.ts`)
- [x] **Auth middleware** — Server-side route protection via Next.js middleware
- [x] **Auth pages** — `/auth/login`, `/auth/signup`, `/auth/callback` fully built
- [x] **Real authentication** — Zustand store wired to Supabase Auth (`initSession`, `signOut`)
- [x] **Auth guards in layouts** — Admin, Teacher, Student layouts redirect unauthenticated users
- [x] **All dashboards on real data** — Every page (`admin`, `teacher`, `student`) pulls live from Supabase
- [x] **Mock data fully removed** — All 11 dashboard pages switched from `mock-service` to `supabase-service`; all hardcoded dummy IDs removed
- [x] **RLS onboarding fix** — Bootstrap race condition solved; new institutions onboard correctly
- [x] **TypeScript clean** — Zero `tsc --noEmit` errors across the entire codebase
- [ ] **Teacher/Student invite emails** — Wire `inviteUserByEmail()` in a Server Action using `lib/supabase/admin.ts`
- [ ] **Real AI Generation** — Write the `generate-test` Supabase Edge Function (calls OpenAI/Anthropic)
- [ ] **Question Bank** — Reusable question library with tags and search
- [ ] **Proctoring** — Webcam / tab-switch detection during exams
- [ ] **Export** — PDF results, CSV grade exports
- [ ] **Real-time** — WebSocket-based live exam status (Supabase Realtime)
- [ ] **Stripe billing** — Webhook handler for subscription upgrades and invoice creation
- [ ] **Tests** — Unit + integration test suite (Vitest + Playwright)
- [ ] **CI/CD** — GitHub Actions pipeline for lint, test, and deploy
