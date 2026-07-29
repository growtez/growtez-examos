-- Add explanation column to questions table
ALTER TABLE IF EXISTS public.questions ADD COLUMN IF NOT EXISTS explanation TEXT;
