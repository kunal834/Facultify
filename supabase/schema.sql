-- ─────────────────────────────────────────────────────────────────────────────
-- Facultify — Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor or via `supabase db push`
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────────────────
create type subscription_tier as enum ('free', 'starter', 'institution', 'campus');
create type user_role       as enum ('admin', 'teacher', 'student');
create type question_type   as enum ('mcq', 'text', 'true_false');
create type difficulty_level as enum ('easy', 'medium', 'hard');
create type test_status     as enum ('draft', 'published', 'active', 'closed');
create type submission_status as enum ('not_started', 'in_progress', 'submitted', 'graded');
create type invoice_status  as enum ('paid', 'pending', 'overdue');
create type exam_track      as enum ('ssc', 'upsc', 'jee', 'neet', 'cuet', 'general');

-- ─── Institutions ─────────────────────────────────────────────────────────────
create table institutions (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  domain                text not null unique,
  admin_email           text not null unique,
  logo_url              text,
  primary_color         text not null default '#3B6FFF',
  secondary_color       text not null default '#7C3AED',
  subscription_tier     subscription_tier not null default 'free',
  max_teachers          integer not null default 1,
  max_students          integer not null default 20,
  ai_generations_used   integer not null default 0,
  ai_generations_limit  integer not null default 10,
  is_active             boolean not null default true,
  billing_status        text not null default 'free',
  dodo_customer_id      text,
  dodo_subscription_id  text,
  current_period_end    timestamptz,
  exam_tracks           text[] not null default array['general']::text[],
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create unique index institutions_dodo_customer_id_idx
  on institutions (dodo_customer_id) where dodo_customer_id is not null;

-- ─── Profiles (auth.users → role mapping) ────────────────────────────────────
-- Created after institution, teacher, or student row exists.
create table profiles (
  id              uuid primary key references auth.users on delete cascade,
  institution_id  uuid not null references institutions on delete cascade,
  role            user_role not null,
  entity_id       uuid not null,  -- institution.id | teacher.id | student.id
  created_at      timestamptz not null default now()
);

-- ─── Teachers ─────────────────────────────────────────────────────────────────
create table teachers (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users on delete set null,
  institution_id  uuid not null references institutions on delete cascade,
  name            text not null,
  email           text not null, -- Removed global 'unique' here
  subject         text not null,
  avatar_url      text,
  is_active       boolean not null default true,
  joined_at       timestamptz not null default now(),
  
  -- Enforces one email per institution
  unique (institution_id, email) 
);
-- ─── Batches ──────────────────────────────────────────────────────────────────
create table batches (
  id              uuid primary key default gen_random_uuid(),
  teacher_id      uuid not null references teachers on delete cascade,
  institution_id  uuid not null references institutions on delete cascade,
  name            text not null,
  subject         text not null,
  student_count   integer not null default 0,
  exam_track      text not null default 'general',
  created_at      timestamptz not null default now()
);

-- ─── Students ─────────────────────────────────────────────────────────────────
create table students (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users on delete set null,
  institution_id  uuid not null references institutions on delete cascade,
  teacher_id      uuid not null references teachers on delete restrict,
  batch_id        uuid not null references batches on delete restrict,
  name            text not null,
  email           text not null,
  roll_number     text not null,
  avatar_url      text,
  is_active       boolean not null default true,
  exam_track      text not null default 'general',
  enrolled_at     timestamptz not null default now()
);

-- ─── Tests ────────────────────────────────────────────────────────────────────
create table tests (
  id                uuid primary key default gen_random_uuid(),
  teacher_id        uuid not null references teachers on delete cascade,
  institution_id    uuid not null references institutions on delete cascade,
  batch_id          uuid not null references batches on delete cascade,
  title             text not null,
  description       text not null default '',
  subject           text not null,
  status            test_status not null default 'draft',
  total_marks       integer not null default 0,
  duration_minutes  integer not null,
  scheduled_at      timestamptz,
  closes_at         timestamptz,
  result_delay_minutes integer not null default 2,   -- minutes after a student submits before their result is auto-revealed
  results_declared     boolean not null default false, -- teacher override: reveal immediately, regardless of the timer
  results_declared_at  timestamptz,
  ai_generated      boolean not null default false,
  attempt_count     integer not null default 0,
  avg_score         numeric(5,2) not null default 0,
  exam_track        text not null default 'general',
  created_at        timestamptz not null default now()
);

-- ─── Questions ────────────────────────────────────────────────────────────────
create table questions (
  id              uuid primary key default gen_random_uuid(),
  test_id         uuid not null references tests on delete cascade,
  "order"         integer not null,
  type            question_type not null,
  text            text not null,
  marks           integer not null default 1,
  difficulty      difficulty_level not null default 'medium',
  correct_answer  text,     -- text questions only
  explanation     text,
  time_limit      integer,  -- seconds, optional
  ai_generated    boolean not null default false
);

-- ─── Question Options (MCQ / true_false) ─────────────────────────────────────
create table question_options (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid not null references questions on delete cascade,
  text         text not null,
  is_correct   boolean not null default false
);

-- ─── Question Bank ────────────────────────────────────────────────────────────
-- Reusable, taggable questions independent of any single test — decoupled
-- from `questions` (which stays test-owned, cascade-deleted with its test,
-- so the grading pipeline doesn't change). Tests are built by copying rows
-- from here into `questions`/`question_options` at creation time; editing a
-- bank question never retroactively changes a test students already sat.
--
-- institution_id is nullable: null rows are platform-wide shared content
-- (e.g. a shared current-affairs daily quiz set), non-null rows are one
-- institution's own reusable questions. Only service-role code can create
-- platform-wide rows — see RLS below.
create table question_bank (
  id                     uuid primary key default gen_random_uuid(),
  institution_id         uuid references institutions on delete cascade,
  created_by_teacher_id  uuid references teachers on delete set null,
  exam_track             exam_track not null default 'general',
  topic                  text not null,
  subject                text not null,
  relevant_date          date,     -- for time-bound content, e.g. a specific day's current affairs
  type                   question_type not null,
  text                   text not null,
  marks                  integer not null default 1,
  difficulty             difficulty_level not null default 'medium',
  correct_answer         text,     -- text questions only
  explanation            text,
  ai_generated           boolean not null default false,
  created_at             timestamptz not null default now()
);

create table question_bank_options (
  id                uuid primary key default gen_random_uuid(),
  question_bank_id  uuid not null references question_bank on delete cascade,
  text              text not null,
  is_correct        boolean not null default false
);

-- ─── Submissions ──────────────────────────────────────────────────────────────
create table submissions (
  id                  uuid primary key default gen_random_uuid(),
  test_id             uuid not null references tests on delete cascade,
  student_id          uuid not null references students on delete cascade,
  student_name        text not null default '',
  status              submission_status not null default 'not_started',
  started_at          timestamptz,
  submitted_at        timestamptz,
  graded_at           timestamptz,
  total_score         integer not null default 0,
  max_score           integer not null default 0,
  percentage          integer not null default 0,
  time_taken_minutes  integer not null default 0,
  unique(test_id, student_id)
);

-- ─── Submission Answers ───────────────────────────────────────────────────────
create table submission_answers (
  id                  uuid primary key default gen_random_uuid(),
  submission_id       uuid not null references submissions on delete cascade,
  question_id         uuid not null references questions on delete cascade,
  selected_option_id  uuid references question_options on delete set null,
  text_answer         text,
  is_correct          boolean,
  marks_awarded       integer,
  teacher_feedback    text,
  time_spent_seconds  integer not null default 0,
  unique(submission_id, question_id)
);

-- ─── Invoices ─────────────────────────────────────────────────────────────────
create table invoices (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references institutions on delete cascade,
  amount          numeric(10,2) not null,
  currency        text not null default 'USD',
  status          invoice_status not null default 'pending',
  issued_at       timestamptz not null default now(),
  due_at          timestamptz not null,
  paid_at         timestamptz,
  description     text not null default ''
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index on teachers          (institution_id);
create index on students          (institution_id);
create index on students          (teacher_id);
create index on students          (batch_id);
create index on batches           (teacher_id);
create index on batches           (institution_id);
create index on tests             (teacher_id);
create index on tests             (institution_id);
create index on tests             (batch_id);
create index on questions         (test_id);
create index on question_options  (question_id);
create index on question_bank         (institution_id);
create index on question_bank         (exam_track);
create index on question_bank         (topic);
create index on question_bank         (relevant_date);
create index on question_bank_options (question_bank_id);
create index on submissions       (test_id);
create index on submissions       (student_id);
create index on submission_answers(submission_id);
create index on invoices          (institution_id);
create index on profiles          (institution_id);

-- ─── updated_at trigger ───────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_institutions_updated_at
  before update on institutions
  for each row execute function set_updated_at();

-- ─── Trigger: keep tests.attempt_count and avg_score in sync ─────────────────
create or replace function sync_test_stats()
returns trigger language plpgsql security definer as $$
declare
  v_test_id uuid;
begin
  v_test_id := coalesce(NEW.test_id, OLD.test_id);
  update tests set
    attempt_count = (
      select count(*) from submissions where test_id = v_test_id
    ),
    avg_score = (
      select coalesce(avg(percentage), 0)
      from submissions
      where test_id = v_test_id and status = 'graded'
    )
  where id = v_test_id;
  return null;
end;
$$;

create trigger on_submission_change
  after insert or update or delete on submissions
  for each row execute function sync_test_stats();

-- ─── Trigger: keep batches.student_count in sync ─────────────────────────────
create or replace function sync_batch_student_count()
returns trigger language plpgsql security definer as $$
begin
  if (TG_OP = 'INSERT') then
    update batches set student_count = student_count + 1 where id = NEW.batch_id;
  elsif (TG_OP = 'DELETE') then
    update batches set student_count = greatest(student_count - 1, 0) where id = OLD.batch_id;
  elsif (TG_OP = 'UPDATE' and OLD.batch_id is distinct from NEW.batch_id) then
    update batches set student_count = greatest(student_count - 1, 0) where id = OLD.batch_id;
    update batches set student_count = student_count + 1 where id = NEW.batch_id;
  end if;
  return null;
end;
$$;

create trigger on_student_batch_change
  after insert or update of batch_id or delete on students
  for each row execute function sync_batch_student_count();

-- ─── Trigger: enforce plan limits on teacher / student invites ───────────────
-- Authoritative check — cannot be bypassed by calling the REST API directly
-- (unlike a client-side count, which RLS can also prevent a caller from
-- computing accurately in the first place, e.g. teachers can't see other
-- teachers' students).
create or replace function enforce_teacher_limit()
returns trigger language plpgsql security definer as $$
declare
  v_max   integer;
  v_count integer;
begin
  select max_teachers into v_max from institutions where id = NEW.institution_id;
  select count(*) into v_count from teachers where institution_id = NEW.institution_id;
  if v_count >= v_max then
    raise exception 'LIMIT_TEACHERS_EXCEEDED';
  end if;
  return NEW;
end;
$$;

create trigger before_teacher_insert
  before insert on teachers
  for each row execute function enforce_teacher_limit();

create or replace function enforce_student_limit()
returns trigger language plpgsql security definer as $$
declare
  v_max   integer;
  v_count integer;
begin
  select max_students into v_max from institutions where id = NEW.institution_id;
  select count(*) into v_count from students where institution_id = NEW.institution_id;
  if v_count >= v_max then
    raise exception 'LIMIT_STUDENTS_EXCEEDED';
  end if;
  return NEW;
end;
$$;

create trigger before_student_insert
  before insert on students
  for each row execute function enforce_student_limit();

-- ─── RLS Helper functions ─────────────────────────────────────────────────────
-- These are security definer so they always run as the function owner,
-- preventing recursive RLS lookups on the profiles table.

create or replace function auth_institution_id() returns uuid
  language sql stable security definer
  as $$ select institution_id from profiles where id = auth.uid() $$;

create or replace function auth_role() returns user_role
  language sql stable security definer
  as $$ select role from profiles where id = auth.uid() $$;

create or replace function auth_entity_id() returns uuid
  language sql stable security definer
  as $$ select entity_id from profiles where id = auth.uid() $$;

-- ─── Enable RLS ───────────────────────────────────────────────────────────────
alter table institutions        enable row level security;
alter table profiles            enable row level security;
alter table teachers            enable row level security;
alter table batches             enable row level security;
alter table students            enable row level security;
alter table tests               enable row level security;
alter table questions           enable row level security;
alter table question_options    enable row level security;
alter table question_bank         enable row level security;
alter table question_bank_options enable row level security;
alter table submissions         enable row level security;
alter table submission_answers  enable row level security;
alter table invoices            enable row level security;

-- ─── RLS Policies: institutions ───────────────────────────────────────────────
create policy "inst_select" on institutions for select to authenticated
  using (id = auth_institution_id());

create policy "inst_insert" on institutions for insert to authenticated
  with check (true);  -- anyone can create an institution during onboarding

create policy "inst_update" on institutions for update to authenticated
  using (id = auth_institution_id() and auth_role() = 'admin')
  with check (id = auth_institution_id());

-- ─── RLS Policies: profiles ───────────────────────────────────────────────────
create policy "profiles_select" on profiles for select to authenticated
  using (id = auth.uid() or institution_id = auth_institution_id());

create policy "profiles_insert" on profiles for insert to authenticated
  with check (true);

-- ─── RLS Policies: teachers ───────────────────────────────────────────────────
create policy "teachers_select" on teachers for select to authenticated
  using (institution_id = auth_institution_id());

create policy "teachers_insert" on teachers for insert to authenticated
  with check (institution_id = auth_institution_id() and auth_role() = 'admin');

create policy "teachers_update" on teachers for update to authenticated
  using (institution_id = auth_institution_id() and auth_role() = 'admin')
  with check (institution_id = auth_institution_id());

create policy "teachers_delete" on teachers for delete to authenticated
  using (institution_id = auth_institution_id() and auth_role() = 'admin');

-- ─── RLS Policies: batches ────────────────────────────────────────────────────
create policy "batches_select" on batches for select to authenticated
  using (institution_id = auth_institution_id());

create policy "batches_insert" on batches for insert to authenticated
  with check (
    institution_id = auth_institution_id() and
    (auth_role() = 'admin' or auth_role() = 'teacher')
  );

create policy "batches_update" on batches for update to authenticated
  using (institution_id = auth_institution_id() and
    (auth_role() = 'admin' or teacher_id = auth_entity_id()))
  with check (institution_id = auth_institution_id());

create policy "batches_delete" on batches for delete to authenticated
  using (institution_id = auth_institution_id() and
    (auth_role() = 'admin' or teacher_id = auth_entity_id()));

-- ─── RLS Policies: students ───────────────────────────────────────────────────
create policy "students_select" on students for select to authenticated
  using (
    institution_id = auth_institution_id() and (
      auth_role() = 'admin' or
      teacher_id = auth_entity_id() or
      (auth_role() = 'student' and id = auth_entity_id())
    )
  );

create policy "students_insert" on students for insert to authenticated
  with check (
    institution_id = auth_institution_id() and
    (auth_role() = 'admin' or auth_role() = 'teacher')
  );

create policy "students_update" on students for update to authenticated
  using (institution_id = auth_institution_id() and
    (auth_role() = 'admin' or teacher_id = auth_entity_id()))
  with check (institution_id = auth_institution_id());

create policy "students_delete" on students for delete to authenticated
  using (institution_id = auth_institution_id() and
    (auth_role() = 'admin' or teacher_id = auth_entity_id()));

-- ─── RLS Policies: tests ──────────────────────────────────────────────────────
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

create policy "tests_insert" on tests for insert to authenticated
  with check (
    institution_id = auth_institution_id() and
    (auth_role() = 'admin' or auth_role() = 'teacher')
  );

create policy "tests_update" on tests for update to authenticated
  using (institution_id = auth_institution_id() and
    (auth_role() = 'admin' or teacher_id = auth_entity_id()))
  with check (institution_id = auth_institution_id());

create policy "tests_delete" on tests for delete to authenticated
  using (institution_id = auth_institution_id() and
    (auth_role() = 'admin' or teacher_id = auth_entity_id()));

-- ─── RLS Policies: questions ──────────────────────────────────────────────────
create policy "questions_select" on questions for select to authenticated
  using (test_id in (select id from tests where institution_id = auth_institution_id()));

create policy "questions_insert" on questions for insert to authenticated
  with check (test_id in (
    select id from tests where institution_id = auth_institution_id()
    and (auth_role() = 'admin' or teacher_id = auth_entity_id())
  ));

create policy "questions_update" on questions for update to authenticated
  using (test_id in (
    select id from tests where institution_id = auth_institution_id()
    and (auth_role() = 'admin' or teacher_id = auth_entity_id())
  ));

create policy "questions_delete" on questions for delete to authenticated
  using (test_id in (
    select id from tests where institution_id = auth_institution_id()
    and (auth_role() = 'admin' or teacher_id = auth_entity_id())
  ));

-- ─── RLS Policies: question_options ──────────────────────────────────────────
create policy "qopts_select" on question_options for select to authenticated
  using (question_id in (
    select id from questions where test_id in (
      select id from tests where institution_id = auth_institution_id()
    )
  ));

create policy "qopts_insert" on question_options for insert to authenticated
  with check (question_id in (
    select id from questions where test_id in (
      select id from tests where institution_id = auth_institution_id()
      and (auth_role() = 'admin' or teacher_id = auth_entity_id())
    )
  ));

create policy "qopts_update" on question_options for update to authenticated
  using (question_id in (
    select id from questions where test_id in (
      select id from tests where institution_id = auth_institution_id()
      and (auth_role() = 'admin' or teacher_id = auth_entity_id())
    )
  ));

create policy "qopts_delete" on question_options for delete to authenticated
  using (question_id in (
    select id from questions where test_id in (
      select id from tests where institution_id = auth_institution_id()
      and (auth_role() = 'admin' or teacher_id = auth_entity_id())
    )
  ));

-- ─── RLS Policies: question_bank ──────────────────────────────────────────────
-- Platform-wide rows (institution_id is null) are readable by anyone
-- authenticated; only service-role code can write them (no insert/update/
-- delete policy allows a null institution_id — those writes bypass RLS).
create policy "qbank_select" on question_bank for select to authenticated
  using (institution_id is null or institution_id = auth_institution_id());

create policy "qbank_insert" on question_bank for insert to authenticated
  with check (
    institution_id = auth_institution_id() and
    (auth_role() = 'admin' or auth_role() = 'teacher')
  );

create policy "qbank_update" on question_bank for update to authenticated
  using (institution_id = auth_institution_id() and
    (auth_role() = 'admin' or created_by_teacher_id = auth_entity_id()))
  with check (institution_id = auth_institution_id());

create policy "qbank_delete" on question_bank for delete to authenticated
  using (institution_id = auth_institution_id() and
    (auth_role() = 'admin' or created_by_teacher_id = auth_entity_id()));

-- ─── RLS Policies: question_bank_options ─────────────────────────────────────
create policy "qbank_opts_select" on question_bank_options for select to authenticated
  using (question_bank_id in (
    select id from question_bank
    where institution_id is null or institution_id = auth_institution_id()
  ));

create policy "qbank_opts_insert" on question_bank_options for insert to authenticated
  with check (question_bank_id in (
    select id from question_bank where institution_id = auth_institution_id()
    and (auth_role() = 'admin' or created_by_teacher_id = auth_entity_id())
  ));

create policy "qbank_opts_update" on question_bank_options for update to authenticated
  using (question_bank_id in (
    select id from question_bank where institution_id = auth_institution_id()
    and (auth_role() = 'admin' or created_by_teacher_id = auth_entity_id())
  ));

create policy "qbank_opts_delete" on question_bank_options for delete to authenticated
  using (question_bank_id in (
    select id from question_bank where institution_id = auth_institution_id()
    and (auth_role() = 'admin' or created_by_teacher_id = auth_entity_id())
  ));

-- ─── RLS Policies: submissions ────────────────────────────────────────────────
create policy "subs_select" on submissions for select to authenticated
  using (
    test_id in (select id from tests where institution_id = auth_institution_id()) and (
      auth_role() = 'admin' or
      (auth_role() = 'teacher' and test_id in (
        select id from tests where teacher_id = auth_entity_id()
      )) or
      (auth_role() = 'student' and student_id = auth_entity_id())
    )
  );

create policy "subs_insert" on submissions for insert to authenticated
  with check (
    auth_role() = 'student' and
    student_id = auth_entity_id()
  );

create policy "subs_update" on submissions for update to authenticated
  using (
    (auth_role() = 'student' and student_id = auth_entity_id()) or
    (auth_role() = 'teacher' and test_id in (
      select id from tests where teacher_id = auth_entity_id()
    ))
  );

-- ─── RLS Policies: submission_answers ────────────────────────────────────────
create policy "sa_select" on submission_answers for select to authenticated
  using (submission_id in (
    select s.id from submissions s
    join tests t on t.id = s.test_id
    where t.institution_id = auth_institution_id() and (
      auth_role() = 'admin' or
      t.teacher_id = auth_entity_id() or
      (auth_role() = 'student' and s.student_id = auth_entity_id())
    )
  ));

create policy "sa_insert" on submission_answers for insert to authenticated
  with check (submission_id in (
    select id from submissions where student_id = auth_entity_id()
  ));

create policy "sa_update" on submission_answers for update to authenticated
  using (submission_id in (
    select s.id from submissions s
    join tests t on t.id = s.test_id
    where
      (auth_role() = 'student' and s.student_id = auth_entity_id()) or
      (auth_role() = 'teacher' and t.teacher_id = auth_entity_id())
  ));

-- ─── RLS Policies: invoices ───────────────────────────────────────────────────
create policy "invoices_select" on invoices for select to authenticated
  using (institution_id = auth_institution_id() and auth_role() = 'admin');

-- ─── Storage: institution-assets (logos, used on rank cards) ─────────────────
-- Objects are stored under `{institution_id}/logo.<ext>`. Public read (logos
-- aren't sensitive and need to be fetchable by the edge card-rendering route
-- and by anyone viewing a shared card); writes restricted to that
-- institution's admin.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('institution-assets', 'institution-assets', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "institution_assets_public_read" on storage.objects for select to public
  using (bucket_id = 'institution-assets');

create policy "institution_assets_admin_write" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'institution-assets' and
    (storage.foldername(name))[1] = auth_institution_id()::text and
    auth_role() = 'admin'
  );

create policy "institution_assets_admin_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'institution-assets' and
    (storage.foldername(name))[1] = auth_institution_id()::text and
    auth_role() = 'admin'
  );

create policy "institution_assets_admin_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'institution-assets' and
    (storage.foldername(name))[1] = auth_institution_id()::text and
    auth_role() = 'admin'
  );

-- ─── View: teachers_with_stats (used in admin teacher list) ──────────────────
create or replace view teachers_with_stats
  with (security_invoker = true)
as
select
  t.*,
  coalesce(sc.cnt, 0)::int as student_count,
  coalesce(tc.cnt, 0)::int as test_count
from teachers t
left join (
  select teacher_id, count(*)::int as cnt from students where is_active group by teacher_id
) sc on sc.teacher_id = t.id
left join (
  select teacher_id, count(*)::int as cnt from tests group by teacher_id
) tc on tc.teacher_id = t.id;

-- ─── 1v1 Battle Arena ────────────────────────────────────────────────────────
create table battle_sessions (
  id                    uuid primary key default gen_random_uuid(),
  cohort_id             uuid references batches(id) on delete cascade,
  topic                 text not null,
  status                text not null default 'waiting',
  player_1_id           uuid references students(id) on delete cascade,
  player_2_id           uuid references students(id) on delete cascade,
  player_1_score        integer not null default 0,
  player_2_score        integer not null default 0,
  questions             jsonb not null,
  created_at            timestamptz not null default now()
);

create table battle_logs (
  battle_id             uuid references battle_sessions(id) on delete cascade,
  player_id             uuid not null,
  question_index        integer not null,
  selected_option       integer,
  is_correct            boolean not null default false,
  time_spent_ms         integer,
  primary key (battle_id, player_id, question_index)
);
