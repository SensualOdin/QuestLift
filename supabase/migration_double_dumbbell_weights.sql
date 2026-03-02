-- Migration: Double existing dumbbell weights in workout_sets
-- Reason: UI now shows per-hand weight for dumbbell exercises, but DB stores total.
-- All existing dumbbell data was stored as per-hand, so double it for consistency.
--
-- Run this ONCE against QuestLift Supabase (ezikuwdjkfgyykockwdk).
-- Safe to re-run check: after running, dumbbell weights should be ~2x what they were.

-- Preview (dry run) — uncomment to check before applying:
-- SELECT ws.id, e.name, e.equipment, ws.weight AS old_weight, ws.weight * 2 AS new_weight
-- FROM workout_sets ws
-- JOIN exercises e ON e.id = ws.exercise_id
-- WHERE e.equipment = 'Dumbbell' AND ws.weight IS NOT NULL;

UPDATE workout_sets ws
SET weight = ws.weight * 2
FROM exercises e
WHERE e.id = ws.exercise_id
  AND e.equipment = 'Dumbbell'
  AND ws.weight IS NOT NULL;
