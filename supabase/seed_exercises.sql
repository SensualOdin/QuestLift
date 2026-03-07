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

-- ============================================================
-- tracking_mode updates (default is 'weight_reps')
-- ============================================================

-- Bodyweight exercises → reps_only
UPDATE public.exercises SET tracking_mode = 'reps_only' WHERE equipment = 'Bodyweight' AND category NOT IN ('Cardio', 'Mobility');

-- Duration exercises (planks, stretches, cardio)
UPDATE public.exercises SET tracking_mode = 'duration' WHERE name IN ('Plank', 'Side Plank', 'Dead Bug');
UPDATE public.exercises SET tracking_mode = 'duration' WHERE category = 'Cardio' AND name NOT IN ('Box Jumps', 'HIIT Circuit');
UPDATE public.exercises SET tracking_mode = 'duration' WHERE category = 'Mobility';

-- Reps or duration (can be done either way)
UPDATE public.exercises SET tracking_mode = 'reps_or_duration' WHERE name IN ('Jump Rope', 'HIIT Circuit', 'Box Jumps');

-- ============================================================
-- CrossFit exercises
-- ============================================================
INSERT INTO public.exercises (name, category, equipment, exercise_type, tracking_mode) VALUES
  ('Thrusters',                'CrossFit', 'Barbell',    'Strength', 'weight_reps'),
  ('Wall Balls',               'CrossFit', NULL,         'Strength', 'reps_only'),
  ('Burpees',                  'CrossFit', 'Bodyweight', 'Strength', 'reps_or_duration'),
  ('Box Jump Overs',           'CrossFit', NULL,         'Strength', 'reps_only'),
  ('Kettlebell Swings',        'CrossFit', 'Kettlebell', 'Strength', 'weight_reps'),
  ('Double-Unders',            'CrossFit', NULL,         'Cardio',   'reps_or_duration'),
  ('Toes-to-Bar',              'CrossFit', 'Bodyweight', 'Strength', 'reps_only'),
  ('Muscle-Ups (Ring)',        'CrossFit', 'Bodyweight', 'Strength', 'reps_only'),
  ('Muscle-Ups (Bar)',         'CrossFit', 'Bodyweight', 'Strength', 'reps_only'),
  ('Handstand Push-Ups',       'CrossFit', 'Bodyweight', 'Strength', 'reps_only'),
  ('Rope Climbs',              'CrossFit', NULL,         'Strength', 'reps_only'),
  ('Ring Dips',                'CrossFit', 'Bodyweight', 'Strength', 'reps_only'),
  ('Pistol Squats',            'CrossFit', 'Bodyweight', 'Strength', 'reps_only'),
  ('GHD Sit-Ups',              'CrossFit', 'Machine',   'Strength', 'reps_only'),
  ('Assault Bike Calories',    'CrossFit', 'Machine',   'Cardio',   'reps_only'),
  ('Row Calories',             'CrossFit', 'Machine',   'Cardio',   'reps_only'),
  ('Ski Erg Calories',         'CrossFit', 'Machine',   'Cardio',   'reps_only'),
  ('Handstand Walk',           'CrossFit', 'Bodyweight', 'Strength', 'duration'),
  ('Farmers Carry',            'CrossFit', NULL,         'Strength', 'duration'),
  ('Sandbag Clean',            'CrossFit', NULL,         'Strength', 'weight_reps'),
  ('D-Ball Over Shoulder',     'CrossFit', NULL,         'Strength', 'weight_reps'),
  ('Sled Pull',                'CrossFit', NULL,         'Strength', 'duration'),
  ('Wall Walk',                'CrossFit', 'Bodyweight', 'Strength', 'reps_only'),
  ('Air Squats',               'CrossFit', 'Bodyweight', 'Strength', 'reps_only'),
  ('Chest-to-Bar Pull-Ups',   'CrossFit', 'Bodyweight', 'Strength', 'reps_only'),
  ('Kipping Pull-Ups',        'CrossFit', 'Bodyweight', 'Strength', 'reps_only');

-- ============================================================
-- Olympic Lifting exercises
-- ============================================================
INSERT INTO public.exercises (name, category, equipment, exercise_type, tracking_mode) VALUES
  ('Snatch',                   'Olympic', 'Barbell',    'Strength', 'weight_reps'),
  ('Clean',                    'Olympic', 'Barbell',    'Strength', 'weight_reps'),
  ('Clean & Jerk',             'Olympic', 'Barbell',    'Strength', 'weight_reps'),
  ('Power Clean',              'Olympic', 'Barbell',    'Strength', 'weight_reps'),
  ('Power Snatch',             'Olympic', 'Barbell',    'Strength', 'weight_reps'),
  ('Hang Clean',               'Olympic', 'Barbell',    'Strength', 'weight_reps'),
  ('Hang Snatch',              'Olympic', 'Barbell',    'Strength', 'weight_reps'),
  ('Split Jerk',               'Olympic', 'Barbell',    'Strength', 'weight_reps'),
  ('Push Jerk',                'Olympic', 'Barbell',    'Strength', 'weight_reps'),
  ('Squat Clean',              'Olympic', 'Barbell',    'Strength', 'weight_reps'),
  ('Squat Snatch',             'Olympic', 'Barbell',    'Strength', 'weight_reps'),
  ('Clean Pull',               'Olympic', 'Barbell',    'Strength', 'weight_reps'),
  ('Snatch Pull',              'Olympic', 'Barbell',    'Strength', 'weight_reps');

-- ============================================================
-- Gymnastics exercises
-- ============================================================
INSERT INTO public.exercises (name, category, equipment, exercise_type, tracking_mode) VALUES
  ('L-Sit',                    'Gymnastics', 'Bodyweight', 'Strength', 'duration'),
  ('Skin the Cat',             'Gymnastics', 'Bodyweight', 'Strength', 'reps_only'),
  ('Back Lever',               'Gymnastics', 'Bodyweight', 'Strength', 'duration'),
  ('Front Lever',              'Gymnastics', 'Bodyweight', 'Strength', 'duration'),
  ('Handstand Hold',           'Gymnastics', 'Bodyweight', 'Strength', 'duration'),
  ('Ring Rows',                'Gymnastics', 'Bodyweight', 'Strength', 'reps_only'),
  ('Strict Pull-Up',          'Gymnastics', 'Bodyweight', 'Strength', 'reps_only'),
  ('Hollow Body Hold',        'Gymnastics', 'Bodyweight', 'Strength', 'duration');

-- ============================================================
-- Recovery exercises
-- ============================================================
INSERT INTO public.exercises (name, category, equipment, exercise_type, tracking_mode) VALUES
  ('Yoga Flow',                'Recovery', 'Bodyweight', 'Mobility', 'duration'),
  ('Foam Rolling (Full)',      'Recovery', NULL,         'Mobility', 'duration'),
  ('Static Stretching',        'Recovery', 'Bodyweight', 'Mobility', 'duration'),
  ('Breathing Exercises',      'Recovery', NULL,         'Mobility', 'duration'),
  ('Cold Plunge',              'Recovery', NULL,         'Mobility', 'duration'),
  ('Sauna',                    'Recovery', NULL,         'Mobility', 'duration'),
  ('Lacrosse Ball Work',       'Recovery', NULL,         'Mobility', 'duration'),
  ('Band Stretching',          'Recovery', 'Resistance Band', 'Mobility', 'duration'),
  ('Meditation',               'Recovery', NULL,         'Mobility', 'duration');
