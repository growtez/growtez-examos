-- Add allow_calculator column to exams table
ALTER TABLE IF EXISTS public.exams
ADD COLUMN IF NOT EXISTS allow_calculator BOOLEAN DEFAULT false;
