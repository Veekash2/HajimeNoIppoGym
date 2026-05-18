-- ============================================================
-- Workout Plans & Weekly Schedule — run this AFTER schema.sql
-- ============================================================

-- Saved workout templates (e.g. "Push Day", "Leg Day", "Boxing")
create table public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  color text default '#CC0000',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Exercises inside a template (no sets yet — just the exercise list)
create table public.template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.workout_templates(id) on delete cascade,
  exercise_id uuid references public.exercises(id),
  exercise_name text not null,
  order_index integer default 0,
  default_sets integer default 3,
  default_reps integer default 10,
  default_weight_kg numeric default 0
);

-- Weekly schedule: maps each day (0=Mon..6=Sun) to a template
-- A day can have no template assigned (rest day), one template, or be set to tai chi
create table public.weekly_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0=Mon, 6=Sun
  template_id uuid references public.workout_templates(id) on delete set null,
  is_tai_chi boolean default false,
  is_rest boolean default false,
  notes text,
  unique(user_id, day_of_week)
);

-- Disable RLS (single-user app)
alter table public.workout_templates disable row level security;
alter table public.template_exercises disable row level security;
alter table public.weekly_schedule disable row level security;

-- Seed default weekly schedule rows for the single user
-- (empty schedule — user will fill it in)
insert into public.weekly_schedule (user_id, day_of_week, is_rest)
values
  ('11110000-0000-0000-0000-000000000001', 0, true),
  ('11110000-0000-0000-0000-000000000001', 1, true),
  ('11110000-0000-0000-0000-000000000001', 2, true),
  ('11110000-0000-0000-0000-000000000001', 3, true),
  ('11110000-0000-0000-0000-000000000001', 4, true),
  ('11110000-0000-0000-0000-000000000001', 5, true),
  ('11110000-0000-0000-0000-000000000001', 6, true)
on conflict (user_id, day_of_week) do nothing;
