-- QuestLift Exercise Seed Data
-- Run AFTER schema.sql has been applied.
-- 56 Strength + 8 Cardio = 64 exercises total

-- ============================================================
-- Chest (8 exercises)
-- ============================================================
INSERT INTO public.exercises (name, category, equipment, exercise_type) VALUES
  ('Barbell Bench Press',       'Chest', 'Barbell',    'Strength'),
  ('Incline Barbell Bench Press','Chest', 'Barbell',   'Strength'),
  ('Dumbbell Bench Press',      'Chest', 'Dumbbell',   'Strength'),
  ('Incline Dumbbell Press',    'Chest', 'Dumbbell',   'Strength'),
  ('Cable Fly',                 'Chest', 'Cable',      'Strength'),
  ('Pec Deck',                  'Chest', 'Machine',    'Strength'),
  ('Dips (Chest)',              'Chest', 'Bodyweight',  'Strength'),
  ('Push-ups',                  'Chest', 'Bodyweight',  'Strength');

-- ============================================================
-- Back (8 exercises)
-- ============================================================
INSERT INTO public.exercises (name, category, equipment, exercise_type) VALUES
  ('Barbell Row',               'Back', 'Barbell',     'Strength'),
  ('Dumbbell Row',              'Back', 'Dumbbell',    'Strength'),
  ('Pull-ups',                  'Back', 'Bodyweight',   'Strength'),
  ('Lat Pulldown',              'Back', 'Cable',       'Strength'),
  ('Seated Cable Row',          'Back', 'Cable',       'Strength'),
  ('T-Bar Row',                 'Back', 'Barbell',     'Strength'),
  ('Face Pull',                 'Back', 'Cable',       'Strength'),
  ('Deadlift',                  'Back', 'Barbell',     'Strength');

-- ============================================================
-- Legs (9 exercises)
-- ============================================================
INSERT INTO public.exercises (name, category, equipment, exercise_type) VALUES
  ('Barbell Back Squat',        'Legs', 'Barbell',     'Strength'),
  ('Front Squat',               'Legs', 'Barbell',     'Strength'),
  ('Romanian Deadlift',         'Legs', 'Barbell',     'Strength'),
  ('Leg Press',                 'Legs', 'Machine',     'Strength'),
  ('Leg Extension',             'Legs', 'Machine',     'Strength'),
  ('Leg Curl',                  'Legs', 'Machine',     'Strength'),
  ('Bulgarian Split Squat',     'Legs', 'Dumbbell',    'Strength'),
  ('Calf Raise',                'Legs', 'Machine',     'Strength'),
  ('Hip Thrust',                'Legs', 'Barbell',     'Strength');

-- ============================================================
-- Shoulders (8 exercises)
-- ============================================================
INSERT INTO public.exercises (name, category, equipment, exercise_type) VALUES
  ('Overhead Press',            'Shoulders', 'Barbell',   'Strength'),
  ('Dumbbell Shoulder Press',   'Shoulders', 'Dumbbell',  'Strength'),
  ('Lateral Raise',             'Shoulders', 'Dumbbell',  'Strength'),
  ('Front Raise',               'Shoulders', 'Dumbbell',  'Strength'),
  ('Reverse Fly',               'Shoulders', 'Dumbbell',  'Strength'),
  ('Arnold Press',              'Shoulders', 'Dumbbell',  'Strength'),
  ('Upright Row',               'Shoulders', 'Barbell',   'Strength'),
  ('Barbell Shrugs',            'Shoulders', 'Barbell',   'Strength');

-- ============================================================
-- Arms (8 exercises)
-- ============================================================
INSERT INTO public.exercises (name, category, equipment, exercise_type) VALUES
  ('Barbell Curl',              'Arms', 'Barbell',     'Strength'),
  ('Dumbbell Curl',             'Arms', 'Dumbbell',    'Strength'),
  ('Hammer Curl',               'Arms', 'Dumbbell',    'Strength'),
  ('Preacher Curl',             'Arms', 'Barbell',     'Strength'),
  ('Tricep Pushdown',           'Arms', 'Cable',       'Strength'),
  ('Skull Crushers',            'Arms', 'Barbell',     'Strength'),
  ('Overhead Tricep Extension', 'Arms', 'Cable',       'Strength'),
  ('Close Grip Bench Press',    'Arms', 'Barbell',     'Strength');

-- ============================================================
-- Core (7 exercises)
-- ============================================================
INSERT INTO public.exercises (name, category, equipment, exercise_type) VALUES
  ('Plank',                     'Core', 'Bodyweight',   'Strength'),
  ('Hanging Leg Raise',         'Core', 'Bodyweight',   'Strength'),
  ('Cable Crunch',              'Core', 'Cable',       'Strength'),
  ('Ab Wheel Rollout',          'Core', 'Bodyweight',   'Strength'),
  ('Russian Twist',             'Core', 'Bodyweight',   'Strength'),
  ('Side Plank',                'Core', 'Bodyweight',   'Strength'),
  ('Decline Sit-up',            'Core', 'Bodyweight',   'Strength');

-- ============================================================
-- Cardio (8 exercises)
-- ============================================================
INSERT INTO public.exercises (name, category, equipment, exercise_type) VALUES
  ('Running',                   'Cardio', NULL,         'Cardio'),
  ('Cycling',                   'Cardio', 'Machine',    'Cardio'),
  ('Rowing Machine',            'Cardio', 'Machine',    'Cardio'),
  ('Jump Rope',                 'Cardio', NULL,         'Cardio'),
  ('Stair Climber',             'Cardio', 'Machine',    'Cardio'),
  ('Swimming',                  'Cardio', NULL,         'Cardio'),
  ('Elliptical',                'Cardio', 'Machine',    'Cardio'),
  ('HIIT Circuit',              'Cardio', 'Bodyweight',  'Cardio');
