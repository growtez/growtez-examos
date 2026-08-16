-- Enable citext for case-insensitive course, batch, session
CREATE EXTENSION IF NOT EXISTS citext;

-- Alter existing columns in students table
ALTER TABLE public.students ALTER COLUMN course TYPE CITEXT;
ALTER TABLE public.students ALTER COLUMN batch TYPE CITEXT;
ALTER TABLE public.students ALTER COLUMN session TYPE CITEXT;

-- Alter existing columns in exams table
ALTER TABLE public.exams ALTER COLUMN course TYPE CITEXT;
ALTER TABLE public.exams ALTER COLUMN batch TYPE CITEXT;
ALTER TABLE public.exams ALTER COLUMN session TYPE CITEXT;
