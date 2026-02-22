-- QuestLift Wizard Class Schema
-- Adds WIS stat and Recovery exercises

-- Add WIS (Wisdom) stat to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wis_minutes_lifetime integer DEFAULT 0;

-- Seed Recovery exercises for Wizard class
INSERT INTO public.exercises (name, category, equipment, exercise_type) VALUES
  ('Yoga Flow',              'Core',      'Bodyweight', 'Recovery'),
  ('Sun Salutation',         'Core',      'Bodyweight', 'Recovery'),
  ('Foam Rolling',           'Recovery',  'Other',      'Recovery'),
  ('Dynamic Stretching',     'Recovery',  'Bodyweight', 'Recovery'),
  ('Static Stretching',      'Recovery',  'Bodyweight', 'Recovery'),
  ('Pilates',                'Core',      'Bodyweight', 'Recovery'),
  ('Breathwork',             'Recovery',  'Bodyweight', 'Recovery'),
  ('Meditation Walk',        'Recovery',  'Bodyweight', 'Recovery'),
  ('Hip Opener Flow',        'Recovery',  'Bodyweight', 'Recovery'),
  ('Shoulder Mobility',      'Recovery',  'Bodyweight', 'Recovery'),
  ('Spine Mobility',         'Recovery',  'Bodyweight', 'Recovery'),
  ('Balance Training',       'Recovery',  'Bodyweight', 'Recovery');
