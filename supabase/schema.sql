-- ============================================================
-- Hajime No Ippo Gym — Single-user schema (no auth required)
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- Fixed user ID — the one and only user
-- Copy this value, it is used in constants/userId.ts as well
-- '11110000-0000-0000-0000-000000000001'

-- ============================================================
-- DROP existing tables if re-running (safe to run multiple times)
-- ============================================================
drop table if exists public.personal_records cascade;
drop table if exists public.tai_chi_sessions cascade;
drop table if exists public.sets cascade;
drop table if exists public.workout_exercises cascade;
drop table if exists public.workouts cascade;
drop table if exists public.exercises cascade;
drop table if exists public.profiles cascade;

-- ============================================================
-- PROFILES — single user, no auth.users dependency
-- ============================================================
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text default 'Veekash',
  xp integer default 0,
  rank_level integer default 0,
  total_workouts integer default 0,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_workout_date date,
  created_at timestamptz default now()
);

-- ============================================================
-- EXERCISES LIBRARY
-- ============================================================
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text not null,
  category text not null,
  description text,
  is_boxing boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- WORKOUT SESSIONS
-- ============================================================
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text,
  started_at timestamptz default now(),
  finished_at timestamptz,
  duration_seconds integer,
  total_volume_kg numeric default 0,
  xp_earned integer default 0,
  notes text,
  workout_type text default 'strength'
);

-- ============================================================
-- EXERCISES WITHIN A WORKOUT
-- ============================================================
create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references public.workouts(id) on delete cascade,
  exercise_id uuid references public.exercises(id),
  exercise_name text not null,
  order_index integer default 0,
  notes text
);

-- ============================================================
-- SETS
-- ============================================================
create table public.sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid references public.workout_exercises(id) on delete cascade,
  set_number integer,
  reps integer default 0,
  weight_kg numeric default 0,
  duration_seconds integer,
  is_pr boolean default false,
  completed boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- TAI CHI SESSIONS
-- ============================================================
create table public.tai_chi_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  session_date date default current_date,
  duration_minutes integer default 45,
  xp_earned integer default 25,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- PERSONAL RECORDS
-- ============================================================
create table public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  exercise_id uuid references public.exercises(id),
  exercise_name text not null,
  weight_kg numeric,
  reps integer,
  achieved_at timestamptz default now()
);

-- ============================================================
-- RLS — disabled (single user app, anon key access)
-- ============================================================
alter table public.profiles disable row level security;
alter table public.exercises disable row level security;
alter table public.workouts disable row level security;
alter table public.workout_exercises disable row level security;
alter table public.sets disable row level security;
alter table public.tai_chi_sessions disable row level security;
alter table public.personal_records disable row level security;

-- ============================================================
-- SEED: single user profile with fixed ID
-- ============================================================
insert into public.profiles (id, display_name, xp, rank_level, total_workouts, current_streak, longest_streak)
values ('11110000-0000-0000-0000-000000000001', 'Veekash', 0, 0, 0, 0, 0);

-- ============================================================
-- SEED: exercise library
-- ============================================================
insert into public.exercises (name, muscle_group, category, is_boxing) values
-- Boxing
('Jab', 'Full Body', 'boxing', true),
('Cross', 'Full Body', 'boxing', true),
('Hook', 'Full Body', 'boxing', true),
('Uppercut', 'Full Body', 'boxing', true),
('Shadowboxing', 'Full Body', 'boxing', true),
('Heavy Bag Work', 'Full Body', 'boxing', true),
('Speed Bag', 'Shoulders', 'boxing', true),
('Double End Bag', 'Full Body', 'boxing', true),
('Jump Rope', 'Full Body', 'cardio', true),
('Neck Bridge', 'Neck', 'boxing', true),
('Bob and Weave', 'Full Body', 'boxing', true),
('Slip Bag', 'Full Body', 'boxing', true),
-- Strength
('Bench Press', 'Chest', 'strength', false),
('Incline Bench Press', 'Chest', 'strength', false),
('Pull-ups', 'Back', 'strength', false),
('Chin-ups', 'Back', 'strength', false),
('Barbell Row', 'Back', 'strength', false),
('Deadlift', 'Full Body', 'strength', false),
('Squat', 'Legs', 'strength', false),
('Romanian Deadlift', 'Legs', 'strength', false),
('Overhead Press', 'Shoulders', 'strength', false),
('Dumbbell Curl', 'Arms', 'strength', false),
('Tricep Dips', 'Arms', 'strength', false),
('Push-ups', 'Chest', 'strength', false),
('Sit-ups', 'Core', 'strength', false),
('Plank', 'Core', 'strength', false),
('Russian Twists', 'Core', 'strength', false),
-- Cardio
('Mountain Climbers', 'Core', 'cardio', false),
('Burpees', 'Full Body', 'cardio', false),
('Running', 'Full Body', 'cardio', false),
-- Tai Chi
('Tai Chi Form', 'Full Body', 'tai_chi', false),
('Tai Chi Push Hands', 'Full Body', 'tai_chi', false);
