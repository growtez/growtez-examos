-- Add shuffle_questions boolean column to exams table
ALTER TABLE IF EXISTS public.exams 
ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT true;
