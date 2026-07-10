-- Add exam_instructions JSONB column to public.exams
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS exam_instructions JSONB DEFAULT '[]'::jsonb;
