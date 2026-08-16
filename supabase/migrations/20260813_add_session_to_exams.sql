-- Add course, batch, session columns to exams table
-- Students added to an exam will inherit these values automatically

ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS course CITEXT DEFAULT 'General';
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS batch CITEXT DEFAULT 'Main';
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS session CITEXT DEFAULT '2026-27';
