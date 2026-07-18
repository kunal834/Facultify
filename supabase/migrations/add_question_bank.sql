-- Run this in the Supabase SQL Editor to add the reusable, taggable question
-- bank. (schema.sql already includes this for fresh installs.)
--
-- This is additive and does not touch `questions`/`question_options` or the
-- grading pipeline — tests still own their own frozen copy of each question.

do $$ begin
  create type exam_track as enum ('ssc', 'upsc', 'jee', 'neet', 'cuet', 'general');
exception
  when duplicate_object then null;
end $$;

create table if not exists question_bank (
  id                     uuid primary key default gen_random_uuid(),
  institution_id         uuid references institutions on delete cascade,
  created_by_teacher_id  uuid references teachers on delete set null,
  exam_track             exam_track not null default 'general',
  topic                  text not null,
  subject                text not null,
  relevant_date          date,
  type                   question_type not null,
  text                   text not null,
  marks                  integer not null default 1,
  difficulty             difficulty_level not null default 'medium',
  correct_answer         text,
  explanation            text,
  ai_generated           boolean not null default false,
  created_at             timestamptz not null default now()
);

create table if not exists question_bank_options (
  id                uuid primary key default gen_random_uuid(),
  question_bank_id  uuid not null references question_bank on delete cascade,
  text              text not null,
  is_correct        boolean not null default false
);

create index if not exists question_bank_institution_id_idx on question_bank (institution_id);
create index if not exists question_bank_exam_track_idx     on question_bank (exam_track);
create index if not exists question_bank_topic_idx          on question_bank (topic);
create index if not exists question_bank_relevant_date_idx  on question_bank (relevant_date);
create index if not exists question_bank_options_qbid_idx   on question_bank_options (question_bank_id);

alter table question_bank         enable row level security;
alter table question_bank_options enable row level security;

drop policy if exists "qbank_select" on question_bank;
create policy "qbank_select" on question_bank for select to authenticated
  using (institution_id is null or institution_id = auth_institution_id());

drop policy if exists "qbank_insert" on question_bank;
create policy "qbank_insert" on question_bank for insert to authenticated
  with check (
    institution_id = auth_institution_id() and
    (auth_role() = 'admin' or auth_role() = 'teacher')
  );

drop policy if exists "qbank_update" on question_bank;
create policy "qbank_update" on question_bank for update to authenticated
  using (institution_id = auth_institution_id() and
    (auth_role() = 'admin' or created_by_teacher_id = auth_entity_id()))
  with check (institution_id = auth_institution_id());

drop policy if exists "qbank_delete" on question_bank;
create policy "qbank_delete" on question_bank for delete to authenticated
  using (institution_id = auth_institution_id() and
    (auth_role() = 'admin' or created_by_teacher_id = auth_entity_id()));

drop policy if exists "qbank_opts_select" on question_bank_options;
create policy "qbank_opts_select" on question_bank_options for select to authenticated
  using (question_bank_id in (
    select id from question_bank
    where institution_id is null or institution_id = auth_institution_id()
  ));

drop policy if exists "qbank_opts_insert" on question_bank_options;
create policy "qbank_opts_insert" on question_bank_options for insert to authenticated
  with check (question_bank_id in (
    select id from question_bank where institution_id = auth_institution_id()
    and (auth_role() = 'admin' or created_by_teacher_id = auth_entity_id())
  ));

drop policy if exists "qbank_opts_update" on question_bank_options;
create policy "qbank_opts_update" on question_bank_options for update to authenticated
  using (question_bank_id in (
    select id from question_bank where institution_id = auth_institution_id()
    and (auth_role() = 'admin' or created_by_teacher_id = auth_entity_id())
  ));

drop policy if exists "qbank_opts_delete" on question_bank_options;
create policy "qbank_opts_delete" on question_bank_options for delete to authenticated
  using (question_bank_id in (
    select id from question_bank where institution_id = auth_institution_id()
    and (auth_role() = 'admin' or created_by_teacher_id = auth_entity_id())
  ));
