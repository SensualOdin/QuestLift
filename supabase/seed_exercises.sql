-- QuestLift Exercise Seed Data
-- Run AFTER schema.sql has been applied.
-- 104 Strength + 14 Cardio = 118 exercises total

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

-- ============================================================
-- NEW EXERCISES - Expanded Library
-- ============================================================

-- Chest (+6)
INSERT INTO public.exercises (name, category, equipment, exercise_type) VALUES
  ('Decline Barbell Bench Press', 'Chest', 'Barbell',   'Strength'),
  ('Machine Chest Press',         'Chest', 'Machine',   'Strength'),
  ('Dumbbell Fly',                'Chest', 'Dumbbell',  'Strength'),
  ('Incline Dumbbell Fly',        'Chest', 'Dumbbell',  'Strength'),
  ('Landmine Press',              'Chest', 'Barbell',   'Strength'),
  ('Svend Press',                 'Chest', 'Dumbbell',  'Strength');

-- Back (+7)
INSERT INTO public.exercises (name, category, equipment, exercise_type) VALUES
  ('Chin-ups',                    'Back', 'Bodyweight',  'Strength'),
  ('Pendlay Row',                 'Back', 'Barbell',     'Strength'),
  ('Meadows Row',                 'Back', 'Barbell',     'Strength'),
  ('Cable Pullover',              'Back', 'Cable',       'Strength'),
  ('Single-Arm Lat Pulldown',     'Back', 'Cable',       'Strength'),
  ('Rack Pull',                   'Back', 'Barbell',     'Strength'),
  ('Chest-Supported Row',         'Back', 'Dumbbell',    'Strength');

-- Legs (+8)
INSERT INTO public.exercises (name, category, equipment, exercise_type) VALUES
  ('Goblet Squat',                'Legs', 'Dumbbell',    'Strength'),
  ('Sumo Deadlift',               'Legs', 'Barbell',     'Strength'),
  ('Hack Squat',                   'Legs', 'Machine',     'Strength'),
  ('Walking Lunge',               'Legs', 'Dumbbell',    'Strength'),
  ('Narrow Leg Press',            'Legs', 'Machine',     'Strength'),
  ('Good Morning',                'Legs', 'Barbell',     'Strength'),
  ('Sissy Squat',                 'Legs', 'Bodyweight',   'Strength'),
  ('Nordic Curl',                 'Legs', 'Bodyweight',   'Strength');

-- Shoulders (+6)
INSERT INTO public.exercises (name, category, equipment, exercise_type) VALUES
  ('Machine Shoulder Press',       'Shoulders', 'Machine',   'Strength'),
  ('Cable Lateral Raise',         'Shoulders', 'Cable',     'Strength'),
  ('Lu Raise',                    'Shoulders', 'Dumbbell',  'Strength'),
  ('Rear Delt Fly (Machine)',     'Shoulders', 'Machine',   'Strength'),
  ('Landmine Shoulder Press',     'Shoulders', 'Barbell',   'Strength'),
  ('Bradford Press',              'Shoulders', 'Barbell',   'Strength');

-- Arms (+8)
INSERT INTO public.exercises (name, category, equipment, exercise_type) VALUES
  ('Incline Dumbbell Curl',       'Arms', 'Dumbbell',    'Strength'),
  ('Concentration Curl',          'Arms', 'Dumbbell',    'Strength'),
  ('Cable Curl',                  'Arms', 'Cable',       'Strength'),
  ('Spider Curl',                 'Arms', 'Dumbbell',    'Strength'),
  ('Dips (Tricep)',               'Arms', 'Bodyweight',   'Strength'),
  ('French Press',                'Arms', 'Barbell',     'Strength'),
  ('Tricep Kickback',             'Arms', 'Dumbbell',    'Strength'),
  ('EZ Bar Curl',                 'Arms', 'Barbell',     'Strength');

-- Core (+5)
INSERT INTO public.exercises (name, category, equipment, exercise_type) VALUES
  ('Pallof Press',                'Core', 'Cable',       'Strength'),
  ('Dead Bug',                    'Core', 'Bodyweight',   'Strength'),
  ('Cable Woodchop',              'Core', 'Cable',       'Strength'),
  ('Dragon Flag',                 'Core', 'Bodyweight',   'Strength'),
  ('Toe Touches',                 'Core', 'Bodyweight',   'Strength');

-- Cardio (+6)
INSERT INTO public.exercises (name, category, equipment, exercise_type) VALUES
  ('Walking',                     'Cardio', NULL,         'Cardio'),
  ('Battle Ropes',                'Cardio', NULL,         'Cardio'),
  ('Sled Push',                   'Cardio', NULL,         'Cardio'),
  ('Box Jumps',                   'Cardio', 'Bodyweight',  'Cardio'),
  ('Assault Bike',                'Cardio', 'Machine',    'Cardio'),
  ('Sprints',                     'Cardio', NULL,         'Cardio');

-- ============================================================
-- Mobility (8 exercises - new category)
-- ============================================================
INSERT INTO public.exercises (name, category, equipment, exercise_type) VALUES
  ('Hip 90/90 Stretch',           'Mobility', 'Bodyweight',  'Strength'),
  ('Worlds Greatest Stretch',     'Mobility', 'Bodyweight',  'Strength'),
  ('Cat-Cow',                     'Mobility', 'Bodyweight',  'Strength'),
  ('Foam Rolling',                'Mobility', NULL,          'Strength'),
  ('Shoulder Dislocates',         'Mobility', NULL,          'Strength'),
  ('Pigeon Stretch',              'Mobility', 'Bodyweight',  'Strength'),
  ('Hamstring Stretch',           'Mobility', 'Bodyweight',  'Strength'),
  ('Thoracic Rotation',           'Mobility', 'Bodyweight',  'Strength');
