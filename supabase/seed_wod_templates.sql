-- QuestLift WOD Template Seed Data
-- Run AFTER schema.sql has been applied.
-- 15 benchmark WODs

INSERT INTO public.wod_templates (name, wod_type, time_cap_seconds, rounds, movements, is_benchmark) VALUES

-- AMRAP WODs
('Cindy', 'amrap', 1200, NULL, '[
  {"exercise_name":"Pull-ups","reps":5,"weight_lbs":null,"notes":null},
  {"exercise_name":"Push-ups","reps":10,"weight_lbs":null,"notes":null},
  {"exercise_name":"Air Squats","reps":15,"weight_lbs":null,"notes":null}
]'::jsonb, true),

('Mary', 'amrap', 1200, NULL, '[
  {"exercise_name":"Handstand Push-Ups","reps":5,"weight_lbs":null,"notes":null},
  {"exercise_name":"Pistol Squats","reps":10,"weight_lbs":null,"notes":"alternating"},
  {"exercise_name":"Pull-ups","reps":15,"weight_lbs":null,"notes":null}
]'::jsonb, true),

-- FOR TIME WODs
('Fran', 'for_time', 600, NULL, '[
  {"exercise_name":"Thrusters","reps":21,"weight_lbs":95,"notes":"21-15-9"},
  {"exercise_name":"Pull-ups","reps":21,"weight_lbs":null,"notes":"21-15-9"}
]'::jsonb, true),

('Grace', 'for_time', 600, NULL, '[
  {"exercise_name":"Clean & Jerk","reps":30,"weight_lbs":135,"notes":null}
]'::jsonb, true),

('Helen', 'for_time', 900, 3, '[
  {"exercise_name":"Running","reps":1,"weight_lbs":null,"notes":"400m run"},
  {"exercise_name":"Kettlebell Swings","reps":21,"weight_lbs":53,"notes":null},
  {"exercise_name":"Pull-ups","reps":12,"weight_lbs":null,"notes":null}
]'::jsonb, true),

('Diane', 'for_time', 600, NULL, '[
  {"exercise_name":"Deadlift","reps":21,"weight_lbs":225,"notes":"21-15-9"},
  {"exercise_name":"Handstand Push-Ups","reps":21,"weight_lbs":null,"notes":"21-15-9"}
]'::jsonb, true),

('Isabel', 'for_time', 600, NULL, '[
  {"exercise_name":"Snatch","reps":30,"weight_lbs":135,"notes":null}
]'::jsonb, true),

('Jackie', 'for_time', 900, NULL, '[
  {"exercise_name":"Rowing Machine","reps":1,"weight_lbs":null,"notes":"1000m row"},
  {"exercise_name":"Thrusters","reps":50,"weight_lbs":45,"notes":null},
  {"exercise_name":"Pull-ups","reps":30,"weight_lbs":null,"notes":null}
]'::jsonb, true),

('Karen', 'for_time', 600, NULL, '[
  {"exercise_name":"Wall Balls","reps":150,"weight_lbs":20,"notes":"20lb ball to 10ft"}
]'::jsonb, true),

-- CHIPPER WODs
('Filthy Fifty', 'chipper', 2400, NULL, '[
  {"exercise_name":"Box Jumps","reps":50,"weight_lbs":null,"notes":"24in"},
  {"exercise_name":"Pull-ups","reps":50,"weight_lbs":null,"notes":"jumping"},
  {"exercise_name":"Kettlebell Swings","reps":50,"weight_lbs":35,"notes":null},
  {"exercise_name":"Walking","reps":50,"weight_lbs":null,"notes":"50 walking lunges"},
  {"exercise_name":"Toes-to-Bar","reps":50,"weight_lbs":null,"notes":"knees-to-elbows"},
  {"exercise_name":"Push-ups","reps":50,"weight_lbs":null,"notes":"push press 45lb"},
  {"exercise_name":"GHD Sit-Ups","reps":50,"weight_lbs":null,"notes":"back extensions"},
  {"exercise_name":"Wall Balls","reps":50,"weight_lbs":20,"notes":null},
  {"exercise_name":"Burpees","reps":50,"weight_lbs":null,"notes":null},
  {"exercise_name":"Double-Unders","reps":50,"weight_lbs":null,"notes":null}
]'::jsonb, true),

('Murph', 'for_time', 3600, NULL, '[
  {"exercise_name":"Running","reps":1,"weight_lbs":null,"notes":"1 mile run"},
  {"exercise_name":"Pull-ups","reps":100,"weight_lbs":null,"notes":"partition as needed"},
  {"exercise_name":"Push-ups","reps":200,"weight_lbs":null,"notes":"partition as needed"},
  {"exercise_name":"Air Squats","reps":300,"weight_lbs":null,"notes":"partition as needed"},
  {"exercise_name":"Running","reps":1,"weight_lbs":null,"notes":"1 mile run"}
]'::jsonb, true),

-- EMOM WODs
('Death by Pull-ups', 'emom', 1200, NULL, '[
  {"exercise_name":"Pull-ups","reps":1,"weight_lbs":null,"notes":"add 1 rep each minute"}
]'::jsonb, true),

('EMOM Cleans', 'emom', 600, NULL, '[
  {"exercise_name":"Power Clean","reps":3,"weight_lbs":135,"notes":"every minute on the minute"}
]'::jsonb, true),

-- TABATA WODs
('Tabata This', 'tabata', 1920, NULL, '[
  {"exercise_name":"Rowing Machine","reps":1,"weight_lbs":null,"notes":"8 rounds: 20s on / 10s off"},
  {"exercise_name":"Air Squats","reps":1,"weight_lbs":null,"notes":"8 rounds: 20s on / 10s off"},
  {"exercise_name":"Pull-ups","reps":1,"weight_lbs":null,"notes":"8 rounds: 20s on / 10s off"},
  {"exercise_name":"Push-ups","reps":1,"weight_lbs":null,"notes":"8 rounds: 20s on / 10s off"},
  {"exercise_name":"Sit-ups","reps":1,"weight_lbs":null,"notes":"8 rounds: 20s on / 10s off"}
]'::jsonb, true),

('Tabata Squats', 'tabata', 240, NULL, '[
  {"exercise_name":"Air Squats","reps":1,"weight_lbs":null,"notes":"8 rounds: 20s on / 10s off, max reps"}
]'::jsonb, true);
