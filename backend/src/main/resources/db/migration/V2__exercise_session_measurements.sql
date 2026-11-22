ALTER TABLE exercise_records ADD COLUMN session_id UUID;
ALTER TABLE exercise_records ADD COLUMN mode VARCHAR(4);
ALTER TABLE exercise_records ADD COLUMN total_hold_seconds INTEGER;
ALTER TABLE exercise_records ADD COLUMN measured_frames INTEGER;
ALTER TABLE exercise_records ADD COLUMN total_frames INTEGER;

CREATE UNIQUE INDEX uq_records_user_session ON exercise_records(user_id, session_id);
