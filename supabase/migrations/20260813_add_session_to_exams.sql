-- Add course, batch, session columns to exams table
-- Students added to an exam will inherit these values automatically

ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS course TEXT DEFAULT 'General';
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS batch TEXT DEFAULT 'Main';
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS session TEXT DEFAULT '2026-27';
