-- =============================================================================
-- QuestLift Achievement Seeds (16 achievements)
-- =============================================================================

insert into public.achievements (name, description, icon, category, condition_type, condition_value, reward_scraps)
values
  -- Workout count milestones
  ('First Blood',     'Complete your first workout',               'sword',      'workout',     'workout_count',        1,    50),
  ('Iron Regular',    'Complete 10 workouts',                      'dumbbell',   'workout',     'workout_count',        10,   100),
  ('Centurion',       'Complete 100 workouts',                     'shield',     'workout',     'workout_count',        100,  500),

  -- Single-session volume milestones
  ('1K Club',         'Lift 1,000 lbs in a single session',       'trophy',     'workout',     'total_volume_single',  1000,  200),
  ('10K Club',        'Lift 10,000 lbs in a single session',      'trophy',     'workout',     'total_volume_single',  10000, 500),

  -- Streak milestones
  ('Iron Streak',     'Work out 7 days in a row',                 'flame',      'workout',     'streak_days',          7,    300),
  ('Forged in Fire',  'Work out 30 days in a row',                'flame',      'workout',     'streak_days',          30,   1000),

  -- Progression
  ('Class Chosen',    'Select your class at level 6',             'sword',      'progression', 'class_selected',       1,    100),
  ('Level 10',        'Reach level 10',                           'star',       'progression', 'level_reached',        10,   150),
  ('Level 25',        'Reach level 25',                           'star',       'progression', 'level_reached',        25,   300),
  ('Level 50',        'Reach level 50',                           'star',       'progression', 'level_reached',        50,   1000),

  -- Personal records
  ('PR Machine',      'Set 10 personal records',                  'trophy',     'workout',     'pr_count',             10,   200),
  ('PR Legend',       'Set 50 personal records',                  'trophy',     'workout',     'pr_count',             50,   500),

  -- Raid
  ('Raid Slayer',     'Help defeat a raid boss',                  'swords',     'raid',        'raid_defeated',        1,    300),

  -- Social
  ('Party Animal',    'Join or create a party',                   'users',      'social',      'party_joined',         1,    100),

  -- Comeback
  ('Comeback Kid',    'Return after 7+ days of inactivity',       'refresh-ccw','workout',     'comeback_triggered',   1,    100);
