CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  student_name TEXT NOT NULL,
  exam_id INTEGER NOT NULL CHECK (exam_id BETWEEN 1 AND 20),
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  correct INTEGER NOT NULL CHECK (correct BETWEEN 0 AND 45),
  answered INTEGER NOT NULL CHECK (answered BETWEEN 0 AND 45),
  elapsed_ms INTEGER NOT NULL CHECK (elapsed_ms >= 0),
  received_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS submissions_recent ON submissions(received_at DESC, id DESC);
