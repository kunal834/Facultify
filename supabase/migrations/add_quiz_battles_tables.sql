-- Migration: Add Battle Sessions and Logs for 1v1 Quiz Battles
CREATE TABLE IF NOT EXISTS battle_sessions (
  id                    uuid primary key default gen_random_uuid(),
  cohort_id             uuid references batches(id) on delete cascade,
  topic                 text not null,
  status                text not null default 'waiting', -- 'waiting' | 'active' | 'completed'
  player_1_id           uuid references students(id) on delete cascade,
  player_2_id           uuid references students(id) on delete cascade,
  player_1_score        integer not null default 0,
  player_2_score        integer not null default 0,
  questions             jsonb not null,                  -- Array of quiz questions
  created_at            timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS battle_logs (
  battle_id             uuid references battle_sessions(id) on delete cascade,
  player_id             uuid not null,
  question_index        integer not null,
  selected_option       integer,
  is_correct            boolean not null default false,
  time_spent_ms         integer,
  primary key (battle_id, player_id, question_index)
);

-- Enable RLS
ALTER TABLE battle_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: battle_sessions
-- Any authenticated student can create a battle session
CREATE POLICY IF NOT EXISTS "battle_sessions_insert" ON battle_sessions
  FOR INSERT TO authenticated WITH CHECK (true);

-- Any authenticated user can read sessions (to join via link)
CREATE POLICY IF NOT EXISTS "battle_sessions_select" ON battle_sessions
  FOR SELECT TO authenticated USING (true);

-- Players can update their own session (join, score update)
CREATE POLICY IF NOT EXISTS "battle_sessions_update" ON battle_sessions
  FOR UPDATE TO authenticated USING (true);

-- RLS Policies: battle_logs
CREATE POLICY IF NOT EXISTS "battle_logs_insert" ON battle_logs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "battle_logs_select" ON battle_logs
  FOR SELECT TO authenticated USING (true);
