-- ─────────────────────────────────────────────────────────────────────────────
-- Facultify — Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor or via `supabase db push`
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────────────────
create type subscription_tier as enum ('starter', 'growth', 'enterprise');
create type user_role       as enum ('admin', 'teacher', 'student');
create type question_type   as enum ('mcq', 'text', 'true_false');
create type difficulty_level as enum ('easy', 'medium', 'hard');
create type test_status     as enum ('draft', 'published', 'active', 'closed');
create type submission_status as enum ('not_started', 'in_progress', 'submitted', 'graded');
create type invoice_status  as enum ('paid', 'pending', 'overdue');

-- ─── Institutions ─────────────────────────────────────────────────────────────
create table institutions (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  domain                text not null unique,
  admin_email           text not null unique,
  logo_url              text,
  subscription_tier     subscription_tier not null default 'starter',
  max_teachers          integer not null default 5,
  max_students          integer not null default 100,
  ai_generations_used   integer not null default 0,
  ai_generations_limit  integer not null default 20,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

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
  user_id         uuid references auth.users on delete set null,  -- null until invite accepted
  institution_id  uuid not null references institutions on delete cascade,
  name            text not null,
  email           text not null,
  subject         text not null,
  avatar_url      text,
  is_active       boolean not null default true,
  joined_at       timestamptz not null default now()
);

-- ─── Batches ──────────────────────────────────────────────────────────────────
create table batches (
  id              uuid primary key default gen_random_uuid(),
  teacher_id      uuid not null references teachers on delete cascade,
  institution_id  uuid not null references institutions on delete cascade,
  name            text not null,
  subject         text not null,
  student_count   integer not null default 0,
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
  ai_generated      boolean not null default false,
  attempt_count     integer not null default 0,
  avg_score         numeric(5,2) not null default 0,
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
