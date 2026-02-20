-- QuestLift Workout Templates Schema & Seed Data
-- Run AFTER schema.sql and seed_exercises.sql have been applied.

-- ============================================================
-- Tables
-- ============================================================

create table public.workout_templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  category text,  -- 'Push', 'Pull', 'Legs', 'Upper', 'Full Body', 'Cardio'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.workout_template_exercises (
  id uuid default gen_random_uuid() primary key,
  template_id uuid references public.workout_templates on delete cascade not null,
  exercise_id uuid references public.exercises on delete cascade not null,
  sort_order integer not null,
  default_sets integer default 3
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.workout_templates enable row level security;
alter table public.workout_template_exercises enable row level security;

-- Templates are admin-seeded, read-only for authenticated users.
create policy "Templates are viewable by authenticated users"
  on public.workout_templates
  for select
  using (auth.role() = 'authenticated');

create policy "Template exercises are viewable by authenticated users"
  on public.workout_template_exercises
  for select
  using (auth.role() = 'authenticated');

-- ============================================================
-- Seed: Workout Templates
-- ============================================================

INSERT INTO public.workout_templates (name, description, category) VALUES
  ('Push Day',    'Chest, shoulders, and triceps focus.',                       'Push'),
  ('Pull Day',    'Back and biceps focus.',                                     'Pull'),
  ('Leg Day',     'Quads, hamstrings, glutes, and calves.',                     'Legs'),
  ('Upper Body',  'Balanced upper-body session hitting chest, back, and arms.', 'Upper'),
  ('Full Body',   'All major muscle groups in one session.',                    'Full Body'),
  ('Cardio Blast','High-intensity cardiovascular conditioning.',                'Cardio');

-- ============================================================
-- Seed: Template Exercises
-- ============================================================

-- -------------------------------------------------------
-- Push Day (6 exercises)
-- -------------------------------------------------------
INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Push Day'),
  (SELECT id FROM public.exercises WHERE name = 'Barbell Bench Press'),
  1, 4
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Push Day'),
  (SELECT id FROM public.exercises WHERE name = 'Incline Dumbbell Press'),
  2, 3
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Push Day'),
  (SELECT id FROM public.exercises WHERE name = 'Overhead Press'),
  3, 3
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Push Day'),
  (SELECT id FROM public.exercises WHERE name = 'Lateral Raise'),
  4, 3
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Push Day'),
  (SELECT id FROM public.exercises WHERE name = 'Tricep Pushdown'),
  5, 3
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Push Day'),
  (SELECT id FROM public.exercises WHERE name = 'Cable Fly'),
  6, 3
);

-- -------------------------------------------------------
-- Pull Day (6 exercises)
-- -------------------------------------------------------
INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Pull Day'),
  (SELECT id FROM public.exercises WHERE name = 'Barbell Row'),
  1, 4
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Pull Day'),
  (SELECT id FROM public.exercises WHERE name = 'Pull-ups'),
  2, 3
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Pull Day'),
  (SELECT id FROM public.exercises WHERE name = 'Seated Cable Row'),
  3, 3
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Pull Day'),
  (SELECT id FROM public.exercises WHERE name = 'Face Pull'),
  4, 3
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Pull Day'),
  (SELECT id FROM public.exercises WHERE name = 'Barbell Curl'),
  5, 3
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Pull Day'),
  (SELECT id FROM public.exercises WHERE name = 'Hammer Curl'),
  6, 3
);

-- -------------------------------------------------------
-- Leg Day (6 exercises)
-- -------------------------------------------------------
INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Leg Day'),
  (SELECT id FROM public.exercises WHERE name = 'Barbell Back Squat'),
  1, 4
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Leg Day'),
  (SELECT id FROM public.exercises WHERE name = 'Romanian Deadlift'),
  2, 3
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Leg Day'),
  (SELECT id FROM public.exercises WHERE name = 'Leg Press'),
  3, 3
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Leg Day'),
  (SELECT id FROM public.exercises WHERE name = 'Leg Curl'),
  4, 3
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Leg Day'),
  (SELECT id FROM public.exercises WHERE name = 'Bulgarian Split Squat'),
  5, 3
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Leg Day'),
  (SELECT id FROM public.exercises WHERE name = 'Calf Raise'),
  6, 4
);

-- -------------------------------------------------------
-- Upper Body (6 exercises)
-- -------------------------------------------------------
INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Upper Body'),
  (SELECT id FROM public.exercises WHERE name = 'Barbell Bench Press'),
  1, 4
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Upper Body'),
  (SELECT id FROM public.exercises WHERE name = 'Barbell Row'),
  2, 4
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Upper Body'),
  (SELECT id FROM public.exercises WHERE name = 'Overhead Press'),
  3, 3
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Upper Body'),
  (SELECT id FROM public.exercises WHERE name = 'Pull-ups'),
  4, 3
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Upper Body'),
  (SELECT id FROM public.exercises WHERE name = 'Barbell Curl'),
  5, 3
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Upper Body'),
  (SELECT id FROM public.exercises WHERE name = 'Tricep Pushdown'),
  6, 3
);

-- -------------------------------------------------------
-- Full Body (6 exercises)
-- -------------------------------------------------------
INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Full Body'),
  (SELECT id FROM public.exercises WHERE name = 'Barbell Back Squat'),
  1, 4
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Full Body'),
  (SELECT id FROM public.exercises WHERE name = 'Barbell Bench Press'),
  2, 4
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Full Body'),
  (SELECT id FROM public.exercises WHERE name = 'Deadlift'),
  3, 3
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Full Body'),
  (SELECT id FROM public.exercises WHERE name = 'Overhead Press'),
  4, 3
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Full Body'),
  (SELECT id FROM public.exercises WHERE name = 'Barbell Row'),
  5, 3
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Full Body'),
  (SELECT id FROM public.exercises WHERE name = 'Plank'),
  6, 3
);

-- -------------------------------------------------------
-- Cardio Blast (4 exercises)
-- -------------------------------------------------------
INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Cardio Blast'),
  (SELECT id FROM public.exercises WHERE name = 'Running'),
  1, 1
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Cardio Blast'),
  (SELECT id FROM public.exercises WHERE name = 'Jump Rope'),
  2, 3
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Cardio Blast'),
  (SELECT id FROM public.exercises WHERE name = 'Rowing Machine'),
  3, 1
);

INSERT INTO public.workout_template_exercises (template_id, exercise_id, sort_order, default_sets)
VALUES (
  (SELECT id FROM public.workout_templates WHERE name = 'Cardio Blast'),
  (SELECT id FROM public.exercises WHERE name = 'HIIT Circuit'),
  4, 3
);
